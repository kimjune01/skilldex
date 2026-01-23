import { createMiddleware } from 'hono/factory';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { verifyToken } from '../lib/jwt.js';
import type { AuthPayload } from './auth.js';

/**
 * Combined authentication middleware that accepts both JWT tokens and API keys.
 * - JWT: Authorization: Bearer eyJ...
 * - API Key: Authorization: Bearer sk_live_... or sk_test_...
 *
 * Use this for endpoints that need to support both web app (JWT) and MCP (API key).
 */
export const combinedAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Missing or invalid Authorization header' } }, 401);
  }

  const token = authHeader.slice(7);

  // Check if it's an API key (starts with sk_)
  if (token.startsWith('sk_')) {
    // API key auth
    const result = await db
      .select()
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(
        and(
          eq(apiKeys.key, token),
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

    // Set user with apiKeyId for logging
    c.set('user', {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin ?? false,
      organizationId: user.organizationId ?? null,
      apiKeyId: apiKey.id,
    } as AuthPayload);

    await next();
    return;
  }

  // JWT auth
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token' } }, 401);
  }

  c.set('user', payload as AuthPayload);
  await next();
});
