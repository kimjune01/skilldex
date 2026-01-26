import { randomBytes } from 'crypto';
import { db } from '@skillomatic/db';
import { apiKeys, users } from '@skillomatic/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { encryptApiKey, decryptApiKey, isEncrypted } from './encryption.js';

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
 * Encrypt an API key for storage
 */
export { encryptApiKey };

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
 * SECURITY: Keys are stored encrypted. This function:
 * 1. Fetches all non-revoked keys for comparison
 * 2. Decrypts each and compares to the provided key
 * 3. Handles both encrypted (new) and plaintext (legacy) keys
 *
 * Note: This is O(n) in the number of active keys, but API keys are
 * typically few per user and the encryption is fast.
 */
export async function validateApiKey(key: string): Promise<ApiKeyUser | null> {
  if (!key || !isValidApiKeyFormat(key)) {
    return null;
  }

  // Fetch all non-revoked keys with user data
  // We need to decrypt each to find a match (can't query encrypted data directly)
  const results = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(isNull(apiKeys.revokedAt));

  // Find matching key by decrypting and comparing
  for (const row of results) {
    const storedKey = row.api_keys.key;
    if (!storedKey) continue;

    try {
      const decryptedKey = decryptApiKey(storedKey);
      if (decryptedKey === key) {
        const apiKey = row.api_keys;
        const user = row.users;

        // Update last used timestamp (fire and forget)
        db.update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, apiKey.id))
          .execute()
          .catch(console.error);

        // Migrate legacy plaintext key to encrypted (fire and forget)
        if (!isEncrypted(storedKey)) {
          db.update(apiKeys)
            .set({ key: encryptApiKey(key) })
            .where(eq(apiKeys.id, apiKey.id))
            .execute()
            .catch(console.error);
        }

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
    } catch {
      // Decryption failed - skip this key (might be corrupted)
      continue;
    }
  }

  return null;
}
