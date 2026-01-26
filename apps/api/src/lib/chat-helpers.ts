import { createHash } from 'crypto';
import { db } from '@skillomatic/db';
import { scrapeTasks } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { type ScrapeTaskEvent } from './scrape-events.js';

// ============ Email types and helpers ============

export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Parse recipient input - supports string or array of EmailAddress
 */
export function parseRecipients(input: unknown): EmailAddress[] {
  if (!input) return [];

  if (typeof input === 'string') {
    return [{ email: input }];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') {
        return { email: item };
      }
      return item as EmailAddress;
    });
  }

  return [];
}

// ============ URL normalization ============

/**
 * Normalize a URL for deduplication purposes
 * - Lowercases protocol and hostname
 * - Removes default ports (80 for http, 443 for https)
 * - Removes trailing slashes from paths
 * - Removes tracking parameters (utm_*, fbclid, gclid)
 * - Sorts query parameters
 * - Removes hash fragments
 */
export function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
  ];
  trackingParams.forEach((param) => url.searchParams.delete(param));
  url.searchParams.sort();
  url.hash = '';
  return url.toString();
}

/**
 * Create a SHA256 hash of a normalized URL
 */
export function hashUrl(normalizedUrl: string): string {
  return createHash('sha256').update(normalizedUrl).digest('hex');
}

// ============ Scrape task helpers ============

/**
 * Wait for a scrape task to complete using event callbacks + polling fallback
 */
export async function waitForScrapeTask(
  userId: string,
  taskId: string,
  originalUrl: string,
  timeoutMs: number
): Promise<unknown> {
  const POLL_INTERVAL_MS = 3000; // Slower polling as backup (3 seconds)
  const startTime = Date.now();

  // Create a promise that will be resolved when we get a WebSocket event
  let eventResolver: ((event: ScrapeTaskEvent) => void) | null = null;
  const eventPromise = new Promise<ScrapeTaskEvent>((resolve) => {
    eventResolver = resolve;
  });

  // Register callback for WebSocket events (set in scrape-events.ts taskCallbacks)
  const callbackKey = `${userId}:${taskId}`;
  const { taskCallbacks } = await import('./scrape-events.js');
  taskCallbacks.set(callbackKey, (event: ScrapeTaskEvent) => {
    if (eventResolver) eventResolver(event);
  });

  try {
    // Race between: WebSocket event, polling check, and timeout
    while (Date.now() - startTime < timeoutMs) {
      // Check database (polling fallback in case WebSocket misses something)
      const [task] = await db
        .select()
        .from(scrapeTasks)
        .where(eq(scrapeTasks.id, taskId))
        .limit(1);

      if (!task) {
        return { error: 'Task disappeared unexpectedly' };
      }

      if (task.status === 'completed' && task.result) {
        return {
          success: true,
          url: originalUrl,
          content: task.result,
          cached: false,
        };
      }

      if (task.status === 'failed') {
        return {
          error: task.errorMessage || 'Scrape failed',
          suggestion: 'Check that the Skillomatic Scraper extension is installed and running.',
        };
      }

      if (task.status === 'expired') {
        return {
          error: 'Scrape task expired',
          suggestion: 'The Skillomatic Scraper extension may not be installed or running.',
        };
      }

      // Wait for either: WebSocket event OR poll interval
      const remainingTime = timeoutMs - (Date.now() - startTime);
      const waitTime = Math.min(POLL_INTERVAL_MS, remainingTime);

      if (waitTime <= 0) break;

      // Race between event and timeout
      const result = await Promise.race([
        eventPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), waitTime)),
      ]);

      // If we got a WebSocket event, process it
      if (result && result.type === 'task_update') {
        if (result.status === 'completed' && result.result) {
          return {
            success: true,
            url: originalUrl,
            content: result.result,
            cached: false,
          };
        }
        if (result.status === 'failed') {
          return {
            error: result.errorMessage || 'Scrape failed',
            suggestion: 'Check that the Skillomatic Scraper extension is installed and running.',
          };
        }
        if (result.status === 'expired') {
          return {
            error: 'Scrape task expired',
            suggestion: 'The Skillomatic Scraper extension may not be installed or running.',
          };
        }
      }
    }

    // Timeout
    return {
      error: 'Scrape timed out waiting for browser extension',
      suggestion:
        'Install the Skillomatic Scraper browser extension and ensure it is configured with your API key.',
      taskId,
    };
  } finally {
    // Clean up callback
    taskCallbacks.delete(callbackKey);
  }
}
