import { randomBytes, randomUUID } from 'crypto';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';

const API_KEY_PREFIX_LIVE = 'sk_live_';
const API_KEY_PREFIX_TEST = 'sk_test_';
const API_KEY_LENGTH = 32; // bytes, results in 64 hex chars

function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX_LIVE) || key.startsWith(API_KEY_PREFIX_TEST);
}

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  apiKeyId: string;
  organizationId: string | null;
  onboardingStep: number;
}

/**
 * Generate a new API key
 * Returns the full plaintext key
 */
export function generateApiKey(isTest = false): string {
  const prefix = isTest ? API_KEY_PREFIX_TEST : API_KEY_PREFIX_LIVE;
  const randomPart = randomBytes(API_KEY_LENGTH).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * Create a default API key for a new user
 * Called automatically on account creation for extension auto-config
 */
export async function createDefaultApiKey(userId: string, organizationId: string | null): Promise<void> {
  const key = generateApiKey();

  await db.insert(apiKeys).values({
    id: randomUUID(),
    userId,
    organizationId,
    key,
    name: 'Default Key',
  });
}

/**
 * Extract the key from Authorization header
 * Supports: "Bearer sk_live_..." or just "sk_live_..."
 */
export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return isValidApiKeyFormat(key) ? key : null;
  }

  if (isValidApiKeyFormat(authHeader)) {
    return authHeader;
  }

  return null;
}

/**
 * Validate API key and return user info
 * Returns null if key is invalid or revoked
 *
 * Keys are stored as plaintext (Turso encrypts at rest).
 * This allows direct DB lookup instead of O(n) decryption.
 */
export async function validateApiKey(key: string): Promise<ApiKeyUser | null> {
  if (!key || !isValidApiKeyFormat(key)) {
    return null;
  }

  // Direct lookup - keys stored as plaintext
  const [result] = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.key, key))
    .limit(1);

  if (!result) {
    return null;
  }

  const apiKey = result.api_keys;
  const user = result.users;

  // Check if revoked
  if (apiKey.revokedAt) {
    return null;
  }

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
    organizationId: user.organizationId,
    onboardingStep: user.onboardingStep ?? 0,
  };
}
