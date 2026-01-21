/**
 * Error Reporting API
 *
 * Receives anonymized error reports from clients for debugging and monitoring.
 * Part of the ephemeral architecture - client-side chat errors are reported here.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { Hono } from 'hono';

// Note: We don't require auth for error reporting to capture errors
// that occur before/during authentication

export const v1ErrorsRoutes = new Hono();

// Error event structure (from client)
interface ErrorEvent {
  type: string;
  code?: string;
  message: string;
  context?: {
    action?: string;
    skillSlug?: string;
    provider?: string;
    statusCode?: number;
  };
  timestamp: number;
  sessionId: string;
}

// In-memory error aggregation (could be moved to DB or external service)
const errorCounts: Map<string, { count: number; lastSeen: number; sample: ErrorEvent }> =
  new Map();

// POST /api/v1/errors - Report errors from client
v1ErrorsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<{ errors: ErrorEvent[] }>();

    if (!body.errors || !Array.isArray(body.errors)) {
      return c.json({ error: { message: 'Invalid request body' } }, 400);
    }

    // Process and aggregate errors
    for (const event of body.errors) {
      // Skip invalid events
      if (!event.type || !event.message) continue;

      // Create a key for aggregation (type + code + context)
      const contextKey = event.context
        ? `${event.context.action || ''}-${event.context.skillSlug || ''}-${event.context.provider || ''}`
        : '';
      const aggregationKey = `${event.type}:${event.code || ''}:${contextKey}`;

      const existing = errorCounts.get(aggregationKey);
      if (existing) {
        existing.count++;
        existing.lastSeen = event.timestamp;
      } else {
        errorCounts.set(aggregationKey, {
          count: 1,
          lastSeen: event.timestamp,
          sample: event,
        });
      }

      // Log errors for monitoring (in production, send to observability service)
      console.log('[CLIENT_ERROR]', {
        type: event.type,
        code: event.code,
        message: event.message.substring(0, 200),
        context: event.context,
        sessionId: event.sessionId,
      });
    }

    return c.json({ data: { received: body.errors.length } });
  } catch (err) {
    console.error('Error processing error report:', err);
    return c.json({ error: { message: 'Failed to process error report' } }, 500);
  }
});

// GET /api/v1/errors/stats - Get error statistics (admin only)
// Note: In a real implementation, this should require admin auth
v1ErrorsRoutes.get('/stats', async (c) => {
  const adminKey = c.req.header('x-admin-key');

  // Simple admin key check (in production, use proper auth)
  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'mysecretadminkey') {
    return c.json({ error: { message: 'Unauthorized' } }, 401);
  }

  // Convert map to array sorted by count
  const stats = Array.from(errorCounts.entries())
    .map(([key, data]) => ({
      key,
      ...data,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100); // Top 100 errors

  // Calculate summary
  const totalErrors = stats.reduce((sum, s) => sum + s.count, 0);
  const errorsByType: Record<string, number> = {};

  for (const stat of stats) {
    const type = stat.sample.type;
    errorsByType[type] = (errorsByType[type] || 0) + stat.count;
  }

  return c.json({
    data: {
      summary: {
        totalErrors,
        uniqueErrors: stats.length,
        errorsByType,
      },
      errors: stats.map((s) => ({
        type: s.sample.type,
        code: s.sample.code,
        message: s.sample.message,
        context: s.sample.context,
        count: s.count,
        lastSeen: new Date(s.lastSeen).toISOString(),
      })),
    },
  });
});

// DELETE /api/v1/errors/stats - Clear error statistics (admin only)
v1ErrorsRoutes.delete('/stats', async (c) => {
  const adminKey = c.req.header('x-admin-key');

  if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'mysecretadminkey') {
    return c.json({ error: { message: 'Unauthorized' } }, 401);
  }

  errorCounts.clear();

  return c.json({ data: { message: 'Error statistics cleared' } });
});
