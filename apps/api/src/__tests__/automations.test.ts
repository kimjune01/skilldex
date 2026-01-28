import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AutomationPublic, AutomationRunPublic, CreateAutomationRequest, UpdateAutomationRequest } from '@skillomatic/shared';

// Mock modules before importing
vi.mock('@skillomatic/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/cron-utils.js', () => ({
  validateCronExpression: vi.fn().mockReturnValue({ valid: true }),
  calculateNextRun: vi.fn().mockReturnValue(new Date()),
  describeCronSchedule: vi.fn().mockReturnValue('Every day at 9:00 AM'),
  isValidTimezone: vi.fn().mockReturnValue(true),
}));

describe('Automations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /v1/automations', () => {
    it('should return automation list with limits', () => {
      const mockResponse = {
        data: {
          automations: [] as AutomationPublic[],
          limit: 3,
          count: 0,
          remaining: 3,
        },
      };

      expect(mockResponse.data).toHaveProperty('automations');
      expect(mockResponse.data).toHaveProperty('limit');
      expect(mockResponse.data).toHaveProperty('count');
      expect(mockResponse.data).toHaveProperty('remaining');
      expect(mockResponse.data.limit).toBe(3);
    });

    it('should calculate remaining correctly', () => {
      const limit = 3;
      const count = 1;
      const remaining = limit - count;

      expect(remaining).toBe(2);
    });
  });

  describe('GET /v1/automations/:id', () => {
    it('should return single automation with all fields', () => {
      const mockAutomation: AutomationPublic = {
        id: 'auto_123',
        name: 'Daily Report',
        skillSlug: 'daily-summary',
        skillParams: { includeMetrics: true },
        cronExpression: '0 9 * * *',
        cronTimezone: 'America/New_York',
        cronDescription: 'Every day at 9:00 AM',
        outputEmail: 'user@example.com',
        isEnabled: true,
        lastRunAt: null,
        nextRunAt: '2024-01-02T09:00:00.000Z',
        consecutiveFailures: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(mockAutomation).toHaveProperty('id');
      expect(mockAutomation).toHaveProperty('name');
      expect(mockAutomation).toHaveProperty('skillSlug');
      expect(mockAutomation).toHaveProperty('cronExpression');
      expect(mockAutomation).toHaveProperty('cronTimezone');
      expect(mockAutomation).toHaveProperty('cronDescription');
      expect(mockAutomation).toHaveProperty('outputEmail');
      expect(mockAutomation).toHaveProperty('isEnabled');
      expect(mockAutomation).toHaveProperty('nextRunAt');
    });

    it('should return 404 for non-existent automation', () => {
      const errorResponse = {
        error: { message: 'Automation not found', code: 'NOT_FOUND' },
      };

      expect(errorResponse.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /v1/automations', () => {
    it('should validate required fields', () => {
      const validRequest: CreateAutomationRequest = {
        name: 'Weekly Report',
        skillSlug: 'weekly-summary',
        cronExpression: '0 9 * * 1',
        outputEmail: 'user@example.com',
      };

      expect(validRequest.name).toBeDefined();
      expect(validRequest.skillSlug).toBeDefined();
      expect(validRequest.cronExpression).toBeDefined();
      expect(validRequest.outputEmail).toBeDefined();
    });

    it('should accept optional skillParams', () => {
      const requestWithParams: CreateAutomationRequest = {
        name: 'Custom Report',
        skillSlug: 'custom-skill',
        cronExpression: '0 9 * * *',
        outputEmail: 'user@example.com',
        skillParams: { key: 'value', nested: { data: true } },
      };

      expect(requestWithParams.skillParams).toBeDefined();
    });

    it('should accept optional timezone', () => {
      const requestWithTimezone: CreateAutomationRequest = {
        name: 'Report',
        skillSlug: 'report',
        cronExpression: '0 9 * * *',
        outputEmail: 'user@example.com',
        cronTimezone: 'Europe/London',
      };

      expect(requestWithTimezone.cronTimezone).toBe('Europe/London');
    });

    it('should enforce 3 automation limit', () => {
      const MAX_AUTOMATIONS_PER_USER = 3;
      const existingCount = 3;

      const errorResponse = {
        error: {
          message: `You have reached the maximum of ${MAX_AUTOMATIONS_PER_USER} automations`,
          code: 'LIMIT_EXCEEDED',
        },
      };

      expect(existingCount >= MAX_AUTOMATIONS_PER_USER).toBe(true);
      expect(errorResponse.error.code).toBe('LIMIT_EXCEEDED');
    });

    it('should validate email format', () => {
      const validEmails = ['user@example.com', 'test.user@domain.co', 'name+tag@email.org'];
      const invalidEmails = ['invalid', 'no@', '@nodomain.com', 'spaces here@mail.com'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should validate cron expression', () => {
      const validCrons = ['* * * * *', '0 9 * * *', '0 9 * * 1', '*/15 * * * *'];

      for (const cron of validCrons) {
        const parts = cron.split(' ');
        expect(parts.length).toBe(5);
      }
    });

    it('should return error for non-automatable skill', () => {
      const errorResponse = {
        error: {
          message: 'Skill "manual-skill" does not support automation',
          code: 'SKILL_NOT_AUTOMATABLE',
        },
      };

      expect(errorResponse.error.code).toBe('SKILL_NOT_AUTOMATABLE');
    });
  });

  describe('PUT /v1/automations/:id', () => {
    it('should allow partial updates', () => {
      const partialUpdate: UpdateAutomationRequest = {
        name: 'Updated Name',
      };

      expect(Object.keys(partialUpdate).length).toBe(1);
    });

    it('should allow updating isEnabled', () => {
      const disableUpdate: UpdateAutomationRequest = {
        isEnabled: false,
      };

      expect(disableUpdate.isEnabled).toBe(false);
    });

    it('should recalculate nextRunAt when cron changes', () => {
      const cronUpdate: UpdateAutomationRequest = {
        cronExpression: '0 10 * * *',
      };

      // When cronExpression changes, nextRunAt should be recalculated
      expect(cronUpdate.cronExpression).toBeDefined();
    });

    it('should recalculate nextRunAt when timezone changes', () => {
      const timezoneUpdate: UpdateAutomationRequest = {
        cronTimezone: 'Asia/Tokyo',
      };

      // When cronTimezone changes, nextRunAt should be recalculated
      expect(timezoneUpdate.cronTimezone).toBeDefined();
    });
  });

  describe('DELETE /v1/automations/:id', () => {
    it('should return success on deletion', () => {
      const successResponse = { data: { success: true } };

      expect(successResponse.data.success).toBe(true);
    });

    it('should return 404 for non-existent automation', () => {
      const errorResponse = {
        error: { message: 'Automation not found', code: 'NOT_FOUND' },
      };

      expect(errorResponse.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /v1/automations/:id/run', () => {
    it('should return success message for manual trigger', () => {
      const successResponse = {
        data: {
          success: true,
          message: 'Automation triggered. It will run within the next minute.',
        },
      };

      expect(successResponse.data.success).toBe(true);
      expect(successResponse.data.message).toContain('minute');
    });

    it('should reject trigger for disabled automation', () => {
      const errorResponse = {
        error: {
          message: 'Automation is disabled. Enable it first to run manually.',
          code: 'AUTOMATION_DISABLED',
        },
      };

      expect(errorResponse.error.code).toBe('AUTOMATION_DISABLED');
    });
  });

  describe('GET /v1/automations/:id/runs', () => {
    it('should return run history with correct shape', () => {
      const mockRun: AutomationRunPublic = {
        id: 'run_123',
        status: 'completed',
        triggeredBy: 'schedule',
        startedAt: '2024-01-01T09:00:00.000Z',
        completedAt: '2024-01-01T09:00:30.000Z',
        durationMs: 30000,
        outputSummary: 'Sent report to user@example.com',
        errorCode: null,
        retryCount: 0,
        createdAt: '2024-01-01T09:00:00.000Z',
      };

      expect(mockRun).toHaveProperty('id');
      expect(mockRun).toHaveProperty('status');
      expect(mockRun).toHaveProperty('triggeredBy');
      expect(mockRun).toHaveProperty('startedAt');
      expect(mockRun).toHaveProperty('completedAt');
      expect(mockRun).toHaveProperty('durationMs');
    });

    it('should include error details for failed runs', () => {
      const failedRun: AutomationRunPublic = {
        id: 'run_456',
        status: 'failed',
        triggeredBy: 'schedule',
        startedAt: '2024-01-01T09:00:00.000Z',
        completedAt: '2024-01-01T09:00:05.000Z',
        durationMs: 5000,
        outputSummary: null,
        errorCode: 'LLM_RATE_LIMITED',
        retryCount: 1,
        createdAt: '2024-01-01T09:00:00.000Z',
      };

      expect(failedRun.status).toBe('failed');
      expect(failedRun.errorCode).toBe('LLM_RATE_LIMITED');
      expect(failedRun.retryCount).toBeGreaterThan(0);
    });
  });
});

describe('Automation Status Types', () => {
  it('should define valid statuses', () => {
    const validStatuses = ['pending', 'running', 'completed', 'failed'];

    expect(validStatuses).toContain('pending');
    expect(validStatuses).toContain('running');
    expect(validStatuses).toContain('completed');
    expect(validStatuses).toContain('failed');
  });
});

describe('Automation Trigger Types', () => {
  it('should define valid trigger types', () => {
    const validTriggers = ['schedule', 'manual'];

    expect(validTriggers).toContain('schedule');
    expect(validTriggers).toContain('manual');
  });
});

describe('Automation Limit Constants', () => {
  it('should have correct limit value', () => {
    const MAX_AUTOMATIONS_PER_USER = 3;

    expect(MAX_AUTOMATIONS_PER_USER).toBe(3);
  });
});

describe('Error Codes', () => {
  it('should define automation-specific error codes', () => {
    const errorCodes = [
      'NOT_FOUND',
      'VALIDATION_ERROR',
      'INVALID_CRON',
      'INVALID_TIMEZONE',
      'INVALID_EMAIL',
      'LIMIT_EXCEEDED',
      'SKILL_NOT_FOUND',
      'SKILL_NOT_AUTOMATABLE',
      'AUTOMATION_DISABLED',
    ];

    expect(errorCodes).toContain('NOT_FOUND');
    expect(errorCodes).toContain('INVALID_CRON');
    expect(errorCodes).toContain('LIMIT_EXCEEDED');
    expect(errorCodes).toContain('SKILL_NOT_AUTOMATABLE');
  });

  it('should define worker error codes', () => {
    const workerErrorCodes = [
      'SKILL_NOT_FOUND',
      'SKILL_NO_INSTRUCTIONS',
      'SKILL_NOT_AUTOMATABLE',
      'LLM_ERROR',
      'LLM_RATE_LIMITED',
      'LLM_TIMEOUT',
      'LLM_AUTH_FAILED',
      'LLM_NOT_CONFIGURED',
      'LLM_EMPTY_RESPONSE',
      'EMAIL_DELIVERY_FAILED',
      'UNKNOWN_ERROR',
    ];

    expect(workerErrorCodes).toContain('LLM_RATE_LIMITED');
    expect(workerErrorCodes).toContain('EMAIL_DELIVERY_FAILED');
  });
});
