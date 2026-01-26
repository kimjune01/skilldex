/**
 * Webhook Security
 *
 * Validates webhook signatures from external services.
 * Prevents webhook spoofing attacks.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { createLogger } from './logger.js';

const log = createLogger('WebhookSecurity');

/**
 * Nango webhook signature verification
 *
 * Nango signs webhooks using HMAC-SHA256 with the secret key.
 * Signature is sent in the X-Nango-Signature header.
 *
 * @see https://docs.nango.dev/integrate/guides/webhooks
 */
export function verifyNangoSignature(
  payload: string | Buffer,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    log.warn('nango_webhook_missing_signature');
    return false;
  }

  if (!secret) {
    log.error('nango_webhook_secret_not_configured');
    // In production, reject webhooks if secret is not configured
    // In development, allow for easier testing
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    log.warn('nango_webhook_signature_skipped_dev_mode');
    return true;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    // Compute expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      log.warn('nango_webhook_signature_length_mismatch');
      return false;
    }

    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      log.warn('nango_webhook_signature_invalid');
    }

    return isValid;
  } catch (error) {
    log.error('nango_webhook_signature_verification_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Generic HMAC-SHA256 signature verification
 * Can be used for other webhook providers
 */
export function verifyHmacSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    const expectedSignature = createHmac(algorithm, secret)
      .update(payloadString)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify webhook is not too old (replay attack prevention)
 * Most webhooks include a timestamp that should be within acceptable range
 */
export function verifyWebhookTimestamp(
  timestamp: number | string,
  toleranceMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  const now = Date.now();

  // Timestamp could be in seconds or milliseconds
  const timestampMs = ts < 1e12 ? ts * 1000 : ts;

  const age = Math.abs(now - timestampMs);
  return age <= toleranceMs;
}

/**
 * Parse Nango webhook signature header
 * Format may be: "sha256=<signature>" or just "<signature>"
 */
export function parseNangoSignature(header: string): string {
  if (header.startsWith('sha256=')) {
    return header.slice(7);
  }
  return header;
}
