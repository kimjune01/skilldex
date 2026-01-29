/**
 * Automations API Routes
 *
 * CRUD operations for scheduled skill automations.
 * Users limited to 3 automations (flat limit for MVP).
 *
 * Endpoints:
 * - GET    /v1/automations           - List user's automations
 * - GET    /v1/automations/:id       - Get single automation
 * - POST   /v1/automations           - Create automation (enforces 3-limit)
 * - PUT    /v1/automations/:id       - Update automation
 * - DELETE /v1/automations/:id       - Delete automation
 * - POST   /v1/automations/:id/run   - Manual trigger
 * - GET    /v1/automations/:id/runs  - Get run history
 * - POST   /v1/automations/parse-schedule - Parse natural language to cron
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { automations, automationRuns, skills, type Automation, type Skill } from '@skillomatic/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { validateCronExpression, calculateNextRun, describeCronSchedule, isValidTimezone } from '../../lib/cron-utils.js';
import { chat } from '../../lib/llm.js';

export const v1AutomationsRoutes = new Hono();

// All routes require auth (API key or JWT)
v1AutomationsRoutes.use('*', combinedAuth);

/** Maximum automations per user (MVP flat limit) */
const MAX_AUTOMATIONS_PER_USER = 3;

// ============ List Automations ============

/**
 * GET /v1/automations - List user's automations
 */
v1AutomationsRoutes.get('/', async (c) => {
  const user = c.get('user');

  const userAutomations = await db
    .select()
    .from(automations)
    .leftJoin(skills, eq(automations.skillSlug, skills.slug))
    .where(eq(automations.userId, user.sub))
    .orderBy(desc(automations.createdAt));

  return c.json({
    data: {
      automations: userAutomations.map((row) => formatAutomation(row.automations, row.skills)),
      limit: MAX_AUTOMATIONS_PER_USER,
      count: userAutomations.length,
      remaining: MAX_AUTOMATIONS_PER_USER - userAutomations.length,
    },
  });
});

// ============ Parse Natural Language Schedule ============

/**
 * POST /v1/automations/parse-schedule - Parse natural language to cron expression
 *
 * Uses LLM to convert "Every Monday at 9am" -> "0 9 * * 1"
 */
v1AutomationsRoutes.post('/parse-schedule', async (c) => {
  const body = await c.req.json();
  const { schedule, timezone } = body;

  if (!schedule || typeof schedule !== 'string' || schedule.trim().length === 0) {
    return c.json({ error: { message: 'Schedule is required', code: 'VALIDATION_ERROR' } }, 400);
  }

  const tz = timezone || 'UTC';

  try {
    const response = await chat([
      {
        role: 'system',
        content: `You are a cron expression generator. Convert natural language schedule descriptions to standard 5-field cron expressions.

Rules:
- Output ONLY the cron expression, nothing else
- Use 5-field format: minute hour day-of-month month day-of-week
- Use * for "any", use specific numbers for specific times
- Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
- For "weekdays" use 1-5, for "weekends" use 0,6

Examples:
- "Every Monday at 9am" -> "0 9 * * 1"
- "Daily at 9am" -> "0 9 * * *"
- "Every weekday at 8:30am" -> "30 8 * * 1-5"
- "First of every month at midnight" -> "0 0 1 * *"
- "Every 15 minutes" -> "*/15 * * * *"
- "Sundays at 6pm" -> "0 18 * * 0"
- "Twice a day at 9am and 5pm" -> "0 9,17 * * *"

If you cannot parse the schedule, respond with "INVALID" followed by a brief reason.`,
      },
      {
        role: 'user',
        content: schedule.trim(),
      },
    ], {
      temperature: 0,
      maxTokens: 50,
    });

    const cronExpression = response.trim();

    // Check if LLM couldn't parse it
    if (cronExpression.startsWith('INVALID')) {
      const reason = cronExpression.replace('INVALID', '').trim() || 'Could not understand the schedule';
      return c.json({
        error: { message: reason, code: 'PARSE_ERROR' },
      }, 400);
    }

    // Validate the cron expression
    const validation = validateCronExpression(cronExpression);
    if (!validation.valid) {
      return c.json({
        error: { message: `Generated invalid cron: ${validation.error}`, code: 'INVALID_CRON' },
      }, 400);
    }

    // Calculate next run and human-readable description
    const nextRunAt = calculateNextRun(cronExpression, tz);
    const description = describeCronSchedule(cronExpression);

    return c.json({
      data: {
        cronExpression,
        description,
        timezone: tz,
        nextRunAt: nextRunAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Automations] Failed to parse schedule:', err);
    return c.json({
      error: { message: 'Failed to parse schedule', code: 'LLM_ERROR' },
    }, 500);
  }
});

// ============ Get Single Automation ============

/**
 * GET /v1/automations/:id - Get single automation
 */
v1AutomationsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [result] = await db
    .select()
    .from(automations)
    .leftJoin(skills, eq(automations.skillSlug, skills.slug))
    .where(and(eq(automations.id, id), eq(automations.userId, user.sub)))
    .limit(1);

  if (!result) {
    return c.json({ error: { message: 'Automation not found', code: 'NOT_FOUND' } }, 404);
  }

  return c.json({ data: { automation: formatAutomation(result.automations, result.skills) } });
});

