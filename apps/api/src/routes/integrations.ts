import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { IntegrationPublic } from '@skillomatic/shared';

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

// POST /api/integrations/connect - Initiate OAuth connection
// In a real implementation, this would redirect to Nango
integrationsRoutes.post('/connect', async (c) => {
  const body = await c.req.json<{ provider: string }>();

  if (!body.provider) {
    return c.json({ error: { message: 'Provider is required' } }, 400);
  }

  // For MVP, return a mock OAuth URL
  // In production, this would use Nango to generate the OAuth URL
  const nangoHost = process.env.NANGO_HOST || 'http://localhost:3003';
  const oauthUrl = `${nangoHost}/oauth/connect/${body.provider}`;

  return c.json({
    data: {
      url: oauthUrl,
      message: 'Redirect user to this URL to complete OAuth',
    },
  });
});

// POST /api/integrations/disconnect - Disconnect an integration
integrationsRoutes.post('/disconnect', async (c) => {
  const body = await c.req.json<{ integrationId: string }>();

  if (!body.integrationId) {
    return c.json({ error: { message: 'Integration ID is required' } }, 400);
  }

  // Update status to disconnected
  await db
    .update(integrations)
    .set({ status: 'disconnected', updatedAt: new Date() })
    .where(eq(integrations.id, body.integrationId));

  return c.json({ data: { message: 'Integration disconnected' } });
});
