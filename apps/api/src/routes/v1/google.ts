/**
 * Google Workspace API Routes (v1)
 *
 * API key authenticated routes for Google Workspace operations.
 * Uses manifests from @skillomatic/shared to execute Google Workspace API calls.
 */
import { Hono } from 'hono';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '../../lib/logger.js';
import { refreshGoogleToken, isGoogleTokenExpired } from '../../lib/google-oauth.js';
import {
  buildAuthHeader,
  isPathBlocked,
  getGoogleWorkspaceManifest,
  isGoogleWorkspaceProvider,
} from '@skillomatic/shared';

const log = createLogger('Google');

export const v1GoogleRoutes = new Hono();

// Support both JWT (web chat) and API key (MCP/Claude Desktop) auth
v1GoogleRoutes.use('*', combinedAuth);

/**
 * Transform request body for batch operations (Google Docs, Sheets, Forms)
 */
function transformRequestBody(
  requestType: string,
  body: Record<string, unknown>
): Record<string, unknown> {
  switch (requestType) {
    case 'appendText':
      return {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: body.text,
          },
        }],
      };

    case 'addSheet':
      return {
        requests: [{
          addSheet: {
            properties: { title: body.sheetTitle },
          },
        }],
      };

    case 'deleteSheet':
      return {
        requests: [{
          deleteSheet: { sheetId: body.sheetId },
        }],
      };

    case 'addQuestion': {
      const questionType = (body.questionType as string) || 'TEXT';
      return {
        requests: [{
          createItem: {
            item: {
              title: body.title,
              questionItem: {
                question: {
                  required: body.required || false,
                  ...(questionType === 'TEXT' || questionType === 'PARAGRAPH_TEXT'
                    ? { textQuestion: { paragraph: questionType === 'PARAGRAPH_TEXT' } }
                    : {}),
                  ...(['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(questionType)
                    ? {
                        choiceQuestion: {
                          type: questionType === 'DROPDOWN' ? 'DROP_DOWN' : questionType.replace('_', ''),
                          options: ((body.options as string[]) || []).map((o) => ({ value: o })),
                        },
                      }
                    : {}),
                },
              },
            },
            location: { index: 0 },
          },
        }],
      };
    }

    default:
      return body;
  }
}

/**
 * Execute a Google Workspace API call using manifests from @skillomatic/shared
 */
