/**
 * Analytics API module
 */

import { request } from './request';

export interface UsageStats {
  summary: {
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    successRate: string;
    avgDurationMs: number;
    uniqueUsers?: number;
  };
  bySkill: Array<{
    skillSlug: string;
    skillName: string;
    category?: string;
    count: number;
    uniqueUsers?: number;
  }>;
  daily: Array<{
    date: string;
    count: number;
    uniqueUsers?: number;
  }>;
  recentLogs?: Array<{
    id: string;
    skillSlug: string;
    skillName: string;
    status: string;
    durationMs?: number;
    createdAt: string;
  }>;
  topUsers?: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
  recentErrors?: Array<{
    skillSlug: string;
    skillName: string;
    errorMessage: string;
    count: number;
  }>;
}

export const analytics = {
  getUsage: (days = 30) => request<UsageStats>(`/analytics/usage?days=${days}`),

  getAdminStats: (days = 30) => request<UsageStats>(`/analytics/admin?days=${days}`),
};
