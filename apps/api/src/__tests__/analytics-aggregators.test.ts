import { describe, it, expect } from 'vitest';
import {
  calculateSuccessStats,
  aggregateBySkill,
  aggregateDailyUsage,
  createDemoSkillLookup,
  createSkillMapLookup,
  countUniqueUsers,
  aggregateTopUsers,
  aggregateErrors,
} from '../lib/analytics-aggregators.js';

describe('analytics-aggregators', () => {
  describe('calculateSuccessStats', () => {
    it('should calculate success rate correctly', () => {
      const logs = [
        { status: 'success', durationMs: 100, createdAt: new Date() },
        { status: 'success', durationMs: 200, createdAt: new Date() },
        { status: 'error', durationMs: 150, createdAt: new Date() },
      ];

      const stats = calculateSuccessStats(logs);

      expect(stats.totalExecutions).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.successRate).toBe('66.7');
      expect(stats.avgDurationMs).toBe(150);
    });

    it('should handle zero executions', () => {
      const stats = calculateSuccessStats([]);

      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe('0');
      expect(stats.avgDurationMs).toBe(0);
    });

    it('should handle null durationMs values', () => {
      const logs = [
        { status: 'success', durationMs: 100, createdAt: new Date() },
        { status: 'success', durationMs: null, createdAt: new Date() },
      ];

      const stats = calculateSuccessStats(logs);
      expect(stats.avgDurationMs).toBe(100);
    });

    it('should handle undefined durationMs values', () => {
      const logs = [
        { status: 'success', durationMs: 200, createdAt: new Date() },
        { status: 'success', createdAt: new Date() },
      ];

      const stats = calculateSuccessStats(logs);
      expect(stats.avgDurationMs).toBe(200);
    });
  });

  describe('aggregateBySkill', () => {
    it('should group usage by skill', () => {
      const logs = [
        { skillSlug: 'sourcing-assistant', status: 'success', createdAt: new Date() },
        { skillSlug: 'sourcing-assistant', status: 'success', createdAt: new Date() },
        { skillSlug: 'interview-scheduler', status: 'success', createdAt: new Date() },
      ];

      const result = aggregateBySkill(logs, createDemoSkillLookup());

      expect(result).toHaveLength(2);
      expect(result[0].skillSlug).toBe('sourcing-assistant');
      expect(result[0].count).toBe(2);
      expect(result[1].skillSlug).toBe('interview-scheduler');
      expect(result[1].count).toBe(1);
    });

    it('should sort by count descending', () => {
      const logs = [
        { skillSlug: 'a', status: 'success', createdAt: new Date() },
        { skillSlug: 'b', status: 'success', createdAt: new Date() },
        { skillSlug: 'b', status: 'success', createdAt: new Date() },
        { skillSlug: 'b', status: 'success', createdAt: new Date() },
      ];

      const result = aggregateBySkill(logs, createDemoSkillLookup());

      expect(result[0].skillSlug).toBe('b');
      expect(result[0].count).toBe(3);
    });

    it('should track unique users when option enabled', () => {
      const logs = [
        { skillSlug: 'skill-1', status: 'success', createdAt: new Date(), userId: 'user-1' },
        { skillSlug: 'skill-1', status: 'success', createdAt: new Date(), userId: 'user-1' },
        { skillSlug: 'skill-1', status: 'success', createdAt: new Date(), userId: 'user-2' },
      ];

      const result = aggregateBySkill(logs, createDemoSkillLookup(), { trackUsers: true });

      expect(result[0].uniqueUsers).toBe(2);
    });

    it('should not track users by default', () => {
      const logs = [
        { skillSlug: 'skill-1', status: 'success', createdAt: new Date(), userId: 'user-1' },
      ];

      const result = aggregateBySkill(logs, createDemoSkillLookup());

      expect(result[0].uniqueUsers).toBeUndefined();
    });

    it('should skip logs where skillLookup returns null', () => {
      const logs = [
        { skillSlug: 'valid', status: 'success', createdAt: new Date() },
        { status: 'success', createdAt: new Date() }, // no skillSlug
      ];

      const result = aggregateBySkill(logs, createDemoSkillLookup());

      expect(result).toHaveLength(1);
      expect(result[0].skillSlug).toBe('valid');
    });
  });

  describe('aggregateDailyUsage', () => {
    it('should group usage by date', () => {
      const logs = [
        { status: 'success', createdAt: '2024-01-15T10:00:00Z' },
        { status: 'success', createdAt: '2024-01-15T14:00:00Z' },
        { status: 'success', createdAt: '2024-01-16T10:00:00Z' },
      ];

      const result = aggregateDailyUsage(logs);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].count).toBe(2);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].count).toBe(1);
    });

    it('should sort by date ascending', () => {
      const logs = [
        { status: 'success', createdAt: '2024-01-20T10:00:00Z' },
        { status: 'success', createdAt: '2024-01-10T10:00:00Z' },
      ];

      const result = aggregateDailyUsage(logs);

      expect(result[0].date).toBe('2024-01-10');
      expect(result[1].date).toBe('2024-01-20');
    });

    it('should track unique users when option enabled', () => {
      const logs = [
        { status: 'success', createdAt: '2024-01-15T10:00:00Z', userId: 'user-1' },
        { status: 'success', createdAt: '2024-01-15T14:00:00Z', userId: 'user-1' },
        { status: 'success', createdAt: '2024-01-15T18:00:00Z', userId: 'user-2' },
      ];

      const result = aggregateDailyUsage(logs, { trackUsers: true });

      expect(result[0].uniqueUsers).toBe(2);
    });

    it('should handle Date objects', () => {
      const logs = [{ status: 'success', createdAt: new Date('2024-01-15T10:00:00Z') }];

      const result = aggregateDailyUsage(logs);

      expect(result[0].date).toBe('2024-01-15');
    });
  });

  describe('createSkillMapLookup', () => {
    it('should return skill info from map', () => {
      const skillMap = new Map([
        ['skill-id-1', { slug: 'sourcing', name: 'Sourcing Assistant', category: 'sourcing' }],
      ]);

      const lookup = createSkillMapLookup(skillMap);
      const result = lookup({ skillId: 'skill-id-1', status: 'success', createdAt: new Date() });

      expect(result).toEqual({
        slug: 'sourcing',
        name: 'Sourcing Assistant',
        category: 'sourcing',
      });
    });

    it('should return null for unknown skill', () => {
      const skillMap = new Map<string, { slug: string; name: string; category?: string }>();
      const lookup = createSkillMapLookup(skillMap);

      const result = lookup({ skillId: 'unknown', status: 'success', createdAt: new Date() });

      expect(result).toBeNull();
    });

    it('should return null for missing skillId', () => {
      const skillMap = new Map([
        ['skill-id-1', { slug: 'sourcing', name: 'Sourcing Assistant' }],
      ]);
      const lookup = createSkillMapLookup(skillMap);

      const result = lookup({ status: 'success', createdAt: new Date() });

      expect(result).toBeNull();
    });
  });

  describe('createDemoSkillLookup', () => {
    it('should convert slug to title case name', () => {
      const lookup = createDemoSkillLookup();
      const result = lookup({
        skillSlug: 'sourcing-assistant',
        status: 'success',
        createdAt: new Date(),
      });

      expect(result).toEqual({
        slug: 'sourcing-assistant',
        name: 'Sourcing Assistant',
      });
    });

    it('should return null for missing skillSlug', () => {
      const lookup = createDemoSkillLookup();
      const result = lookup({ status: 'success', createdAt: new Date() });

      expect(result).toBeNull();
    });
  });

  describe('countUniqueUsers', () => {
    it('should count unique users', () => {
      const logs = [
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-2' },
        { status: 'success', createdAt: new Date(), userId: 'user-3' },
      ];

      expect(countUniqueUsers(logs)).toBe(3);
    });

    it('should handle logs without userId', () => {
      const logs = [
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date() },
      ];

      expect(countUniqueUsers(logs)).toBe(1);
    });

    it('should return 0 for empty logs', () => {
      expect(countUniqueUsers([])).toBe(0);
    });
  });

  describe('aggregateTopUsers', () => {
    it('should aggregate and sort by count', () => {
      const logs = [
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-2' },
      ];

      const userLookup = (userId: string) => {
        const users: Record<string, { name: string; email: string }> = {
          'user-1': { name: 'Alice', email: 'alice@test.com' },
          'user-2': { name: 'Bob', email: 'bob@test.com' },
        };
        return users[userId] || null;
      };

      const result = aggregateTopUsers(logs, userLookup);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].userName).toBe('Alice');
      expect(result[0].count).toBe(3);
      expect(result[1].userId).toBe('user-2');
      expect(result[1].count).toBe(1);
    });

    it('should respect limit', () => {
      const logs = [
        { status: 'success', createdAt: new Date(), userId: 'user-1' },
        { status: 'success', createdAt: new Date(), userId: 'user-2' },
        { status: 'success', createdAt: new Date(), userId: 'user-3' },
      ];

      const result = aggregateTopUsers(logs, () => null, 2);

      expect(result).toHaveLength(2);
    });

    it('should handle unknown users', () => {
      const logs = [{ status: 'success', createdAt: new Date(), userId: 'unknown' }];

      const result = aggregateTopUsers(logs, () => null);

      expect(result[0].userName).toBe('Unknown');
      expect(result[0].userEmail).toBe('');
    });
  });

  describe('aggregateErrors', () => {
    it('should group errors by skill and message', () => {
      const logs = [
        {
          status: 'error',
          createdAt: new Date(),
          skillSlug: 'skill-1',
          errorMessage: 'Connection failed',
        },
        {
          status: 'error',
          createdAt: new Date(),
          skillSlug: 'skill-1',
          errorMessage: 'Connection failed',
        },
        {
          status: 'error',
          createdAt: new Date(),
          skillSlug: 'skill-1',
          errorMessage: 'Timeout',
        },
        { status: 'success', createdAt: new Date(), skillSlug: 'skill-1' }, // should be ignored
      ];

      const result = aggregateErrors(logs, createDemoSkillLookup());

      expect(result).toHaveLength(2);
      expect(result[0].errorMessage).toBe('Connection failed');
      expect(result[0].count).toBe(2);
      expect(result[1].errorMessage).toBe('Timeout');
      expect(result[1].count).toBe(1);
    });

    it('should sort by count descending', () => {
      const logs = [
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'A' },
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'B' },
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'B' },
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'B' },
      ];

      const result = aggregateErrors(logs, createDemoSkillLookup());

      expect(result[0].errorMessage).toBe('B');
      expect(result[0].count).toBe(3);
    });

    it('should respect limit', () => {
      const logs = [
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'A' },
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'B' },
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: 'C' },
      ];

      const result = aggregateErrors(logs, createDemoSkillLookup(), 2);

      expect(result).toHaveLength(2);
    });

    it('should handle null error messages', () => {
      const logs = [
        { status: 'error', createdAt: new Date(), skillSlug: 'skill-1', errorMessage: null },
      ];

      const result = aggregateErrors(logs, createDemoSkillLookup());

      expect(result[0].errorMessage).toBeNull();
    });
  });
});
