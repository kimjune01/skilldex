import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getNangoClient } from '../../lib/nango.js';
import {
  getEffectiveAccessForUser,
  canRead,
  canWrite,
} from '../../lib/integration-permissions.js';
import {
  getProvider,
  getProviders,
  getNangoKey,
  getApiBaseUrl,
  buildAuthHeader,
  isPathBlocked,
} from '@skillomatic/shared';
import { createLogger } from '../../lib/logger.js';

const log = createLogger('Calendar');

export const v1CalendarRoutes = new Hono();

// All routes require API key auth
v1CalendarRoutes.use('*', apiKeyAuth);

/**
 * Get all supported calendar providers from registry
 */
function getCalendarProviderIds(): string[] {
  return getProviders({ category: 'calendar' }).map((p) => p.id);
}

/**
 * Node.js base64 encoder for basic auth
 */
function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
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
    log.warn('proxy_invalid_json', { userId: user.id });
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { provider, method, path, query, body, headers: customHeaders } = requestBody;

  // Validate required fields
  if (!provider || !method || !path) {
    log.warn('proxy_missing_fields', { userId: user.id, provider, method, path });
    return c.json({ error: { message: 'Missing required fields: provider, method, path' } }, 400);
  }

  // Check if provider is supported (must be a calendar provider from registry)
  const providerConfig = getProvider(provider);
  if (!providerConfig || providerConfig.category !== 'calendar') {
    log.warn('proxy_unsupported_provider', { userId: user.id, provider });
    return c.json({ error: { message: `Unsupported calendar provider: ${provider}` } }, 400);
  }

  // Check if path is blocklisted (using registry)
  if (isPathBlocked(provider, path)) {
    log.warn('proxy_blocklisted_path', { userId: user.id, provider, path });
    return c.json({ error: { message: 'Access to this endpoint is not allowed' } }, 403);
  }

  // Check user's effective access level
  if (!user.organizationId) {
    log.warn('proxy_no_org', { userId: user.id });
    return c.json({ error: { message: 'User must belong to an organization' } }, 403);
  }

  const effectiveAccess = await getEffectiveAccessForUser(user.id, user.organizationId);
  const calendarAccess = effectiveAccess.calendar;

  // Check if user has any calendar access
  if (!canRead(calendarAccess)) {
    log.info('proxy_access_denied', { userId: user.id, calendarAccess, reason: 'no_read' });
    return c.json({ error: { message: 'Calendar access is disabled or not connected' } }, 403);
  }

  // Check write access for mutating operations
  if (requiresWriteAccess(method) && !canWrite(calendarAccess)) {
    log.info('proxy_access_denied', { userId: user.id, calendarAccess, method, reason: 'no_write' });
    return c.json({ error: { message: 'You have read-only access to the calendar' } }, 403);
  }

  // Get the user's calendar integration
  // Include all calendar providers from registry for fallback matching
  const calendarProviders = [provider, ...getCalendarProviderIds()];
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
    log.info('proxy_no_integration', { userId: user.id, orgId: user.organizationId, provider });
    return c.json({ error: { message: 'No calendar integration connected' } }, 400);
  }

  const int = calendarIntegration;
  let metadata: Record<string, unknown> = {};
  try {
    metadata = int.metadata ? JSON.parse(int.metadata) : {};
  } catch {
    log.unreachable('proxy_invalid_metadata', {
      integrationId: int.id,
      provider: int.provider,
    });
  }

  // Get access token from Nango
  if (!int.nangoConnectionId) {
    log.error('proxy_missing_nango_connection', {
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
    const providerConfigKey = getNangoKey(providerKey);

    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);
    accessToken = token.access_token;
  } catch (error) {
    log.error('proxy_nango_token_failed', {
      integrationId: int.id,
      provider: int.provider,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return c.json({ error: { message: 'Failed to authenticate with calendar provider' } }, 502);
  }

  // Build the full URL using registry
  const baseUrl = (getApiBaseUrl(provider) || '').replace(/\/+$/, '');
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

  // Build headers using registry
  const authHeaders = buildAuthHeader(provider, accessToken, base64Encode);
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
      log.warn('proxy_provider_error', {
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

    log.info('proxy_success', {
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

    log.error('proxy_network_error', {
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
