import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { scrapeTasks, users, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq, and, gt, desc, lt } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import type {
  ScrapeTaskPublic,
  CreateScrapeTaskRequest,
  CreateScrapeTaskResponse,
  UpdateScrapeTaskRequest,
} from '@skillomatic/shared';
import { emitTaskUpdate, assignTaskToExtension } from '../../lib/scrape-events.js';

export const v1ScrapeRoutes = new Hono();

// All routes require API key auth
v1ScrapeRoutes.use('*', apiKeyAuth);

// Constants
const TASK_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours - reuse completed results
const STALL_THRESHOLD_MS = 30 * 1000; // 30 seconds - suggest extension install
const PROCESSING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes - mark as expired

// Allowed domains for scraping (LinkedIn only)
const ALLOWED_DOMAINS = ['www.linkedin.com', 'linkedin.com'];

// ============ URL Validation ============

/**
 * Check if URL is an allowed domain (LinkedIn only)
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// ============ URL Normalization & Hashing ============

/**
 * Normalize URL for deduplication:
 * - Lowercase protocol and hostname
 * - Remove default ports (80, 443)
 * - Sort query parameters
 * - Remove trailing slashes
 * - Remove common tracking parameters (utm_*, fbclid, etc.)
 */
function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);

  // Lowercase protocol and hostname
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  // Remove default ports
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }

  // Remove trailing slash from pathname (except root)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  // Remove common tracking parameters
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'msclkid', 'ref', 'source'
  ];
  trackingParams.forEach(param => url.searchParams.delete(param));

  // Sort remaining query parameters
  url.searchParams.sort();

  // Remove hash/fragment
  url.hash = '';

  return url.toString();
}

/**
 * Create SHA-256 hash of normalized URL
 */
function hashUrl(normalizedUrl: string): string {
  return createHash('sha256').update(normalizedUrl).digest('hex');
}

// Helper to format task for API response
function formatTask(task: typeof scrapeTasks.$inferSelect): ScrapeTaskPublic {
  const now = Date.now();
  const createdAtMs = task.createdAt.getTime();
  const waitTime = now - createdAtMs;

  let suggestion: string | undefined;

  // Add suggestions based on task state
  if (task.status === 'pending' && waitTime > STALL_THRESHOLD_MS) {
    suggestion =
      'No Skillomatic Scraper extension detected. Install it and ensure it\'s configured with your API key.';
  } else if (task.status === 'failed' && !task.errorMessage) {
    suggestion = 'Task failed unexpectedly. Check extension status in browser toolbar.';
  } else if (task.status === 'processing' && task.claimedAt) {
    const processingTime = now - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      suggestion = 'Extension may have disconnected during scrape. Please check your browser and try again.';
    }
  }

  return {
    id: task.id,
    url: task.url,
    status: task.status as ScrapeTaskPublic['status'],
    result: task.result || undefined,
    errorMessage: task.errorMessage || undefined,
    suggestion,
    createdAt: task.createdAt.toISOString(),
    claimedAt: task.claimedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  };
}

// POST /v1/scrape/tasks - Create scrape task, return pointer (task ID)
// Supports deduplication: returns cached result if same URL was scraped recently
v1ScrapeRoutes.post('/tasks', async (c) => {
  const user = c.get('apiKeyUser');
  const body = await c.req.json<CreateScrapeTaskRequest>();
  const forceRefresh = c.req.query('refresh') === 'true';

  if (!body.url) {
    return c.json({ error: { message: 'URL is required' } }, 400);
  }

  // Validate URL is LinkedIn
  if (!isAllowedUrl(body.url)) {
    return c.json({
      error: {
        message: 'Only LinkedIn URLs are supported. The scrape API is restricted to linkedin.com domains.'
      }
    }, 400);
  }

  // Validate and normalize URL
  let normalizedUrl: string;
  let urlHash: string;
  try {
    normalizedUrl = normalizeUrl(body.url);
    urlHash = hashUrl(normalizedUrl);
  } catch {
    return c.json({ error: { message: 'Invalid URL format' } }, 400);
  }

  const now = new Date();
  const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS);

  // Check for existing cached result (unless force refresh)
  if (!forceRefresh) {
    // Look for a completed task with the same URL hash within cache TTL
    const [cached] = await db
      .select()
      .from(scrapeTasks)
      .where(
        and(
          eq(scrapeTasks.userId, user.id),
          eq(scrapeTasks.urlHash, urlHash),
          eq(scrapeTasks.status, 'completed'),
          gt(scrapeTasks.completedAt, cacheThreshold)
        )
      )
      .orderBy(desc(scrapeTasks.completedAt))
      .limit(1);

    if (cached) {
      // Return cached result with cache indicator
      const response = formatTask(cached);
      return c.json({ ...response, cached: true }, 200);
    }

    // Also check for pending/processing tasks to avoid duplicate work
    const [inProgress] = await db
      .select()
      .from(scrapeTasks)
      .where(
        and(
          eq(scrapeTasks.userId, user.id),
          eq(scrapeTasks.urlHash, urlHash),
          gt(scrapeTasks.expiresAt, now)
        )
      )
      .orderBy(desc(scrapeTasks.createdAt))
      .limit(1);

    if (inProgress && ['pending', 'processing'].includes(inProgress.status)) {
      // Return existing in-progress task
      return c.json(formatTask(inProgress), 200);
    }
  }

  // Create new task
  const taskId = randomUUID();

  const [task] = await db
    .insert(scrapeTasks)
    .values({
      id: taskId,
      userId: user.id,
      apiKeyId: user.apiKeyId,
      url: body.url,
      urlHash,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + TASK_TTL_MS),
    })
    .returning();

  // Push task to connected extension via WebSocket (if available)
  assignTaskToExtension(user.id, { id: task.id, url: body.url });

  const response: CreateScrapeTaskResponse = {
    id: task.id,
    url: task.url,
    status: 'pending',
    createdAt: task.createdAt.toISOString(),
  };

  return c.json(response, 201);
});

