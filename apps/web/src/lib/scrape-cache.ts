/**
 * Scrape Cache - IndexedDB-based cache for scraped content
 *
 * In the ephemeral architecture, scrape results are cached client-side to:
 * 1. Reduce redundant scrape requests for the same URL
 * 2. Allow multi-tab synchronization via BroadcastChannel
 * 3. Keep scraped content (which may contain PII) out of server storage
 *
 * Cache entries expire after 24 hours by default.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

const DB_NAME = 'skillomatic-scrape-cache';
const DB_VERSION = 1;
const STORE_NAME = 'scrapes';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cache entry structure
export interface ScrapeCacheEntry {
  url: string;
  urlHash: string;
  content: string;
  contentType: string;
  scrapedAt: number;
  expiresAt: number;
  metadata?: {
    title?: string;
    description?: string;
    source?: string;
  };
}

// Pending scrape request
export interface PendingScrape {
  url: string;
  taskId: string;
  requestedAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// BroadcastChannel for multi-tab sync
const CHANNEL_NAME = 'skillomatic-scrape-sync';
let broadcastChannel: BroadcastChannel | null = null;

// Database instance
let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initScrapeCache(): Promise<void> {
  if (db) return;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open scrape cache database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;

      // Initialize BroadcastChannel for multi-tab sync
      if ('BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannel.onmessage = handleBroadcastMessage;
      }

      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create scrapes store with urlHash as key
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'urlHash' });
        store.createIndex('url', 'url', { unique: true });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Handle messages from other tabs via BroadcastChannel
 */
function handleBroadcastMessage(event: MessageEvent): void {
  const { type, data } = event.data;

  switch (type) {
    case 'scrape_completed':
      // Another tab completed a scrape - notify any waiting subscribers
      notifySubscribers(data.url, data.entry);
      break;

    case 'cache_cleared':
      // Another tab cleared the cache - clear local state
      pendingRequests.clear();
      break;
  }
}

/**
 * Compute SHA-256 hash of URL for cache key
 */
async function hashUrl(url: string): Promise<string> {
  // Normalize URL first
  const normalized = normalizeUrl(url);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize URL for consistent caching
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Normalize protocol and hostname to lowercase
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove trailing slash
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.protocol}//${parsed.hostname}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Get cached scrape result
 */
export async function getCachedScrape(url: string): Promise<ScrapeCacheEntry | null> {
  await initScrapeCache();
  if (!db) return null;

  const urlHash = await hashUrl(url);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(urlHash);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entry = request.result as ScrapeCacheEntry | undefined;

      // Check if entry exists and hasn't expired
      if (entry && entry.expiresAt > Date.now()) {
        resolve(entry);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Store scrape result in cache
 */
export async function cacheScrape(
  url: string,
  content: string,
  contentType: string = 'text/markdown',
  metadata?: ScrapeCacheEntry['metadata'],
  ttlMs: number = DEFAULT_TTL_MS
): Promise<ScrapeCacheEntry> {
  await initScrapeCache();
  if (!db) throw new Error('Scrape cache not initialized');

  const urlHash = await hashUrl(url);
  const now = Date.now();

  const entry: ScrapeCacheEntry = {
    url: normalizeUrl(url),
    urlHash,
    content,
    contentType,
    scrapedAt: now,
    expiresAt: now + ttlMs,
    metadata,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Broadcast to other tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'scrape_completed',
          data: { url, entry },
        });
      }

      resolve(entry);
    };
  });
}

/**
 * Delete cached scrape
 */
export async function deleteCachedScrape(url: string): Promise<void> {
  await initScrapeCache();
  if (!db) return;

  const urlHash = await hashUrl(url);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(urlHash);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all cached scrapes
 */
export async function clearScrapeCache(): Promise<void> {
  await initScrapeCache();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Notify other tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'cache_cleared' });
      }
      resolve();
    };
  });
}

/**
 * Clean up expired entries
 */
