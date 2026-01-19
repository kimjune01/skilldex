import { createMiddleware } from 'hono/factory';
import { db } from '@skilldex/db';
import { apiKeys, users } from '@skilldex/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { extractApiKey } from '../lib/api-keys.js';

// User info from API key
export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  apiKeyId: string;
}

// Extend Hono's context
declare module 'hono' {
  interface ContextVariableMap {
    apiKeyUser: ApiKeyUser;
  }
}

/**
 * API key authentication middleware
 * Expects: Authorization: Bearer sk_live_...
 */
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const key = extractApiKey(authHeader);

  if (!key) {
    return c.json({ error: { message: 'Missing or invalid API key' } }, 401);
  }

  // Find API key by direct match (full key stored in db)
  const result = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(
      and(
        eq(apiKeys.key, key),
        isNull(apiKeys.revokedAt)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: { message: 'Invalid or revoked API key' } }, 401);
  }

  const row = result[0];
  const apiKey = row.api_keys;
  const user = row.users;

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .execute()
    .catch(console.error);

  c.set('apiKeyUser', {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    apiKeyId: apiKey.id,
  });

  await next();
});
