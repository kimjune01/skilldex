import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { IntegrationPublic } from '@skillomatic/shared';
import {
  getNangoClient,
  generateConnectionId,
  PROVIDER_CONFIG_KEYS,
  NangoError,
} from '../lib/nango.js';
import { randomUUID } from 'crypto';

export const integrationsRoutes = new Hono();

// All routes require JWT auth
integrationsRoutes.use('*', jwtAuth);

// GET /api/integrations - List user's integrations
integrationsRoutes.get('/', async (c) => {
  const user = c.get('user');

  const userIntegrations = await db
    .select()
    .from(integrations)
    .where(eq(integrations.userId, user.sub));

  const publicIntegrations: IntegrationPublic[] = userIntegrations.map((int) => ({
    id: int.id,
    provider: int.provider as IntegrationPublic['provider'],
    status: int.status as IntegrationPublic['status'],
    lastSyncAt: int.lastSyncAt ?? undefined,
    createdAt: int.createdAt,
  }));

  return c.json({ data: publicIntegrations });
});

// POST /api/integrations/session - Create a Nango Connect session token
// Frontend uses this token to open the Nango Connect UI
integrationsRoutes.post('/session', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ allowedIntegrations?: string[] }>().catch(() => ({} as { allowedIntegrations?: string[] }));

  try {
    const nango = getNangoClient();
    const session = await nango.createConnectSession({
      userId: user.sub,
      userEmail: user.email,
      allowedIntegrations: body.allowedIntegrations,
    });

    return c.json({
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        connectLink: session.connectLink,
      },
    });
  } catch (error) {
    if (error instanceof NangoError) {
      const statusCode = (error.statusCode || 500) as 400 | 401 | 403 | 404 | 500;
      return c.json(
        { error: { message: error.message, code: error.code } },
        statusCode
      );
    }
    throw error;
  }
});

// POST /api/integrations/connect - Initiate OAuth connection (deprecated - use /session)
integrationsRoutes.post('/connect', async (c) => {
  const body = await c.req.json<{ provider: string; subProvider?: string }>();
  const user = c.get('user');

  if (!body.provider) {
    return c.json({ error: { message: 'Provider is required' } }, 400);
  }

  // Map provider to Nango provider config key
  // subProvider allows specifying specific ATS (e.g., provider=ats, subProvider=greenhouse)
  const providerKey = body.subProvider || body.provider;
  const providerConfigKey = PROVIDER_CONFIG_KEYS[providerKey];

  if (!providerConfigKey) {
    return c.json(
      {
        error: {
          message: `Unknown provider: ${providerKey}. Supported: ${Object.keys(PROVIDER_CONFIG_KEYS).join(', ')}`,
        },
      },
      400
    );
  }

  // Generate unique connection ID for this user + provider
  const connectionId = generateConnectionId(user.sub, body.provider);

  // Build callback URL - this should point to our callback endpoint
  const apiUrl = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';
  const callbackUrl = `${apiUrl}/api/integrations/callback`;

  // Get the Nango connect URL
  const nango = getNangoClient();
  const oauthUrl = nango.getConnectUrl(providerConfigKey, connectionId, callbackUrl);

  // Check if integration record exists, create or update
  const existingIntegration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, user.sub), eq(integrations.provider, body.provider)))
    .limit(1);

  if (existingIntegration.length === 0) {
    // Create new integration record in pending state
    await db.insert(integrations).values({
      id: randomUUID(),
      userId: user.sub,
      organizationId: user.organizationId,
      provider: body.provider,
      nangoConnectionId: connectionId,
      status: 'pending',
      metadata: JSON.stringify({ subProvider: body.subProvider }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Update existing to pending
    await db
      .update(integrations)
      .set({
        nangoConnectionId: connectionId,
        status: 'pending',
        metadata: JSON.stringify({ subProvider: body.subProvider }),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existingIntegration[0].id));
  }

  return c.json({
    data: {
      url: oauthUrl,
      connectionId,
      message: 'Redirect user to this URL to complete OAuth',
    },
  });
});

// GET /api/integrations/callback - OAuth callback handler
// This is called by Nango after OAuth completes
integrationsRoutes.get('/callback', async (c) => {
  const connectionId = c.req.query('connection_id');
  const error = c.req.query('error');
  const errorDescription = c.req.query('error_description');

  // Build redirect URL to frontend
  const webUrl = process.env.WEB_URL || 'http://localhost:5173';

  if (error) {
    // OAuth failed - redirect to integrations page with error
    const errorUrl = new URL(`${webUrl}/integrations`);
    errorUrl.searchParams.set('error', errorDescription || error);
    return c.redirect(errorUrl.toString());
  }

  if (!connectionId) {
    const errorUrl = new URL(`${webUrl}/integrations`);
    errorUrl.searchParams.set('error', 'Missing connection ID');
    return c.redirect(errorUrl.toString());
  }

  // Find the integration by connection ID and update status
  const integration = await db
    .select()
    .from(integrations)
    .where(eq(integrations.nangoConnectionId, connectionId))
    .limit(1);

  if (integration.length > 0) {
    await db
      .update(integrations)
      .set({
        status: 'connected',
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integration[0].id));
  }

  // Redirect to integrations page with success
  const successUrl = new URL(`${webUrl}/integrations`);
  successUrl.searchParams.set('success', 'Integration connected successfully');
  return c.redirect(successUrl.toString());
});

// POST /api/integrations/disconnect - Disconnect an integration
integrationsRoutes.post('/disconnect', async (c) => {
  const body = await c.req.json<{ integrationId: string }>();
  const user = c.get('user');

  if (!body.integrationId) {
    return c.json({ error: { message: 'Integration ID is required' } }, 400);
  }

  // Get the integration
  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.id, body.integrationId), eq(integrations.userId, user.sub)))
    .limit(1);

  if (integration.length === 0) {
    return c.json({ error: { message: 'Integration not found' } }, 404);
  }

  const int = integration[0];

  // Delete from Nango if connection ID exists
  if (int.nangoConnectionId) {
    try {
      const nango = getNangoClient();
      const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
      await nango.deleteConnection(providerConfigKey, int.nangoConnectionId);
    } catch (error) {
      // Log but don't fail - the Nango connection might not exist
      console.warn(`Failed to delete Nango connection: ${error}`);
    }
  }

  // Update status to disconnected
  await db
    .update(integrations)
    .set({
      status: 'disconnected',
      nangoConnectionId: null,
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, body.integrationId));

  return c.json({ data: { message: 'Integration disconnected' } });
});

