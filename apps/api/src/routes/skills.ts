import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { skills, integrations, payIntentions, users, automations } from '@skillomatic/db/schema';
import { eq, or, and, isNotNull } from 'drizzle-orm';
import { combinedAuth } from '../middleware/combinedAuth.js';
import type { SkillPublic, SkillAccessInfo, SkillCreateRequest, SkillVisibilityRequest } from '@skillomatic/shared';
import {
  buildCapabilityProfile,
  checkCapabilityRequirements,
  renderSkillInstructions,
  buildConfigSkill,
} from '../lib/skill-renderer.js';
import {
  getOrgIntegrationPermissions,
  getOrgDisabledSkills,
  getEffectiveAccessForUser,
  getUserIntegrationsByCategory,
  isIntegrationCategory,
} from '../lib/integration-permissions.js';
import { getSkillStatus } from '../lib/skill-access.js';
import {
  validateSkillContent,
  slugify,
  ensureUniqueSlug,
  extractInstructions,
} from '../lib/skill-validator.js';
import { validateCronExpression, calculateNextRun } from '../lib/cron-utils.js';
import { getUrlsFromRequest } from '../lib/google-oauth.js';
import { randomUUID } from 'crypto';

export const skillsRoutes = new Hono();

// Public routes (no auth required for downloads)
// GET /skills/install.sh - Download install script for all skills
skillsRoutes.get('/install.sh', async (c) => {
  const { baseUrl } = getUrlsFromRequest(c);

  const enabledSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.isEnabled, true));

  const skillDownloads = enabledSkills
    .map(s => `  echo "  - ${s.name}"\n  curl -sf "${baseUrl}/skills/${s.slug}/download" -o "${s.slug}.md"`)
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

// GET /skills/:slug/download - Download skill markdown file (public)
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
function toSkillPublic(
  skill: typeof skills.$inferSelect,
  options?: { userId?: string; creatorName?: string }
): SkillPublic {
  const isOwner = options?.userId ? skill.userId === options.userId : false;

  // Parse requiredIntegrations - stored as object {"ats": "read-only"}
  const requiredIntegrations = skill.requiredIntegrations
    ? JSON.parse(skill.requiredIntegrations)
    : {};

  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category as SkillPublic['category'],
    version: skill.version,
    requiredIntegrations,
    requiredScopes: [],
    intent: skill.intent || '',
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
    isEnabled: skill.isEnabled,
    // New fields for user-generated skills
    visibility: (skill.visibility || 'private') as SkillPublic['visibility'],
    sourceType: (skill.sourceType || 'filesystem') as SkillPublic['sourceType'],
    isGlobal: skill.isGlobal,
    creatorId: skill.userId || undefined,
    creatorName: options?.creatorName,
    isOwner,
    canEdit: isOwner || (skill.visibility === 'organization' && !skill.isGlobal),
    hasPendingVisibilityRequest: !!skill.pendingVisibility,
    // Automation settings
    automationEnabled: skill.automationEnabled || false,
    requiresInput: skill.requiresInput || false,
  };
}

