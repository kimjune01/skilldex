/**
 * Stripe Integration Library
 *
 * Handles Stripe Checkout for pay intention confirmation.
 * Uses setup mode ($0) to collect payment method without charging.
 *
 * Flow:
 * 1. User triggers premium feature
 * 2. API creates pay intention, calls createSetupCheckout()
 * 3. User redirected to Stripe Checkout (setup mode)
 * 4. Webhook receives checkout.session.completed
 * 5. Pay intention status updated to 'confirmed'
 */

import Stripe from 'stripe';
import { createLogger } from './logger.js';

const log = createLogger('Stripe');

// Lazy initialization to avoid errors when STRIPE_SECRET_KEY is not set
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export interface CreateCheckoutOptions {
  userId: string;
  email: string;
  payIntentionId: string;
  triggerType: string;
  triggerProvider?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  customerId: string;
  setupIntentId: string;
}

/**
 * Find or create a Stripe customer for the user
 */
async function findOrCreateCustomer(email: string, userId: string): Promise<Stripe.Customer> {
  const stripe = getStripe();

  // Search for existing customer by metadata
  const existing = await stripe.customers.search({
    query: `metadata['skillomatic_user_id']:'${userId}'`,
  });

  if (existing.data.length > 0) {
    log.info('customer_found', { userId, customerId: existing.data[0].id });
    return existing.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      skillomatic_user_id: userId,
    },
  });

  log.info('customer_created', { userId, customerId: customer.id, email });
  return customer;
}

/**
 * Create a Stripe Checkout session in setup mode.
 * This collects payment method without charging the customer.
 */
export async function createSetupCheckout(options: CreateCheckoutOptions): Promise<CheckoutResult> {
  const stripe = getStripe();
  const webUrl = process.env.WEB_URL || 'http://localhost:5173';

  // Create or retrieve Stripe customer
  const customer = await findOrCreateCustomer(options.email, options.userId);

  // Create Checkout Session in setup mode (no payment, just collect card)
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customer.id,
    payment_method_types: ['card'],
    success_url: `${webUrl}/integrations?pay_intention=success&id=${options.payIntentionId}`,
    cancel_url: `${webUrl}/integrations?pay_intention=cancelled`,
    metadata: {
      payIntentionId: options.payIntentionId,
      userId: options.userId,
      triggerType: options.triggerType,
      triggerProvider: options.triggerProvider || '',
    },
  });

  log.info('checkout_session_created', {
    sessionId: session.id,
    customerId: customer.id,
    payIntentionId: options.payIntentionId,
    triggerType: options.triggerType,
  });

  return {
    checkoutUrl: session.url!,
    customerId: customer.id,
    setupIntentId: session.setup_intent as string,
  };
}

export interface WebhookResult {
  type: string;
  payIntentionId?: string;
  paymentMethodId?: string;
  customerId?: string;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(body: Buffer, signature: string): Promise<WebhookResult> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  log.info('webhook_received', { type: event.type, eventId: event.id });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process setup mode sessions (our pay intention flow)
      if (session.mode !== 'setup') {
        return { type: event.type };
      }

      const payIntentionId = session.metadata?.payIntentionId;
      if (!payIntentionId) {
        log.warn('checkout_missing_pay_intention', { sessionId: session.id });
        return { type: event.type };
      }

      // Get the payment method from the setup intent
      let paymentMethodId: string | undefined;
      if (session.setup_intent) {
        const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);
        paymentMethodId = setupIntent.payment_method as string;
      }

      log.info('checkout_completed', {
        sessionId: session.id,
        payIntentionId,
        customerId: session.customer,
        paymentMethodId,
      });

      return {
        type: 'completed',
        payIntentionId,
        paymentMethodId,
        customerId: session.customer as string,
      };
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const payIntentionId = session.metadata?.payIntentionId;

      log.info('checkout_expired', { sessionId: session.id, payIntentionId });

      return {
        type: 'expired',
        payIntentionId,
      };
    }

    default:
      return { type: event.type };
  }
}

// Export the stripe client getter for direct access if needed
export { getStripe };
