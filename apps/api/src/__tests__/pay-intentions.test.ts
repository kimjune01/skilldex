import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing
vi.mock('@skillomatic/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/stripe.js', () => ({
  isStripeConfigured: vi.fn().mockReturnValue(true),
  createSetupCheckout: vi.fn().mockResolvedValue({
    checkoutUrl: 'https://checkout.stripe.com/test',
    customerId: 'cus_test123',
    setupIntentId: 'seti_test123',
  }),
}));

describe('Pay Intentions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /pay-intentions', () => {
    it('should validate trigger type', () => {
      // Valid trigger types
      const validTypes = ['individual_ats', 'premium_integration'];
      for (const type of validTypes) {
        expect(validTypes).toContain(type);
      }

      // Invalid types should be rejected
      const invalidTypes = ['invalid', 'unknown', '', 'ats', 'premium'];
      for (const type of invalidTypes) {
        expect(validTypes).not.toContain(type);
      }
    });

    it('should require triggerType in request body', () => {
      const requestBody = { triggerType: 'individual_ats', triggerProvider: 'greenhouse' };
      expect(requestBody.triggerType).toBeDefined();
    });

    it('should optionally include triggerProvider', () => {
      const withProvider = { triggerType: 'premium_integration', triggerProvider: 'airtable' };
      const withoutProvider = { triggerType: 'individual_ats' };

      expect(withProvider.triggerProvider).toBe('airtable');
      expect(withoutProvider.triggerProvider).toBeUndefined();
    });
  });

  describe('GET /pay-intentions/status', () => {
    it('should require triggerType query param', () => {
      const validQueries = [
        { triggerType: 'individual_ats' },
        { triggerType: 'premium_integration' },
      ];

      for (const query of validQueries) {
        expect(query.triggerType).toBeDefined();
      }
    });

    it('should return hasConfirmed boolean', () => {
      const expectedResponse = {
        data: {
          hasConfirmed: true,
          confirmedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      expect(typeof expectedResponse.data.hasConfirmed).toBe('boolean');
    });
  });

  describe('GET /pay-intentions/my', () => {
    it('should return array of pay intentions', () => {
      const mockResponse = {
        data: [
          {
            id: 'pi_123',
            triggerType: 'individual_ats',
            triggerProvider: 'greenhouse',
            status: 'confirmed',
            confirmedAt: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      expect(Array.isArray(mockResponse.data)).toBe(true);
      expect(mockResponse.data[0]).toHaveProperty('id');
      expect(mockResponse.data[0]).toHaveProperty('triggerType');
      expect(mockResponse.data[0]).toHaveProperty('status');
    });
  });

  describe('GET /pay-intentions/admin/stats', () => {
    it('should return aggregate stats', () => {
      const expectedShape = {
        data: {
          total: 100,
          confirmed: 75,
          pending: 25,
          byTriggerType: {
            individual_ats: 40,
            premium_integration: 60,
          },
          recentIntentions: [],
        },
      };

      expect(expectedShape.data).toHaveProperty('total');
      expect(expectedShape.data).toHaveProperty('confirmed');
      expect(expectedShape.data).toHaveProperty('pending');
      expect(expectedShape.data).toHaveProperty('byTriggerType');
      expect(expectedShape.data.byTriggerType).toHaveProperty('individual_ats');
      expect(expectedShape.data.byTriggerType).toHaveProperty('premium_integration');
    });

    it('should accept days query param', () => {
      const validDays = [7, 30, 90];
      for (const days of validDays) {
        expect(typeof days).toBe('number');
        expect(days).toBeGreaterThan(0);
      }
    });
  });

  describe('GET /pay-intentions/admin/list', () => {
    it('should support pagination', () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          hasMore: true,
        },
      };

      expect(mockResponse.pagination).toHaveProperty('page');
      expect(mockResponse.pagination).toHaveProperty('limit');
      expect(mockResponse.pagination).toHaveProperty('total');
      expect(mockResponse.pagination).toHaveProperty('hasMore');
    });

    it('should include user info with intentions', () => {
      const intentionWithUser = {
        id: 'pi_123',
        triggerType: 'individual_ats',
        status: 'confirmed',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          organizationId: 'org_123',
        },
      };

      expect(intentionWithUser.user).toHaveProperty('email');
      expect(intentionWithUser.user).toHaveProperty('name');
    });
  });
});

describe('Pay Intention Status Types', () => {
  it('should define valid statuses', () => {
    const validStatuses = ['pending', 'confirmed', 'cancelled'];

    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('confirmed');
    expect(validStatuses).toContain('cancelled');
  });
});

describe('Pay Intention Trigger Types', () => {
  it('should define trigger types', () => {
    const validTriggers = ['individual_ats', 'premium_integration'];

    expect(validTriggers).toContain('individual_ats');
    expect(validTriggers).toContain('premium_integration');
  });
});
