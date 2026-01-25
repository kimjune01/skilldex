/**
 * Analytics Aggregation Utilities
 *
 * Pure functions for aggregating usage log data.
 * Used by both demo mode and production analytics.
 */

export interface UsageLog {
  skillId?: string;
  skillSlug?: string;
  status: string;
  durationMs?: number | null;
  createdAt: Date | string;
  userId?: string;
  errorMessage?: string | null;
}

export interface SkillInfo {
  slug: string;
  name: string;
  category?: string;
}

export interface SkillUsageCount {
  skillSlug: string;
  skillName: string;
  count: number;
  category?: string;
  uniqueUsers?: number;
}

export interface DailyUsageCount {
  date: string;
  count: number;
  uniqueUsers?: number;
}

export interface SuccessStats {
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  successRate: string;
  avgDurationMs: number;
}

/**
 * Calculate success statistics from usage logs
 */
export function calculateSuccessStats(logs: UsageLog[]): SuccessStats {
  const totalExecutions = logs.length;
  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const durations = logs.filter((l) => l.durationMs != null).map((l) => l.durationMs!);
  const avgDurationMs =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  return {
    totalExecutions,
    successCount,
    errorCount,
    successRate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(1) : '0',
    avgDurationMs,
  };
}

/**
 * Aggregate usage by skill
 */
export function aggregateBySkill(
  logs: UsageLog[],
  skillLookup: (log: UsageLog) => SkillInfo | null,
  options?: { trackUsers?: boolean }
): SkillUsageCount[] {
  const bySkillMap = new Map<string, { info: SkillInfo; count: number; users: Set<string> }>();

  for (const log of logs) {
    const skill = skillLookup(log);
    if (!skill) continue;

    const existing = bySkillMap.get(skill.slug);
    if (existing) {
      existing.count++;
      if (options?.trackUsers && log.userId) existing.users.add(log.userId);
    } else {
      bySkillMap.set(skill.slug, {
        info: skill,
        count: 1,
        users: options?.trackUsers && log.userId ? new Set([log.userId]) : new Set(),
      });
    }
  }

  return Array.from(bySkillMap.values())
    .map((s) => ({
      skillSlug: s.info.slug,
      skillName: s.info.name,
      count: s.count,
      category: s.info.category,
      uniqueUsers: s.users.size > 0 ? s.users.size : undefined,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate usage by date
 */
export function aggregateDailyUsage(
  logs: UsageLog[],
  options?: { trackUsers?: boolean }
): DailyUsageCount[] {
  const dailyMap = new Map<string, { count: number; users: Set<string> }>();

  for (const log of logs) {
    const date =
      typeof log.createdAt === 'string'
        ? log.createdAt.split('T')[0]
        : log.createdAt.toISOString().split('T')[0];

    const existing = dailyMap.get(date);
    if (existing) {
      existing.count++;
      if (options?.trackUsers && log.userId) existing.users.add(log.userId);
    } else {
      dailyMap.set(date, {
        count: 1,
        users: options?.trackUsers && log.userId ? new Set([log.userId]) : new Set(),
      });
    }
  }

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      uniqueUsers: data.users.size > 0 ? data.users.size : undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Helper: Create skill lookup function from demo logs (uses skillSlug directly)
 */
export function createDemoSkillLookup(): (log: UsageLog) => SkillInfo | null {
  return (log) => {
    if (!log.skillSlug) return null;
    return {
      slug: log.skillSlug,
      name: log.skillSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  };
}

/**
 * Helper: Create skill lookup function from skill map
 */
export function createSkillMapLookup(
  skillMap: Map<string, { slug: string; name: string; category?: string }>
): (log: UsageLog) => SkillInfo | null {
  return (log) => {
    if (!log.skillId) return null;
    const skill = skillMap.get(log.skillId);
    if (!skill) return null;
    return {
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
    };
  };
}

/**
 * Count unique users across logs
 */
export function countUniqueUsers(logs: UsageLog[]): number {
  return new Set(logs.map((l) => l.userId).filter(Boolean)).size;
}

/**
 * Aggregate top users by usage count
 */
export function aggregateTopUsers(
  logs: UsageLog[],
  userLookup: (userId: string) => { name?: string; email?: string } | null,
  limit = 10
): Array<{ userId: string; userName: string; userEmail: string; count: number }> {
  const userCountMap = new Map<string, number>();

  for (const log of logs) {
    if (log.userId) {
      userCountMap.set(log.userId, (userCountMap.get(log.userId) || 0) + 1);
    }
  }

  return Array.from(userCountMap.entries())
    .map(([userId, count]) => {
      const user = userLookup(userId);
      return {
        userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Aggregate error occurrences by skill and message
 */
export function aggregateErrors(
  logs: UsageLog[],
  skillLookup: (log: UsageLog) => SkillInfo | null,
  limit = 20
): Array<{ skillSlug: string; skillName: string; errorMessage: string | null; count: number }> {
  const errorMap = new Map<
    string,
    { slug: string; name: string; message: string | null; count: number }
  >();

  for (const log of logs.filter((l) => l.status === 'error')) {
    const skill = skillLookup(log);
    if (!skill) continue;

    const key = `${skill.slug}-${log.errorMessage}`;
    const existing = errorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      errorMap.set(key, {
        slug: skill.slug,
        name: skill.name,
        message: log.errorMessage ?? null,
        count: 1,
      });
    }
  }

  return Array.from(errorMap.values())
    .map((e) => ({
      skillSlug: e.slug,
      skillName: e.name,
      errorMessage: e.message,
      count: e.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
