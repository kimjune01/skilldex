/**
 * Error Reporting API
 *
 * Receives anonymized error reports from clients for debugging and monitoring.
 * Part of the ephemeral architecture - stores standardized error codes only (no PII).
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { errorEvents } from '@skillomatic/db/schema';
import { and, gte, sql, lt, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { ErrorCode, ErrorCategory } from '@skillomatic/shared';
import { getErrorCategory } from '@skillomatic/shared';

// Note: We don't require auth for error reporting to capture errors
// that occur before/during authentication

export const v1ErrorsRoutes = new Hono();

// Error event structure (from client) - uses standardized error codes
interface ClientErrorEvent {
  errorCode: ErrorCode;
  errorCategory?: ErrorCategory; // Optional, we can derive from code
  context?: {
    action?: string;
    skillSlug?: string;
    provider?: string;
    httpStatus?: number;
  };
  timestamp: number;
  sessionId: string;
}

// Valid error codes for validation
const VALID_ERROR_CODES = new Set<string>([
  // LLM
  'LLM_AUTH_FAILED', 'LLM_RATE_LIMITED', 'LLM_TIMEOUT', 'LLM_INVALID_RESPONSE',
  'LLM_CONTEXT_TOO_LONG', 'LLM_CONTENT_FILTERED',
  // ATS
  'ATS_AUTH_FAILED', 'ATS_NOT_FOUND', 'ATS_RATE_LIMITED', 'ATS_TIMEOUT', 'ATS_INVALID_REQUEST',
  // Skill
  'SKILL_NOT_FOUND', 'SKILL_DISABLED', 'SKILL_MISSING_CAPABILITY', 'SKILL_RENDER_FAILED',
  // Scrape
  'SCRAPE_TIMEOUT', 'SCRAPE_BLOCKED', 'SCRAPE_NOT_LOGGED_IN', 'SCRAPE_INVALID_URL',
  // Integration
  'INTEGRATION_NOT_CONNECTED', 'INTEGRATION_TOKEN_EXPIRED', 'INTEGRATION_OAUTH_FAILED',
  // System
  'NETWORK_ERROR', 'VALIDATION_ERROR', 'UNKNOWN_ERROR',
]);

// POST /v1/errors - Report errors from client
v1ErrorsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<{ errors: ClientErrorEvent[]; userId?: string; organizationId?: string }>();

    if (!body.errors || !Array.isArray(body.errors)) {
      return c.json({ error: { message: 'Invalid request body' } }, 400);
    }

    let stored = 0;

    // Store each error event
    for (const event of body.errors) {
      // Validate error code
      if (!event.errorCode || !VALID_ERROR_CODES.has(event.errorCode)) {
        continue; // Skip invalid error codes
      }

      // Derive category if not provided
      const category = event.errorCategory || getErrorCategory(event.errorCode);

      await db.insert(errorEvents).values({
        id: randomUUID(),
        organizationId: body.organizationId || null,
        userId: body.userId || null,
        errorCode: event.errorCode,
        errorCategory: category,
        skillSlug: event.context?.skillSlug || null,
        provider: event.context?.provider || null,
        action: event.context?.action || null,
        httpStatus: event.context?.httpStatus || null,
        sessionId: event.sessionId,
        createdAt: new Date(event.timestamp),
      });

      stored++;

      // Log for monitoring (just code, no PII)
      console.log('[ERROR_EVENT]', {
        code: event.errorCode,
        category,
        provider: event.context?.provider,
        skillSlug: event.context?.skillSlug,
        sessionId: event.sessionId,
      });
    }

    return c.json({ data: { received: body.errors.length, stored } });
  } catch (err) {
    console.error('Error processing error report:', err);
    return c.json({ error: { message: 'Failed to process error report' } }, 500);
  }
});

// GET /v1/errors/stats - Get error statistics (admin only)
v1ErrorsRoutes.get('/stats', async (c) => {
  const adminKey = c.req.header('x-admin-key');

  // Simple admin key check (in production, use proper auth)
  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'mysecretadminkey') {
    return c.json({ error: { message: 'Unauthorized' } }, 401);
  }

  // Query params
  const hours = parseInt(c.req.query('hours') || '24');
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Type-safe db queries - cast for aggregate queries (union type loses overloads)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  // Get error counts by code
  const errorsByCode = await dbAny
    .select({
      errorCode: errorEvents.errorCode,
      errorCategory: errorEvents.errorCategory,
      count: sql<number>`count(*)`,
    })
    .from(errorEvents)
    .where(gte(errorEvents.createdAt, since))
    .groupBy(errorEvents.errorCode, errorEvents.errorCategory)
    .orderBy(sql`count(*) DESC`)
    .limit(50) as { errorCode: string; errorCategory: string; count: number }[];

  // Get error counts by category
  const errorsByCategory = await dbAny
    .select({
      errorCategory: errorEvents.errorCategory,
      count: sql<number>`count(*)`,
    })
    .from(errorEvents)
    .where(gte(errorEvents.createdAt, since))
    .groupBy(errorEvents.errorCategory)
    .orderBy(sql`count(*) DESC`) as { errorCategory: string; count: number }[];

  // Get error counts by provider
  const errorsByProvider = await dbAny
    .select({
      provider: errorEvents.provider,
      count: sql<number>`count(*)`,
    })
    .from(errorEvents)
    .where(and(
      gte(errorEvents.createdAt, since),
      sql`${errorEvents.provider} IS NOT NULL`
    ))
    .groupBy(errorEvents.provider)
    .orderBy(sql`count(*) DESC`)
    .limit(20) as { provider: string | null; count: number }[];

  // Get error counts by skill
  const errorsBySkill = await dbAny
    .select({
      skillSlug: errorEvents.skillSlug,
      count: sql<number>`count(*)`,
    })
    .from(errorEvents)
    .where(and(
      gte(errorEvents.createdAt, since),
      sql`${errorEvents.skillSlug} IS NOT NULL`
    ))
    .groupBy(errorEvents.skillSlug)
    .orderBy(sql`count(*) DESC`)
    .limit(20) as { skillSlug: string | null; count: number }[];

  // Total error count
  const totalResult = await dbAny
    .select({
      count: sql<number>`count(*)`,
    })
    .from(errorEvents)
    .where(gte(errorEvents.createdAt, since)) as { count: number }[];

  const totalErrors = totalResult[0]?.count ?? 0;

  return c.json({
    data: {
      summary: {
        totalErrors,
        uniqueErrorCodes: errorsByCode.length,
        timeRangeHours: hours,
        since: since.toISOString(),
      },
      errorsByCode,
      errorsByCategory,
      errorsByProvider,
      errorsBySkill,
    },
  });
});

// GET /v1/errors/recent - Get recent errors (admin only)
v1ErrorsRoutes.get('/recent', async (c) => {
  const adminKey = c.req.header('x-admin-key');

  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'mysecretadminkey') {
    return c.json({ error: { message: 'Unauthorized' } }, 401);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  const recentErrors = await db
    .select()
    .from(errorEvents)
    .orderBy(desc(errorEvents.createdAt))
    .limit(limit);

  return c.json({
    data: recentErrors.map((e) => ({
      id: e.id,
      errorCode: e.errorCode,
      errorCategory: e.errorCategory,
      provider: e.provider,
      skillSlug: e.skillSlug,
      action: e.action,
      httpStatus: e.httpStatus,
      sessionId: e.sessionId,
      createdAt: e.createdAt,
    })),
  });
});

// DELETE /v1/errors - Clear old errors (admin only)
v1ErrorsRoutes.delete('/', async (c) => {
  const adminKey = c.req.header('x-admin-key');

  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'mysecretadminkey') {
    return c.json({ error: { message: 'Unauthorized' } }, 401);
  }

  // Delete errors older than X days (default 30)
  const days = parseInt(c.req.query('days') || '30');
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  await db
    .delete(errorEvents)
    .where(lt(errorEvents.createdAt, cutoff));

  return c.json({ data: { message: `Deleted errors older than ${days} days` } });
});