// GET /api/integrations/:id/token - Get fresh access token for an integration
// This is used by skill rendering to embed fresh tokens
integrationsRoutes.get('/:id/token', async (c) => {
  const user = c.get('user');
  const integrationId = c.req.param('id');

  // Get the integration
  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, user.sub)))
    .limit(1);

  if (integration.length === 0) {
    return c.json({ error: { message: 'Integration not found' } }, 404);
  }

  const int = integration[0];

  if (int.status !== 'connected') {
    return c.json({ error: { message: 'Integration is not connected' } }, 400);
  }

  if (!int.nangoConnectionId) {
    return c.json({ error: { message: 'No Nango connection for this integration' } }, 400);
  }

  try {
    const nango = getNangoClient();
    const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);

    // Update last sync time
    await db
      .update(integrations)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(integrations.id, integrationId));

    return c.json({
      data: {
        accessToken: token.access_token,
        tokenType: token.token_type,
        expiresAt: token.expires_at,
      },
    });
  } catch (error) {
    if (error instanceof NangoError) {
      // Mark integration as error if token fetch fails
      await db
        .update(integrations)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(integrations.id, integrationId));

      const statusCode = (error.statusCode || 500) as 400 | 401 | 403 | 404 | 500;
      return c.json(
        {
          error: {
            message: `Failed to get token: ${error.message}`,
            code: error.code,
          },
        },
        statusCode
      );
    }
    throw error;
  }
});

// GET /api/integrations/status/:provider - Check connection status for a provider
integrationsRoutes.get('/status/:provider', async (c) => {
  const user = c.get('user');
  const provider = c.req.param('provider');

  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, user.sub), eq(integrations.provider, provider)))
    .limit(1);

  if (integration.length === 0) {
    return c.json({
      data: {
        connected: false,
        status: 'not_configured',
      },
    });
  }

  const int = integration[0];

  // If connected, verify with Nango that connection is still valid
  if (int.status === 'connected' && int.nangoConnectionId) {
    try {
      const nango = getNangoClient();
      const providerConfigKey = PROVIDER_CONFIG_KEYS[int.provider] || int.provider;
      const connection = await nango.getConnection(providerConfigKey, int.nangoConnectionId);

      if (!connection) {
        // Nango connection was deleted - update our status
        await db
          .update(integrations)
          .set({ status: 'disconnected', updatedAt: new Date() })
          .where(eq(integrations.id, int.id));

        return c.json({
          data: {
            connected: false,
            status: 'disconnected',
            message: 'Connection was revoked',
          },
        });
      }
    } catch {
      // Nango check failed, but don't change status yet
      // Could be a temporary network issue
    }
  }

  return c.json({
    data: {
      connected: int.status === 'connected',
      status: int.status,
      lastSyncAt: int.lastSyncAt,
    },
  });
});
