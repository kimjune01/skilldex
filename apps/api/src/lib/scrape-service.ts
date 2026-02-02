/**
 * Scrape Service
 *
 * Internal service functions for scrape operations.
 * Used by both API routes and the MCP server.
 */

import { db } from '@skillomatic/db';
import { scrapeTasks } from '@skillomatic/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
// ScrapeTask type matches the MCP API contract
interface ScrapeTask {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  result?: string;
  errorMessage?: string;
  suggestion?: string;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
}
import { assignTaskToExtension } from './scrape-events.js';

// Constants
const TASK_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PROCESSING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const STALL_THRESHOLD_MS = 30 * 1000; // 30 seconds

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

function hashUrl(normalizedUrl: string): string {
  return createHash('sha256').update(normalizedUrl).digest('hex');
}

function formatTask(task: typeof scrapeTasks.$inferSelect): ScrapeTask {
  const now = Date.now();
  const createdAtMs = task.createdAt.getTime();
  const waitTime = now - createdAtMs;

  let suggestion: string | undefined;

  if (task.status === 'pending' && waitTime > STALL_THRESHOLD_MS) {
    suggestion = 'No Skillomatic Scraper extension detected. Install it and ensure it\'s configured with your API key.';
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
    status: task.status as ScrapeTask['status'],
    result: task.result || undefined,
    errorMessage: task.errorMessage || undefined,
    suggestion,
    createdAt: task.createdAt.toISOString(),
    claimedAt: task.claimedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  };
}

/**
 * Create a scrape task for a URL
 */
export async function createScrapeTaskInternal(userId: string, url: string): Promise<ScrapeTask> {
  // Normalize and hash URL
  let normalizedUrl: string;
  let urlHash: string;
  try {
    normalizedUrl = normalizeUrl(url);
    urlHash = hashUrl(normalizedUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  const now = new Date();
  const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS);

  // Check for cached result
  const [cached] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.userId, userId),
        eq(scrapeTasks.urlHash, urlHash),
        eq(scrapeTasks.status, 'completed'),
        gt(scrapeTasks.completedAt, cacheThreshold)
      )
    )
    .orderBy(desc(scrapeTasks.completedAt))
    .limit(1);

  if (cached) {
    return formatTask(cached);
  }

  // Check for in-progress task
  const [inProgress] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.userId, userId),
        eq(scrapeTasks.urlHash, urlHash),
        gt(scrapeTasks.expiresAt, now)
      )
    )
    .orderBy(desc(scrapeTasks.createdAt))
    .limit(1);

  if (inProgress && ['pending', 'processing'].includes(inProgress.status)) {
    return formatTask(inProgress);
  }

  // Create new task
  const taskId = randomUUID();

  const [task] = await db
    .insert(scrapeTasks)
    .values({
      id: taskId,
      userId,
      apiKeyId: null, // No API key for internal calls
      url,
      urlHash,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + TASK_TTL_MS),
    })
    .returning();

  // Push task to connected extension
  assignTaskToExtension(userId, { id: task.id, url });

  return formatTask(task);
}

/**
 * Get a scrape task by ID
 */
export async function getScrapeTaskInternal(userId: string, taskId: string): Promise<ScrapeTask> {
  const [task] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, userId)
      )
    )
    .limit(1);

  if (!task) {
    throw new Error('Task not found');
  }

  const now = new Date();

  // Check if task should be marked expired
  if (task.status === 'pending' && now > task.expiresAt) {
    const [expired] = await db
      .update(scrapeTasks)
      .set({ status: 'expired' })
      .where(eq(scrapeTasks.id, taskId))
      .returning();

    return formatTask(expired);
  }

  // Check if processing task timed out
  if (task.status === 'processing' && task.claimedAt) {
    const processingTime = now.getTime() - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      const [failed] = await db
        .update(scrapeTasks)
        .set({
          status: 'failed',
          errorMessage: 'Processing timeout - extension may have disconnected',
        })
        .where(eq(scrapeTasks.id, taskId))
        .returning();

      return formatTask(failed);
    }
  }

  return formatTask(task);
}