// GET /skills - List skills available to the authenticated user
// Returns: global skills + org-wide skills + user's private skills
// Query params:
//   - includeAccess=true: include access status for each skill
//   - filter=my: show only user's own skills
//   - filter=pending: (admin) show skills with pending visibility requests
skillsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const organizationId = user.organizationId;
  const includeAccess = c.req.query('includeAccess') === 'true';
  const filter = c.req.query('filter');

  let allSkills;

  // Special filters
  if (filter === 'my') {
    // Only user's own skills
    allSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.userId, user.sub));
  } else if (filter === 'pending' && user.isAdmin && organizationId) {
    // Admin view: skills with pending visibility requests in this org
    allSkills = await db
      .select()
      .from(skills)
      .where(
        and(
          eq(skills.organizationId, organizationId),
          isNotNull(skills.pendingVisibility)
        )
      );
  } else if (organizationId) {
    // User belongs to an organization: show global + org-wide + user's private skills
    allSkills = await db
      .select()
      .from(skills)
      .where(
        or(
          eq(skills.isGlobal, true),
          and(
            eq(skills.organizationId, organizationId),
            eq(skills.visibility, 'organization')
          ),
          eq(skills.userId, user.sub)
        )
      );
  } else {
    // No organization: show global skills + user's own private skills
    allSkills = await db
      .select()
      .from(skills)
      .where(
        or(
          eq(skills.isGlobal, true),
          eq(skills.userId, user.sub)
        )
      );
  }

  // Get access info if requested (works for both org and individual users)
  let disabledSkills: string[] = [];
  let effectiveAccess: Awaited<ReturnType<typeof getEffectiveAccessForUser>> | null = null;

  if (includeAccess) {
    if (organizationId) {
      disabledSkills = await getOrgDisabledSkills(organizationId);
    }
    // getEffectiveAccessForUser handles both org and individual users
    effectiveAccess = await getEffectiveAccessForUser(user.sub, organizationId);
  }

  // Build public skills with access info
  const publicSkills = allSkills.map((skill) => {
    const base = toSkillPublic(skill, { userId: user.sub });

    // Add access info if requested
    if (includeAccess && effectiveAccess) {
      // Parse requirements from requiredIntegrations (stored as {"ats": "read-only", "sheets": "read-write"})
      const requirements: Record<string, string> = {};
      if (skill.requiredIntegrations) {
        try {
          const parsed = JSON.parse(skill.requiredIntegrations) as Record<string, string>;
          for (const [key, value] of Object.entries(parsed)) {
            // Map 'sheets' to 'database' category for access check
            const category = key === 'sheets' ? 'database' : key;
            if (isIntegrationCategory(category)) {
              requirements[category] = value;
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      const skillStatus = getSkillStatus(
        skill.slug,
        Object.keys(requirements).length > 0 ? requirements : null,
        effectiveAccess,
        disabledSkills,
        user.isAdmin || false
      );

      return {
        ...base,
        accessInfo: {
          status: skillStatus.status,
          limitations: skillStatus.limitations,
          guidance: skillStatus.guidance,
          disabledByAdmin: disabledSkills.includes(skill.slug),
        },
      };
    }

    return base;
  });

  // Filter: Admins see all skills. Non-admins see enabled skills OR skills with access info
  // (so they can see limited skills as dimmed instead of hidden)
  const filteredSkills = user.isAdmin
    ? publicSkills
    : publicSkills.filter(s => s.isEnabled || (s.accessInfo && s.accessInfo.status !== 'disabled'));

  return c.json({ data: filteredSkills });
});

// GET /skills/config - Get config skill (ephemeral architecture)
// This returns all credentials needed for client-side LLM calls
// MUST be before /:slug routes to avoid being caught as a slug
skillsRoutes.get('/config', async (c) => {
  const user = c.get('user');
  const profile = await buildCapabilityProfile(user.sub);
  const configContent = buildConfigSkill(profile);

  // Get effective access if user has org context
  let effectiveAccess: Awaited<ReturnType<typeof getEffectiveAccessForUser>> | undefined;
  if (user.organizationId) {
    effectiveAccess = await getEffectiveAccessForUser(user.sub, user.organizationId);
  }

  // Determine calendar provider (prioritize calendly if connected)
  const calendarProvider = profile.calendar?.calendly
    ? 'calendly'
    : profile.calendar?.ical?.provider === 'google'
      ? 'google-calendar'
      : profile.calendar?.ical?.provider === 'outlook'
        ? 'outlook-calendar'
        : undefined;

  // Get connected integrations (org users use three-way model, individual users check directly)
  let connectedIntegrations: { provider: string }[] = [];
  let allowAirtable = false;

  if (user.organizationId) {
    const integrationsByCategory = await getUserIntegrationsByCategory(user.sub, user.organizationId);
    const databaseEnabled = effectiveAccess
      ? effectiveAccess.database !== 'none' && effectiveAccess.database !== 'disabled'
      : false;

    if (databaseEnabled) {
      connectedIntegrations = integrationsByCategory.database;
      allowAirtable = true;
    }
  } else {
    connectedIntegrations = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, user.sub), eq(integrations.status, 'connected')));
  }

  // Check which providers are connected
  const hasProvider = (provider: string) => connectedIntegrations.some((int) => int.provider === provider);
  const hasAirtable = allowAirtable && hasProvider('airtable');
  const hasGoogleSheets = hasProvider('google-sheets');
  const hasGoogleDrive = hasProvider('google-drive');
  const hasGoogleDocs = hasProvider('google-docs');
  const hasGoogleForms = hasProvider('google-forms');
  const hasGoogleContacts = hasProvider('google-contacts');
  const hasGoogleTasks = hasProvider('google-tasks');

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
        hasAirtable,
        hasGoogleSheets,
        hasGoogleDrive,
        hasGoogleDocs,
        hasGoogleForms,
        hasGoogleContacts,
        hasGoogleTasks,
        isSuperAdmin: !!user.isSuperAdmin,
        llmProvider: profile.llm?.provider,
        atsProvider: profile.ats?.provider,
        calendarProvider,
        emailProvider: profile.email?.provider,
        airtableProvider: hasAirtable ? 'airtable' : undefined,
        googleSheetsProvider: hasGoogleSheets ? 'google-sheets' : undefined,
        effectiveAccess: effectiveAccess
          ? {
              ats: effectiveAccess.ats,
              email: effectiveAccess.email,
              calendar: effectiveAccess.calendar,
              database: effectiveAccess.database,
            }
          : undefined,
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

// GET /skills/:slug - Get skill by slug
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

  return c.json({ data: toSkillPublic(skill, { userId: user.sub }) });
});