// ============ Create Automation ============

/**
 * POST /v1/automations - Create automation
 */
v1AutomationsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  // Validate required fields
  const { name, skillSlug, cronExpression, outputEmail, skillParams, cronTimezone } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: { message: 'Name is required', code: 'VALIDATION_ERROR' } }, 400);
  }

  if (name.trim().length > 100) {
    return c.json({ error: { message: 'Name must be 100 characters or less', code: 'VALIDATION_ERROR' } }, 400);
  }

  if (!skillSlug || typeof skillSlug !== 'string') {
    return c.json({ error: { message: 'Skill slug is required', code: 'VALIDATION_ERROR' } }, 400);
  }

  if (!cronExpression || typeof cronExpression !== 'string') {
    return c.json({ error: { message: 'Cron expression is required', code: 'VALIDATION_ERROR' } }, 400);
  }

  if (!outputEmail || typeof outputEmail !== 'string') {
    return c.json({ error: { message: 'Output email is required', code: 'VALIDATION_ERROR' } }, 400);
  }

  // Check user's automation limit
  const existingAutomations = await db
    .select()
    .from(automations)
    .where(eq(automations.userId, user.sub));

  if (existingAutomations.length >= MAX_AUTOMATIONS_PER_USER) {
    return c.json({
      error: {
        message: `You've reached the limit of ${MAX_AUTOMATIONS_PER_USER} automations. Upgrade for unlimited automations, or delete an existing one.`,
        code: 'AUTOMATION_LIMIT_EXCEEDED',
        upgradePrompt: {
          triggerType: 'automation',
          currentCount: existingAutomations.length,
          limit: MAX_AUTOMATIONS_PER_USER,
        },
      },
    }, 403);
  }

  // Validate cron expression
  const cronValidation = validateCronExpression(cronExpression);
  if (!cronValidation.valid) {
    return c.json({
      error: {
        message: `Invalid cron expression: ${cronValidation.error}`,
        code: 'INVALID_CRON',
      },
    }, 400);
  }

  // Validate timezone
  const timezone = cronTimezone || 'UTC';
  if (!isValidTimezone(timezone)) {
    return c.json({
      error: {
        message: `Invalid timezone: ${timezone}`,
        code: 'INVALID_TIMEZONE',
      },
    }, 400);
  }

  // Validate skill exists and has automationEnabled
  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, skillSlug))
    .limit(1);

  if (!skill) {
    return c.json({
      error: {
        message: `Skill not found: ${skillSlug}`,
        code: 'SKILL_NOT_FOUND',
      },
    }, 404);
  }

  if (!skill.automationEnabled) {
    return c.json({
      error: {
        message: `Skill "${skill.name}" does not support automation`,
        code: 'SKILL_NOT_AUTOMATABLE',
      },
    }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(outputEmail)) {
    return c.json({
      error: {
        message: 'Invalid email address',
        code: 'INVALID_EMAIL',
      },
    }, 400);
  }

  // Calculate next run time
  const nextRunAt = calculateNextRun(cronExpression, timezone);

  // Create automation
  const id = randomUUID();
  const now = new Date();

  await db.insert(automations).values({
    id,
    userId: user.sub,
    organizationId: user.organizationId || null,
    name: name.trim(),
    skillSlug,
    skillParams: skillParams ? JSON.stringify(skillParams) : null,
    cronExpression,
    cronTimezone: timezone,
    outputEmail,
    isEnabled: true,
    nextRunAt,
    consecutiveFailures: 0,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`[Automations] Created automation ${id} for user ${user.sub}`);

  const [created] = await db
    .select()
    .from(automations)
    .leftJoin(skills, eq(automations.skillSlug, skills.slug))
    .where(eq(automations.id, id))
    .limit(1);

  return c.json({ data: { automation: formatAutomation(created.automations, created.skills) } }, 201);
});

