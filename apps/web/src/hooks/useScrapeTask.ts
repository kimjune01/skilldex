import { useState, useCallback, useRef } from 'react';
import { scrape } from '@/lib/api';
import type { ScrapeTaskPublic } from '@skillomatic/shared';

export class ScrapeError extends Error {
  suggestion?: string;

  constructor(message: string, suggestion?: string) {
    super(message);
    this.name = 'ScrapeError';
    this.suggestion = suggestion;
  }
}

interface UseScrapeTaskOptions {
  pollIntervalMs?: number;
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
}

const DEFAULT_POLL_INTERVAL = 3000; // 3 seconds
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Note: WebSocket support was removed for Lambda compatibility.
// Adding WebSocket (via API Gateway WebSocket API) would be a performance
// optimization - enabling instant updates instead of 3-second polling.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useScrapeTask(options: UseScrapeTaskOptions = {}): UseScrapeTaskReturn {
  const { pollIntervalMs = DEFAULT_POLL_INTERVAL, timeoutMs = DEFAULT_TIMEOUT } = options;

  const [task, setTask] = useState<ScrapeTaskPublic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const taskIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setTask(null);
    setIsLoading(false);
    setError(null);
    setSuggestion(null);
    cancelledRef.current = false;
    taskIdRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsLoading(false);
  }, []);

  const scrapeUrl = useCallback(
    async (url: string): Promise<string> => {
      reset();
      setIsLoading(true);
      cancelledRef.current = false;

      const startTime = Date.now();

      try {
        // 1. Create the task
        const created = await scrape.createTask(url);
        taskIdRef.current = created.id;
        setTask({
          id: created.id,
          url: created.url,
          status: created.status,
          createdAt: created.createdAt,
        });

        // 2. Poll for completion
        while (!cancelledRef.current) {
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            const timeoutError = 'Scrape request timed out';
            setError(timeoutError);
            setSuggestion('The scrape took too long. Check if the extension is running and try again.');
            throw new ScrapeError(timeoutError, 'The scrape took too long. Check if the extension is running and try again.');
          }

          // Poll the API
          const taskStatus = await scrape.getTask(created.id);
          setTask(taskStatus);

          // Surface suggestion from API if available
          if (taskStatus.suggestion) {
            setSuggestion(taskStatus.suggestion);
          }

          if (taskStatus.status === 'completed') {
            setIsLoading(false);
            return taskStatus.result || '';
          }

          if (taskStatus.status === 'failed' || taskStatus.status === 'expired') {
            const errorMsg = taskStatus.errorMessage || 'Scrape failed';
            setError(errorMsg);
            if (taskStatus.suggestion) {
              setSuggestion(taskStatus.suggestion);
            }
            setIsLoading(false);
            throw new ScrapeError(errorMsg, taskStatus.suggestion);
          }

          // Wait before next poll
          await sleep(pollIntervalMs);
        }

        // Cancelled
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
    [pollIntervalMs, timeoutMs, reset]
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
  };
}