// GET /skills/:slug/rendered - Get skill with rendered credentials (ephemeral architecture)
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

  // Check capability requirements (stored as {"ats": "read-only"}, extract keys)
  const requiredIntegrationsForCheck = skill.requiredIntegrations
    ? Object.keys(JSON.parse(skill.requiredIntegrations))
    : [];

  const capabilityCheck = checkCapabilityRequirements(requiredIntegrationsForCheck, profile);

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
      ...toSkillPublic(skill, { userId: user.sub }),
      rendered: true,
      instructions: renderedInstructions,
    },
  });
});

/**
 * POST /skills - Create a new user-generated skill from markdown content
 *
 * SYNC: When updating request params, see docs/architecture/SKILL_CREATION.md
 * for the full list of files that must be updated together.
 */
skillsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<SkillCreateRequest>();

  // Validate content is provided
  if (!body.content) {
    return c.json(
      { error: { message: 'Skill content (markdown with YAML frontmatter) is required' } },
      400
    );
  }

  // Validate and parse the markdown content
  const validation = validateSkillContent(body.content);
  if (!validation.valid) {
    return c.json({ error: { message: validation.error } }, 400);
  }

  const parsed = validation.parsed!;

  // Validate cron expression if provided
  let cronExpression: string | null = null;
  if (body.cron) {
    const cronValidation = validateCronExpression(body.cron);
    if (!cronValidation.valid) {
      return c.json({ error: { message: `Invalid cron expression: ${cronValidation.error}` } }, 400);
    }
    cronExpression = body.cron;
  }

  // Generate slug from the parsed name
  const baseSlug = slugify(parsed.name);

  // Handle force upsert: check if skill exists and user owns it
  if (body.force) {
    const [existing] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, baseSlug), eq(skills.userId, user.sub)))
      .limit(1);

    if (existing) {
      // Update existing skill instead of creating new one
      const now = new Date();
      try {
        const [updated] = await db
          .update(skills)
          .set({
            name: parsed.name,
            description: parsed.description,
            category: body.category || parsed.category || existing.category,
            intent: parsed.intent || null,
            capabilities: parsed.capabilities ? JSON.stringify(parsed.capabilities) : null,
            instructions: extractInstructions(body.content),
            requiredIntegrations: parsed.requires ? JSON.stringify(parsed.requires) : null,
            requiresInput: parsed.requiresInput || false,
            updatedAt: now,
          })
          .where(eq(skills.id, existing.id))
          .returning();

        console.log('[Skills] Skill updated (force):', { slug: baseSlug, skillId: updated.id, userId: user.sub, name: parsed.name });
        return c.json({ data: toSkillPublic(updated, { userId: user.sub }) }, 200);
      } catch (error) {
        console.error('[Skills] Error updating skill (force):', { slug: baseSlug, userId: user.sub, name: parsed.name, error });
        return c.json({ error: { message: 'Failed to update skill. Please try again.' } }, 500);
      }
    }
    // If no existing skill found, continue with normal creation
  }

  let slug: string;
  try {
    slug = await ensureUniqueSlug(baseSlug, user.sub);
  } catch (error) {
    console.error('[Skills] Error generating unique slug:', { baseSlug, userId: user.sub, error });
    return c.json({ error: { message: 'Failed to generate skill slug. Please try again.' } }, 500);
  }

  // Determine visibility
  // Admin-created skills default to org-wide, others default to private
  let visibility: 'private' | 'organization' = body.visibility || 'private';
  if (user.isAdmin && !body.visibility) {
    visibility = 'organization';
  }

  // Create the skill
  const id = randomUUID();
  const now = new Date();

  try {
    const [newSkill] = await db
      .insert(skills)
      .values({
        id,
        slug,
        name: parsed.name,
        description: parsed.description,
        category: body.category || parsed.category || 'Productivity',
        version: '1.0.0',
        userId: user.sub,
        organizationId: user.organizationId || null,
        isGlobal: false,
        visibility,
        sourceType: 'user-generated',
        intent: parsed.intent || null,
        capabilities: parsed.capabilities ? JSON.stringify(parsed.capabilities) : null,
        instructions: extractInstructions(body.content),
        requiredIntegrations: parsed.requires ? JSON.stringify(parsed.requires) : null,
        requiresInput: parsed.requiresInput || false,
        isEnabled: true,
        automationEnabled: cronExpression ? true : false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // If cron expression provided, create an automation for this skill
    if (cronExpression) {
      const automationId = randomUUID();
      const nextRunAt = calculateNextRun(cronExpression, 'UTC');

      await db.insert(automations).values({
        id: automationId,
        userId: user.sub,
        organizationId: user.organizationId || null,
        name: `${parsed.name} - Scheduled`,
        skillSlug: slug,
        skillParams: null,
        cronExpression,
        cronTimezone: 'UTC',
        outputEmail: user.email,
        isEnabled: true,
        nextRunAt,
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      });

      console.log('[Skills] Automation created for skill:', { slug, automationId, cron: cronExpression });
    }

    console.log('[Skills] Skill created:', { slug, skillId: newSkill.id, userId: user.sub, name: parsed.name, visibility, hasCron: !!cronExpression });
    return c.json({ data: toSkillPublic(newSkill, { userId: user.sub }) }, 201);
  } catch (error) {
    console.error('[Skills] Error creating skill:', { slug, userId: user.sub, name: parsed.name, error });
    return c.json({ error: { message: 'Failed to create skill. Please try again.' } }, 500);
  }
});

