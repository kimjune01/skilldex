import { randomBytes } from 'crypto';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

const API_KEY_PREFIX = 'sk_live_';
const API_KEY_LENGTH = 32; // bytes, results in 64 hex chars

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  apiKeyId: string;
}

/**
 * Generate a new API key
 * Returns the full key to store and display
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(API_KEY_LENGTH).toString('hex');
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Extract the key from Authorization header
 * Supports: "Bearer sk_live_..." or just "sk_live_..."
 */
export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader;
  }

  return null;
}

/**
 * Validate API key and return user info
 * Returns null if key is invalid or revoked
 */
export async function validateApiKey(key: string): Promise<ApiKeyUser | null> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

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
    return null;
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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    apiKeyId: apiKey.id,
  };
}
