/**
 * Error Reporter for Ephemeral Architecture
 *
 * Reports standardized error codes back to the server for debugging and monitoring.
 * Raw error messages are classified into error codes - no PII is sent to server.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import type { ErrorCode, ErrorEventReport } from '@skillomatic/shared';
import { getErrorCategory } from '@skillomatic/shared';

const API_BASE = import.meta.env.VITE_API_URL;

// Session ID for correlating errors (not user identity)
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

// Context for error classification
interface ErrorContext {
  provider?: string;
  action?: string;
  skillSlug?: string;
  httpStatus?: number;
}

/**
 * Classify a raw error into a standardized error code.
 * This is where PII stripping happens - raw messages become safe codes.
 */
export function classifyError(error: Error | string, context: ErrorContext = {}): ErrorCode {
  const message = error instanceof Error ? error.message : error;
  const lowerMessage = message.toLowerCase();
  const status = context.httpStatus;

  // Auth errors
  if (status === 401 || lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication failed')) {
    if (context.provider?.includes('llm') || context.provider?.includes('anthropic') ||
        context.provider?.includes('openai') || context.provider?.includes('groq')) {
      return 'LLM_AUTH_FAILED';
    }
    if (context.provider?.includes('ats') || context.provider?.includes('greenhouse') ||
        context.provider?.includes('lever') || context.provider?.includes('ashby')) {
      return 'ATS_AUTH_FAILED';
    }
    if (context.action?.includes('integration') || context.action?.includes('oauth')) {
      return 'INTEGRATION_TOKEN_EXPIRED';
    }
    return 'ATS_AUTH_FAILED'; // Default for 401
  }

  // Rate limiting
  if (status === 429 || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    if (context.provider?.includes('llm') || context.provider?.includes('anthropic') ||
        context.provider?.includes('openai') || context.provider?.includes('groq')) {
      return 'LLM_RATE_LIMITED';
    }
    return 'ATS_RATE_LIMITED';
  }

  // Timeouts
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out') ||
      lowerMessage.includes('deadline exceeded')) {
    if (context.action?.includes('scrape')) {
      return 'SCRAPE_TIMEOUT';
    }
    if (context.provider?.includes('llm') || context.provider?.includes('anthropic') ||
        context.provider?.includes('openai') || context.provider?.includes('groq')) {
      return 'LLM_TIMEOUT';
    }
    return 'ATS_TIMEOUT';
  }

  // Not found errors
  if (status === 404 || lowerMessage.includes('not found')) {
    if (context.skillSlug || context.action?.includes('skill')) {
      return 'SKILL_NOT_FOUND';
    }
    return 'ATS_NOT_FOUND';
  }

  // LLM-specific errors
  if (lowerMessage.includes('context') && lowerMessage.includes('long')) {
    return 'LLM_CONTEXT_TOO_LONG';
  }
  if (lowerMessage.includes('content') && (lowerMessage.includes('filter') || lowerMessage.includes('policy'))) {
    return 'LLM_CONTENT_FILTERED';
  }
  if (lowerMessage.includes('invalid') && lowerMessage.includes('response')) {
    return 'LLM_INVALID_RESPONSE';
  }

  // Skill-specific errors
  if (lowerMessage.includes('skill') && lowerMessage.includes('disabled')) {
    return 'SKILL_DISABLED';
  }
  if (lowerMessage.includes('missing') && (lowerMessage.includes('capability') || lowerMessage.includes('integration'))) {
    return 'SKILL_MISSING_CAPABILITY';
  }
  if (lowerMessage.includes('render') && lowerMessage.includes('failed')) {
    return 'SKILL_RENDER_FAILED';
  }

  // Scrape-specific errors
  if (lowerMessage.includes('blocked') || lowerMessage.includes('access denied')) {
    return 'SCRAPE_BLOCKED';
  }
  if (lowerMessage.includes('not logged in') || lowerMessage.includes('login required')) {
    return 'SCRAPE_NOT_LOGGED_IN';
  }
  if (lowerMessage.includes('invalid') && lowerMessage.includes('url')) {
    return 'SCRAPE_INVALID_URL';
  }

  // Integration errors
  if (lowerMessage.includes('not connected') || lowerMessage.includes('disconnected')) {
    return 'INTEGRATION_NOT_CONNECTED';
  }
  if (lowerMessage.includes('token') && lowerMessage.includes('expired')) {
    return 'INTEGRATION_TOKEN_EXPIRED';
  }
  if (lowerMessage.includes('oauth') && lowerMessage.includes('failed')) {
    return 'INTEGRATION_OAUTH_FAILED';
  }

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed') ||
      lowerMessage.includes('connection') || lowerMessage.includes('offline')) {
    return 'NETWORK_ERROR';
  }

  // Validation errors
  if (status === 400 || lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }

  // Unknown
  return 'UNKNOWN_ERROR';
}

/**
 * Queue of errors to batch send
 */
const errorQueue: ErrorEventReport[] = [];
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

    // Get user/org IDs from JWT if available (for attribution)
    let userId: string | undefined;
    let organizationId: string | undefined;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        organizationId = payload.organizationId;
      } catch {
        // Ignore invalid token
      }
    }

    await fetch(`${API_BASE}/v1/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        errors: batch,
        userId,
        organizationId,
      }),
    });
  } catch (err) {
    // Don't report errors about error reporting - could cause infinite loop
    console.error('Failed to report errors:', err);
  }
}

/**
 * Report an error with automatic classification
 */
export function reportError(
  error: Error | string,
  context: ErrorContext = {}
): void {
  const errorCode = classifyError(error, context);
  const errorCategory = getErrorCategory(errorCode);

  const event: ErrorEventReport = {
    errorCode,
    errorCategory,
    skillSlug: context.skillSlug,
    provider: context.provider,
    action: context.action,
    httpStatus: context.httpStatus,
    sessionId: getSessionId(),
    timestamp: Date.now(),
  };

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
  reportError(error, { provider: `llm_${provider}`, httpStatus: statusCode });
}

/**
 * Report an action execution error
 */
export function reportActionError(error: Error | string, action: string): void {
  reportError(error, { action });
}

/**
 * Report a scrape error
 */
export function reportScrapeError(error: Error | string): void {
  reportError(error, { action: 'scrape' });
}

/**
 * Report a skill rendering error
 */
export function reportSkillRenderError(error: Error | string, skillSlug: string): void {
  reportError(error, { skillSlug, action: 'skill_render' });
}

/**
 * Report an authentication error
 */
export function reportAuthError(error: Error | string): void {
  reportError(error, { action: 'auth' });
}

/**
 * Report a network error
 */
export function reportNetworkError(error: Error | string): void {
  reportError(error, { action: 'network' });
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error instanceof Error) {
      reportError(error);
    } else {
      reportError(String(error));
    }
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    if (event.error) {
      reportError(event.error);
    } else {
      reportError(event.message);
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

    // Get user/org IDs from JWT if available
    let userId: string | undefined;
    let organizationId: string | undefined;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        organizationId = payload.organizationId;
      } catch {
        // Ignore invalid token
      }
    }

    const blob = new Blob(
      [
        JSON.stringify({
          errors: errorQueue,
          userId,
          organizationId,
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
