/**
 * Data Provider Proxy Routes (Airtable, etc.)
 *
 * Generic proxy for data/CRM providers that aren't ATS, Calendar, or Email.
 * Uses the same permission model as other proxy routes.
 */

import { Hono } from 'hono';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { getNangoClient } from '../../lib/nango.js';
import {
  getProvider,
  getNangoKey,
  getApiBaseUrl,
  buildAuthHeader,
  isPathBlocked,
} from '@skillomatic/shared';

/**
 * Structured telemetry logging for Data operations.
 */
const telemetry = {
  info: (event: string, data?: Record<string, unknown>) =>
    console.log(`[Data] ${event}`, data ? JSON.stringify(data) : ''),
  warn: (event: string, data?: Record<string, unknown>) =>
    console.warn(`[Data] ${event}`, data ? JSON.stringify(data) : ''),
  error: (event: string, data?: Record<string, unknown>) =>
    console.error(`[Data] ${event}`, data ? JSON.stringify(data) : ''),
};

export const v1DataRoutes = new Hono();

// All routes require API key or JWT auth
v1DataRoutes.use('*', combinedAuth);

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

// POST /v1/data/proxy - Proxy requests to data provider
v1DataRoutes.post('/proxy', async (c) => {
  const user = c.get('user');
  const startTime = Date.now();

  let requestBody: ProxyRequestBody;
  try {
    requestBody = await c.req.json();
  } catch {
    telemetry.warn('proxy_invalid_json', { userId: user.sub });
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { provider, method, path, query, body, headers: customHeaders } = requestBody;

  // Validate required fields
  if (!provider || !method || !path) {
    telemetry.warn('proxy_missing_fields', { userId: user.sub, provider, method, path });
    return c.json({ error: { message: 'Missing required fields: provider, method, path' } }, 400);
  }

  // Check if provider is supported (must be a database provider from registry)
  const providerConfig = getProvider(provider);
  if (!providerConfig || providerConfig.category !== 'database') {
    telemetry.warn('proxy_unsupported_provider', { userId: user.sub, provider });
    return c.json({ error: { message: `Unsupported data provider: ${provider}` } }, 400);
  }

  // Check if path is blocklisted (using registry)
  if (isPathBlocked(provider, path)) {
    telemetry.warn('proxy_blocklisted_path', { userId: user.sub, provider, path });
    return c.json({ error: { message: 'Access to this endpoint is not allowed' } }, 403);
  }

  // Get the user's integration for this provider
  const [dataIntegration] = await db
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

  if (!dataIntegration) {
    telemetry.info('proxy_no_integration', { userId: user.sub, provider });
    return c.json({ error: { message: `No ${provider} integration connected` } }, 400);
  }

  const int = dataIntegration;
  let metadata: Record<string, unknown> = {};
  try {
    metadata = int.metadata ? JSON.parse(int.metadata) : {};
  } catch {
    telemetry.warn('proxy_invalid_metadata', {
      integrationId: int.id,
      provider: int.provider,
    });
  }

  // Check access level from metadata
  const accessLevel = (metadata.accessLevel as string) || 'read-write';
  if (requiresWriteAccess(method) && accessLevel === 'read-only') {
    telemetry.info('proxy_access_denied', {
      userId: user.sub,
      accessLevel,
      method,
      reason: 'read_only',
    });
    return c.json({ error: { message: `You have read-only access to ${provider}` } }, 403);
  }

  // Get access token from Nango
  if (!int.nangoConnectionId) {
    telemetry.error('proxy_missing_nango_connection', {
      integrationId: int.id,
      provider: int.provider,
      userId: user.sub,
    });
    return c.json({ error: { message: `${provider} integration not properly configured` } }, 400);
  }

  let accessToken: string;
  try {
    const nango = getNangoClient();
    const providerConfigKey = getNangoKey(provider);

    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);
    accessToken = token.access_token;
  } catch (error) {
    telemetry.error('proxy_nango_token_failed', {
      integrationId: int.id,
      provider: int.provider,
      userId: user.sub,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return c.json({ error: { message: `Failed to authenticate with ${provider}` } }, 502);
  }

  // Build the full URL using registry
  const baseUrl = (getApiBaseUrl(provider) || '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(baseUrl + normalizedPath);

  // Add query parameters
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        // Handle array query params (e.g., Airtable's records[] for delete)
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
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
      telemetry.warn('proxy_provider_error', {
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

    telemetry.info('proxy_success', {
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

    telemetry.error('proxy_network_error', {
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