// PUT /skills/:slug - Update skill (owner or admin for org skills)
skillsRoutes.put('/:slug', async (c) => {
  const user = c.get('user');
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

  // Permission check:
  // - Creator can edit their own skills
  // - Admin can edit org-wide skills in their org
  // - Super admin can edit system skills
  const isCreator = existingSkill.userId === user.sub;
  const isOrgAdmin = user.isAdmin && existingSkill.organizationId === user.organizationId;
  const canEditSystemSkill = user.isSuperAdmin && existingSkill.isGlobal;

  if (!isCreator && !isOrgAdmin && !canEditSystemSkill) {
    return c.json({ error: { message: 'You do not have permission to edit this skill' } }, 403);
  }

  // Prevent editing system skills unless super admin
  if (existingSkill.isGlobal && !user.isSuperAdmin) {
    return c.json({ error: { message: 'Cannot edit system skills' } }, 403);
  }

  // Build update object with only provided fields
  const updates: Partial<typeof skills.$inferInsert> = {};

  // If content is provided, validate and extract all fields from it
  if (body.content !== undefined) {
    const validation = validateSkillContent(body.content);
    if (!validation.valid) {
      return c.json({ error: { message: validation.error } }, 400);
    }

    const parsed = validation.parsed!;
    updates.name = parsed.name;
    updates.description = parsed.description;
    updates.intent = parsed.intent || null;
    updates.capabilities = parsed.capabilities ? JSON.stringify(parsed.capabilities) : null;
    updates.instructions = extractInstructions(body.content);
    updates.requiredIntegrations = parsed.requires ? JSON.stringify(parsed.requires) : null;
    updates.requiresInput = parsed.requiresInput || false;
    if (parsed.category) updates.category = parsed.category;
  } else {
    // Individual field updates (when not using content)
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.intent !== undefined) updates.intent = body.intent;
    if (body.capabilities !== undefined) updates.capabilities = JSON.stringify(body.capabilities);
  }

  // Category and isEnabled can be overridden separately
  if (body.category !== undefined) updates.category = body.category;
  if (body.isEnabled !== undefined) updates.isEnabled = body.isEnabled;

  // Handle automation toggle with pay intention tracking
  if (body.automationEnabled !== undefined) {
    // If enabling automation (false -> true), check/create pay intention
    if (body.automationEnabled === true && !existingSkill.automationEnabled) {
      // Check if user already has confirmed automation pay intention
      const existingIntention = await db
        .select()
        .from(payIntentions)
        .where(
          and(
            eq(payIntentions.userId, user.sub),
            eq(payIntentions.triggerType, 'automation'),
            eq(payIntentions.status, 'confirmed')
          )
        )
        .limit(1);

      // If no confirmed intention, create one (auto-confirmed like other pay intentions)
      if (existingIntention.length === 0) {
        const payIntentionId = randomUUID();
        const now = new Date();
        await db.insert(payIntentions).values({
          id: payIntentionId,
          userId: user.sub,
          triggerType: 'automation',
          triggerProvider: existingSkill.slug,
          status: 'confirmed',
          confirmedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // Update user's hasConfirmedPayIntention flag
        await db
          .update(users)
          .set({ hasConfirmedPayIntention: true, updatedAt: now })
          .where(eq(users.id, user.sub));

        console.log('[Skills] Automation pay intention created', {
          skillSlug: existingSkill.slug,
          userId: user.sub,
          payIntentionId,
        });
      }
    }
    updates.automationEnabled = body.automationEnabled;
  }

  updates.updatedAt = new Date();

  // Update the skill
  try {
    const [updatedSkill] = await db
      .update(skills)
      .set(updates)
      .where(eq(skills.id, existingSkill.id))
      .returning();

    return c.json({ data: toSkillPublic(updatedSkill, { userId: user.sub }) });
  } catch (error) {
    console.error('[Skills] Error updating skill:', { slug, skillId: existingSkill.id, userId: user.sub, error });
    return c.json({ error: { message: 'Failed to update skill. Please try again.' } }, 500);
  }
});

// GET /skills/:slug/access - Get skill access info (debug view)
// Returns detailed information about why a skill is available, limited, or disabled
skillsRoutes.get('/:slug/access', combinedAuth, async (c) => {
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

  // Check basic access
  if (!canAccessSkill(skill, user)) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Need org context for permissions
  if (!user.organizationId) {
    return c.json({ error: { message: 'Organization context required' } }, 400);
  }

  // Get org permissions and disabled skills
  const orgPermissions = await getOrgIntegrationPermissions(user.organizationId);
  const disabledSkills = await getOrgDisabledSkills(user.organizationId);
  const effectiveAccess = await getEffectiveAccessForUser(user.sub, user.organizationId);

  // Parse skill requirements (stored as {"ats": "read-only"})
  const requirements: Record<string, string> = {};
  if (skill.requiredIntegrations) {
    try {
      const parsed = JSON.parse(skill.requiredIntegrations) as Record<string, string>;
      for (const [key, value] of Object.entries(parsed)) {
        // Map 'sheets' to 'database' category for access check
        const category = key === 'sheets' ? 'database' : key;
        if (isIntegrationCategory(category)) {
          requirements[category] = value;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Get skill status
  const skillStatus = getSkillStatus(
    skill.slug,
    Object.keys(requirements).length > 0 ? requirements : null,
    effectiveAccess,
    disabledSkills,
    user.isAdmin || false
  );

  const accessInfo: SkillAccessInfo = {
    status: skillStatus.status,
    limitations: skillStatus.limitations,
    guidance: skillStatus.guidance,
    requirements: Object.keys(requirements).length > 0 ? requirements as SkillAccessInfo['requirements'] : undefined,
    effectiveAccess: {
      ats: effectiveAccess.ats,
      email: effectiveAccess.email,
      calendar: effectiveAccess.calendar,
    },
    orgPermissions: {
      ats: orgPermissions.ats,
      email: orgPermissions.email,
      calendar: orgPermissions.calendar,
    },
    disabledByAdmin: disabledSkills.includes(skill.slug),
  };

  return c.json({ data: accessInfo });
});

// DELETE /skills/:slug - Delete a skill
skillsRoutes.delete('/:slug', async (c) => {
  const user = c.get('user');
  const slug = c.req.param('slug');

  // Find existing skill
  const [existingSkill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!existingSkill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Permission check:
  // - Creator can delete their own private skills
  // - Admin can delete org-wide skills in their org (deletes for whole org)
  // - Cannot delete system skills
  const isCreator = existingSkill.userId === user.sub;
  const isOrgAdmin = user.isAdmin && existingSkill.organizationId === user.organizationId;

  // Prevent deleting system skills
  if (existingSkill.isGlobal) {
    return c.json({ error: { message: 'Cannot delete system skills' } }, 403);
  }

  // Check permission
  if (!isCreator && !isOrgAdmin) {
    return c.json({ error: { message: 'You do not have permission to delete this skill' } }, 403);
  }

  // If non-admin creator trying to delete an org-wide skill, deny
  if (isCreator && !user.isAdmin && existingSkill.visibility === 'organization') {
    return c.json({ error: { message: 'Only admins can delete org-wide skills' } }, 403);
  }

  // Delete the skill
  try {
    await db.delete(skills).where(eq(skills.id, existingSkill.id));
    console.log('[Skills] Skill deleted:', { slug, skillId: existingSkill.id, deletedBy: user.sub });
    return c.json({ data: { success: true, message: 'Skill deleted' } });
  } catch (error) {
    console.error('[Skills] Error deleting skill:', { slug, skillId: existingSkill.id, userId: user.sub, error });
    return c.json({ error: { message: 'Failed to delete skill. Please try again.' } }, 500);
  }
});

// POST /skills/:slug/request-visibility - Request visibility change (owner only)
skillsRoutes.post('/:slug/request-visibility', async (c) => {
  const user = c.get('user');
  const slug = c.req.param('slug');
  const body = await c.req.json<SkillVisibilityRequest>();

  // Find existing skill
  const [existingSkill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!existingSkill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Only the creator can request visibility change
  if (existingSkill.userId !== user.sub) {
    return c.json({ error: { message: 'Only the skill creator can request visibility changes' } }, 403);
  }

  // Can only request for private skills
  if (existingSkill.visibility !== 'private') {
    return c.json({ error: { message: 'Skill is already shared' } }, 400);
  }

  // Can't request if already pending
  if (existingSkill.pendingVisibility) {
    return c.json({ error: { message: 'A visibility request is already pending' } }, 400);
  }

  // Validate requested visibility
  if (body.visibility !== 'organization') {
    return c.json({ error: { message: 'Invalid visibility requested' } }, 400);
  }

  // Update skill with pending visibility
  try {
    await db
      .update(skills)
      .set({
        pendingVisibility: body.visibility,
        visibilityRequestedAt: new Date(),
      })
      .where(eq(skills.id, existingSkill.id));

    console.log('[Skills] Visibility request submitted:', { slug, skillId: existingSkill.id, requestedBy: user.sub, requestedVisibility: body.visibility });
    return c.json({ data: { message: 'Visibility request submitted for admin approval' } });
  } catch (error) {
    console.error('[Skills] Error submitting visibility request:', { slug, skillId: existingSkill.id, userId: user.sub, error });
    return c.json({ error: { message: 'Failed to submit visibility request. Please try again.' } }, 500);
  }
});

// POST /skills/:slug/approve-visibility - Approve visibility request (admin only)
skillsRoutes.post('/:slug/approve-visibility', async (c) => {
  const user = c.get('user');
  const slug = c.req.param('slug');

  // Must be admin
  if (!user.isAdmin) {
    return c.json({ error: { message: 'Admin access required' } }, 403);
  }

  // Find existing skill
  const [existingSkill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!existingSkill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Must be in admin's org
  if (existingSkill.organizationId !== user.organizationId) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Must have pending visibility request
  if (!existingSkill.pendingVisibility) {
    return c.json({ error: { message: 'No pending visibility request' } }, 400);
  }

  // Approve: update visibility and clear pending fields
  try {
    const [updatedSkill] = await db
      .update(skills)
      .set({
        visibility: existingSkill.pendingVisibility,
        pendingVisibility: null,
        visibilityRequestedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, existingSkill.id))
      .returning();

    console.log('[Skills] Visibility request approved:', { slug, skillId: existingSkill.id, approvedBy: user.sub, newVisibility: existingSkill.pendingVisibility });
    return c.json({ data: toSkillPublic(updatedSkill, { userId: user.sub }) });
  } catch (error) {
    console.error('[Skills] Error approving visibility request:', { slug, skillId: existingSkill.id, adminId: user.sub, error });
    return c.json({ error: { message: 'Failed to approve visibility request. Please try again.' } }, 500);
  }
});

// POST /skills/:slug/toggle-hidden - Toggle skill visibility for the current user
skillsRoutes.post('/:slug/toggle-hidden', async (c) => {
  const user = c.get('user');
  const slug = c.req.param('slug');

  // Get current hidden skills from user record
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!userRecord) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Parse current hidden skills (JSON array of slugs)
  let hiddenSkills: string[] = [];
  if (userRecord.hiddenSkills) {
    try {
      hiddenSkills = JSON.parse(userRecord.hiddenSkills);
    } catch {
      hiddenSkills = [];
    }
  }

  // Toggle: add if not present, remove if present
  const isHidden = hiddenSkills.includes(slug);
  if (isHidden) {
    hiddenSkills = hiddenSkills.filter((s) => s !== slug);
  } else {
    hiddenSkills.push(slug);
  }

  // Update user record
  try {
    await db
      .update(users)
      .set({
        hiddenSkills: JSON.stringify(hiddenSkills),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub));

    return c.json({ data: { hidden: !isHidden, hiddenSkills } });
  } catch (error) {
    console.error('[Skills] Error toggling hidden skill:', { slug, userId: user.sub, error });
    return c.json({ error: { message: 'Failed to update skill visibility' } }, 500);
  }
});

// POST /skills/:slug/deny-visibility - Deny visibility request (admin only)
skillsRoutes.post('/:slug/deny-visibility', async (c) => {
  const user = c.get('user');
  const slug = c.req.param('slug');

  // Must be admin
  if (!user.isAdmin) {
    return c.json({ error: { message: 'Admin access required' } }, 403);
  }

  // Find existing skill
  const [existingSkill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug))
    .limit(1);

  if (!existingSkill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Must be in admin's org
  if (existingSkill.organizationId !== user.organizationId) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Must have pending visibility request
  if (!existingSkill.pendingVisibility) {
    return c.json({ error: { message: 'No pending visibility request' } }, 400);
  }

  // Deny: clear pending fields (skill remains private)
  try {
    await db
      .update(skills)
      .set({
        pendingVisibility: null,
        visibilityRequestedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, existingSkill.id));

    console.log('[Skills] Visibility request denied:', { slug, skillId: existingSkill.id, deniedBy: user.sub });
    return c.json({ data: { message: 'Visibility request denied' } });
  } catch (error) {
    console.error('[Skills] Error denying visibility request:', { slug, skillId: existingSkill.id, adminId: user.sub, error });
    return c.json({ error: { message: 'Failed to deny visibility request. Please try again.' } }, 500);
  }
});