// GET /v1/scrape/tasks - List tasks or claim pending task (for extension)
v1ScrapeRoutes.get('/tasks', async (c) => {
  const user = c.get('apiKeyUser');
  const status = c.req.query('status');
  const claim = c.req.query('claim') === 'true';

  const now = new Date();

  // If status=pending and claim=true, extension is polling - mark extension as installed
  if (status === 'pending' && claim) {
    // Side effect: advance onboarding to EXTENSION_INSTALLED if not already there
    // This is fire-and-forget, we don't wait for it
    db.update(users)
      .set({
        onboardingStep: ONBOARDING_STEPS.EXTENSION_INSTALLED,
        updatedAt: now,
      })
      .where(
        and(
          eq(users.id, user.id),
          lt(users.onboardingStep, ONBOARDING_STEPS.EXTENSION_INSTALLED)
        )
      )
      .catch(() => {
        // Ignore errors - this is a side effect
      });
  }

  // If status=pending and claim=true, atomically claim one task for processing
  if (status === 'pending' && claim) {
    // Find oldest pending task that hasn't expired
    const [pendingTask] = await db
      .select()
      .from(scrapeTasks)
      .where(
        and(
          eq(scrapeTasks.userId, user.id),
          eq(scrapeTasks.status, 'pending'),
          gt(scrapeTasks.expiresAt, now)
        )
      )
      .orderBy(scrapeTasks.createdAt)
      .limit(1);

    if (!pendingTask) {
      return c.json({ task: null });
    }

    // Atomically mark as processing
    const [claimed] = await db
      .update(scrapeTasks)
      .set({
        status: 'processing',
        claimedAt: now,
      })
      .where(
        and(
          eq(scrapeTasks.id, pendingTask.id),
          eq(scrapeTasks.status, 'pending') // Ensure still pending (atomic)
        )
      )
      .returning();

    if (!claimed) {
      // Another worker claimed it, return null
      return c.json({ task: null });
    }

    return c.json({ task: formatTask(claimed) });
  }

  // Otherwise, list user's tasks
  const tasks = await db
    .select()
    .from(scrapeTasks)
    .where(eq(scrapeTasks.userId, user.id))
    .orderBy(scrapeTasks.createdAt)
    .limit(50);

  // Filter by status if provided
  const filtered = status
    ? tasks.filter((t) => t.status === status)
    : tasks;

  return c.json({
    tasks: filtered.map(formatTask),
    total: filtered.length,
  });
});

// GET /v1/scrape/tasks/:id - Get single task by ID (pointer lookup)
v1ScrapeRoutes.get('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');

  const [task] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    )
    .limit(1);

  if (!task) {
    return c.json({ error: { message: 'Task not found' } }, 404);
  }

  // Check if task should be marked expired
  const now = new Date();
  if (task.status === 'pending' && now > task.expiresAt) {
    // Mark as expired
    const [expired] = await db
      .update(scrapeTasks)
      .set({ status: 'expired' })
      .where(eq(scrapeTasks.id, taskId))
      .returning();

    const formatted = formatTask(expired);
    formatted.suggestion =
      'Task expired. The Skillomatic Scraper extension may not be installed or running.';
    return c.json(formatted);
  }

  // Check if processing task timed out
  if (task.status === 'processing' && task.claimedAt) {
    const processingTime = now.getTime() - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      // Mark as failed due to timeout
      const [failed] = await db
        .update(scrapeTasks)
        .set({
          status: 'failed',
          errorMessage: 'Processing timeout - extension may have disconnected',
        })
        .where(eq(scrapeTasks.id, taskId))
        .returning();

      return c.json(formatTask(failed));
    }
  }

  return c.json(formatTask(task));
});

// PUT /v1/scrape/tasks/:id - Update task (extension reports result)
v1ScrapeRoutes.put('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');
  const body = await c.req.json<UpdateScrapeTaskRequest>();

  // Validate status
  if (!['completed', 'failed'].includes(body.status)) {
    return c.json({ error: { message: 'Status must be "completed" or "failed"' } }, 400);
  }

  // Find the task
  const [task] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    )
    .limit(1);

  if (!task) {
    return c.json({ error: { message: 'Task not found' } }, 404);
  }

  // Only allow updating tasks that are pending or processing
  if (!['pending', 'processing'].includes(task.status)) {
    return c.json(
      { error: { message: `Cannot update task with status "${task.status}"` } },
      400
    );
  }

  // Update the task
  const now = new Date();
  const [updated] = await db
    .update(scrapeTasks)
    .set({
      status: body.status,
      result: body.result,
      errorMessage: body.errorMessage,
      completedAt: now,
    })
    .where(eq(scrapeTasks.id, taskId))
    .returning();

  // Broadcast task update via WebSocket
  emitTaskUpdate(taskId, {
    type: 'task_update',
    taskId,
    status: body.status as 'completed' | 'failed',
    result: body.result,
    errorMessage: body.errorMessage,
  });

  return c.json(formatTask(updated));
});

// DELETE /v1/scrape/tasks/:id - Cancel/delete a task
v1ScrapeRoutes.delete('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');

  await db
    .delete(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    );

  return c.json({ deleted: true });
});
