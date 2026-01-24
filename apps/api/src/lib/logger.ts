/**
 * Centralized Logger for API
 *
 * Provides structured logging with:
 * - Consistent JSON formatting for log aggregation
 * - Module-specific prefixes for easy filtering
 * - Debug mode support (LOG_LEVEL=debug)
 * - Request correlation IDs
 * - PII-safe error classification
 *
 * Usage:
 *   import { createLogger } from '../lib/logger.js';
 *   const log = createLogger('ATS');
 *   log.info('operation_started', { candidateId: '123' });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Request correlation ID for tracing */
  requestId?: string;
  /** User ID (for audit trail) */
  userId?: string;
  /** Organization ID */
  orgId?: string;
  /** Additional structured data */
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  event: string;
  requestId?: string;
  userId?: string;
  orgId?: string;
  data?: Record<string, unknown>;
}

// Check log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS[LOG_LEVEL as LogLevel] === undefined;
}

/**
 * Format log entry for output.
 * In production, outputs JSON for log aggregation.
 * In development, outputs human-readable format.
 */
function formatLog(entry: LogEntry): string {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Human-readable format for development
    const prefix = `[${entry.module}]`;
    const reqId = entry.requestId ? ` [${entry.requestId.slice(0, 8)}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${prefix}${reqId} ${entry.event}${data}`;
  }

  // JSON format for production (log aggregation friendly)
  return JSON.stringify(entry);
}

/**
 * Output log entry to appropriate stream.
 */
function output(level: LogLevel, formatted: string): void {
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export interface Logger {
  debug: (event: string, data?: LogContext) => void;
  info: (event: string, data?: LogContext) => void;
  warn: (event: string, data?: LogContext) => void;
  error: (event: string, data?: LogContext) => void;
  /** Log events that should never happen in normal operation */
  unreachable: (event: string, data?: LogContext) => void;
  /** Create a child logger with inherited context */
  child: (context: LogContext) => Logger;
}

/**
 * Create a logger for a specific module.
 *
 * @param module - Module name (e.g., 'ATS', 'Email', 'Calendar')
 * @param defaultContext - Context that will be included in all log entries
 */
export function createLogger(module: string, defaultContext?: LogContext): Logger {
  const logWithLevel = (level: LogLevel, event: string, data?: LogContext): void => {
    if (!shouldLog(level)) return;

    const { requestId, userId, orgId, ...rest } = { ...defaultContext, ...data };

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      event,
      requestId,
      userId,
      orgId,
      data: Object.keys(rest).length > 0 ? rest : undefined,
    };

    output(level, formatLog(entry));
  };

  return {
    debug: (event, data) => logWithLevel('debug', event, data),
    info: (event, data) => logWithLevel('info', event, data),
    warn: (event, data) => logWithLevel('warn', event, data),
    error: (event, data) => logWithLevel('error', event, data),
    unreachable: (event, data) => {
      // Always log unreachable events regardless of log level
      const { requestId, userId, orgId, ...rest } = { ...defaultContext, ...data };
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        module: `${module}:UNREACHABLE`,
        event,
        requestId,
        userId,
        orgId,
        data: Object.keys(rest).length > 0 ? rest : undefined,
      };
      console.error(formatLog(entry));
    },
    child: (context) => createLogger(module, { ...defaultContext, ...context }),
  };
}

/**
 * Extract request ID from Hono context.
 * Generates a new one if not present.
 */
export function getRequestId(c: { get: (key: string) => unknown; set: (key: string, value: unknown) => void }): string {
  let requestId = c.get('requestId') as string | undefined;
  if (!requestId) {
    requestId = crypto.randomUUID();
    c.set('requestId', requestId);
  }
  return requestId;
}

/**
 * Create a logger bound to a request context.
 * Automatically includes requestId and userId.
 */
export function createRequestLogger(
  module: string,
  c: { get: (key: string) => unknown; set: (key: string, value: unknown) => void }
): Logger {
  const requestId = getRequestId(c);
  const user = c.get('user') as { id: string; organizationId?: string } | undefined;
  const apiKeyUser = c.get('apiKeyUser') as { id: string; organizationId?: string } | undefined;
  const authUser = user || apiKeyUser;

  return createLogger(module, {
    requestId,
    userId: authUser?.id,
    orgId: authUser?.organizationId,
  });
}

// Pre-configured loggers for common modules (without request context)
export const loggers = {
  ats: createLogger('ATS'),
  email: createLogger('Email'),
  calendar: createLogger('Calendar'),
  data: createLogger('Data'),
  auth: createLogger('Auth'),
  oauth: createLogger('OAuth'),
  skills: createLogger('Skills'),
  integrations: createLogger('Integrations'),
  permissions: createLogger('Permissions'),
  scrape: createLogger('Scrape'),
  proxy: createLogger('Proxy'),
  admin: createLogger('Admin'),
};
