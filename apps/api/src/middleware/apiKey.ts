import { createMiddleware } from 'hono/factory';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { extractApiKey, encryptApiKey } from '../lib/api-keys.js';
import { decryptApiKey, isEncrypted } from '../lib/encryption.js';

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
 * SECURITY: Keys are stored encrypted (AES-256-GCM).
 * This middleware decrypts and compares each non-revoked key.
 * Legacy plaintext keys are automatically migrated on first use.
 */
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const key = extractApiKey(authHeader);

  if (!key) {
    return c.json({ error: { message: 'Missing or invalid API key' } }, 401);
  }

  // Fetch all non-revoked keys with user data
  // We need to decrypt each to find a match (can't query encrypted data directly)
  const results = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(isNull(apiKeys.revokedAt));

  // Find matching key by decrypting and comparing
  let matchedRow: typeof results[0] | null = null;

  for (const row of results) {
    const storedKey = row.api_keys.key;
    if (!storedKey) continue;

    try {
      const decryptedKey = decryptApiKey(storedKey);
      if (decryptedKey === key) {
        matchedRow = row;
        break;
      }
    } catch {
      // Decryption failed - skip this key (might be corrupted)
      continue;
    }
  }

  if (!matchedRow) {
    return c.json({ error: { message: 'Invalid or revoked API key' } }, 401);
  }

  const apiKey = matchedRow.api_keys;
  const user = matchedRow.users;

  // Update last used timestamp (fire and forget, non-critical)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .execute()
    .catch((err) => {
      console.error(`[ApiKey] Failed to update lastUsedAt for key ${apiKey.id}:`, err);
    });

  // Migrate legacy plaintext key to encrypted (fire and forget)
  if (!isEncrypted(apiKey.key)) {
    db.update(apiKeys)
      .set({ key: encryptApiKey(key) })
      .where(eq(apiKeys.id, apiKey.id))
      .execute()
      .catch((err) => {
        console.error(`[ApiKey] Failed to migrate key ${apiKey.id} to encrypted:`, err);
      });
  }

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
