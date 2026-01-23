/**
 * Scrape Routes (JWT Auth)
 *
 * Web-chat-accessible scrape endpoints using JWT authentication.
 * These routes parallel /v1/scrape but use JWT instead of API key auth.
 *
 * The browser extension still uses /v1/scrape with API key auth to report results.
 */
import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import { db } from '@skillomatic/db';
import { scrapeTasks } from '@skillomatic/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import type {
  ScrapeTaskPublic,
  CreateScrapeTaskRequest,
  CreateScrapeTaskResponse,
} from '@skillomatic/shared';
import { assignTaskToExtension } from '../lib/scrape-events.js';

export const scrapeRoutes = new Hono();

// All routes require JWT auth
scrapeRoutes.use('*', jwtAuth);

// Constants
const TASK_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours - reuse completed results
const STALL_THRESHOLD_MS = 30 * 1000; // 30 seconds - suggest extension install

// Allowed domains for scraping (LinkedIn only)
const ALLOWED_DOMAINS = ['www.linkedin.com', 'linkedin.com'];

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

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'msclkid', 'ref', 'source'
  ];
  trackingParams.forEach(param => url.searchParams.delete(param));
  url.searchParams.sort();
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

  if (task.status === 'pending' && waitTime > STALL_THRESHOLD_MS) {
    suggestion =
      'No Skillomatic Scraper extension detected. Install it and ensure it\'s configured with your API key.';
  } else if (task.status === 'failed' && !task.errorMessage) {
    suggestion = 'Task failed unexpectedly. Check extension status in browser toolbar.';
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

// POST /scrape/tasks - Create scrape task (JWT auth)
scrapeRoutes.post('/tasks', async (c) => {
  const user = c.get('user');
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
      const response = formatTask(cached);
      return c.json({ data: { ...response, cached: true } }, 200);
    }

    // Check for pending/processing tasks to avoid duplicate work
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
      return c.json({ data: formatTask(inProgress) }, 200);
    }
  }

  // Create new task (no apiKeyId since this is JWT auth)
  const taskId = randomUUID();

  const [task] = await db
    .insert(scrapeTasks)
    .values({
      id: taskId,
      userId: user.id,
      url: body.url,
      urlHash,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + TASK_TTL_MS),
    })
    .returning();

  // Push task to connected extension via WebSocket
  assignTaskToExtension(user.id, { id: task.id, url: body.url });

  const response: CreateScrapeTaskResponse = {
    id: task.id,
    url: task.url,
    status: 'pending',
    createdAt: task.createdAt.toISOString(),
  };

  return c.json({ data: response }, 201);
});

// GET /scrape/tasks/:id - Get single task by ID
scrapeRoutes.get('/tasks/:id', async (c) => {
  const user = c.get('user');
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
    const [expired] = await db
      .update(scrapeTasks)
      .set({ status: 'expired' })
      .where(eq(scrapeTasks.id, taskId))
      .returning();

    const formatted = formatTask(expired);
    formatted.suggestion =
      'Task expired. The Skillomatic Scraper extension may not be installed or running.';
    return c.json({ data: formatted });
  }

  return c.json({ data: formatTask(task) });
});