async function executeGoogleWorkspaceAction(
  userId: string,
  provider: string,
  operation: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>
): Promise<{ data?: unknown; error?: string; status?: number; details?: unknown }> {
  // Check provider is valid Google Workspace provider
  if (!isGoogleWorkspaceProvider(provider)) {
    return { error: `Unsupported provider: ${provider}` };
  }

  // Get manifest from shared
  const manifest = getGoogleWorkspaceManifest(provider);
  if (!manifest) {
    return { error: `Manifest not found for provider: ${provider}` };
  }

  // Find the operation in the manifest
  const op = manifest.operations.find((o) => o.id === operation);
  if (!op) {
    const availableOps = manifest.operations.map((o) => o.id).join(', ');
    return { error: `Unknown operation: ${operation}. Available: ${availableOps}` };
  }

  // Get the user's integration
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.userId, userId),
        eq(integrations.provider, provider),
        eq(integrations.status, 'connected')
      )
    )
    .limit(1);

  if (!integration) {
    return { error: `${provider} is not connected. Please connect it in the integrations page.` };
  }

  let metadata: Record<string, unknown> = {};
  try {
    metadata = integration.metadata ? JSON.parse(integration.metadata) : {};
  } catch {
    return { error: 'Invalid integration metadata' };
  }

  // Check access level
  const accessLevel = (metadata.accessLevel as string) || 'read-write';
  const requiresWrite = op.access === 'write' || op.access === 'delete';
  if (requiresWrite && accessLevel === 'read-only') {
    return { error: `You have read-only access to ${provider}. This operation requires write access.` };
  }

  // Get access token
  let accessToken = metadata.accessToken as string | undefined;
  const refreshToken = metadata.refreshToken as string | undefined;
  const expiresAt = metadata.expiresAt as string | undefined;

  if (!accessToken) {
    return { error: `${provider} integration not properly configured` };
  }

  // Refresh token if expired
  if (isGoogleTokenExpired(expiresAt) && refreshToken) {
    const refreshResult = await refreshGoogleToken(refreshToken, metadata);

    if (refreshResult) {
      accessToken = refreshResult.accessToken;
      await db
        .update(integrations)
        .set({
          metadata: JSON.stringify(refreshResult.metadata),
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, integration.id));
    } else {
      await db
        .update(integrations)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(integrations.id, integration.id));
      return { error: `Token expired - please reconnect ${provider}` };
    }
  }

  // Categorize params using manifest definitions
  const allParams = { ...params };
  const pathParamNames = new Set([...op.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

  const pathParams: Record<string, unknown> = {};
  const queryParams: Record<string, unknown> = {};
  let bodyParams: Record<string, unknown> = { ...body };

  for (const [key, value] of Object.entries(allParams)) {
    if (value === undefined) continue;
    if (pathParamNames.has(key)) {
      pathParams[key] = value;
    } else if (op.body && key in op.body) {
      bodyParams[key] = value;
    } else if (op.params && key in op.params) {
      queryParams[key] = value;
    }
  }

  // Interpolate path parameters
  let path = op.path;
  for (const [key, value] of Object.entries(pathParams)) {
    path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  // Check if path is blocked
  if (isPathBlocked(provider, path)) {
    return { error: 'Access to this endpoint is not allowed' };
  }

  // Transform body for special request types (batchUpdate APIs)
  const requestType = op.meta?.requestType as string | undefined;
  if (requestType) {
    bodyParams = transformRequestBody(requestType, bodyParams);
  }

  // Build URL
  const baseUrl = manifest.baseUrl.replace(/\/+$/, '');
  const url = new URL(baseUrl + path);

  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const authHeaders = buildAuthHeader(provider, accessToken, (s) => Buffer.from(s).toString('base64'));
  const requestHeaders: Record<string, string> = {
    ...authHeaders,
    'Content-Type': 'application/json',
  };

  // Make request
  const hasBody = Object.keys(bodyParams).length > 0;
  const methodsWithBody = ['POST', 'PUT', 'PATCH'];

  try {
    const response = await fetch(url.toString(), {
      method: op.method.toUpperCase(),
      headers: requestHeaders,
      body: hasBody && methodsWithBody.includes(op.method.toUpperCase())
        ? JSON.stringify(bodyParams)
        : undefined,
    });

    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      return {
        error: `API returned ${response.status}`,
        status: response.status,
        details: responseData,
      };
    }

    return { data: responseData };
  } catch (error) {
    return {
      error: `Failed to communicate with ${provider}`,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// POST /v1/google/action - Execute a Google Workspace action
v1GoogleRoutes.post('/action', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: { message: 'Authentication required' } }, 401);
  }

  try {
    const body = await c.req.json<{
      provider: string;
      operation: string;
      params?: Record<string, unknown>;
      body?: Record<string, unknown>;
    }>();

    if (!body.provider) {
      return c.json({ error: { message: 'Provider is required' } }, 400);
    }

    if (!body.operation) {
      return c.json({ error: { message: 'Operation is required' } }, 400);
    }

    const validProviders = [
      'google-sheets',
      'google-drive',
      'google-docs',
      'google-forms',
      'google-contacts',
      'google-tasks',
    ];

    if (!validProviders.includes(body.provider)) {
      return c.json({ error: { message: `Invalid provider: ${body.provider}` } }, 400);
    }

    const result = await executeGoogleWorkspaceAction(
      user.id,
      body.provider,
      body.operation,
      body.params,
      body.body
    );

    if (result.error) {
      log.warn('google_workspace_action_error', {
        userId: user.id,
        provider: body.provider,
        operation: body.operation,
        error: result.error,
      });
      // Use 400 as default for client errors
      const statusCode = result.status && result.status >= 400 && result.status < 600 ? result.status as 400 | 401 | 403 | 404 | 500 : 400;
      return c.json({ error: { message: result.error, details: result.details } }, statusCode);
    }

    log.info('google_workspace_action_success', {
      userId: user.id,
      provider: body.provider,
      operation: body.operation,
    });

    return c.json({ data: result.data });
  } catch (error) {
    log.error('google_workspace_action_exception', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return c.json(
      { error: { message: error instanceof Error ? error.message : 'Google Workspace action failed' } },
      500
    );
  }
});
