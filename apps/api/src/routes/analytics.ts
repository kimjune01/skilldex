import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import { db } from '@skillomatic/db';
import { skillUsageLogs, skills, users } from '@skillomatic/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { isDemoMode, generateDemoUsageLogs } from '../lib/demo-data.js';
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

export const analyticsRoutes = new Hono();

// All routes require JWT auth
analyticsRoutes.use('*', jwtAuth);

// GET /analytics/usage - Get user's own usage stats
analyticsRoutes.get('/usage', async (c) => {
  const user = c.get('user');
  const days = parseInt(c.req.query('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    const demoLogs = generateDemoUsageLogs(user.id);
    const filteredLogs = demoLogs.filter((l) => new Date(l.createdAt) >= since);

    const demoSkillLookup = createDemoSkillLookup();
    const summary = calculateSuccessStats(filteredLogs);
    const bySkill = aggregateBySkill(filteredLogs, demoSkillLookup);
    const daily = aggregateDailyUsage(filteredLogs);

    // Recent logs
    const recentLogs = filteredLogs.slice(0, 20).map((log) => ({
      id: log.id,
      skillSlug: log.skillSlug,
      skillName: log.skillSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      status: log.status,
      durationMs: log.durationMs,
      createdAt: log.createdAt,
    }));

    return c.json({
      data: {
        summary,
        bySkill,
        daily,
        recentLogs,
      },
      demo: true,
    });
  }

  // Get all logs for this user
  const allLogs = await db
    .select()
    .from(skillUsageLogs)
    .where(and(eq(skillUsageLogs.userId, user.id), gte(skillUsageLogs.createdAt, since)))
    .orderBy(desc(skillUsageLogs.createdAt))
    .limit(100);

  // Get all skills for lookup
  const allSkills = await db.select().from(skills);
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));

  const skillLookup = createSkillMapLookup(skillMap);
  const summary = calculateSuccessStats(allLogs);
  const bySkill = aggregateBySkill(allLogs, skillLookup);
  const daily = aggregateDailyUsage(allLogs);

  // Recent logs with skill info
  const recentLogs = allLogs.slice(0, 20).map((log) => {
    const skill = skillMap.get(log.skillId);
    return {
      id: log.id,
      skillSlug: skill?.slug || 'unknown',
      skillName: skill?.name || 'Unknown',
      status: log.status,
      durationMs: log.durationMs,
      createdAt: log.createdAt?.toISOString(),
    };
  });

  return c.json({
    data: {
      summary,
      bySkill,
      daily,
      recentLogs,
    },
  });
});

// GET /analytics/admin - Admin-only aggregated analytics
analyticsRoutes.get('/admin', async (c) => {
  const user = c.get('user');

  if (!user.isAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const days = parseInt(c.req.query('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all logs
  const allLogs = await db
    .select()
    .from(skillUsageLogs)
    .where(gte(skillUsageLogs.createdAt, since))
    .orderBy(desc(skillUsageLogs.createdAt));

  // Get all skills and users for lookup
  const allSkills = await db.select().from(skills);
  const allUsers = await db.select().from(users);
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const skillLookup = createSkillMapLookup(skillMap);
  const userLookup = (userId: string) => userMap.get(userId) || null;

  const baseStats = calculateSuccessStats(allLogs);
  const summary = {
    ...baseStats,
    uniqueUsers: countUniqueUsers(allLogs),
  };

  const bySkill = aggregateBySkill(allLogs, skillLookup, { trackUsers: true });
  const topUsers = aggregateTopUsers(allLogs, userLookup, 10);
  const daily = aggregateDailyUsage(allLogs, { trackUsers: true });
  const recentErrors = aggregateErrors(allLogs, skillLookup, 20);

  return c.json({
    data: {
      summary,
      bySkill,
      topUsers,
      daily,
      recentErrors,
    },
  });
});