// ============ Update Automation ============

/**
 * PUT /v1/automations/:id - Update automation
 */
v1AutomationsRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  const [automation] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, user.sub)))
    .limit(1);

  if (!automation) {
    return c.json({ error: { message: 'Automation not found', code: 'NOT_FOUND' } }, 404);
  }

  const updates: Partial<typeof automations.$inferInsert> = {
    updatedAt: new Date(),
  };

  // Handle each field
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return c.json({ error: { message: 'Name cannot be empty', code: 'VALIDATION_ERROR' } }, 400);
    }
    if (body.name.trim().length > 100) {
      return c.json({ error: { message: 'Name must be 100 characters or less', code: 'VALIDATION_ERROR' } }, 400);
    }
    updates.name = body.name.trim();
  }

  if (body.outputEmail !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.outputEmail)) {
      return c.json({ error: { message: 'Invalid email address', code: 'INVALID_EMAIL' } }, 400);
    }
    updates.outputEmail = body.outputEmail;
  }

  if (body.skillParams !== undefined) {
    updates.skillParams = body.skillParams ? JSON.stringify(body.skillParams) : null;
  }

  if (body.isEnabled !== undefined) {
    updates.isEnabled = !!body.isEnabled;
  }

  // Handle cron expression and timezone changes (need to recalculate nextRunAt)
  let newCronExpression = automation.cronExpression;
  let newTimezone = automation.cronTimezone;

  if (body.cronExpression !== undefined) {
    const cronValidation = validateCronExpression(body.cronExpression);
    if (!cronValidation.valid) {
      return c.json({
        error: {
          message: `Invalid cron expression: ${cronValidation.error}`,
          code: 'INVALID_CRON',
        },
      }, 400);
    }
    updates.cronExpression = body.cronExpression;
    newCronExpression = body.cronExpression;
  }

  if (body.cronTimezone !== undefined) {
    if (!isValidTimezone(body.cronTimezone)) {
      return c.json({
        error: {
          message: `Invalid timezone: ${body.cronTimezone}`,
          code: 'INVALID_TIMEZONE',
        },
      }, 400);
    }
    updates.cronTimezone = body.cronTimezone;
    newTimezone = body.cronTimezone;
  }

  // Recalculate nextRunAt if cron or timezone changed
  if (body.cronExpression !== undefined || body.cronTimezone !== undefined) {
    updates.nextRunAt = calculateNextRun(newCronExpression, newTimezone);
  }

  await db.update(automations).set(updates).where(eq(automations.id, id));

  console.log(`[Automations] Updated automation ${id}`);

  const [updated] = await db
    .select()
    .from(automations)
    .leftJoin(skills, eq(automations.skillSlug, skills.slug))
    .where(eq(automations.id, id))
    .limit(1);

  return c.json({ data: { automation: formatAutomation(updated.automations, updated.skills) } });
});

