/**
 * Webhook handlers for external services
 *
 * Currently handles:
 * - Nango auth webhooks (connection created, refresh failed)
 * - Stripe webhooks (checkout completed, payment method collected)
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations, users, payIntentions, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { handleWebhook as handleStripeWebhook, isStripeConfigured } from '../lib/stripe.js';
import { createLogger } from '../lib/logger.js';

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

// POST /webhooks/nango - Handle Nango webhooks
webhooksRoutes.post('/nango', async (c) => {
  try {
    const payload = await c.req.json<NangoWebhook>();

    console.log('[Nango Webhook] Received:', JSON.stringify(payload, null, 2));

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
           * INTEGRATION ONBOARDING: Advance user's onboarding when first integration connects.
           * This is triggered by Nango webhook after successful OAuth.
           */
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (user && user.onboardingStep < ONBOARDING_STEPS.ATS_CONNECTED) {
            await db
              .update(users)
              .set({
                onboardingStep: ONBOARDING_STEPS.ATS_CONNECTED,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
            console.log(`[Nango Webhook] Advanced onboarding for user ${userId} to ATS_CONNECTED`);
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
