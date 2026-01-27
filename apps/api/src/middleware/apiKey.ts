import { createMiddleware } from 'hono/factory';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { extractApiKey } from '../lib/api-keys.js';

// User info from API key
export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  organizationId: string | null;
  apiKeyId: string;
  onboardingStep: number;
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
 *
 * Keys are stored as plaintext (Turso encrypts at rest).
 * This allows direct DB lookup instead of O(n) decryption.
 */
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const key = extractApiKey(authHeader);

  if (!key) {
    return c.json({ error: { message: 'Missing or invalid API key' } }, 401);
  }

  // Direct lookup - keys stored as plaintext
  const [result] = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.key, key), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!result) {
    return c.json({ error: { message: 'Invalid or revoked API key' } }, 401);
  }

  const apiKey = result.api_keys;
  const user = result.users;

  // Update last used timestamp (fire and forget, non-critical)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .execute()
    .catch((err) => {
      console.error(`[ApiKey] Failed to update lastUsedAt for key ${apiKey.id}:`, err);
    });

  c.set('apiKeyUser', {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? null,
    apiKeyId: apiKey.id,
    onboardingStep: user.onboardingStep ?? 0,
  });

  await next();
});
