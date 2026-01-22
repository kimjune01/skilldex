import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from '../../lib/nango.js';
import {
  getEffectiveAccessForUser,
  canRead,
  canWrite,
} from '../../lib/integration-permissions.js';

/**
 * Structured telemetry logging for Calendar operations.
 */
const telemetry = {
  info: (event: string, data?: Record<string, unknown>) =>
    console.log(`[Calendar] ${event}`, data ? JSON.stringify(data) : ''),
  warn: (event: string, data?: Record<string, unknown>) =>
    console.warn(`[Calendar] ${event}`, data ? JSON.stringify(data) : ''),
  error: (event: string, data?: Record<string, unknown>) =>
    console.error(`[Calendar] ${event}`, data ? JSON.stringify(data) : ''),
  unreachable: (event: string, data?: Record<string, unknown>) =>
    console.error(`[Calendar] UNREACHABLE: ${event}`, data ? JSON.stringify(data) : ''),
};

export const v1CalendarRoutes = new Hono();

// All routes require API key auth
v1CalendarRoutes.use('*', apiKeyAuth);

/**
 * Provider-specific base URLs and auth configuration
 */
const PROVIDER_CONFIG: Record<string, {
  getBaseUrl: () => string;
  getAuthHeader: (token: string) => Record<string, string>;
}> = {
  'calendly': {
    getBaseUrl: () => 'https://api.calendly.com',
    getAuthHeader: (token) => ({
      'Authorization': `Bearer ${token}`,
    }),
  },
  'google-calendar': {
    getBaseUrl: () => 'https://www.googleapis.com/calendar/v3',
    getAuthHeader: (token) => ({
      'Authorization': `Bearer ${token}`,
    }),
  },
};

/**
 * Blocklisted paths that should never be proxied (security)
 */
const BLOCKLISTED_PATHS: Record<string, RegExp[]> = {
  'calendly': [
    /^\/webhook_subscriptions/i,
    /^\/data_compliance/i,
  ],
  'google-calendar': [
    /^\/users\/.*\/settings/i,
  ],
};

/**
 * Check if a path is blocklisted for a provider
 */
function isPathBlocklisted(provider: string, path: string): boolean {
  const patterns = BLOCKLISTED_PATHS[provider] || [];
  return patterns.some((pattern) => pattern.test(path));
}

/**
 * Check if a method requires write access
 */
function requiresWriteAccess(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Proxy request schema
 */
interface ProxyRequestBody {
  provider: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

// POST /v1/calendar/proxy - Proxy requests to calendar provider
v1CalendarRoutes.post('/proxy', async (c) => {
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  let requestBody: ProxyRequestBody;
  try {
    requestBody = await c.req.json();
  } catch {
    telemetry.warn('proxy_invalid_json', { userId: user.id });
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { provider, method, path, query, body, headers: customHeaders } = requestBody;

  // Validate required fields
  if (!provider || !method || !path) {
    telemetry.warn('proxy_missing_fields', { userId: user.id, provider, method, path });
    return c.json({ error: { message: 'Missing required fields: provider, method, path' } }, 400);
  }

  // Check if provider is supported
  const providerConfig = PROVIDER_CONFIG[provider];
  if (!providerConfig) {
    telemetry.warn('proxy_unsupported_provider', { userId: user.id, provider });
    return c.json({ error: { message: `Unsupported calendar provider: ${provider}` } }, 400);
  }

  // Check if path is blocklisted
  if (isPathBlocklisted(provider, path)) {
    telemetry.warn('proxy_blocklisted_path', { userId: user.id, provider, path });
    return c.json({ error: { message: 'Access to this endpoint is not allowed' } }, 403);
  }

  // Check user's effective access level
  if (!user.organizationId) {
    telemetry.warn('proxy_no_org', { userId: user.id });
    return c.json({ error: { message: 'User must belong to an organization' } }, 403);
  }

  const effectiveAccess = await getEffectiveAccessForUser(user.id, user.organizationId);
  const calendarAccess = effectiveAccess.calendar;

  // Check if user has any calendar access
  if (!canRead(calendarAccess)) {
    telemetry.info('proxy_access_denied', { userId: user.id, calendarAccess, reason: 'no_read' });
    return c.json({ error: { message: 'Calendar access is disabled or not connected' } }, 403);
  }

  // Check write access for mutating operations
  if (requiresWriteAccess(method) && !canWrite(calendarAccess)) {
    telemetry.info('proxy_access_denied', { userId: user.id, calendarAccess, method, reason: 'no_write' });
    return c.json({ error: { message: 'You have read-only access to the calendar' } }, 403);
  }

  // Get the user's calendar integration
  const calendarProviders = [provider, 'calendar', 'calendly', 'google-calendar'];
  const [calendarIntegration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.status, 'connected'),
        user.organizationId
          ? eq(integrations.organizationId, user.organizationId)
          : eq(integrations.userId, user.id),
        or(...calendarProviders.map((p) => eq(integrations.provider, p)))
      )
    )
    .limit(1);

  if (!calendarIntegration) {
    telemetry.info('proxy_no_integration', { userId: user.id, orgId: user.organizationId, provider });
    return c.json({ error: { message: 'No calendar integration connected' } }, 400);
  }

  const int = calendarIntegration;
  let metadata: Record<string, unknown> = {};
  try {
    metadata = int.metadata ? JSON.parse(int.metadata) : {};
  } catch {
    telemetry.unreachable('proxy_invalid_metadata', {
      integrationId: int.id,
      provider: int.provider,
    });
  }

  // Get access token from Nango
  if (!int.nangoConnectionId) {
    telemetry.error('proxy_missing_nango_connection', {
      integrationId: int.id,
      provider: int.provider,
      userId: user.id,
    });
    return c.json({ error: { message: 'Calendar integration not properly configured' } }, 400);
  }

  let accessToken: string;
  try {
    const nango = getNangoClient();
    const providerKey = (metadata.subProvider as string) || provider;
    const providerConfigKey = PROVIDER_CONFIG_KEYS[providerKey] || providerKey;

    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);
    accessToken = token.access_token;
  } catch (error) {
    telemetry.error('proxy_nango_token_failed', {
      integrationId: int.id,
      provider: int.provider,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return c.json({ error: { message: 'Failed to authenticate with calendar provider' } }, 502);
  }

  // Build the full URL
  const baseUrl = providerConfig.getBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(baseUrl + normalizedPath);

  // Add query parameters
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const authHeaders = providerConfig.getAuthHeader(accessToken);
  const requestHeaders: Record<string, string> = {
    ...authHeaders,
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Make the request to the provider
  try {
    const response = await fetch(url.toString(), {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get response body
    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    const durationMs = Date.now() - startTime;

    // Return error responses with proper status
    if (!response.ok) {
      telemetry.warn('proxy_provider_error', {
        provider,
        method,
        path,
        status: response.status,
        durationMs,
        userId: user.id,
      });
      return c.json({
        error: {
          message: `Provider returned ${response.status}`,
          status: response.status,
          data: responseData,
        },
      }, response.status as 400 | 401 | 403 | 404 | 500 | 502);
    }

    telemetry.info('proxy_success', {
      provider,
      method,
      path,
      durationMs,
      userId: user.id,
    });

    return c.json({
      data: responseData,
      meta: {
        provider,
        method,
        path,
        durationMs,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    telemetry.error('proxy_network_error', {
      provider,
      method,
      path,
      durationMs,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return c.json({
      error: {
        message: 'Failed to communicate with calendar provider',
      },
    }, 502);
  }
});
