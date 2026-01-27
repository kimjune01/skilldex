import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations, users, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { IntegrationPublic, IntegrationAccessLevel } from '@skillomatic/shared';
import { isProviderAllowedForIndividual, isPremiumProvider, getProviderCategory } from '@skillomatic/shared';
import { hasPayIntention, parseIntegrationMetadata } from '../lib/integration-permissions.js';
import {
  getNangoClient,
  generateConnectionId,
  PROVIDER_CONFIG_KEYS,
  NangoError,
} from '../lib/nango.js';
import { createGoogleOAuthRoutes, createGoogleOAuthTokenRoutes } from '../lib/google-oauth.js';
import { randomUUID } from 'crypto';
import { createLogger } from '../lib/logger.js';

export const integrationsRoutes = new Hono();

const log = createLogger('Integrations');

// ============================================================================
// Google OAuth routes (Gmail & Calendar) - no middleware, handle auth manually
// These must be registered BEFORE the jwtAuth middleware
// ============================================================================
integrationsRoutes.route('/', createGoogleOAuthRoutes());

// All other routes require JWT auth
integrationsRoutes.use('*', jwtAuth);

// Google OAuth token routes (require auth)
integrationsRoutes.route('/', createGoogleOAuthTokenRoutes());

// ============================================================================
// Mock ATS - Development only, instant connect without OAuth
// ============================================================================
const isDev = process.env.NODE_ENV !== 'production';

// POST /integrations/mock-ats/connect - Instantly connect mock ATS (dev only)
integrationsRoutes.post('/mock-ats/connect', async (c) => {
  if (!isDev) {
    return c.json({ error: { message: 'Mock ATS only available in development' } }, 403);
  }

  const user = c.get('user');

  // Check if already connected
  const existing = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, user.sub), eq(integrations.provider, 'ats')))
    .limit(1);

  const metadata = {
    accessLevel: 'read-write',
    subProvider: 'mock-ats',
  };

  if (existing.length === 0) {
    await db.insert(integrations).values({
      id: randomUUID(),
      userId: user.sub,
      organizationId: user.organizationId,
      provider: 'ats',
      status: 'connected',
      metadata: JSON.stringify(metadata),
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(integrations)
      .set({
        status: 'connected',
        metadata: JSON.stringify(metadata),
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing[0].id));
  }

  log.info('mock_ats_connected', { userId: user.sub });

  return c.json({ data: { message: 'Mock ATS connected successfully' } });
});

// GET /integrations - List user's integrations
integrationsRoutes.get('/', async (c) => {
  const user = c.get('user');

  const userIntegrations = await db
    .select()
    .from(integrations)
    .where(eq(integrations.userId, user.sub));

  const publicIntegrations: IntegrationPublic[] = userIntegrations.map((int) => {
    const metadata = parseIntegrationMetadata(int.metadata);
    // Validate and default access level
    const rawAccessLevel = metadata.accessLevel;
    const accessLevel: IntegrationAccessLevel =
      rawAccessLevel === 'read-write' || rawAccessLevel === 'read-only'
        ? rawAccessLevel
        : 'read-write';
    return {
      id: int.id,
      provider: int.provider as IntegrationPublic['provider'],
      status: int.status as IntegrationPublic['status'],
      lastSyncAt: int.lastSyncAt ?? undefined,
      createdAt: int.createdAt,
      accessLevel,
    };
  });

  return c.json({ data: publicIntegrations });
});

// Valid access levels for user preference
type UserAccessLevel = 'read-write' | 'read-only';

