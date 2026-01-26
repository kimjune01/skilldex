/**
 * Security Headers Middleware
 *
 * Adds industry-standard security headers to all responses.
 * Based on OWASP recommendations and common security best practices.
 *
 * @see https://owasp.org/www-project-secure-headers/
 */

import type { Context, Next, MiddlewareHandler } from 'hono';

export interface SecurityHeadersOptions {
  /** Content Security Policy directives */
  contentSecurityPolicy?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
    frameAncestors?: string[];
  };
  /** X-Frame-Options header value */
  xFrameOptions?: 'DENY' | 'SAMEORIGIN';
  /** X-Content-Type-Options - prevents MIME sniffing */
  xContentTypeOptions?: boolean;
  /** X-XSS-Protection - legacy XSS protection */
  xXssProtection?: boolean;
  /** Referrer-Policy value */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  /** Strict-Transport-Security options */
  hsts?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  /** Permissions-Policy (formerly Feature-Policy) */
  permissionsPolicy?: Record<string, string[]>;
}

const DEFAULT_OPTIONS: SecurityHeadersOptions = {
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.anthropic.com', 'https://api.openai.com', 'https://api.groq.com'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [], // Disable FLoC
  },
};

/**
 * Build CSP header string from options
 */
function buildCSP(csp: SecurityHeadersOptions['contentSecurityPolicy']): string {
  if (!csp) return '';

  const directives: string[] = [];

  if (csp.defaultSrc?.length) {
    directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
  }
  if (csp.scriptSrc?.length) {
    directives.push(`script-src ${csp.scriptSrc.join(' ')}`);
  }
  if (csp.styleSrc?.length) {
    directives.push(`style-src ${csp.styleSrc.join(' ')}`);
  }
  if (csp.imgSrc?.length) {
    directives.push(`img-src ${csp.imgSrc.join(' ')}`);
  }
  if (csp.connectSrc?.length) {
    directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
  }
  if (csp.fontSrc?.length) {
    directives.push(`font-src ${csp.fontSrc.join(' ')}`);
  }
  if (csp.objectSrc?.length) {
    directives.push(`object-src ${csp.objectSrc.join(' ')}`);
  }
  if (csp.mediaSrc?.length) {
    directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
  }
  if (csp.frameSrc?.length) {
    directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
  }
  if (csp.frameAncestors?.length) {
    directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
  }

  return directives.join('; ');
}

/**
 * Build HSTS header string from options
 */
function buildHSTS(hsts: SecurityHeadersOptions['hsts']): string {
  if (!hsts) return '';

  let value = `max-age=${hsts.maxAge}`;
  if (hsts.includeSubDomains) {
    value += '; includeSubDomains';
  }
  if (hsts.preload) {
    value += '; preload';
  }
  return value;
}

/**
 * Build Permissions-Policy header string from options
 */
function buildPermissionsPolicy(policy: SecurityHeadersOptions['permissionsPolicy']): string {
  if (!policy) return '';

  return Object.entries(policy)
    .map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`;
      }
      return `${feature}=(${allowlist.map((v) => (v === 'self' ? 'self' : `"${v}"`)).join(' ')})`;
    })
    .join(', ');
}

/**
 * Create security headers middleware with specified options
 */
export function securityHeaders(
  options: SecurityHeadersOptions = {}
): MiddlewareHandler {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Pre-build static header values
  const cspValue = buildCSP(opts.contentSecurityPolicy);
  const hstsValue = buildHSTS(opts.hsts);
  const permissionsPolicyValue = buildPermissionsPolicy(opts.permissionsPolicy);

  return async (c: Context, next: Next) => {
    await next();

    // Content Security Policy
    // Note: For API-only servers returning JSON, CSP is less critical
    // but we set it anyway for defense in depth
    if (cspValue) {
      c.header('Content-Security-Policy', cspValue);
    }

    // X-Frame-Options - Prevents clickjacking
    if (opts.xFrameOptions) {
      c.header('X-Frame-Options', opts.xFrameOptions);
    }

    // X-Content-Type-Options - Prevents MIME type sniffing
    if (opts.xContentTypeOptions) {
      c.header('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection - Legacy browser XSS filter
    // Modern browsers don't need this, but doesn't hurt
    if (opts.xXssProtection) {
      c.header('X-XSS-Protection', '1; mode=block');
    }

    // Referrer-Policy - Controls referrer information
    if (opts.referrerPolicy) {
      c.header('Referrer-Policy', opts.referrerPolicy);
    }

    // Strict-Transport-Security - Enforces HTTPS
    // Only set in production (HTTPS environments)
    if (hstsValue && process.env.NODE_ENV === 'production') {
      c.header('Strict-Transport-Security', hstsValue);
    }

    // Permissions-Policy - Controls browser features
    if (permissionsPolicyValue) {
      c.header('Permissions-Policy', permissionsPolicyValue);
    }

    // Cache-Control for sensitive data
    // API responses with user data should not be cached
    if (c.req.path.startsWith('/v1/') || c.req.path.startsWith('/auth/')) {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      c.header('Pragma', 'no-cache');
    }
  };
}

/**
 * Default security headers middleware with sensible defaults
 */
export const defaultSecurityHeaders = securityHeaders();

/**
 * API-specific security headers (less restrictive CSP for JSON responses)
 */
export const apiSecurityHeaders = securityHeaders({
  // API responses are JSON, so CSP is minimal
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXssProtection: false, // Not needed for JSON-only API
  referrerPolicy: 'no-referrer',
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});
