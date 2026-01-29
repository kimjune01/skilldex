/**
 * Skill Access Control
 *
 * Determines skill status based on user's effective access and org settings.
 *
 * Key principles:
 * - Skills are NEVER hidden due to access level (only shown as limited)
 * - Admin can disable skills entirely (user won't see them at all)
 * - Skills declare their requirements in SKILL.md frontmatter
 * - Users always get guidance on how to get access
 *
 * @see docs/SKILL_ACCESS.md for full documentation
 */

import { type EffectiveAccess, type AccessLevel, canRead, canWrite, PERMISSION_CATEGORIES, type IntegrationCategory } from './integration-permissions.js';

/**
 * Skill status
 * - 'available': All requirements met, skill works fully
 * - 'limited': Some requirements not met, skill shown with guidance
 * - 'disabled': Admin disabled the skill, not shown to user
 */
export type SkillStatus = 'available' | 'limited' | 'disabled';

/**
 * Skill requirements (from SKILL.md frontmatter)
 * Maps integration category to required access level
 * Note: 'sheets' is an alias for 'database' category
 */
export interface SkillRequirements {
  ats?: AccessLevel;
  email?: AccessLevel;
  calendar?: AccessLevel;
  database?: AccessLevel;
  docs?: AccessLevel;
}

/**
 * Result of skill status check
 */
export interface SkillStatusResult {
  status: SkillStatus;
  limitations?: string[]; // What's missing
  guidance?: string; // How to fix
}

/**
 * Check if a skill's requirements are satisfied by user's effective access
 *
 * @param requirements - The skill's parsed requirements (known categories only)
 * @param userAccess - The user's effective access levels
 * @param unsupportedIntegrations - List of integrations the skill requires that don't exist in the system
 */
export function checkSkillRequirements(
  requirements: SkillRequirements | null,
  userAccess: EffectiveAccess,
  unsupportedIntegrations: string[] = []
): { satisfied: boolean; limitations: string[] } {
  const limitations: string[] = [];

  // First, add limitations for unsupported integrations
  // These are integrations the skill references that don't exist in the platform
  for (const integration of unsupportedIntegrations) {
    limitations.push(`Requires ${integration} (not available)`);
  }

  if (!requirements) {
    return {
      satisfied: limitations.length === 0,
      limitations,
    };
  }

  // Check each required category
  for (const [category, requiredLevel] of Object.entries(requirements)) {
    if (!requiredLevel) continue;

    const effectiveLevel = userAccess[category as keyof EffectiveAccess];

    // Check if requirement is met
    if (requiredLevel === 'read-write' && !canWrite(effectiveLevel)) {
      if (effectiveLevel === 'none') {
        limitations.push(`Requires ${category} integration (not connected)`);
      } else if (effectiveLevel === 'read-only') {
        limitations.push(`Requires ${category} write access (you have read-only)`);
      } else if (effectiveLevel === 'disabled') {
        limitations.push(`Requires ${category} (disabled by admin)`);
      }
    } else if (requiredLevel === 'read-only' && !canRead(effectiveLevel)) {
      if (effectiveLevel === 'none') {
        limitations.push(`Requires ${category} integration (not connected)`);
      } else if (effectiveLevel === 'disabled') {
        limitations.push(`Requires ${category} (disabled by admin)`);
      }
    }
  }

  return {
    satisfied: limitations.length === 0,
    limitations,
  };
}

/**
 * Generate guidance for how to resolve limitations
 */
function generateGuidance(limitations: string[], isAdmin: boolean): string {
  const hasAdminLimitation = limitations.some(
    (l) => l.includes('disabled by admin')
  );
  const hasAccessLimitation = limitations.some(
    (l) => l.includes('read-only') || l.includes('write access')
  );
  const hasConnectionLimitation = limitations.some(
    (l) => l.includes('not connected')
  );
  const hasUnsupportedIntegration = limitations.some(
    (l) => l.includes('not available')
  );

  const actions: string[] = [];

  if (hasConnectionLimitation) {
    actions.push('connect the required integration in Settings');
  }

  if (hasAccessLimitation) {
    actions.push('update your integration access level in Settings');
  }

  if (hasAdminLimitation) {
    if (isAdmin) {
      actions.push('enable this integration category in Organization Settings');
    } else {
      actions.push('contact your admin to enable access');
    }
  }

  // Unsupported integrations have no actionable guidance - they're simply not available
  if (hasUnsupportedIntegration && actions.length === 0) {
    return 'Some required integrations are not yet supported.';
  }

  if (actions.length === 0) {
    return '';
  }

  if (actions.length === 1) {
    return `To use this skill fully, ${actions[0]}.`;
  }

  return `To use this skill fully, ${actions.slice(0, -1).join(', ')}, or ${actions[actions.length - 1]}.`;
}

