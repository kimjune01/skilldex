/**
 * Error Reporter for Ephemeral Architecture
 *
 * Reports anonymized errors back to the server for debugging and monitoring.
 * PII is stripped from error messages before transmission.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Error event types
export type ErrorEventType =
  | 'llm_error'
  | 'action_error'
  | 'scrape_error'
  | 'skill_render_error'
  | 'auth_error'
  | 'network_error'
  | 'unknown_error';

// Error event structure
export interface ErrorEvent {
  type: ErrorEventType;
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

// Session ID for correlating errors
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    // Generate a random session ID (not tied to user identity)
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

// PII patterns to strip from error messages
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // Phone numbers (various formats)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  // API keys (common formats)
  /\b(sk_live_|sk_test_|pk_live_|pk_test_)[A-Za-z0-9]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]+/gi,
  // URLs with potential PII in query strings
  /\?[A-Za-z0-9=&_%+-]+/g,
  // Names in common error message patterns
  /for user ['"][^'"]+['"]/gi,
  /candidate ['"][^'"]+['"]/gi,
];

/**
 * Strip PII from error message
 */
function stripPII(message: string): string {
  let sanitized = message;

  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Also truncate very long messages (could contain PII)
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '... [truncated]';
  }

  return sanitized;
}

/**
 * Queue of errors to batch send
 */
const errorQueue: ErrorEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Send batched errors to server
 */
async function flushErrors(): Promise<void> {
  if (errorQueue.length === 0) return;

  const batch = [...errorQueue];
  errorQueue.length = 0;

  try {
    const token = localStorage.getItem('token');

    await fetch(`${API_BASE}/v1/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ errors: batch }),
    });
  } catch (err) {
    // Don't report errors about error reporting - could cause infinite loop
    console.error('Failed to report errors:', err);
  }
}

/**
 * Report an error
 */
export function reportError(
  type: ErrorEventType,
  error: Error | string,
  context?: ErrorEvent['context']
): void {
  const message = error instanceof Error ? error.message : error;

  const event: ErrorEvent = {
    type,
    message: stripPII(message),
    context,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };

  // Extract error code if present
  if (error instanceof Error && 'code' in error) {
    event.code = String((error as Error & { code?: unknown }).code);
  }

  // Add to queue
  errorQueue.push(event);

  // Schedule flush if not already scheduled
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null;
      flushErrors();
    }, 5000); // Batch errors every 5 seconds
  }
}

/**
 * Report an LLM error
 */
export function reportLLMError(
  error: Error | string,
  provider: string,
  statusCode?: number
): void {
  reportError('llm_error', error, { provider, statusCode });
}

/**
 * Report an action execution error
 */
export function reportActionError(error: Error | string, action: string): void {
  reportError('action_error', error, { action });
}

/**
 * Report a scrape error
 */
export function reportScrapeError(error: Error | string): void {
  reportError('scrape_error', error);
}

/**
 * Report a skill rendering error
 */
export function reportSkillRenderError(error: Error | string, skillSlug: string): void {
  reportError('skill_render_error', error, { skillSlug });
}

/**
 * Report an authentication error
 */
export function reportAuthError(error: Error | string): void {
  reportError('auth_error', error);
}

/**
 * Report a network error
 */
export function reportNetworkError(error: Error | string): void {
  reportError('network_error', error);
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error instanceof Error) {
      reportError('unknown_error', error);
    } else {
      reportError('unknown_error', String(error));
    }
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    if (event.error) {
      reportError('unknown_error', event.error);
    } else {
      reportError('unknown_error', event.message);
    }
  });
}

/**
 * Force flush any pending errors (call on page unload)
 */
export function flushPendingErrors(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  // Use sendBeacon for reliability on page unload
  if (errorQueue.length > 0 && navigator.sendBeacon) {
    const token = localStorage.getItem('token');
    const blob = new Blob(
      [
        JSON.stringify({
          errors: errorQueue,
          token,
        }),
      ],
      { type: 'application/json' }
    );

    navigator.sendBeacon(`${API_BASE}/v1/errors`, blob);
    errorQueue.length = 0;
  }
}

// Flush errors on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingErrors);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingErrors();
    }
  });
}
