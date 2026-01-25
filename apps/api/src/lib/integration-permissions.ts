/**
 * Integration Permissions System
 *
 * Implements a three-way intersection model for integration access:
 * 1. Admin allows → Org-level settings for integrations (read/write per category)
 * 2. Integration connected → User has OAuth'd the provider
 * 3. User's personal choice → User can restrict their own access (e.g., email: read-only)
 *
 * Effective access = min(admin_level, user_level) when connected
 *
 * @see docs/INTEGRATION_PERMISSIONS.md for full documentation
 */

import { db } from '@skillomatic/db';
import { organizations, integrations, payIntentions, users } from '@skillomatic/db/schema';
import { eq, and, or } from 'drizzle-orm';
import {
  getProviderCategory as getProviderCategoryFromRegistry,
  isProviderAllowedForIndividual,
  type PayIntentionTrigger,
} from '@skillomatic/shared';
import { createLogger } from './logger.js';

const log = createLogger('Permissions');

/**
 * Access level for an integration category
 * - 'read-write': Full access (can read and modify data)
 * - 'read-only': Can only read data, not modify
 * - 'disabled': Category is disabled by admin
 * - 'none': Integration not connected
 */
export type AccessLevel = 'read-write' | 'read-only' | 'disabled' | 'none';

/**
 * Integration categories that can have permissions set
 */
export type IntegrationCategory = 'ats' | 'email' | 'calendar' | 'database';

/**
 * Org-level integration permissions
 */
export interface OrgIntegrationPermissions {
  ats: AccessLevel;
  email: AccessLevel;
  calendar: AccessLevel;
  database: AccessLevel;
}

/**
 * User's effective access per category (after three-way intersection)
 */
export interface EffectiveAccess {
  ats: AccessLevel;
  email: AccessLevel;
  calendar: AccessLevel;
  database: AccessLevel;
}

/**
 * Integration metadata stored in integrations.metadata JSON
 */
export interface IntegrationMetadata {
  subProvider?: string; // e.g., 'gmail', 'outlook', 'greenhouse'
  accessLevel?: AccessLevel; // User's personal access level choice
  isOrgWide?: boolean;
}

/**
 * Default permissions - all enabled with read-write access
 */
const DEFAULT_PERMISSIONS: OrgIntegrationPermissions = {
  ats: 'read-write',
  email: 'read-write',
  calendar: 'read-write',
  database: 'read-write',
};

/**
 * Get the organization's integration permissions
 */
