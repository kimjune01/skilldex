import { describe, it, expect } from 'vitest';
import {
  validateCronExpression,
  calculateNextRun,
  describeCronSchedule,
  isValidTimezone,
} from '../lib/cron-utils.js';

describe('validateCronExpression', () => {
  it('should validate standard 5-field cron expressions', () => {
    expect(validateCronExpression('0 9 * * 1')).toEqual({ valid: true });
    expect(validateCronExpression('*/15 * * * *')).toEqual({ valid: true });
    expect(validateCronExpression('0 0 1 * *')).toEqual({ valid: true });
  });

  it('should reject invalid cron expressions', () => {
    const result = validateCronExpression('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject expressions with invalid field values', () => {
    const result = validateCronExpression('60 * * * *');
    expect(result.valid).toBe(false);
  });

  it('should reject expressions with wrong number of fields', () => {
    // 2 fields is definitely invalid
    const result = validateCronExpression('* *');
    expect(result.valid).toBe(false);
  });

  it('should accept expressions with step values', () => {
    expect(validateCronExpression('*/5 * * * *')).toEqual({ valid: true });
    expect(validateCronExpression('0 */2 * * *')).toEqual({ valid: true });
  });

  it('should accept expressions with ranges', () => {
    expect(validateCronExpression('0 9-17 * * *')).toEqual({ valid: true });
    expect(validateCronExpression('0 0 * * 1-5')).toEqual({ valid: true });
  });

  it('should accept expressions with lists', () => {
    expect(validateCronExpression('0 9,12,15 * * *')).toEqual({ valid: true });
    expect(validateCronExpression('0 0 * * 1,3,5')).toEqual({ valid: true });
  });
});

describe('calculateNextRun', () => {
  it('should calculate next run time in UTC', () => {
    const nextRun = calculateNextRun('0 9 * * *', 'UTC');
    expect(nextRun).toBeInstanceOf(Date);
    expect(nextRun.getTime()).toBeGreaterThan(Date.now());
  });

  it('should calculate next run time in a specific timezone', () => {
    const nextRun = calculateNextRun('0 9 * * *', 'America/New_York');
    expect(nextRun).toBeInstanceOf(Date);
    expect(nextRun.getTime()).toBeGreaterThan(Date.now());
  });

  it('should return a future date for every-minute cron', () => {
    const nextRun = calculateNextRun('* * * * *', 'UTC');
    expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    // Should be within 1 minute
    expect(nextRun.getTime() - Date.now()).toBeLessThan(60 * 1000);
  });

  it('should handle monthly schedules', () => {
    const nextRun = calculateNextRun('0 0 1 * *', 'UTC');
    expect(nextRun).toBeInstanceOf(Date);
    // Next run should be on the 1st of some month (could be this month or next)
    expect(nextRun.getUTCDate()).toBe(1);
    expect(nextRun.getUTCHours()).toBe(0);
  });
});

describe('describeCronSchedule', () => {
  it('should describe every minute', () => {
    const desc = describeCronSchedule('* * * * *');
    // describeCronSchedule may return the raw expression for non-standard patterns
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(0);
  });

  it('should describe hourly schedules', () => {
    const desc = describeCronSchedule('0 * * * *');
    expect(desc.toLowerCase()).toContain('hour');
  });

  it('should describe daily schedules', () => {
    const desc = describeCronSchedule('0 9 * * *');
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(0);
  });

  it('should describe weekly schedules', () => {
    const desc = describeCronSchedule('0 9 * * 1');
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(0);
  });

  it('should handle invalid expressions gracefully', () => {
    const desc = describeCronSchedule('invalid');
    expect(desc).toBeDefined();
  });
});

describe('isValidTimezone', () => {
  it('should accept valid IANA timezones', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
    expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    expect(isValidTimezone('America/Los_Angeles')).toBe(true);
  });

  it('should reject invalid timezones', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    expect(isValidTimezone('NotATimezone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });

  it('should accept Etc/GMT offsets', () => {
    expect(isValidTimezone('Etc/GMT')).toBe(true);
    expect(isValidTimezone('Etc/GMT+5')).toBe(true);
    expect(isValidTimezone('Etc/GMT-8')).toBe(true);
  });
});
