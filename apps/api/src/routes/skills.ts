import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { skills } from '@skillomatic/db/schema';
import { eq, or } from 'drizzle-orm';
import { combinedAuth } from '../middleware/combinedAuth.js';
import type { SkillPublic } from '@skillomatic/shared';
import {
  buildCapabilityProfile,
  checkCapabilityRequirements,
  renderSkillInstructions,
  buildConfigSkill,
} from '../lib/skill-renderer.js';

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

// Protected routes (require JWT or API key auth)
skillsRoutes.use('*', combinedAuth);

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

// GET /api/skills - List skills available to the authenticated user
// Returns: global skills + skills for user's organization (if any)
skillsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const organizationId = user.organizationId;

  // Build filter: global skills OR skills for user's organization
  // Also filter out disabled skills for non-admins
  let allSkills;

  if (organizationId) {
    // User belongs to an organization: show global + org-specific skills
    allSkills = await db
      .select()
      .from(skills)
      .where(
        or(
          eq(skills.isGlobal, true),
          eq(skills.organizationId, organizationId)
        )
      );
  } else {
    // No organization: show only global skills
    allSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.isGlobal, true));
  }

  // Non-admins only see enabled skills
  const filteredSkills = user.isAdmin
    ? allSkills
    : allSkills.filter(s => s.isEnabled);

  const publicSkills = filteredSkills.map(toSkillPublic);

  return c.json({ data: publicSkills });
});

// GET /api/skills/config - Get config skill (ephemeral architecture)
// This returns all credentials needed for client-side LLM calls
// MUST be before /:slug routes to avoid being caught as a slug
skillsRoutes.get('/config', async (c) => {
  const user = c.get('user');
  const profile = await buildCapabilityProfile(user.sub);
  const configContent = buildConfigSkill(profile);

  return c.json({
    data: {
      slug: '_config',
      name: 'System Configuration',
      rendered: true,
      instructions: configContent,
      profile: {
        hasLLM: !!profile.llm,
        hasATS: !!profile.ats,
        hasCalendar: !!(profile.calendar?.ical || profile.calendar?.calendly),
        hasEmail: !!profile.email,
        isSuperAdmin: !!user.isSuperAdmin,
        llmProvider: profile.llm?.provider,
        atsProvider: profile.ats?.provider,
      },
    },
  });
});

// Helper: Check if user can access a skill
function canAccessSkill(
  skill: typeof skills.$inferSelect,
  user: { organizationId?: string | null; isAdmin?: boolean }
): boolean {
  // Global skills are accessible to everyone
  if (skill.isGlobal) return true;

  // Org-specific skills require matching organization
  if (skill.organizationId && user.organizationId === skill.organizationId) return true;

  return false;
}

// GET /api/skills/:slug - Get skill by slug
skillsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const user = c.get('user');

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Check access
  if (!canAccessSkill(skill, user)) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Non-admins can't see disabled skills
  if (!skill.isEnabled && !user.isAdmin) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  return c.json({ data: toSkillPublic(skill) });
});

// GET /api/skills/:slug/rendered - Get skill with rendered credentials (ephemeral architecture)
// This returns the skill instructions with all {{VARIABLE}} placeholders replaced
// with actual credentials from the user's capability profile
skillsRoutes.get('/:slug/rendered', async (c) => {
  const slug = c.req.param('slug');
  const user = c.get('user');

  // Special case: _config skill returns all credentials
  if (slug === '_config') {
    const profile = await buildCapabilityProfile(user.sub);
    const configContent = buildConfigSkill(profile);

    return c.json({
      data: {
        slug: '_config',
        name: 'System Configuration',
        rendered: true,
        instructions: configContent,
      },
    });
  }

  // Load skill from DB
  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Check access
  if (!canAccessSkill(skill, user)) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  if (!skill.isEnabled && !user.isAdmin) {
    return c.json({ error: { message: 'Skill is disabled' } }, 403);
  }

  if (!skill.instructions) {
    return c.json({ error: { message: 'Skill has no instructions' } }, 400);
  }

  // Build user's capability profile
  const profile = await buildCapabilityProfile(user.sub);

  // Check capability requirements
  const requiredIntegrations = skill.requiredIntegrations
    ? JSON.parse(skill.requiredIntegrations)
    : [];

  const capabilityCheck = checkCapabilityRequirements(requiredIntegrations, profile);

  if (!capabilityCheck.satisfied) {
    return c.json(
      {
        error: {
          message: `This skill requires: ${capabilityCheck.missing.join(', ')}. Please connect these integrations in Settings.`,
          code: 'MISSING_CAPABILITIES',
          missing: capabilityCheck.missing,
        },
      },
      400
    );
  }

  // Render the skill with credentials
  const renderedInstructions = renderSkillInstructions(skill.instructions, profile);

  return c.json({
    data: {
      ...toSkillPublic(skill),
      rendered: true,
      instructions: renderedInstructions,
    },
  });
});

// PUT /api/skills/:slug - Update skill (admin only)
skillsRoutes.put('/:slug', async (c) => {
  const user = c.get('user');

  // Check if user is admin
  if (!user.isAdmin) {
    return c.json({ error: { message: 'Admin access required' } }, 403);
  }

  const slug = c.req.param('slug');
  const body = await c.req.json();

  // Find existing skill
  const [existingSkill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!existingSkill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Build update object with only provided fields
  const updates: Partial<typeof skills.$inferInsert> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.intent !== undefined) updates.intent = body.intent;
  if (body.capabilities !== undefined) updates.capabilities = JSON.stringify(body.capabilities);
  if (body.requiredIntegrations !== undefined) updates.requiredIntegrations = JSON.stringify(body.requiredIntegrations);
  if (body.isEnabled !== undefined) updates.isEnabled = body.isEnabled;

  // Update the skill
  const [updatedSkill] = await db
    .update(skills)
    .set(updates)
    .where(eq(skills.id, existingSkill.id))
    .returning();

  return c.json({ data: toSkillPublic(updatedSkill) });
});

