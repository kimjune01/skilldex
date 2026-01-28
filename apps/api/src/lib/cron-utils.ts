/**
 * Cron expression utilities for automation scheduling
 *
 * Uses cron-parser for expression validation and next run calculation.
 * Supports standard 5-field cron expressions and IANA timezones.
 *
 * @see https://www.npmjs.com/package/cron-parser
 */
import CronExpressionParser from 'cron-parser';

/**
 * Calculate the next run time for a cron expression
 *
 * @param cronExpression - 5-field cron expression (e.g., "0 9 * * MON")
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles")
 * @returns Next scheduled run time as Date
 */
export function calculateNextRun(cronExpression: string, timezone: string): Date {
  const options = {
    currentDate: new Date(),
    tz: timezone,
  };

  const interval = CronExpressionParser.parse(cronExpression, options);
  return interval.next().toDate();
}

/**
 * Validate a cron expression
 *
 * @param cronExpression - 5-field cron expression to validate
 * @returns Object with valid boolean and optional error message
 */
export function validateCronExpression(cronExpression: string): { valid: boolean; error?: string } {
  try {
    CronExpressionParser.parse(cronExpression);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid cron expression',
    };
  }
}

/**
 * Get a human-readable description of a cron schedule
 *
 * Maps common patterns to readable descriptions.
 * Returns the raw expression for custom/unknown patterns.
 *
 * @param cronExpression - 5-field cron expression
 * @returns Human-readable description
 */
export function describeCronSchedule(cronExpression: string): string {
  // Common patterns mapped to descriptions
  const patterns: Record<string, string> = {
    '0 * * * *': 'Every hour',
    '*/30 * * * *': 'Every 30 minutes',
    '*/15 * * * *': 'Every 15 minutes',
    '0 9 * * *': 'Daily at 9:00 AM',
    '0 8 * * *': 'Daily at 8:00 AM',
    '0 0 * * *': 'Daily at midnight',
    '0 9 * * 1': 'Every Monday at 9:00 AM',
    '0 9 * * 5': 'Every Friday at 9:00 AM',
    '0 9 * * 1-5': 'Weekdays at 9:00 AM',
    '0 0 1 * *': 'First of every month at midnight',
    '0 9 1 * *': 'First of every month at 9:00 AM',
  };

  const description = patterns[cronExpression];
  if (description) {
    return description;
  }

  // Try to parse and describe basic patterns
  try {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      return cronExpression;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Every X minutes
    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const interval = minute.slice(2);
      return `Every ${interval} minutes`;
    }

    // Specific hour daily
    if (minute === '0' && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const hourNum = parseInt(hour, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      return `Daily at ${displayHour}:00 ${period}`;
    }

    // Fall back to raw expression
    return cronExpression;
  } catch {
    return cronExpression;
  }
}

/**
 * Validate IANA timezone string
 *
 * @param timezone - IANA timezone string to validate
 * @returns true if valid timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