/**
 * Get the status of a skill for a user
 *
 * @param skillSlug - The skill's slug
 * @param rawRequirements - Skill's raw requirements object (from frontmatter/DB)
 *                         Can include unsupported integrations like 'stripe'
 * @param userAccess - User's effective access levels
 * @param disabledSkills - Org's disabled skills list
 * @param isAdmin - Whether the user is an admin (affects guidance)
 * @returns Skill status with limitations and guidance
 */
export function getSkillStatus(
  skillSlug: string,
  rawRequirements: Record<string, string> | SkillRequirements | null,
  userAccess: EffectiveAccess,
  disabledSkills: string[],
  isAdmin: boolean = false
): SkillStatusResult {
  // Check if skill is disabled by admin
  if (disabledSkills.includes(skillSlug)) {
    return {
      status: 'disabled',
    };
  }

  // Parse raw requirements to separate supported vs unsupported integrations
  const { requirements, unsupportedIntegrations } = parseRawRequirements(rawRequirements);

  // Check requirements (including unsupported integrations)
  const { satisfied, limitations } = checkSkillRequirements(requirements, userAccess, unsupportedIntegrations);

  if (satisfied) {
    return {
      status: 'available',
    };
  }

  return {
    status: 'limited',
    limitations,
    guidance: generateGuidance(limitations, isAdmin),
  };
}

/**
 * Parse raw requirements object into supported requirements and unsupported integrations
 */
function parseRawRequirements(
  rawRequirements: Record<string, string> | SkillRequirements | null
): ExtendedSkillRequirements {
  if (!rawRequirements) {
    return { requirements: null, unsupportedIntegrations: [] };
  }

  const result: SkillRequirements = {};
  const unsupportedIntegrations: string[] = [];

  for (const [key, value] of Object.entries(rawRequirements)) {
    if (value !== 'read-write' && value !== 'read-only') {
      continue;
    }

    // Map 'sheets' to 'database' category
    const category = key === 'sheets' ? 'database' : key;
    if (PERMISSION_CATEGORIES.includes(category as IntegrationCategory)) {
      result[category as keyof SkillRequirements] = value;
    } else {
      // Track unsupported integrations (e.g., 'stripe', 'hubspot', etc.)
      unsupportedIntegrations.push(key);
    }
  }

  return {
    requirements: Object.keys(result).length > 0 ? result : null,
    unsupportedIntegrations,
  };
}

/**
 * Extended skill requirements that include unsupported integrations
 */
export interface ExtendedSkillRequirements {
  requirements: SkillRequirements | null;
  unsupportedIntegrations: string[];
}

/**
 * Parse skill requirements from SKILL.md frontmatter
 *
 * Expected format:
 * ```yaml
 * requires:
 *   email: read-write
 *   ats: read-only
 * ```
 *
 * Returns both valid requirements and a list of unsupported integrations
 * (integrations referenced that don't exist in the system)
 */
export function parseSkillRequirements(frontmatter: Record<string, unknown>): SkillRequirements | null {
  return parseSkillRequirementsExtended(frontmatter).requirements;
}

/**
 * Parse skill requirements and also track unsupported integrations
 */
export function parseSkillRequirementsExtended(frontmatter: Record<string, unknown>): ExtendedSkillRequirements {
  const requires = frontmatter.requires;
  if (!requires || typeof requires !== 'object') {
    return { requirements: null, unsupportedIntegrations: [] };
  }

  const result: SkillRequirements = {};
  const unsupportedIntegrations: string[] = [];
  const requiresObj = requires as Record<string, unknown>;

  for (const [key, value] of Object.entries(requiresObj)) {
    if (value !== 'read-write' && value !== 'read-only') {
      continue;
    }

    // Map 'sheets' to 'database' category
    const category = key === 'sheets' ? 'database' : key;
    if (PERMISSION_CATEGORIES.includes(category as IntegrationCategory)) {
      result[category as keyof SkillRequirements] = value;
    } else {
      // Track unsupported integrations (e.g., 'stripe', 'hubspot', etc.)
      unsupportedIntegrations.push(key);
    }
  }

  return {
    requirements: Object.keys(result).length > 0 ? result : null,
    unsupportedIntegrations,
  };
}

/**
 * Check if a skill can perform a specific action
 * Used at runtime to determine if an action should be allowed
 */
export function canPerformAction(
  category: keyof EffectiveAccess,
  action: 'read' | 'write',
  userAccess: EffectiveAccess
): boolean {
  const level = userAccess[category];
  if (action === 'write') {
    return canWrite(level);
  }
  return canRead(level);
}