// ============ Delete Automation ============

/**
 * DELETE /v1/automations/:id - Delete automation
 */
v1AutomationsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [automation] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, user.sub)))
    .limit(1);

  if (!automation) {
    return c.json({ error: { message: 'Automation not found', code: 'NOT_FOUND' } }, 404);
  }

  // Delete runs first (cascade should handle this, but be explicit)
  await db.delete(automationRuns).where(eq(automationRuns.automationId, id));
  await db.delete(automations).where(eq(automations.id, id));

  console.log(`[Automations] Deleted automation ${id}`);

  return c.json({ data: { success: true } });
});

// ============ Manual Trigger ============

/**
 * POST /v1/automations/:id/run - Manually trigger automation
 *
 * Triggers immediate execution by setting nextRunAt to now.
 * The automation worker will pick it up on next tick (within 1 minute).
 */
v1AutomationsRoutes.post('/:id/run', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [automation] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, user.sub)))
    .limit(1);

  if (!automation) {
    return c.json({ error: { message: 'Automation not found', code: 'NOT_FOUND' } }, 404);
  }

  if (!automation.isEnabled) {
    return c.json({
      error: {
        message: 'Automation is disabled. Enable it first to run manually.',
        code: 'AUTOMATION_DISABLED',
      },
    }, 400);
  }

  // Set nextRunAt to now so the worker picks it up
  await db.update(automations)
    .set({ nextRunAt: new Date(), updatedAt: new Date() })
    .where(eq(automations.id, id));

  console.log(`[Automations] Manual trigger for automation ${id}`);

  return c.json({
    data: {
      success: true,
      message: 'Automation triggered. It will run within the next minute.',
    },
  });
});

// ============ Run History ============

/**
 * GET /v1/automations/:id/runs - Get run history
 */
v1AutomationsRoutes.get('/:id/runs', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [automation] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.userId, user.sub)))
    .limit(1);

  if (!automation) {
    return c.json({ error: { message: 'Automation not found', code: 'NOT_FOUND' } }, 404);
  }

  const runs = await db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.automationId, id))
    .orderBy(desc(automationRuns.createdAt))
    .limit(50);

  return c.json({
    data: {
      runs: runs.map(run => ({
        id: run.id,
        status: run.status,
        triggeredBy: run.triggeredBy,
        startedAt: run.startedAt?.toISOString() || null,
        completedAt: run.completedAt?.toISOString() || null,
        durationMs: run.durationMs,
        outputSummary: run.outputSummary,
        errorCode: run.errorCode,
        retryCount: run.retryCount,
        createdAt: run.createdAt.toISOString(),
      })),
    },
  });
});

// ============ Helpers ============

/**
 * Format automation for API response
 */
function formatAutomation(automation: Automation, skill?: Skill | null) {
  return {
    id: automation.id,
    name: automation.name,
    skillSlug: automation.skillSlug,
    skillParams: automation.skillParams ? JSON.parse(automation.skillParams) : null,
    cronExpression: automation.cronExpression,
    cronTimezone: automation.cronTimezone,
    cronDescription: describeCronSchedule(automation.cronExpression),
    outputEmail: automation.outputEmail,
    isEnabled: automation.isEnabled,
    lastRunAt: automation.lastRunAt?.toISOString() || null,
    nextRunAt: automation.nextRunAt?.toISOString() || null,
    consecutiveFailures: automation.consecutiveFailures,
    createdAt: automation.createdAt.toISOString(),
    updatedAt: automation.updatedAt.toISOString(),
    skill: skill?.name ? {
      name: skill.name,
      description: skill.description || '',
      category: skill.category || 'Productivity',
    } : undefined,
  };
}
