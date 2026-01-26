/**
 * Rate Limiting Middleware
 *
 * Provides protection against brute force attacks, API abuse, and DoS.
 * Uses in-memory storage with sliding window algorithm.
 *
 * Industry standard limits:
 * - Login: 5 attempts per 15 minutes per IP (prevents brute force)
 * - API: 100 requests per minute per API key (generous for normal use)
 * - General: 60 requests per minute per IP (prevents abuse)
 */

import type { Context, Next, MiddlewareHandler } from 'hono';
import { createLogger } from '../lib/logger.js';

const log = createLogger('RateLimit');

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Key generator function - determines how to identify the requester */
  keyGenerator: (c: Context) => string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean;
  /** Custom handler when rate limit is exceeded */
  handler?: (c: Context) => Response;
}

// In-memory store with automatic cleanup
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      return existing;
    }

    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    this.store.set(key, entry);
    return entry;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Note: Each rate limit middleware creates its own store instance
// This ensures independent tracking for different rate limit types

/**
 * Get client IP address from request
 * Handles CloudFront, Lambda, and local development
 */
function getClientIP(c: Context): string {
  // CloudFront/API Gateway sets X-Forwarded-For
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (client IP) from the chain
    return forwarded.split(',')[0].trim();
  }

  // Lambda context might have source IP
  const sourceIP = c.req.header('x-source-ip');
  if (sourceIP) return sourceIP;

  // Fallback for local development
  return 'unknown';
}

/**
 * Create a rate limiting middleware with specified options
 */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const store = new RateLimitStore();

  return async (c: Context, next: Next) => {
    // Check if we should skip
    if (options.skip?.(c)) {
      return next();
    }

    const key = options.keyGenerator(c);
    const entry = store.increment(key, options.windowMs);

    // Set rate limit headers
    const remaining = Math.max(0, options.limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - Date.now()) / 1000);

    c.header('X-RateLimit-Limit', options.limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetSeconds.toString());

    if (entry.count > options.limit) {
      c.header('Retry-After', resetSeconds.toString());

      log.warn('rate_limit_exceeded', {
        key,
        limit: options.limit,
        count: entry.count,
        path: c.req.path,
      });

      if (options.handler) {
        return options.handler(c);
      }

      return c.json(
        {
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: resetSeconds,
          },
        },
        429
      );
    }

    return next();
  };
}

/**
 * Rate limiter for login attempts
 * Strict limit: 5 attempts per 15 minutes per IP
 * Prevents brute force password attacks
 */
export const loginRateLimit = rateLimit({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (c) => `login:${getClientIP(c)}`,
  handler: (c) =>
    c.json(
      {
        error: {
          message: 'Too many login attempts. Please try again in 15 minutes.',
          code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        },
      },
      429
    ),
});

/**
 * Rate limiter for API key authenticated routes
 * Generous limit: 100 requests per minute per API key
 * Allows normal operation while preventing abuse
 */
export const apiKeyRateLimit = rateLimit({
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (c) => {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer sk_')) {
      // Extract first 20 chars of API key for identification
      return `api:${authHeader.slice(7, 27)}`;
    }
    // Fallback to IP if no API key
    return `api:ip:${getClientIP(c)}`;
  },
});

/**
 * Rate limiter for general authenticated routes
 * Moderate limit: 60 requests per minute per user
 */
export const generalRateLimit = rateLimit({
  limit: 60,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (c) => {
    // Try to use user ID from JWT if available
    const user = c.get('user');
    if (user?.sub) {
      return `general:user:${user.sub}`;
    }
    // Fallback to IP
    return `general:ip:${getClientIP(c)}`;
  },
  // Skip rate limiting for health checks
  skip: (c) => c.req.path === '/health',
});

/**
 * Strict rate limiter for sensitive operations
 * Very strict: 3 requests per minute
 * For password reset, account deletion, etc.
 */
export const strictRateLimit = rateLimit({
  limit: 3,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (c) => {
    const user = c.get('user');
    if (user?.sub) {
      return `strict:user:${user.sub}`;
    }
    return `strict:ip:${getClientIP(c)}`;
  },
});

/**
 * Rate limiter for webhook endpoints
 * Lenient: 100 requests per minute per IP
 * Webhooks need flexibility for bursts
 */
export const webhookRateLimit = rateLimit({
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (c) => `webhook:${getClientIP(c)}`,
});