export async function getOrgIntegrationPermissions(
  orgId: string
): Promise<OrgIntegrationPermissions> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org || !org.integrationPermissions) {
    return DEFAULT_PERMISSIONS;
  }

  try {
    const parsed = JSON.parse(org.integrationPermissions);
    return {
      ats: parsed.ats || 'read-write',
      email: parsed.email || 'read-write',
      calendar: parsed.calendar || 'read-write',
      database: parsed.database || 'read-write',
    };
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

/**
 * Get the disabled skills list for an organization
 */
export async function getOrgDisabledSkills(orgId: string): Promise<string[]> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org || !org.disabledSkills) {
    return [];
  }

  try {
    const parsed = JSON.parse(org.disabledSkills);
    // Validate it's an array of strings
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * Update organization's integration permissions (admin only)
 */
export async function updateOrgIntegrationPermissions(
  orgId: string,
  permissions: Partial<OrgIntegrationPermissions>
): Promise<void> {
  const current = await getOrgIntegrationPermissions(orgId);
  const updated = { ...current, ...permissions };

  // Log permission changes for audit trail
  const changes: Record<string, { from: AccessLevel; to: AccessLevel }> = {};
  for (const [key, value] of Object.entries(permissions)) {
    const category = key as IntegrationCategory;
    if (current[category] !== value) {
      changes[category] = { from: current[category], to: value as AccessLevel };
    }
  }

  if (Object.keys(changes).length > 0) {
    log.info('org_permissions_updated', { orgId, changes });
  }

  await db
    .update(organizations)
    .set({
      integrationPermissions: JSON.stringify(updated),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Update organization's disabled skills list (admin only)
 */
export async function updateOrgDisabledSkills(
  orgId: string,
  disabledSkills: string[]
): Promise<void> {
  const current = await getOrgDisabledSkills(orgId);

  // Calculate what changed
  const added = disabledSkills.filter((s) => !current.includes(s));
  const removed = current.filter((s) => !disabledSkills.includes(s));

  if (added.length > 0 || removed.length > 0) {
    log.info('org_disabled_skills_updated', {
      orgId,
      added: added.length > 0 ? added : undefined,
      removed: removed.length > 0 ? removed : undefined,
      totalDisabled: disabledSkills.length,
    });
  }

  await db
    .update(organizations)
    .set({
      disabledSkills: JSON.stringify(disabledSkills),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Valid access levels that can be stored in metadata
 */
const VALID_ACCESS_LEVELS: AccessLevel[] = ['read-write', 'read-only', 'disabled', 'none'];

/**
 * Get the user's access level for a connected integration from metadata
 */
function getUserAccessLevel(integration: { metadata: string | null }): AccessLevel {
  if (!integration.metadata) {
    return 'read-write'; // Default to full access if not specified
  }

  try {
    const meta: IntegrationMetadata = JSON.parse(integration.metadata);
    // Validate that the access level is a valid value
    if (meta.accessLevel && VALID_ACCESS_LEVELS.includes(meta.accessLevel)) {
      return meta.accessLevel;
    }
    return 'read-write';
  } catch {
    return 'read-write';
  }
}

/**
 * Map provider to category.
 * Uses the centralized provider registry from @skillomatic/shared.
 * Also handles generic category aliases (e.g., 'ats' -> 'ats', 'email' -> 'email').
 */
export function providerToCategory(provider: string): IntegrationCategory | null {
  // Handle generic category aliases
  const categoryAliases: Record<string, IntegrationCategory> = {
    ats: 'ats',
    email: 'email',
    calendar: 'calendar',
    database: 'database',
  };

  if (categoryAliases[provider]) {
    return categoryAliases[provider];
  }

  // Look up in centralized registry
  const category = getProviderCategoryFromRegistry(provider);
  if (category) {
    return category as IntegrationCategory;
  }

  // Unknown provider - could indicate data migration issue or new provider
  if (provider) {
    log.warn('unknown_provider', { provider });
  }
  return null;
}

/**
 * Calculate minimum of two access levels
 * Order: read-write > read-only > disabled > none
 */
function minAccessLevel(a: AccessLevel, b: AccessLevel): AccessLevel {
  const order: AccessLevel[] = ['none', 'disabled', 'read-only', 'read-write'];
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);
  return order[Math.min(aIndex, bIndex)];
}

/**
 * Get the effective access level for a category (three-way intersection)
 *
 * @param category - The integration category (ats, email, calendar)
 * @param orgPermissions - Admin-set org permissions
 * @param userIntegrations - User's connected integrations for this category
 * @returns The effective access level
 */
export function getEffectiveAccess(
  category: IntegrationCategory,
  orgPermissions: OrgIntegrationPermissions,
  userIntegrations: Array<{ metadata: string | null }>
): AccessLevel {
  // If admin has disabled this category, effective is disabled
  const adminLevel = orgPermissions[category];
  if (adminLevel === 'disabled') {
    return 'disabled';
  }

  // If no integrations connected for this category, effective is none
  if (userIntegrations.length === 0) {
    return 'none';
  }

  // Get the highest user access level among connected integrations
  // (user might have multiple gmail accounts, we take the highest)
  let userLevel: AccessLevel = 'none';
  for (const integration of userIntegrations) {
    const level = getUserAccessLevel(integration);
    if (level === 'read-write') {
      userLevel = 'read-write';
      break; // Can't get higher
    } else if (level === 'read-only' && userLevel === 'none') {
      userLevel = 'read-only';
    }
  }

  // Three-way intersection: min(admin, user)
  return minAccessLevel(adminLevel, userLevel);
}

/**
 * Get all user's connected integrations grouped by category
 *
 * Optimized to use a single database query for both user-specific
 * and org-wide integrations, filtering org-wide in memory.
 */
export async function getUserIntegrationsByCategory(
  userId: string,
  organizationId: string
): Promise<Record<IntegrationCategory, Array<{ id: string; provider: string; metadata: string | null }>>> {
  // Single query: get user's integrations OR org's integrations (for org-wide filtering)
  const allIntegrations = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.status, 'connected'),
        or(
          eq(integrations.userId, userId),
          eq(integrations.organizationId, organizationId)
        )
      )
    );

  // Separate user integrations and filter org-wide integrations
  const userIntegrations: typeof allIntegrations = [];
  const orgWideIntegrations: typeof allIntegrations = [];

  for (const int of allIntegrations) {
    if (int.userId === userId) {
      userIntegrations.push(int);
    } else {
      // Check if it's org-wide
      if (int.metadata) {
        try {
          const meta = JSON.parse(int.metadata);
          if (meta.isOrgWide === true) {
            orgWideIntegrations.push(int);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  // Combine and dedupe by ID
  const all = [...userIntegrations, ...orgWideIntegrations];
  const byCategory: Record<IntegrationCategory, Array<{ id: string; provider: string; metadata: string | null }>> = {
    ats: [],
    email: [],
    calendar: [],
    database: [],
  };

  for (const int of all) {
    const category = providerToCategory(int.provider);
    if (category) {
      // Avoid duplicates
      if (!byCategory[category].some((i) => i.id === int.id)) {
        byCategory[category].push({
          id: int.id,
          provider: int.provider,
          metadata: int.metadata,
        });
      }
    }
  }

  return byCategory;
}

/**
 * Get the effective access for all categories for a user.
 *
 * For organization users: uses three-way intersection (admin + connection + user preference)
 * For individual users: applies individual account restrictions (no ATS, limited database)
 *
 * @param userId - The user ID
 * @param organizationId - The organization ID (null for individual users)
 */
export async function getEffectiveAccessForUser(
  userId: string,
  organizationId: string | null
): Promise<EffectiveAccess> {
  // Individual users have restricted access
  if (!organizationId) {
    return getIndividualEffectiveAccess(userId);
  }

  // Organization users use the three-way intersection model
  const orgPermissions = await getOrgIntegrationPermissions(organizationId);
  const integrationsByCategory = await getUserIntegrationsByCategory(userId, organizationId);

  return {
    ats: getEffectiveAccess('ats', orgPermissions, integrationsByCategory.ats),
    email: getEffectiveAccess('email', orgPermissions, integrationsByCategory.email),
    calendar: getEffectiveAccess('calendar', orgPermissions, integrationsByCategory.calendar),
    database: getEffectiveAccess('database', orgPermissions, integrationsByCategory.database),
  };
}

/**
 * Get effective access for individual (free) accounts.
 *
 * Individual accounts have restricted access:
 * - ATS: always disabled (requires organization)
 * - Email: allowed if connected
 * - Calendar: allowed if connected
 * - Database: only google-sheets allowed (not airtable)
 */
async function getIndividualEffectiveAccess(userId: string): Promise<EffectiveAccess> {
  // Get user's connected integrations
  const userIntegrations = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.userId, userId),
        eq(integrations.status, 'connected')
      )
    );

  // Group by category, but only include allowed providers
  const byCategory: Record<IntegrationCategory, typeof userIntegrations> = {
    ats: [],
    email: [],
    calendar: [],
    database: [],
  };

  for (const int of userIntegrations) {
    const category = providerToCategory(int.provider);
    if (category && isProviderAllowedForIndividual(int.provider)) {
      byCategory[category].push(int);
    }
  }

  // Calculate effective access for individual
  return {
    // ATS is always disabled for individuals
    ats: 'disabled',
    // Email: full access if connected
    email: byCategory.email.length > 0
      ? getHighestUserAccessLevel(byCategory.email)
      : 'none',
    // Calendar: full access if connected
    calendar: byCategory.calendar.length > 0
      ? getHighestUserAccessLevel(byCategory.calendar)
      : 'none',
    // Database: only google-sheets (already filtered above)
    database: byCategory.database.length > 0
      ? getHighestUserAccessLevel(byCategory.database)
      : 'none',
  };
}

/**
 * Get the highest user access level among multiple integrations
 */
function getHighestUserAccessLevel(
  integrations: Array<{ metadata: string | null }>
): AccessLevel {
  let highest: AccessLevel = 'none';

  for (const integration of integrations) {
    const level = getUserAccessLevel(integration);
    if (level === 'read-write') {
      return 'read-write'; // Can't get higher
    }
    if (level === 'read-only' && highest === 'none') {
      highest = 'read-only';
    }
  }

  return highest;
}

/**
 * Check if a specific access level allows reading
 */
export function canRead(level: AccessLevel): boolean {
  return level === 'read-write' || level === 'read-only';
}

/**
 * Check if a specific access level allows writing
 */
export function canWrite(level: AccessLevel): boolean {
  return level === 'read-write';
}

/**
 * Valid access levels for user preference (subset of AccessLevel)
 * Users can only choose read-write or read-only; disabled/none are system-set
 */
export type UserAccessLevel = 'read-write' | 'read-only';

/**
 * Update user's access level for an integration
 *
 * @param integrationId - The integration ID to update
 * @param userId - The user ID (for ownership verification)
 * @param accessLevel - The new access level (must be 'read-write' or 'read-only')
 * @throws Error if integration not found, user doesn't own it, or invalid access level
 */
export async function updateUserAccessLevel(
  integrationId: string,
  userId: string,
  accessLevel: UserAccessLevel
): Promise<void> {
  // Validate access level
  if (accessLevel !== 'read-write' && accessLevel !== 'read-only') {
    log.warn('invalid_access_level_attempt', { integrationId, userId, accessLevel });
    throw new Error('Invalid access level. Must be "read-write" or "read-only"');
  }

  const [integration] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1);

  if (!integration) {
    log.warn('integration_not_found', { integrationId, userId });
    throw new Error('Integration not found');
  }

  // Verify ownership
  if (integration.userId !== userId) {
    log.warn('unauthorized_access_level_change', {
      integrationId,
      requestingUserId: userId,
      ownerUserId: integration.userId,
    });
    throw new Error('Not authorized to modify this integration');
  }

  let metadata: IntegrationMetadata = {};
  if (integration.metadata) {
    try {
      metadata = JSON.parse(integration.metadata);
    } catch {
      metadata = {};
    }
  }

  const previousLevel = metadata.accessLevel || 'read-write';
  metadata.accessLevel = accessLevel;

  // Log the change
  if (previousLevel !== accessLevel) {
    log.info('user_access_level_changed', {
      integrationId,
      userId,
      provider: integration.provider,
      from: previousLevel,
      to: accessLevel,
    });
  }

  await db
    .update(integrations)
    .set({
      metadata: JSON.stringify(metadata),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integrationId));
}

// ============ PAY INTENTION CHECKS ============

/**
 * Check if user has confirmed pay intention for a specific trigger type.
 *
 * Used to gate premium features:
 * - individual_ats: Individual users accessing ATS integrations
 * - premium_integration: Any user accessing premium integrations (non-free providers)
 */
export async function hasPayIntention(
  userId: string,
  triggerType: PayIntentionTrigger
): Promise<boolean> {
  const intention = await db
    .select()
    .from(payIntentions)
    .where(
      and(
        eq(payIntentions.userId, userId),
        eq(payIntentions.triggerType, triggerType),
        eq(payIntentions.status, 'confirmed')
      )
    )
    .limit(1);

  return intention.length > 0;
}

/**
 * Check if user has any confirmed pay intention (quick check via user flag).
 * Uses the denormalized hasConfirmedPayIntention flag on the user record.
 */
export async function hasAnyPayIntention(userId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.hasConfirmedPayIntention ?? false;
}

/**
 * Safely parse integration metadata JSON string.
 * Returns empty object for null, undefined, or invalid JSON.
 */
export function parseIntegrationMetadata(
  metadataString: string | null | undefined
): IntegrationMetadata {
  if (!metadataString) {
    return {};
  }

  try {
    return JSON.parse(metadataString) as IntegrationMetadata;
  } catch {
    return {};
  }
}

/**
 * Type-safe helper to get a specific metadata field.
 */
export function getMetadataField<K extends keyof IntegrationMetadata>(
  metadataString: string | null | undefined,
  field: K
): IntegrationMetadata[K] | undefined {
  const metadata = parseIntegrationMetadata(metadataString);
  return metadata[field];
}
