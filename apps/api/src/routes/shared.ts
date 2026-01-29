/**
 * Public shared skill routes
 *
 * These routes are PUBLIC (no auth required) and allow anyone with a share link
 * to view and download a shared skill.
 *
 * Routes:
 * - GET /s/:code - Get shared skill metadata
 * - GET /s/:code/download - Download SKILL.md file
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { skills, users } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import type { SharedSkillPublic } from '@skillomatic/shared';

export const sharedRoutes = new Hono();

// GET /s/:code - Get shared skill by code (public, no auth)
sharedRoutes.get('/:code', async (c) => {
  const code = c.req.param('code');

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.shareCode, code))
    .limit(1);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Optionally get creator name
  let creatorName: string | undefined;
  if (skill.userId) {
    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, skill.userId))
      .limit(1);
    creatorName = creator?.name || undefined;
  }

  const publicSkill: SharedSkillPublic = {
    shareCode: code,
    name: skill.name,
    description: skill.description,
    category: skill.category as SharedSkillPublic['category'],
    version: skill.version,
    intent: skill.intent || '',
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
    requiredIntegrations: skill.requiredIntegrations
      ? JSON.parse(skill.requiredIntegrations)
      : {},
    creatorName,
    sharedAt: skill.sharedAt?.toISOString() || skill.createdAt.toISOString(),
  };

  return c.json({ data: publicSkill });
});

// GET /s/:code/download - Download shared skill SKILL.md (public, no auth)
sharedRoutes.get('/:code/download', async (c) => {
  const code = c.req.param('code');

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.shareCode, code))
    .limit(1);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  if (!skill.instructions) {
    return c.json({ error: { message: 'Skill instructions not found' } }, 404);
  }

  // Reconstruct SKILL.md format with YAML frontmatter
  const frontmatterLines = [
    '---',
    `name: ${skill.name}`,
    `description: ${skill.description}`,
  ];

  if (skill.intent) {
    frontmatterLines.push(`intent: ${skill.intent}`);
  }

  if (skill.capabilities) {
    const caps = JSON.parse(skill.capabilities) as string[];
    if (caps.length > 0) {
      frontmatterLines.push('capabilities:');
      caps.forEach((cap) => frontmatterLines.push(`  - ${cap}`));
    }
  }

  if (skill.requiredIntegrations) {
    const integrations = JSON.parse(skill.requiredIntegrations) as Record<string, string>;
    if (Object.keys(integrations).length > 0) {
      frontmatterLines.push('requires:');
      Object.entries(integrations).forEach(([key, value]) => {
        frontmatterLines.push(`  ${key}: ${value}`);
      });
    }
  }

  frontmatterLines.push('---');

  const content = `${frontmatterLines.join('\n')}\n\n${skill.instructions}`;
  const filename = `${skill.slug || skill.name.toLowerCase().replace(/\s+/g, '-')}.md`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
