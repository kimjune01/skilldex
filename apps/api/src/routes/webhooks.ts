/**
 * Webhook handlers for external services
 *
 * Currently handles:
 * - Nango auth webhooks (connection created, refresh failed)
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { integrations, users, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';

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

// POST /api/webhooks/nango - Handle Nango webhooks
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
