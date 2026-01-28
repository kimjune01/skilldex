/**
 * Time Tracking Provider Proxy Routes (Clockify, etc.)
 *
 * Generic proxy for time tracking providers.
 * Supports API key authentication (stored in integration metadata).
 */

import { Hono } from 'hono';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getProvider,
  getApiBaseUrl,
  buildAuthHeader,
  isPathBlocked,
} from '@skillomatic/shared';
import { createLogger } from '../../lib/logger.js';

const log = createLogger('TimeTracking');

export const v1TimeTrackingRoutes = new Hono();

// All routes require API key or JWT auth
v1TimeTrackingRoutes.use('*', combinedAuth);

/**
 * Node.js base64 encoder for basic auth (if needed in future)
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

// POST /v1/time-tracking/proxy - Proxy requests to time tracking provider
v1TimeTrackingRoutes.post('/proxy', async (c) => {
  const user = c.get('user');
  const startTime = Date.now();

  let requestBody: ProxyRequestBody;
  try {
    requestBody = await c.req.json();
  } catch {
    log.warn('proxy_invalid_json', { userId: user.sub });
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { provider, method, path, query, body, headers: customHeaders } = requestBody;

  // Validate required fields
  if (!provider || !method || !path) {
    log.warn('proxy_missing_fields', { userId: user.sub, provider, method, path });
    return c.json({ error: { message: 'Missing required fields: provider, method, path' } }, 400);
  }

  // Check if provider is supported (must be a time-tracking provider from registry)
  const providerConfig = getProvider(provider);
  if (!providerConfig || providerConfig.category !== 'time-tracking') {
    log.warn('proxy_unsupported_provider', { userId: user.sub, provider });
    return c.json({ error: { message: `Unsupported time tracking provider: ${provider}` } }, 400);
  }

  // Check if path is blocklisted (using registry)
  if (isPathBlocked(provider, path)) {
    log.warn('proxy_blocklisted_path', { userId: user.sub, provider, path });
    return c.json({ error: { message: 'Access to this endpoint is not allowed' } }, 403);
  }

  // Get the user's integration for this provider
  const [timeTrackingIntegration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.userId, user.sub),
        eq(integrations.provider, provider),
        eq(integrations.status, 'connected')
      )
    )
    .limit(1);

  if (!timeTrackingIntegration) {
    log.info('proxy_no_integration', { userId: user.sub, provider });
    return c.json({ error: { message: `No ${provider} integration connected` } }, 400);
  }

  const int = timeTrackingIntegration;
  let metadata: Record<string, unknown> = {};
  try {
    metadata = int.metadata ? JSON.parse(int.metadata) : {};
  } catch {
    log.warn('proxy_invalid_metadata', {
      integrationId: int.id,
      provider: int.provider,
    });
  }

  // Check access level from metadata
  const accessLevel = (metadata.accessLevel as string) || 'read-write';
  if (requiresWriteAccess(method) && accessLevel === 'read-only') {
    log.info('proxy_access_denied', {
      userId: user.sub,
      accessLevel,
      method,
      reason: 'read_only',
    });
    return c.json({ error: { message: `You have read-only access to ${provider}` } }, 403);
  }

  // Get API key from metadata (api-key auth flow)
  let apiKey: string;

  if (providerConfig.oauthFlow === 'api-key') {
    // API key stored in integration metadata
    const storedApiKey = metadata.apiKey as string | undefined;

    if (!storedApiKey) {
      log.error('proxy_missing_api_key', {
        integrationId: int.id,
        provider: int.provider,
        userId: user.sub,
      });
      return c.json({ error: { message: `${provider} integration not properly configured. Please reconnect.` } }, 400);
    }

    apiKey = storedApiKey;
  } else {
    // Unsupported auth flow for time-tracking
    log.error('proxy_unsupported_auth_flow', {
      provider,
      oauthFlow: providerConfig.oauthFlow,
      userId: user.sub,
    });
    return c.json({ error: { message: `Unsupported authentication method for ${provider}` } }, 500);
  }

  // Build the full URL using registry
  const baseUrl = (getApiBaseUrl(provider) || '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(baseUrl + normalizedPath);

  // Add query parameters
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
  }

  // Build headers using registry (buildAuthHeader handles api-key type)
  const authHeaders = buildAuthHeader(provider, apiKey, base64Encode);
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
      // Check for invalid API key
      if (response.status === 401 || response.status === 403) {
        log.warn('proxy_auth_failed', {
          provider,
          method,
          path,
          status: response.status,
          userId: user.sub,
        });
        return c.json(
          {
            error: {
              message: `Authentication failed. Your ${provider} API key may be invalid or expired. Please reconnect.`,
              status: response.status,
            },
          },
          401
        );
      }

      log.warn('proxy_provider_error', {
        provider,
        method,
        path,
        status: response.status,
        durationMs,
        userId: user.sub,
      });
      return c.json(
        {
          error: {
            message: `Provider returned ${response.status}`,
            status: response.status,
            data: responseData,
          },
        },
        response.status as 400 | 401 | 403 | 404 | 422 | 500 | 502
      );
    }

    log.info('proxy_success', {
      provider,
      method,
      path,
      durationMs,
      userId: user.sub,
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
      userId: user.sub,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return c.json(
      {
        error: {
          message: `Failed to communicate with ${provider}`,
        },
      },
      502
    );
  }
});
