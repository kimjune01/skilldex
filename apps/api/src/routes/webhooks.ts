/**
 * Webhook handlers for external services
 *
 * Currently handles:
 * - Nango auth webhooks (connection created, refresh failed)
 * - Stripe webhooks (checkout completed, payment method collected)
 *
 * SECURITY: All webhooks validate signatures to prevent spoofing attacks.
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations, users, payIntentions, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { handleWebhook as handleStripeWebhook, isStripeConfigured } from '../lib/stripe.js';
import { createLogger } from '../lib/logger.js';
import { verifyNangoSignature, parseNangoSignature } from '../lib/webhook-security.js';
import { webhookRateLimit } from '../middleware/rate-limit.js';

export const webhooksRoutes = new Hono();

// Nango webhook payload types
interface NangoAuthWebhook {
  type: 'auth';
  operation: 'creation' | 'refresh';
  connectionId: string;
  authMode: string;
  providerConfigKey: string;
  provider: string;
  environment: string;
  success: boolean;
  endUser?: {
    endUserId: string;
    endUserEmail?: string;
    tags?: Record<string, string>;
  };
  error?: {
    type: string;
    description: string;
  };
}

interface NangoSyncWebhook {
  type: 'sync';
  // Add sync webhook fields if needed
}

type NangoWebhook = NangoAuthWebhook | NangoSyncWebhook;

const log = createLogger('Webhooks');

// Nango webhook secret for signature verification
const NANGO_WEBHOOK_SECRET = process.env.NANGO_WEBHOOK_SECRET || process.env.NANGO_SECRET_KEY || '';

// Apply rate limiting to all webhook routes
webhooksRoutes.use('*', webhookRateLimit);

// POST /webhooks/nango - Handle Nango webhooks
webhooksRoutes.post('/nango', async (c) => {
  try {
    // Get raw body for signature verification
    const rawBody = await c.req.text();

    // Verify webhook signature (prevents spoofing attacks)
    const signature = c.req.header('x-nango-signature');
    const parsedSignature = signature ? parseNangoSignature(signature) : undefined;

    if (!verifyNangoSignature(rawBody, parsedSignature, NANGO_WEBHOOK_SECRET)) {
      log.warn('nango_webhook_rejected_invalid_signature', {
        hasSignature: !!signature,
      });
      // Return 401 but don't reveal details
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody) as NangoWebhook;

    log.info('nango_webhook_received', {
      type: payload.type,
    });

    if (payload.type === 'auth') {
      const authPayload = payload as NangoAuthWebhook;

      if (authPayload.operation === 'creation') {
        // Connection was created
        if (authPayload.success && authPayload.endUser?.endUserId) {
          // Find integration by user ID and provider, update status
          const userId = authPayload.endUser.endUserId;
          const provider = authPayload.provider;

          console.log(`[Nango Webhook] Connection created for user ${userId}, provider ${provider}`);

          // Update integration status to connected
          // The connectionId from Nango is different from our nangoConnectionId
          // We need to find by userId and provider
          const result = await db
            .update(integrations)
            .set({
              status: 'connected',
              nangoConnectionId: authPayload.connectionId,
              lastSyncAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(integrations.userId, userId));

          console.log(`[Nango Webhook] Updated integration:`, result);

          /*
           * INTEGRATION ONBOARDING: Advance user's onboarding based on which provider was connected.
           */
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (user) {
            let newStep: number | null = null;
            let stepName = '';

            if (provider === 'google-sheets' && user.onboardingStep < ONBOARDING_STEPS.SHEETS_CONNECTED) {
              newStep = ONBOARDING_STEPS.SHEETS_CONNECTED;
              stepName = 'SHEETS_CONNECTED';
            } else if (provider === 'email' && user.onboardingStep < ONBOARDING_STEPS.EMAIL_CONNECTED) {
              newStep = ONBOARDING_STEPS.EMAIL_CONNECTED;
              stepName = 'EMAIL_CONNECTED';
            } else if (provider === 'calendar' && user.onboardingStep < ONBOARDING_STEPS.CALENDAR_CONNECTED) {
              newStep = ONBOARDING_STEPS.CALENDAR_CONNECTED;
              stepName = 'CALENDAR_CONNECTED';
            }

            if (newStep !== null) {
              await db
                .update(users)
                .set({
                  onboardingStep: newStep,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, userId));
              console.log(`[Nango Webhook] Advanced onboarding for user ${userId} to ${stepName}`);
            }
          }
        } else if (!authPayload.success) {
          console.error('[Nango Webhook] Connection creation failed:', authPayload.error);
        }
      } else if (authPayload.operation === 'refresh') {
        // Token refresh attempt
        if (!authPayload.success) {
          console.error('[Nango Webhook] Token refresh failed:', authPayload.error);

          // Mark integration as error if we can identify it
          if (authPayload.connectionId) {
            await db
              .update(integrations)
              .set({
                status: 'error',
                updatedAt: new Date(),
              })
              .where(eq(integrations.nangoConnectionId, authPayload.connectionId));
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return c.json({ received: true });
  } catch (error) {
    console.error('[Nango Webhook] Error processing webhook:', error);
    // Still return 200 to prevent retries for malformed payloads
    return c.json({ received: true, error: 'Processing error' });
  }
});

// POST /webhooks/stripe - Handle Stripe webhooks
webhooksRoutes.post('/stripe', async (c) => {
  if (!isStripeConfigured()) {
    log.warn('stripe_webhook_not_configured');
    return c.json({ error: { message: 'Stripe not configured' } }, 503);
  }

  const signature = c.req.header('stripe-signature');
  if (!signature) {
    log.warn('stripe_webhook_missing_signature');
    return c.json({ error: { message: 'Missing Stripe signature' } }, 400);
  }

  try {
    // Get raw body as buffer for signature verification
    const body = await c.req.arrayBuffer();

    const result = await handleStripeWebhook(Buffer.from(body), signature);

    if (result.type === 'completed' && result.payIntentionId) {
      // Update pay intention to confirmed
      await db
        .update(payIntentions)
        .set({
          status: 'confirmed',
          stripePaymentMethodId: result.paymentMethodId,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payIntentions.id, result.payIntentionId));

      // Get the pay intention to find user ID
      const [intention] = await db
        .select()
        .from(payIntentions)
        .where(eq(payIntentions.id, result.payIntentionId))
        .limit(1);

      if (intention) {
        // Update user's hasConfirmedPayIntention flag and stripeCustomerId
        await db
          .update(users)
          .set({
            hasConfirmedPayIntention: true,
            stripeCustomerId: result.customerId || intention.stripeCustomerId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, intention.userId));

        log.info('pay_intention_confirmed', {
          payIntentionId: result.payIntentionId,
          userId: intention.userId,
          triggerType: intention.triggerType,
        });
      }
    } else if (result.type === 'expired' && result.payIntentionId) {
      // Mark pay intention as cancelled
      await db
        .update(payIntentions)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(payIntentions.id, result.payIntentionId));

      log.info('pay_intention_expired', {
        payIntentionId: result.payIntentionId,
      });
    }

    return c.json({ received: true });
  } catch (err) {
    log.error('stripe_webhook_error', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return c.json({ error: { message: 'Webhook processing error' } }, 400);
  }
});
