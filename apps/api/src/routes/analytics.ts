import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import { db } from '@skillomatic/db';
import { skillUsageLogs, skills, users } from '@skillomatic/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { isDemoMode, generateDemoUsageLogs } from '../lib/demo-data.js';

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
    const filteredLogs = demoLogs.filter(
      (l) => new Date(l.createdAt) >= since
    );

    const totalExecutions = filteredLogs.length;
    const successCount = filteredLogs.filter((l) => l.status === 'success').length;
    const errorCount = filteredLogs.filter((l) => l.status === 'error').length;
    const durations = filteredLogs.map((l) => l.durationMs);
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    // Usage by skill
    const bySkillMap = new Map<string, { slug: string; name: string; count: number }>();
    for (const log of filteredLogs) {
      const existing = bySkillMap.get(log.skillSlug);
      if (existing) {
        existing.count++;
      } else {
        bySkillMap.set(log.skillSlug, {
          slug: log.skillSlug,
          name: log.skillSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          count: 1,
        });
      }
    }
    const bySkill = Array.from(bySkillMap.values())
      .map((s) => ({ skillSlug: s.slug, skillName: s.name, count: s.count }))
      .sort((a, b) => b.count - a.count);

    // Daily usage
    const dailyMap = new Map<string, number>();
    for (const log of filteredLogs) {
      const date = log.createdAt.split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

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
        summary: {
          totalExecutions,
          successCount,
          errorCount,
          successRate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(1) : '0',
          avgDurationMs,
        },
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
    .where(
      and(
        eq(skillUsageLogs.userId, user.id),
        gte(skillUsageLogs.createdAt, since)
      )
    )
    .orderBy(desc(skillUsageLogs.createdAt))
    .limit(100);

  // Get all skills for lookup
  const allSkills = await db.select().from(skills);
  const skillMap = new Map(allSkills.map(s => [s.id, s]));

  // Calculate stats
  const totalExecutions = allLogs.length;
  const successCount = allLogs.filter(l => l.status === 'success').length;
  const errorCount = allLogs.filter(l => l.status === 'error').length;
  const durations = allLogs.filter(l => l.durationMs).map(l => l.durationMs!);
  const avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Usage by skill
  const bySkillMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const log of allLogs) {
    const skill = skillMap.get(log.skillId);
    if (skill) {
      const existing = bySkillMap.get(skill.slug);
      if (existing) {
        existing.count++;
      } else {
        bySkillMap.set(skill.slug, { slug: skill.slug, name: skill.name, count: 1 });
      }
    }
  }
  const bySkill = Array.from(bySkillMap.values())
    .map(s => ({ skillSlug: s.slug, skillName: s.name, count: s.count }))
    .sort((a, b) => b.count - a.count);

  // Daily usage
  const dailyMap = new Map<string, number>();
  for (const log of allLogs) {
    if (log.createdAt) {
      const date = log.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
      summary: {
        totalExecutions,
        successCount,
        errorCount,
        successRate: totalExecutions > 0
          ? (successCount / totalExecutions * 100).toFixed(1)
          : '0',
        avgDurationMs,
      },
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
  const skillMap = new Map(allSkills.map(s => [s.id, s]));
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Calculate summary stats
  const totalExecutions = allLogs.length;
  const successCount = allLogs.filter(l => l.status === 'success').length;
  const errorCount = allLogs.filter(l => l.status === 'error').length;
  const durations = allLogs.filter(l => l.durationMs).map(l => l.durationMs!);
  const avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const uniqueUsers = new Set(allLogs.map(l => l.userId)).size;

  // Usage by skill
  const bySkillMap = new Map<string, { slug: string; name: string; category: string; count: number; users: Set<string> }>();
  for (const log of allLogs) {
    const skill = skillMap.get(log.skillId);
    if (skill) {
      const existing = bySkillMap.get(skill.slug);
      if (existing) {
        existing.count++;
        existing.users.add(log.userId);
      } else {
        bySkillMap.set(skill.slug, {
          slug: skill.slug,
          name: skill.name,
          category: skill.category,
          count: 1,
          users: new Set([log.userId]),
        });
      }
    }
  }
  const bySkill = Array.from(bySkillMap.values())
    .map(s => ({ skillSlug: s.slug, skillName: s.name, category: s.category, count: s.count, uniqueUsers: s.users.size }))
    .sort((a, b) => b.count - a.count);

  // Top users
  const userCountMap = new Map<string, number>();
  for (const log of allLogs) {
    userCountMap.set(log.userId, (userCountMap.get(log.userId) || 0) + 1);
  }
  const topUsers = Array.from(userCountMap.entries())
    .map(([userId, count]) => {
      const u = userMap.get(userId);
      return { userId, userName: u?.name || 'Unknown', userEmail: u?.email || '', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily usage
  const dailyMap = new Map<string, { count: number; users: Set<string> }>();
  for (const log of allLogs) {
    if (log.createdAt) {
      const date = log.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.count++;
        existing.users.add(log.userId);
      } else {
        dailyMap.set(date, { count: 1, users: new Set([log.userId]) });
      }
    }
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, count: data.count, uniqueUsers: data.users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent errors
  const errorMap = new Map<string, { slug: string; name: string; message: string | null; count: number }>();
  for (const log of allLogs.filter(l => l.status === 'error')) {
    const skill = skillMap.get(log.skillId);
    if (skill) {
      const key = `${skill.slug}-${log.errorMessage}`;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorMap.set(key, { slug: skill.slug, name: skill.name, message: log.errorMessage, count: 1 });
      }
    }
  }
  const recentErrors = Array.from(errorMap.values())
    .map(e => ({ skillSlug: e.slug, skillName: e.name, errorMessage: e.message, count: e.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return c.json({
    data: {
      summary: {
        totalExecutions,
        successCount,
        errorCount,
        successRate: totalExecutions > 0
          ? (successCount / totalExecutions * 100).toFixed(1)
          : '0',
        avgDurationMs,
        uniqueUsers,
      },
      bySkill,
      topUsers,
      daily,
      recentErrors,
    },
  });
});
