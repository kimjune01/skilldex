import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { skills } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { SkillPublic } from '@skillomatic/shared';

export const skillsRoutes = new Hono();

// Public routes (no auth required for downloads)
// GET /api/skills/install.sh - Download install script for all skills
skillsRoutes.get('/install.sh', async (c) => {
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const enabledSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.isEnabled, true));

  const skillDownloads = enabledSkills
    .map(s => `  echo "  - ${s.name}"\n  curl -sf "${baseUrl}/api/skills/${s.slug}/download" -o "${s.slug}.md"`)
    .join('\n');

  const script = `#!/bin/bash
# Skillomatic Skills Installer
# This script downloads Claude Code skills from your Skillomatic instance.
# Review this script before running: cat install-skillomatic.sh

set -e

SKILLS_DIR="\${HOME}/.claude/commands"

echo "Installing Skillomatic skills to \${SKILLS_DIR}"
echo ""

mkdir -p "\${SKILLS_DIR}"
cd "\${SKILLS_DIR}"

echo "Downloading ${enabledSkills.length} skills..."
${skillDownloads}

echo ""
echo "Done! Skills installed to \${SKILLS_DIR}"
echo ""
echo "Next steps:"
echo "  1. Make sure SKILLOMATIC_API_KEY is set in your shell profile"
echo "  2. Run: source ~/.zshrc (or ~/.bashrc)"
echo "  3. Open Claude Code and try: /ats-search"
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="install-skillomatic.sh"',
    },
  });
});

// GET /api/skills/:slug/download - Download skill markdown file (public)
skillsRoutes.get('/:slug/download', async (c) => {
  const slug = c.req.param('slug');

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  if (!skill.instructions) {
    return c.json({ error: { message: 'Skill instructions not found' } }, 404);
  }

  // Reconstruct SKILL.md format with frontmatter
  const frontmatter = [
    '---',
    `name: ${skill.slug}`,
    `description: ${skill.description}`,
    skill.intent ? `intent: ${skill.intent}` : null,
    skill.capabilities ? `capabilities:\n${JSON.parse(skill.capabilities).map((c: string) => `  - ${c}`).join('\n')}` : null,
    '---',
  ].filter(Boolean).join('\n');

  const content = `${frontmatter}\n\n${skill.instructions}`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="${slug}.md"`,
    },
  });
});

// Protected routes (require JWT auth)
skillsRoutes.use('*', jwtAuth);

// Helper to convert DB skill to public format (now uses DB fields instead of filesystem)
function toSkillPublic(skill: typeof skills.$inferSelect): SkillPublic {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category as SkillPublic['category'],
    version: skill.version,
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [],
    requiredScopes: [],
    intent: skill.intent || '',
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
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

