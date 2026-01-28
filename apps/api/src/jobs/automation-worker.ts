/**
 * Automation Worker Lambda Handler
 *
 * Triggered by EventBridge every minute to process due automations.
 * Executes skills via Gemini 3 Flash and delivers results via email.
 *
 * Architecture:
 * 1. Query for automations where isEnabled=true AND nextRunAt <= now
 * 2. For each automation: load skill, execute via Gemini, send email
 * 3. Update nextRunAt based on cron expression
 * 4. On failure: exponential backoff, max 3 retries
 *
 * @see docs/future/AUTOMATIONS_EXPLORATION.md
 */
import { Resource } from 'sst';

// Set environment variables from SST secrets before loading other modules
try {
  process.env.TURSO_DATABASE_URL = Resource.TursoDatabaseUrl.value;
  process.env.TURSO_AUTH_TOKEN = Resource.TursoAuthToken.value;
  // @ts-expect-error - GeminiApiKey added for automations, types regenerate on deploy
  process.env.GEMINI_API_KEY = Resource.GeminiApiKey.value;
} catch {
  // Running locally without SST resources
  console.log('[AutomationWorker] Running without SST resources (local dev)');
}

import { db } from '@skillomatic/db';
import { automations, automationRuns, skills, users } from '@skillomatic/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { chat, type LLMChatMessage } from '../lib/llm.js';
import { sendAutomationResultEmail, sendAutomationFailureEmail } from '../lib/automation-email.js';
import { calculateNextRun } from '../lib/cron-utils.js';

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

interface ExecutionResult {
  success: boolean;
  output?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Main handler for EventBridge cron trigger
 */
export async function handler(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date();
  console.log(`[AutomationWorker] Starting at ${now.toISOString()}`);

  // Query due automations
  const dueAutomations = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.isEnabled, true),
        lte(automations.nextRunAt, now)
      )
    )
    .limit(BATCH_SIZE);

  console.log(`[AutomationWorker] Found ${dueAutomations.length} due automations`);

  let succeeded = 0;
  let failed = 0;

  // Process each automation
  for (const automation of dueAutomations) {
    try {
      const success = await processAutomation(automation, now);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`[AutomationWorker] Unhandled error for ${automation.id}:`, error);
      failed++;
    }
  }

  console.log(`[AutomationWorker] Complete: ${succeeded} succeeded, ${failed} failed`);

  return { processed: dueAutomations.length, succeeded, failed };
}

/**
 * Process a single automation
 */
