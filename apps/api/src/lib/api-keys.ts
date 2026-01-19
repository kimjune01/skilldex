import { randomBytes } from 'crypto';

const API_KEY_PREFIX = 'sk_live_';
const API_KEY_LENGTH = 32; // bytes, results in 64 hex chars

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
