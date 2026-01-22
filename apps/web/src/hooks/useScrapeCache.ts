/**
 * Scrape Cache Hook
 *
 * Provides a React hook for the ephemeral scrape cache.
 * Handles cache lookup, WebSocket integration, and multi-tab sync.
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
}

export interface UseScrapeReturn {
  /**
   * Request a scrape for a URL
   * Returns cached result if available, otherwise initiates scrape via WebSocket
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

/**
 * Hook for using the scrape cache with WebSocket integration
 */
export function useScrapeCache(options: UseScrapeOptions = {}): UseScrapeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
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
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Connect to WebSocket for scrape results
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token for WebSocket connection');
      return null;
    }

    // Build WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).host
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/scrape?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for scrape results');
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'task_completed': {
            const { url, result } = data;
            // Cache the result
            await completePendingScrape(url, result.content, {
              title: result.title,
              source: 'extension',
            });
            options.onScrapeComplete?.(url, result.content);
            break;
          }

          case 'task_failed': {
            const { url, error: errorMsg } = data;
            failPendingScrape(url, errorMsg);
            options.onScrapeError?.(url, errorMsg);
            break;
          }

          case 'task_progress': {
            // Could update UI with progress
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
    };

    wsRef.current = ws;
    return ws;
  }, [options]);

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

        // Connect WebSocket to receive results
        connectWebSocket();

        // Wait for result via subscription
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            failPendingScrape(url, 'Scrape timed out');
            setIsLoading(false);
            reject(new Error('Scrape request timed out'));
          }, 60000); // 60 second timeout

          const unsubscribe = subscribeToScrape(url, (entry) => {
            clearTimeout(timeout);
            unsubscribe();
            setIsLoading(false);
            resolve(entry);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Scrape request failed';
        setError(message);
        setIsLoading(false);
        failPendingScrape(url, message);
        return null;
      }
    },
    [connectWebSocket]
  );

  return {
    scrape,
    checkCache,
    cacheResult,
    isLoading,
    error,
  };
}