async function processAutomation(
  automation: typeof automations.$inferSelect,
  now: Date
): Promise<boolean> {
  const runId = randomUUID();
  const startTime = Date.now();

  console.log(`[AutomationWorker] Processing automation ${automation.id} (${automation.name})`);

  // Create run record
  await db.insert(automationRuns).values({
    id: runId,
    automationId: automation.id,
    status: 'running',
    triggeredBy: 'schedule',
    startedAt: now,
    createdAt: now,
  });

  try {
    // Load the skill
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.slug, automation.skillSlug))
      .limit(1);

    if (!skill) {
      throw new AutomationError('SKILL_NOT_FOUND', `Skill not found: ${automation.skillSlug}`);
    }

    if (!skill.instructions) {
      throw new AutomationError('SKILL_NO_INSTRUCTIONS', `Skill has no instructions: ${automation.skillSlug}`);
    }

    if (!skill.automationEnabled) {
      throw new AutomationError('SKILL_NOT_AUTOMATABLE', `Skill does not support automation: ${automation.skillSlug}`);
    }

    // Get user info for context
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, automation.userId))
      .limit(1);

    // Execute via Gemini
    const result = await executeSkillViaGemini(
      skill,
      automation.skillParams ? JSON.parse(automation.skillParams) : {},
      user
    );

    if (!result.success) {
      throw new AutomationError(result.errorCode || 'EXECUTION_FAILED', result.errorMessage);
    }

    // Send email with results
    const emailResult = await sendAutomationResultEmail({
      to: automation.outputEmail,
      automationName: automation.name,
      skillName: skill.name,
      output: result.output || 'No output generated',
      executedAt: now,
    });

    if (!emailResult.success) {
      throw new AutomationError('EMAIL_DELIVERY_FAILED', emailResult.error);
    }

    // Update automation state - success
    const nextRun = calculateNextRun(automation.cronExpression, automation.cronTimezone);
    await db.update(automations)
      .set({
        lastRunAt: now,
        nextRunAt: nextRun,
        consecutiveFailures: 0,
        updatedAt: now,
      })
      .where(eq(automations.id, automation.id));

    // Update run record - completed
    const durationMs = Date.now() - startTime;
    await db.update(automationRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        durationMs,
        outputSummary: `Sent report to ${automation.outputEmail}`,
      })
      .where(eq(automationRuns.id, runId));

    console.log(`[AutomationWorker] Success: ${automation.id} (${durationMs}ms)`);
    return true;

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorCode = error instanceof AutomationError ? error.code : 'UNKNOWN_ERROR';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const failures = automation.consecutiveFailures + 1;

    console.error(`[AutomationWorker] Failed: ${automation.id} - ${errorCode}: ${errorMessage}`);

    // Exponential backoff for retries (max 1 hour)
    const backoffMinutes = Math.min(Math.pow(2, failures), 60);
    const nextRun = failures < MAX_RETRIES
      ? new Date(now.getTime() + backoffMinutes * 60 * 1000)
      : calculateNextRun(automation.cronExpression, automation.cronTimezone);

    // Update automation state - failure
    await db.update(automations)
      .set({
        consecutiveFailures: failures,
        nextRunAt: nextRun,
        updatedAt: now,
      })
      .where(eq(automations.id, automation.id));

    // Update run record - failed
    await db.update(automationRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        durationMs,
        errorCode,
        retryCount: failures,
      })
      .where(eq(automationRuns.id, runId));

    // Send failure notification if max retries reached
    if (failures >= MAX_RETRIES) {
      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.slug, automation.skillSlug))
        .limit(1);

      await sendAutomationFailureEmail({
        to: automation.outputEmail,
        automationName: automation.name,
        skillName: skill?.name || automation.skillSlug,
        errorCode,
        errorMessage,
        executedAt: now,
        consecutiveFailures: failures,
      });
    }

    return false;
  }
}

/**
 * Execute a skill via Gemini LLM
 */
async function executeSkillViaGemini(
  skill: typeof skills.$inferSelect,
  params: Record<string, unknown>,
  user: typeof users.$inferSelect | undefined
): Promise<ExecutionResult> {
  const systemPrompt = `You are executing an automated skill for Skillomatic.

## Skill: ${skill.name}
${skill.description}

## Instructions
${skill.instructions}

## Context
- User: ${user?.name || 'Unknown'}
- User Email: ${user?.email || 'Unknown'}
- Executed At: ${new Date().toISOString()}
- Parameters: ${JSON.stringify(params)}

## Output Requirements
Execute this skill and provide a clear, formatted output suitable for email delivery.
Focus on the key results and insights. Keep the response concise but informative.
Use markdown formatting (headers, bullets, bold) for readability.`;

  const messages: LLMChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Execute the "${skill.name}" skill and generate a report based on the instructions above.` },
  ];

  try {
    const output = await chat(messages, {
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
      maxTokens: 4096,
      temperature: 0.3, // Lower temperature for consistent outputs
    });

    if (!output || output.trim().length === 0) {
      return { success: false, errorCode: 'LLM_EMPTY_RESPONSE', errorMessage: 'LLM returned empty response' };
    }

    return { success: true, output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Classify the error
    const lowerMessage = errorMessage.toLowerCase();
    let errorCode = 'LLM_ERROR';

    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      errorCode = 'LLM_RATE_LIMITED';
    } else if (lowerMessage.includes('timeout')) {
      errorCode = 'LLM_TIMEOUT';
    } else if (lowerMessage.includes('auth') || lowerMessage.includes('401') || lowerMessage.includes('403')) {
      errorCode = 'LLM_AUTH_FAILED';
    } else if (lowerMessage.includes('not configured')) {
      errorCode = 'LLM_NOT_CONFIGURED';
    }

    return { success: false, errorCode, errorMessage };
  }
}

/**
 * Custom error class for automation failures
 */
class AutomationError extends Error {
  constructor(public code: string, message?: string) {
    super(message || code);
    this.name = 'AutomationError';
  }
}
