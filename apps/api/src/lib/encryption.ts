/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Used for API keys and other secrets that need to be retrievable.
 *
 * SECURITY:
 * - Uses AES-256-GCM (authenticated encryption)
 * - Unique IV (nonce) for each encryption operation
 * - Encryption key from environment variable (not in database)
 * - Defense in depth: database breach alone doesn't expose secrets
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT = 'skillomatic-api-key-encryption-v1'; // Static salt for key derivation

/**
 * Derive a 256-bit encryption key from the master secret.
 * Uses scrypt for key derivation (memory-hard, resistant to GPU attacks).
 */
function deriveKey(masterSecret: string): Buffer {
  return scryptSync(masterSecret, SALT, 32); // 32 bytes = 256 bits
}

/**
 * Get the master encryption key from environment.
 * Falls back to JWT_SECRET if API_KEY_ENCRYPTION_KEY is not set.
 *
 * SECURITY: In production, should use a dedicated encryption key.
 */
function getMasterKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!key) {
    throw new Error(
      'Encryption key not configured. Set API_KEY_ENCRYPTION_KEY or JWT_SECRET.'
    );
  }

  // Warn if using JWT_SECRET as fallback in production
  if (!process.env.API_KEY_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    console.warn(
      '[Security] Using JWT_SECRET for API key encryption. ' +
        'Consider setting a dedicated API_KEY_ENCRYPTION_KEY for better security isolation.'
    );
  }

  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * Output format: base64(iv + authTag + ciphertext)
 * - IV: 16 bytes (unique per encryption)
 * - Auth Tag: 16 bytes (integrity verification)
 * - Ciphertext: variable length
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey(getMasterKey());
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt a base64-encoded encrypted string.
 *
 * @param encryptedBase64 - Base64-encoded encrypted data from encrypt()
 * @returns Original plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(encryptedBase64: string): string {
  const key = deriveKey(getMasterKey());
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Check if a string appears to be encrypted (base64 with expected length).
 * Used to detect legacy plaintext keys during migration.
 */
export function isEncrypted(value: string): boolean {
  // Encrypted API keys are base64 and longer than plaintext keys
  // Plaintext: sk_live_ + 64 hex chars = 72 chars
  // Encrypted: base64(16 + 16 + ~72) ≈ 140+ chars

  if (value.startsWith('sk_live_') || value.startsWith('sk_test_')) {
    return false; // Plaintext key
  }

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(value, 'base64');
    // Should have at least IV + AuthTag + some ciphertext
    return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 10;
  } catch {
    return false;
  }
}

/**
 * Safely decrypt a value, handling both encrypted and plaintext (legacy).
 * Returns the plaintext key regardless of storage format.
 */
export function decryptApiKey(storedValue: string): string {
  if (!isEncrypted(storedValue)) {
    // Legacy plaintext key - return as-is
    return storedValue;
  }

  return decrypt(storedValue);
}

/**
 * Encrypt an API key for storage.
 */
export function encryptApiKey(plaintextKey: string): string {
  return encrypt(plaintextKey);
}
