/**
 * Skills Library - Progressive Disclosure Pattern
 *
 * Following Claude's Agent Skills pattern:
 * - Level 1: Metadata only (name, description, intent) - loaded into system prompt
 * - Level 2: Full instructions - loaded on demand via load_skill action
 *
 * Skills are filtered by user role using the roleSkills table.
 */

import { db } from '@skillomatic/db';
import { skills, roleSkills, userRoles } from '@skillomatic/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Skill metadata (Level 1) - always in context
export interface SkillMetadata {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  intent: string | null;
  capabilities: string[];
  /** Required integrations with access levels: {"ats": "read-write", "email": "read-only"} */
  requiredIntegrations: Record<string, string>;
}

// Full skill (Level 2) - loaded on demand
export interface SkillFull extends SkillMetadata {
  instructions: string | null;
  version: string;
}

/**
 * Get skill metadata for a user based on their roles
 * Returns only Level 1 data (metadata) for system prompt
 *
 * If user has no roles assigned, returns all enabled skills (default behavior)
 */
export async function getSkillMetadataForUser(userId: string): Promise<SkillMetadata[]> {
  // Get user's roles
  const userRoleRecords = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  let skillRecords;

  if (userRoleRecords.length === 0) {
    // No roles assigned - return all enabled skills (backwards compatible)
    skillRecords = await db
      .select()
      .from(skills)
      .where(eq(skills.isEnabled, true));
  } else {
    // Get skills assigned to user's roles
    const roleIds = userRoleRecords.map(r => r.roleId);

    const roleSkillRecords = await db
      .select()
      .from(roleSkills)
      .where(inArray(roleSkills.roleId, roleIds));

    if (roleSkillRecords.length === 0) {
      // Roles exist but no skills assigned - return empty
      return [];
    }

    const skillIds = [...new Set(roleSkillRecords.map(r => r.skillId))];

    skillRecords = await db
      .select()
      .from(skills)
      .where(and(eq(skills.isEnabled, true), inArray(skills.id, skillIds)));
  }

  return skillRecords.map(toSkillMetadata);
}

/**
 * Get all enabled skills metadata (for admin or when no role filtering needed)
 */
export async function getAllSkillMetadata(): Promise<SkillMetadata[]> {
  const skillRecords = await db
    .select()
    .from(skills)
    .where(eq(skills.isEnabled, true));

  return skillRecords.map(toSkillMetadata);
}

/**
 * Load full skill by slug (Level 2 - progressive disclosure)
 * Called when LLM decides to use a skill
 */
export async function loadSkillBySlug(slug: string): Promise<SkillFull | null> {
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.isEnabled, true)))
    .limit(1);

  if (!skill) return null;

  return {
    ...toSkillMetadata(skill),
    instructions: skill.instructions,
    version: skill.version,
  };
}

/**
 * Check if user has access to a specific skill
 */
export async function userCanAccessSkill(userId: string, skillSlug: string): Promise<boolean> {
  // Get skill
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.slug, skillSlug), eq(skills.isEnabled, true)))
    .limit(1);

  if (!skill) return false;

  // Get user's roles
  const userRoleRecords = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  // No roles = access all (backwards compatible)
  if (userRoleRecords.length === 0) return true;

  // Check if any role has this skill
  const roleIds = userRoleRecords.map(r => r.roleId);
  const [hasAccess] = await db
    .select()
    .from(roleSkills)
    .where(and(inArray(roleSkills.roleId, roleIds), eq(roleSkills.skillId, skill.id)))
    .limit(1);

  return !!hasAccess;
}

// Convert DB record to SkillMetadata
function toSkillMetadata(skill: typeof skills.$inferSelect): SkillMetadata {
  // Parse requiredIntegrations - stored as {"ats": "read-write", "email": "read-only"}
  const requiredIntegrations = skill.requiredIntegrations
    ? JSON.parse(skill.requiredIntegrations)
    : {};

  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    intent: skill.intent,
    capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : [],
    requiredIntegrations,
  };
}