// POST /integrations/session - Create a Nango Connect session token
// Frontend uses this token to open the Nango Connect UI
// Accepts optional accessLevel ('read-write' | 'read-only') to store user's preference
integrationsRoutes.post('/session', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    allowedIntegrations?: string[];
    accessLevel?: UserAccessLevel;
    provider?: string;
  }>().catch(() => ({} as { allowedIntegrations?: string[]; accessLevel?: UserAccessLevel; provider?: string }));

  // Check if individual user is trying to connect a restricted provider
  const isIndividual = !user.organizationId;
  if (isIndividual && body.provider) {
    if (!isProviderAllowedForIndividual(body.provider)) {
      return c.json({
        error: {
          message: 'This integration requires an organization account. Create or join an organization to access ATS and other team integrations.',
          code: 'INDIVIDUAL_ACCOUNT_RESTRICTION',
        },
      }, 403);
    }
  }

  // Also check allowedIntegrations array for restricted providers
  if (isIndividual && body.allowedIntegrations) {
    const blockedProviders = body.allowedIntegrations.filter(p => !isProviderAllowedForIndividual(p));
    if (blockedProviders.length > 0) {
      return c.json({
        error: {
          message: `These integrations require an organization account: ${blockedProviders.join(', ')}`,
          code: 'INDIVIDUAL_ACCOUNT_RESTRICTION',
        },
      }, 403);
    }
  }

  // Check if premium provider requires pay intention
  const providerToCheck = body.provider || body.allowedIntegrations?.[0];
  if (providerToCheck && isPremiumProvider(providerToCheck)) {
    // Determine trigger type based on provider category and account type
    // individual_ats: Individual users accessing ATS providers
    // premium_integration: All other premium providers (Outlook, Airtable, etc.)
    const isAtsProvider = getProviderCategory(providerToCheck) === 'ats';
    const triggerType = isIndividual && isAtsProvider ? 'individual_ats' : 'premium_integration';

    // Check if user has confirmed pay intention
    const hasConfirmed = await hasPayIntention(user.sub, triggerType);

    if (!hasConfirmed) {
      return c.json({
        error: {
          message: 'This integration requires a payment method on file.',
          code: 'PAY_INTENTION_REQUIRED',
          data: {
            triggerType,
            triggerProvider: providerToCheck,
          },
        },
      }, 403);
    }
  }

  // Validate accessLevel if provided
  if (body.accessLevel && !['read-write', 'read-only'].includes(body.accessLevel)) {
    return c.json(
      { error: { message: 'Invalid accessLevel. Must be "read-write" or "read-only"' } },
      400
    );
  }

  try {
    const nango = getNangoClient();
    const session = await nango.createConnectSession({
      userId: user.sub,
      userEmail: user.email,
      allowedIntegrations: body.allowedIntegrations,
    });

    // Store pending access level in the database (in the integration record's metadata)
    // This ensures it works across multiple server instances
    if (body.accessLevel && body.provider) {
      const existingIntegration = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, user.sub), eq(integrations.provider, body.provider)))
        .limit(1);

      const pendingMetadata = {
        pendingAccessLevel: body.accessLevel,
        subProvider: body.allowedIntegrations?.[0],
      };

      if (existingIntegration.length === 0) {
        // Create a pending integration record to store the preference
        await db.insert(integrations).values({
          id: randomUUID(),
          userId: user.sub,
          organizationId: user.organizationId,
          provider: body.provider,
          status: 'pending',
          metadata: JSON.stringify(pendingMetadata),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update existing record with pending access level
        const existingMetadata = parseIntegrationMetadata(existingIntegration[0].metadata);
        await db
          .update(integrations)
          .set({
            metadata: JSON.stringify({ ...existingMetadata, ...pendingMetadata }),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingIntegration[0].id));
      }
    }

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

// POST /integrations/connect - Initiate OAuth connection (deprecated - use /session)
// Accepts optional accessLevel ('read-write' | 'read-only') to store user's preference
integrationsRoutes.post('/connect', async (c) => {
  const body = await c.req.json<{
    provider: string;
    subProvider?: string;
    accessLevel?: UserAccessLevel;
  }>();
  const user = c.get('user');

  if (!body.provider) {
    return c.json({ error: { message: 'Provider is required' } }, 400);
  }

  // Check if individual user is trying to connect a restricted provider
  const isIndividual = !user.organizationId;
  const providerToCheck = body.subProvider || body.provider;
  if (isIndividual && !isProviderAllowedForIndividual(providerToCheck)) {
    return c.json({
      error: {
        message: 'This integration requires an organization account. Create or join an organization to access ATS and other team integrations.',
        code: 'INDIVIDUAL_ACCOUNT_RESTRICTION',
      },
    }, 403);
  }

  // Check if premium provider requires pay intention
  if (isPremiumProvider(providerToCheck)) {
    // Determine trigger type based on provider category and account type
    const isAtsProvider = getProviderCategory(providerToCheck) === 'ats';
    const triggerType = isIndividual && isAtsProvider ? 'individual_ats' : 'premium_integration';
    const hasConfirmed = await hasPayIntention(user.sub, triggerType);

    if (!hasConfirmed) {
      return c.json({
        error: {
          message: 'This integration requires a payment method on file.',
          code: 'PAY_INTENTION_REQUIRED',
          data: {
            triggerType,
            triggerProvider: providerToCheck,
          },
        },
      }, 403);
    }
  }

  // Validate accessLevel if provided
  if (body.accessLevel && !['read-write', 'read-only'].includes(body.accessLevel)) {
    return c.json(
      { error: { message: 'Invalid accessLevel. Must be "read-write" or "read-only"' } },
      400
    );
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
  const callbackUrl = `${apiUrl}/integrations/callback`;

  // Get the Nango connect URL
  const nango = getNangoClient();
  const oauthUrl = nango.getConnectUrl(providerConfigKey, connectionId, callbackUrl);

  // Build metadata with subProvider and pendingAccessLevel (to be converted to accessLevel on callback)
  const metadata: { subProvider?: string; pendingAccessLevel?: string } = {};
  if (body.subProvider) metadata.subProvider = body.subProvider;
  if (body.accessLevel) metadata.pendingAccessLevel = body.accessLevel;

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
      metadata: JSON.stringify(metadata),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Update existing to pending, preserve existing metadata and add new fields
    const existingMetadata = parseIntegrationMetadata(existingIntegration[0].metadata);
    const mergedMetadata = { ...existingMetadata, ...metadata };

    await db
      .update(integrations)
      .set({
        nangoConnectionId: connectionId,
        status: 'pending',
        metadata: JSON.stringify(mergedMetadata),
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

// GET /integrations/callback - OAuth callback handler
// This is called by Nango after OAuth completes
integrationsRoutes.get('/callback', async (c) => {
  const connectionId = c.req.query('connection_id');
  const error = c.req.query('error');
  const errorDescription = c.req.query('error_description');

  // Build redirect URL to frontend
  const webUrl = process.env.WEB_URL || 'http://localhost:5173';

  if (error) {
    // OAuth failed - redirect to integrations page with error
    log.warn('oauth_callback_error', { error, errorDescription, connectionId });
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
    const int = integration[0];

    // Build updated metadata - convert pendingAccessLevel to accessLevel
    const existingMetadata = parseIntegrationMetadata(int.metadata);
    const updatedMetadata = { ...existingMetadata } as Record<string, unknown>;

    // Apply pending access level if available, otherwise default to 'read-write'
    if (updatedMetadata.pendingAccessLevel) {
      updatedMetadata.accessLevel = updatedMetadata.pendingAccessLevel;
      delete updatedMetadata.pendingAccessLevel; // Clean up the pending field
    } else if (!updatedMetadata.accessLevel) {
      // Default to read-write if no preference set
      updatedMetadata.accessLevel = 'read-write';
    }

    await db
      .update(integrations)
      .set({
        status: 'connected',
        metadata: JSON.stringify(updatedMetadata),
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, int.id));

    log.info('integration_connected', {
      integrationId: int.id,
      userId: int.userId,
      provider: int.provider,
      accessLevel: updatedMetadata.accessLevel,
    });

    /*
     * INTEGRATION ONBOARDING: Advance user's onboarding based on which provider was connected.
     */
    const userId = int.userId;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      let newStep: number | null = null;
      const provider = int.provider;

      if (provider === 'google-sheets' && user.onboardingStep < ONBOARDING_STEPS.SHEETS_CONNECTED) {
        newStep = ONBOARDING_STEPS.SHEETS_CONNECTED;
      } else if (provider === 'email' && user.onboardingStep < ONBOARDING_STEPS.EMAIL_CONNECTED) {
        newStep = ONBOARDING_STEPS.EMAIL_CONNECTED;
      } else if (provider === 'calendar' && user.onboardingStep < ONBOARDING_STEPS.CALENDAR_CONNECTED) {
        newStep = ONBOARDING_STEPS.CALENDAR_CONNECTED;
      }

      if (newStep !== null) {
        await db
          .update(users)
          .set({
            onboardingStep: newStep,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    }
  }

  // Redirect to integrations page with success
  const successUrl = new URL(`${webUrl}/integrations`);
  successUrl.searchParams.set('success', 'Integration connected successfully');
  return c.redirect(successUrl.toString());
});

// POST /integrations/disconnect - Disconnect an integration
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

  log.info('integration_disconnected', {
    integrationId: body.integrationId,
    userId: user.sub,
    provider: int.provider,
  });

  return c.json({ data: { message: 'Integration disconnected' } });
});

// GET /integrations/:id/token - Get fresh access token for an integration
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

// PATCH /integrations/:id/access-level - Update access level for an integration
// Allows users to change their access level preference (read-write or read-only)
integrationsRoutes.patch('/:id/access-level', async (c) => {
  const user = c.get('user');
  const integrationId = c.req.param('id');
  const body = await c.req.json<{ accessLevel: UserAccessLevel }>();

  if (!body.accessLevel || !['read-write', 'read-only'].includes(body.accessLevel)) {
    return c.json(
      { error: { message: 'Invalid accessLevel. Must be "read-write" or "read-only"' } },
      400
    );
  }

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

  // Update metadata with new access level
  const existingMetadata = parseIntegrationMetadata(int.metadata);
  const previousLevel = existingMetadata.accessLevel || 'read-write';
  const updatedMetadata = { ...existingMetadata, accessLevel: body.accessLevel };

  await db
    .update(integrations)
    .set({
      metadata: JSON.stringify(updatedMetadata),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integrationId));

  // Log access level change
  if (previousLevel !== body.accessLevel) {
    log.info('access_level_changed', {
      integrationId,
      userId: user.sub,
      provider: int.provider,
      from: previousLevel,
      to: body.accessLevel,
    });
  }

  return c.json({
    data: {
      id: int.id,
      provider: int.provider,
      accessLevel: body.accessLevel,
      message: `Access level updated to ${body.accessLevel}`,
    },
  });
});

// GET /integrations/status/:provider - Check connection status for a provider
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
    } catch (err) {
      // Nango check failed, but don't change status yet
      // Could be a temporary network issue
      log.warn('nango_connection_check_failed', {
        integrationId: int.id,
        userId: user.sub,
        provider: int.provider,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // Parse metadata to get access level
  const metadata = parseIntegrationMetadata(int.metadata);
  // Validate and default access level
  const rawAccessLevel = metadata.accessLevel;
  const accessLevel: IntegrationAccessLevel =
    rawAccessLevel === 'read-write' || rawAccessLevel === 'read-only'
      ? rawAccessLevel
      : 'read-write';

  return c.json({
    data: {
      connected: int.status === 'connected',
      status: int.status,
      lastSyncAt: int.lastSyncAt,
      accessLevel,
    },
  });
});

