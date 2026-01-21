import { Hono } from 'hono';
import { db } from '@skilldex/db';
import { apiKeys } from '@skilldex/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { jwtAuth } from '../middleware/auth.js';
import { generateApiKey } from '../lib/api-keys.js';
import type { ApiKeyPublic, ApiKeyCreateResponse } from '@skilldex/shared';

export const apiKeysRoutes = new Hono();

// All routes require JWT auth
apiKeysRoutes.use('*', jwtAuth);

// GET /api/api-keys - List user's API keys (full key visible)
apiKeysRoutes.get('/', async (c) => {
  const user = c.get('user');

  const keys = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, user.sub),
        isNull(apiKeys.revokedAt)
      )
    );

  const publicKeys: ApiKeyPublic[] = keys.map((k) => ({
    id: k.id,
    name: k.name,
    key: k.key, // Full key always visible
    lastUsedAt: k.lastUsedAt ?? undefined,
    createdAt: k.createdAt,
  }));

  return c.json({ data: publicKeys });
});

// POST /api/api-keys - Create new API key
apiKeysRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ name?: string }>();

  const name = body.name || 'API Key';
  const key = generateApiKey();
  const id = randomUUID();

  await db.insert(apiKeys).values({
    id,
    userId: user.sub,
    organizationId: user.organizationId ?? null, // Add org context
    key,
    name,
  });

  const response: ApiKeyCreateResponse = {
    id,
    name,
    key,
    createdAt: new Date(),
  };

  return c.json({ data: response }, 201);
});

// DELETE /api/api-keys/:id - Revoke API key
apiKeysRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  // Find the key and verify ownership
  const key = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.userId, user.sub),
        isNull(apiKeys.revokedAt)
      )
    )
    .limit(1);

  if (key.length === 0) {
    return c.json({ error: { message: 'API key not found' } }, 404);
  }

  // Revoke the key
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, id));

  return c.json({ data: { message: 'API key revoked' } });
});
