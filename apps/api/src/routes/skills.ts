import { Hono } from 'hono';
import { db } from '@skilldex/db';
import { skills } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { SkillPublic } from '@skilldex/shared';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const skillsRoutes = new Hono();

// All routes require JWT auth
skillsRoutes.use('*', jwtAuth);

// Helper to convert DB skill to public format
function toSkillPublic(skill: typeof skills.$inferSelect): SkillPublic {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category as SkillPublic['category'],
    version: skill.version,
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [],
    requiredScopes: skill.requiredScopes ? JSON.parse(skill.requiredScopes) : [],
    intentions: skill.intentions ? JSON.parse(skill.intentions) : [],
    isEnabled: skill.isEnabled,
  };
}

// GET /api/skills - List all skills
skillsRoutes.get('/', async (c) => {
  const allSkills = await db.select().from(skills);
  const publicSkills = allSkills.map(toSkillPublic);

  return c.json({ data: publicSkills });
});

// GET /api/skills/:slug - Get skill by slug
skillsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const skill = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (skill.length === 0) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  return c.json({ data: toSkillPublic(skill[0]) });
});

// GET /api/skills/:slug/download - Download skill markdown file
skillsRoutes.get('/:slug/download', async (c) => {
  const slug = c.req.param('slug');

  const skill = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (skill.length === 0) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Read the skill markdown file
  const skillPath = join(process.cwd(), '..', '..', skill[0].skillMdPath);

  if (!existsSync(skillPath)) {
    return c.json({ error: { message: 'Skill file not found' } }, 404);
  }

  const content = readFileSync(skillPath, 'utf-8');

  // Return as downloadable file
  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="${slug}.md"`,
    },
  });
});
