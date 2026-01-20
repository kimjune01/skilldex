import { Hono } from 'hono';
import { db } from '@skilldex/db';
import { skills } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import type { SkillPublic } from '@skilldex/shared';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

export const skillsRoutes = new Hono();

// Parse frontmatter from SKILL.md content
function parseFrontmatter(content: string): { intent: string; capabilities: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { intent: '', capabilities: [] };
  }
  try {
    const yaml = parseYaml(match[1]);
    return {
      intent: yaml.intent || '',
      capabilities: Array.isArray(yaml.capabilities) ? yaml.capabilities : [],
    };
  } catch {
    return { intent: '', capabilities: [] };
  }
}

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
# Skilldex Skills Installer
# This script downloads Claude Code skills from your Skilldex instance.
# Review this script before running: cat install-skilldex.sh

set -e

SKILLS_DIR="\${HOME}/.claude/commands"

echo "Installing Skilldex skills to \${SKILLS_DIR}"
echo ""

mkdir -p "\${SKILLS_DIR}"
cd "\${SKILLS_DIR}"

echo "Downloading ${enabledSkills.length} skills..."
${skillDownloads}

echo ""
echo "Done! Skills installed to \${SKILLS_DIR}"
echo ""
echo "Next steps:"
echo "  1. Make sure SKILLDEX_API_KEY is set in your shell profile"
echo "  2. Run: source ~/.zshrc (or ~/.bashrc)"
echo "  3. Open Claude Code and try: /ats-search"
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="install-skilldex.sh"',
    },
  });
});

// GET /api/skills/:slug/download - Download skill markdown file (public)
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

  const skillPath = join(process.cwd(), '..', '..', skill[0].skillMdPath);

  if (!existsSync(skillPath)) {
    return c.json({ error: { message: 'Skill file not found' } }, 404);
  }

  const content = readFileSync(skillPath, 'utf-8');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="${slug}.md"`,
    },
  });
});

// Protected routes (require JWT auth)
skillsRoutes.use('*', jwtAuth);

// Helper to convert DB skill to public format
function toSkillPublic(skill: typeof skills.$inferSelect): SkillPublic {
  // Parse intent and capabilities from SKILL.md frontmatter
  const skillPath = join(process.cwd(), '..', '..', skill.skillMdPath);
  let intent = '';
  let capabilities: string[] = [];

  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    intent = parsed.intent;
    capabilities = parsed.capabilities;
  }

  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category as SkillPublic['category'],
    version: skill.version,
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [],
    requiredScopes: skill.requiredScopes ? JSON.parse(skill.requiredScopes) : [],
    intent,
    capabilities,
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

