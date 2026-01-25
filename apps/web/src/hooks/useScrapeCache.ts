/**
 * Scrape Cache Hook
 *
 * Provides a React hook for the ephemeral scrape cache.
 * Handles cache lookup and multi-tab sync.
 *
 * Note: WebSocket support was removed for Lambda compatibility.
 * Adding WebSocket (via API Gateway WebSocket API) would be a performance
 * optimization - enabling instant updates instead of polling.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  initScrapeCache,
  getCachedScrape,
  cacheScrape,
  subscribeToScrape,
  markScrapePending,
  isScrapePending,
  completePendingScrape,
  failPendingScrape,
  cleanupExpiredEntries,
  type ScrapeCacheEntry,
} from '@/lib/scrape-cache';

export interface UseScrapeOptions {
  onScrapeComplete?: (url: string, content: string) => void;
  onScrapeError?: (url: string, error: string) => void;
  pollIntervalMs?: number;
}

export interface UseScrapeReturn {
  /**
   * Request a scrape for a URL
   * Returns cached result if available, otherwise initiates scrape via polling
   */
  scrape: (url: string) => Promise<ScrapeCacheEntry | null>;

  /**
   * Check if a URL has a cached result
   */
  checkCache: (url: string) => Promise<ScrapeCacheEntry | null>;

  /**
   * Manually cache a scrape result
   */
  cacheResult: (url: string, content: string) => Promise<ScrapeCacheEntry>;

  /**
   * Whether a scrape is currently in progress
   */
  isLoading: boolean;

  /**
   * Current error, if any
   */
  error: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_POLL_INTERVAL = 3000; // 3 seconds

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hook for using the scrape cache with polling
 */
export function useScrapeCache(options: UseScrapeOptions = {}): UseScrapeReturn {
  const { pollIntervalMs = DEFAULT_POLL_INTERVAL } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize cache on mount
  useEffect(() => {
    initPromiseRef.current = initScrapeCache().catch((err) => {
      console.error('Failed to initialize scrape cache:', err);
    });

    // Cleanup expired entries periodically
    const cleanupInterval = setInterval(() => {
      cleanupExpiredEntries().catch(console.error);
    }, 60 * 60 * 1000); // Every hour

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Check cache for a URL
  const checkCache = useCallback(async (url: string): Promise<ScrapeCacheEntry | null> => {
    await initPromiseRef.current;
    return getCachedScrape(url);
  }, []);

  // Manually cache a result
  const cacheResult = useCallback(
    async (url: string, content: string): Promise<ScrapeCacheEntry> => {
      await initPromiseRef.current;
      return cacheScrape(url, content);
    },
    []
  );

  // Request a scrape
  const scrape = useCallback(
    async (url: string): Promise<ScrapeCacheEntry | null> => {
      await initPromiseRef.current;
      setError(null);

      // Check cache first
      const cached = await getCachedScrape(url);
      if (cached) {
        return cached;
      }

      // Check if already pending
      if (isScrapePending(url)) {
        // Subscribe to existing request
        return new Promise((resolve) => {
          const unsubscribe = subscribeToScrape(url, (entry) => {
            unsubscribe();
            resolve(entry);
          });
        });
      }

      // Initiate new scrape request
      setIsLoading(true);

      try {
        // Create scrape task via API
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/v1/scrape/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || `Request failed (${response.status})`);
        }

        const data = await response.json();
        const taskId = data.data?.id || data.id;

        // Mark as pending
        markScrapePending(url, taskId);

        // Poll for completion
        const startTime = Date.now();
        const timeoutMs = 60000; // 60 seconds

        while (true) {
          if (Date.now() - startTime > timeoutMs) {
            failPendingScrape(url, 'Scrape timed out');
            setIsLoading(false);
            throw new Error('Scrape request timed out');
          }

          // Poll task status
          const statusResponse = await fetch(`${API_BASE}/v1/scrape/tasks/${taskId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const task = statusData.data || statusData;

            if (task.status === 'completed' && task.result) {
              const entry = await completePendingScrape(url, task.result, {
                title: task.title,
                source: 'extension',
              });
              options.onScrapeComplete?.(url, task.result);
              setIsLoading(false);
              return entry;
            }

            if (task.status === 'failed' || task.status === 'expired') {
              const errorMsg = task.errorMessage || 'Scrape failed';
              failPendingScrape(url, errorMsg);
              options.onScrapeError?.(url, errorMsg);
              setIsLoading(false);
              throw new Error(errorMsg);
            }
          }

          await sleep(pollIntervalMs);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Scrape request failed';
        setError(message);
        setIsLoading(false);
        failPendingScrape(url, message);
        return null;
      }
    },
    [options, pollIntervalMs]
  );

  return {
    scrape,
    checkCache,
    cacheResult,
    isLoading,
    error,
  };
}