export async function cleanupExpiredEntries(): Promise<number> {
  await initScrapeCache();
  if (!db) return 0;

  const now = Date.now();
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');

    // Get all entries that have expired
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };
  });
}

// Subscribers waiting for scrape results
const subscribers = new Map<string, Array<(entry: ScrapeCacheEntry) => void>>();

// Pending scrape requests (to avoid duplicates)
const pendingRequests = new Map<string, PendingScrape>();

/**
 * Notify subscribers when a scrape completes
 */
function notifySubscribers(url: string, entry: ScrapeCacheEntry): void {
  const normalizedUrl = normalizeUrl(url);
  const callbacks = subscribers.get(normalizedUrl);

  if (callbacks) {
    callbacks.forEach((callback) => callback(entry));
    subscribers.delete(normalizedUrl);
  }
}

/**
 * Subscribe to scrape completion for a URL
 */
export function subscribeToScrape(
  url: string,
  callback: (entry: ScrapeCacheEntry) => void
): () => void {
  const normalizedUrl = normalizeUrl(url);

  if (!subscribers.has(normalizedUrl)) {
    subscribers.set(normalizedUrl, []);
  }
  subscribers.get(normalizedUrl)!.push(callback);

  // Return unsubscribe function
  return () => {
    const callbacks = subscribers.get(normalizedUrl);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        subscribers.delete(normalizedUrl);
      }
    }
  };
}

/**
 * Mark a scrape request as pending
 */
export function markScrapePending(url: string, taskId: string): void {
  const normalizedUrl = normalizeUrl(url);
  pendingRequests.set(normalizedUrl, {
    url: normalizedUrl,
    taskId,
    requestedAt: Date.now(),
    status: 'pending',
  });
}

/**
 * Check if a scrape is already pending
 */
export function isScrapePending(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);
  const pending = pendingRequests.get(normalizedUrl);
  return pending?.status === 'pending' || pending?.status === 'processing';
}

/**
 * Get pending scrape info
 */
export function getPendingScrape(url: string): PendingScrape | null {
  const normalizedUrl = normalizeUrl(url);
  return pendingRequests.get(normalizedUrl) || null;
}

/**
 * Complete a pending scrape request
 */
export async function completePendingScrape(
  url: string,
  content: string,
  metadata?: ScrapeCacheEntry['metadata']
): Promise<ScrapeCacheEntry> {
  const normalizedUrl = normalizeUrl(url);
  const pending = pendingRequests.get(normalizedUrl);

  if (pending) {
    pending.status = 'completed';
  }

  // Cache the result
  const entry = await cacheScrape(url, content, 'text/markdown', metadata);

  // Notify subscribers
  notifySubscribers(url, entry);

  // Clean up pending request after a short delay
  setTimeout(() => {
    pendingRequests.delete(normalizedUrl);
  }, 1000);

  return entry;
}

/**
 * Fail a pending scrape request
 */
export function failPendingScrape(url: string, _error: string): void {
  const normalizedUrl = normalizeUrl(url);
  const pending = pendingRequests.get(normalizedUrl);

  if (pending) {
    pending.status = 'failed';
  }

  // Clean up after a short delay
  setTimeout(() => {
    pendingRequests.delete(normalizedUrl);
  }, 5000);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  await initScrapeCache();
  if (!db)
    return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entries = request.result as ScrapeCacheEntry[];
      let totalSize = 0;
      let oldestEntry: number | null = null;
      let newestEntry: number | null = null;

      entries.forEach((entry) => {
        totalSize += entry.content.length;
        if (oldestEntry === null || entry.scrapedAt < oldestEntry) {
          oldestEntry = entry.scrapedAt;
        }
        if (newestEntry === null || entry.scrapedAt > newestEntry) {
          newestEntry = entry.scrapedAt;
        }
      });

      resolve({
        totalEntries: entries.length,
        totalSize,
        oldestEntry,
        newestEntry,
      });
    };
  });
}
