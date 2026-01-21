import { useState, useCallback, useRef, useEffect } from 'react';
import { scrape } from '@/lib/api';
import type { ScrapeTaskPublic } from '@skilldex/shared';

export class ScrapeError extends Error {
  suggestion?: string;

  constructor(message: string, suggestion?: string) {
    super(message);
    this.name = 'ScrapeError';
    this.suggestion = suggestion;
  }
}

interface ScrapeTaskEvent {
  type: 'task_update' | 'connected' | 'subscribed' | 'unsubscribed' | 'pong';
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  result?: string;
  errorMessage?: string;
  userId?: string;
}

interface UseScrapeTaskOptions {
  pollIntervalMs?: number; // Fallback poll interval
  timeoutMs?: number;
}

interface UseScrapeTaskReturn {
  task: ScrapeTaskPublic | null;
  taskId: string | null;
  isLoading: boolean;
  error: string | null;
  suggestion: string | null;
  scrapeUrl: (url: string) => Promise<string>;
  cancel: () => void;
  reset: () => void;
  wsConnected: boolean;
}

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds (slower, just a fallback)
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Get WebSocket URL from current location
function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // In dev, API is on port 3000
  const apiHost = import.meta.env.DEV ? 'localhost:3000' : host;
  return `${protocol}//${apiHost}/ws/scrape`;
}

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token');
}

export function useScrapeTask(options: UseScrapeTaskOptions = {}): UseScrapeTaskReturn {
  const { pollIntervalMs = DEFAULT_POLL_INTERVAL, timeoutMs = DEFAULT_TIMEOUT } = options;

  const [task, setTask] = useState<ScrapeTaskPublic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const cancelledRef = useRef(false);
  const taskIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventResolverRef = useRef<((event: ScrapeTaskEvent) => void) | null>(null);

  // Manage WebSocket connection
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setWsConnected(false);
      return;
    }

    const wsUrl = `${getWsUrl()}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected to scrape notifications');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ScrapeTaskEvent;

        // Handle task updates
        if (data.type === 'task_update' && data.taskId === taskIdRef.current) {
          // Notify any waiting promise
          if (eventResolverRef.current) {
            eventResolverRef.current(data);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected from scrape notifications');
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      setWsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setTask(null);
    setIsLoading(false);
    setError(null);
    setSuggestion(null);
    cancelledRef.current = false;
    taskIdRef.current = null;
    eventResolverRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsLoading(false);
    eventResolverRef.current = null;
  }, []);

  // Subscribe to task updates via WebSocket
  const subscribeToTask = useCallback((taskId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', taskId }));
    }
  }, []);

  // Unsubscribe from task updates
  const unsubscribeFromTask = useCallback((taskId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', taskId }));
    }
  }, []);

  const scrapeUrl = useCallback(
    async (url: string): Promise<string> => {
      reset();
      setIsLoading(true);
      cancelledRef.current = false;

      const startTime = Date.now();

      try {
        // 1. Create the task - returns task ID (pointer)
        const created = await scrape.createTask(url);
        taskIdRef.current = created.id;
        setTask({
          id: created.id,
          url: created.url,
          status: created.status,
          createdAt: created.createdAt,
        });

        // Subscribe to WebSocket updates for this task
        subscribeToTask(created.id);

        // 2. Wait for completion using WebSocket + polling fallback
        while (!cancelledRef.current) {
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            unsubscribeFromTask(created.id);
            const timeoutError = 'Scrape request timed out';
            setError(timeoutError);
            setSuggestion('The scrape took too long. Check if the extension is running and try again.');
            throw new ScrapeError(timeoutError, 'The scrape took too long. Check if the extension is running and try again.');
          }

          // Race between WebSocket event and poll timeout
          const wsEventPromise = new Promise<ScrapeTaskEvent | null>((resolve) => {
            eventResolverRef.current = resolve;
            // Timeout for this wait cycle (use poll interval)
            setTimeout(() => resolve(null), pollIntervalMs);
          });

          const wsEvent = await wsEventPromise;

          // If we got a WebSocket event, process it immediately
          if (wsEvent && wsEvent.type === 'task_update' && wsEvent.taskId === created.id) {
            if (wsEvent.status === 'completed' && wsEvent.result) {
              unsubscribeFromTask(created.id);
              setTask((prev) => prev ? { ...prev, status: 'completed', result: wsEvent.result } : null);
              setIsLoading(false);
              return wsEvent.result;
            }

            if (wsEvent.status === 'failed' || wsEvent.status === 'expired') {
              unsubscribeFromTask(created.id);
              const errorMsg = wsEvent.errorMessage || 'Scrape failed';
              setError(errorMsg);
              setIsLoading(false);
              throw new ScrapeError(errorMsg);
            }

            // Update task state for in-progress status
            if (wsEvent.status) {
              setTask((prev) => prev ? { ...prev, status: wsEvent.status! } : null);
            }
            continue; // Don't poll, wait for next event
          }

          // Fallback: Poll API if WebSocket didn't provide update
          const taskStatus = await scrape.getTask(created.id);
          setTask(taskStatus);

          // Surface suggestion from API if available
          if (taskStatus.suggestion) {
            setSuggestion(taskStatus.suggestion);
          }

          if (taskStatus.status === 'completed') {
            unsubscribeFromTask(created.id);
            setIsLoading(false);
            return taskStatus.result || '';
          }

          if (taskStatus.status === 'failed' || taskStatus.status === 'expired') {
            unsubscribeFromTask(created.id);
            const errorMsg = taskStatus.errorMessage || 'Scrape failed';
            setError(errorMsg);
            if (taskStatus.suggestion) {
              setSuggestion(taskStatus.suggestion);
            }
            setIsLoading(false);
            throw new ScrapeError(errorMsg, taskStatus.suggestion);
          }
        }

        // Cancelled
        unsubscribeFromTask(created.id);
        setIsLoading(false);
        throw new ScrapeError('Scrape cancelled');
      } catch (err) {
        setIsLoading(false);
        if (err instanceof ScrapeError) {
          throw err;
        }
        const message = err instanceof Error ? err.message : 'Scrape failed';
        setError(message);
        throw new ScrapeError(message);
      }
    },
    [pollIntervalMs, timeoutMs, reset, subscribeToTask, unsubscribeFromTask]
  );

  return {
    task,
    taskId: taskIdRef.current,
    isLoading,
    error,
    suggestion,
    scrapeUrl,
    cancel,
    reset,
    wsConnected,
  };
}