import { type EffectiveAccess } from './integration-permissions.js';
import { getSkillStatus, type SkillStatusResult } from './skill-access.js';
import { sanitizeSkillMetadata } from './prompt-sanitizer.js';

/**
 * Skill with status information for system prompt
 */
export interface SkillWithStatus extends SkillMetadata {
  statusInfo: SkillStatusResult;
}

/**
 * Build the skills portion of the system prompt using only metadata
 * This is the Level 1 disclosure - enough for LLM to decide when to load a skill
 *
 * @param skillsMetadata - List of skills to include
 * @param effectiveAccess - Optional user's effective access levels
 * @param disabledSkills - Optional list of admin-disabled skill slugs
 */
export function buildSkillsPromptSection(
  skillsMetadata: SkillMetadata[],
  effectiveAccess?: EffectiveAccess,
  disabledSkills?: string[]
): string {
  if (skillsMetadata.length === 0) {
    return 'No skills are currently available.';
  }

  // Calculate status for each skill
  const skillsWithStatus: SkillWithStatus[] = skillsMetadata.map(s => ({
    ...s,
    statusInfo: getSkillStatus(
      s.slug,
      s.requiredIntegrations,
      effectiveAccess || { ats: 'read-write', email: 'read-write', calendar: 'read-write', database: 'read-write', docs: 'read-write' },
      disabledSkills || []
    ),
  }));

  // Separate available and limited skills
  const availableSkills = skillsWithStatus.filter(s => s.statusInfo.status === 'available');
  const limitedSkills = skillsWithStatus.filter(s => s.statusInfo.status === 'limited');

  // Build available skills list (sanitize user-controlled metadata)
  const availableSkillsList = availableSkills
    .map(s => {
      const sanitized = sanitizeSkillMetadata({
        description: s.description,
        intent: s.intent,
        capabilities: s.capabilities,
      });
      let entry = `- **${s.slug}**: ${sanitized.description}`;
      if (sanitized.intent) {
        entry += `\n  - *Use when*: ${sanitized.intent}`;
      }
      if (sanitized.capabilities && sanitized.capabilities.length > 0) {
        entry += `\n  - *Can*: ${sanitized.capabilities.join(', ')}`;
      }
      return entry;
    })
    .join('\n');

  // Build limited skills list with guidance (sanitize user-controlled metadata)
  const limitedSkillsList = limitedSkills
    .map(s => {
      const sanitized = sanitizeSkillMetadata({
        description: s.description,
        intent: s.intent,
        capabilities: s.capabilities,
      });
      let entry = `- **${s.slug}** (LIMITED): ${sanitized.description}`;
      if (s.statusInfo.limitations && s.statusInfo.limitations.length > 0) {
        entry += `\n  - *Limitations*: ${s.statusInfo.limitations.join(', ')}`;
      }
      if (s.statusInfo.guidance) {
        entry += `\n  - *How to enable*: ${s.statusInfo.guidance}`;
      }
      return entry;
    })
    .join('\n');

  let output = `## Available Skills

The following skills are available. To use a skill, first load its full instructions with the load_skill action, then follow those instructions.

${availableSkillsList || 'No skills currently have full access.'}`;

  if (limitedSkillsList) {
    output += `

## Limited Skills

These skills have reduced functionality due to access restrictions:

${limitedSkillsList}

**Note**: Limited skills may not work fully. Inform the user about limitations before attempting to use them.`;
  }

  output += `

### How to Use Skills

1. When a user's request matches a skill's intent, use \`load_skill\` to get full instructions:
   \`\`\`action
   {"action": "load_skill", "slug": "skill-slug-here"}
   \`\`\`

2. The system will return the skill's full instructions
3. Follow those instructions to complete the task (may involve additional actions like \`scrape_url\`)`;

  return output;
}
