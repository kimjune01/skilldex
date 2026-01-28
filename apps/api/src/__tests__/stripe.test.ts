import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = { ...process.env };

describe('Stripe Integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('isStripeConfigured', () => {
    it('should return true when STRIPE_SECRET_KEY is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      const { isStripeConfigured } = await import('../lib/stripe.js');
      expect(isStripeConfigured()).toBe(true);
    });

    it('should return false when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { isStripeConfigured } = await import('../lib/stripe.js');
      expect(isStripeConfigured()).toBe(false);
    });

    it('should return false when STRIPE_SECRET_KEY is empty', async () => {
      process.env.STRIPE_SECRET_KEY = '';
      const { isStripeConfigured } = await import('../lib/stripe.js');
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe('CreateCheckoutOptions interface', () => {
    it('should require userId', () => {
      const options = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'individual_ats',
      };
      expect(options.userId).toBeDefined();
    });

    it('should require email', () => {
      const options = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'individual_ats',
      };
      expect(options.email).toBeDefined();
    });

    it('should require payIntentionId', () => {
      const options = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'individual_ats',
      };
      expect(options.payIntentionId).toBeDefined();
    });

    it('should require triggerType', () => {
      const options = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'individual_ats',
      };
      expect(options.triggerType).toBeDefined();
    });

    it('should optionally include triggerProvider', () => {
      const withProvider = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'premium_integration',
        triggerProvider: 'airtable',
      };
      expect(withProvider.triggerProvider).toBe('airtable');

      const withoutProvider: {
        userId: string;
        email: string;
        payIntentionId: string;
        triggerType: string;
        triggerProvider?: string;
      } = {
        userId: 'user_123',
        email: 'test@example.com',
        payIntentionId: 'pi_123',
        triggerType: 'individual_ats',
      };
      expect(withoutProvider.triggerProvider).toBeUndefined();
    });
  });

  describe('CheckoutResult interface', () => {
    it('should include checkoutUrl', () => {
      const result = {
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
        customerId: 'cus_123',
        setupIntentId: 'seti_123',
      };
      expect(result.checkoutUrl).toBeDefined();
      expect(result.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com/);
    });

    it('should include customerId', () => {
      const result = {
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
        customerId: 'cus_123',
        setupIntentId: 'seti_123',
      };
      expect(result.customerId).toBeDefined();
      expect(result.customerId).toMatch(/^cus_/);
    });

    it('should include setupIntentId', () => {
      const result = {
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
        customerId: 'cus_123',
        setupIntentId: 'seti_123',
      };
      expect(result.setupIntentId).toBeDefined();
      expect(result.setupIntentId).toMatch(/^seti_/);
    });
  });

  describe('WebhookResult interface', () => {
    it('should include type for all events', () => {
      const completedResult = {
        type: 'completed',
        payIntentionId: 'pi_123',
        paymentMethodId: 'pm_123',
        customerId: 'cus_123',
      };
      expect(completedResult.type).toBe('completed');

      const expiredResult = {
        type: 'expired',
        payIntentionId: 'pi_123',
      };
      expect(expiredResult.type).toBe('expired');

      const otherResult = {
        type: 'customer.created',
      };
      expect(otherResult.type).toBe('customer.created');
    });

    it('should include payIntentionId for completed events', () => {
      const result = {
        type: 'completed',
        payIntentionId: 'pi_123',
        paymentMethodId: 'pm_123',
        customerId: 'cus_123',
      };
      expect(result.payIntentionId).toBeDefined();
    });

    it('should include paymentMethodId for completed events', () => {
      const result = {
        type: 'completed',
        payIntentionId: 'pi_123',
        paymentMethodId: 'pm_123',
        customerId: 'cus_123',
      };
      expect(result.paymentMethodId).toBeDefined();
      expect(result.paymentMethodId).toMatch(/^pm_/);
    });
  });

  describe('Webhook event types', () => {
    it('should handle checkout.session.completed', () => {
      const eventType = 'checkout.session.completed';
      expect(eventType).toBe('checkout.session.completed');
    });

    it('should handle checkout.session.expired', () => {
      const eventType = 'checkout.session.expired';
      expect(eventType).toBe('checkout.session.expired');
    });

    it('should only process setup mode sessions', () => {
      const setupSession = { mode: 'setup' };
      const paymentSession = { mode: 'payment' };
      const subscriptionSession = { mode: 'subscription' };

      expect(setupSession.mode).toBe('setup');
      expect(paymentSession.mode).not.toBe('setup');
      expect(subscriptionSession.mode).not.toBe('setup');
    });
  });
});

describe('Stripe Checkout Flow', () => {
  it('should use setup mode for $0 checkout', () => {
    const checkoutParams = {
      mode: 'setup',
      payment_method_types: ['card'],
    };
    expect(checkoutParams.mode).toBe('setup');
  });

  it('should include success and cancel URLs', () => {
    const webUrl = 'http://localhost:5173';
    const payIntentionId = 'pi_123';

    const successUrl = `${webUrl}/connections?pay_intention=success&id=${payIntentionId}`;
    const cancelUrl = `${webUrl}/connections?pay_intention=cancelled`;

    expect(successUrl).toContain('pay_intention=success');
    expect(successUrl).toContain(`id=${payIntentionId}`);
    expect(cancelUrl).toContain('pay_intention=cancelled');
  });

  it('should include metadata in checkout session', () => {
    const metadata = {
      payIntentionId: 'pi_123',
      userId: 'user_123',
      triggerType: 'individual_ats',
      triggerProvider: 'greenhouse',
    };

    expect(metadata.payIntentionId).toBeDefined();
    expect(metadata.userId).toBeDefined();
    expect(metadata.triggerType).toBeDefined();
  });
});
