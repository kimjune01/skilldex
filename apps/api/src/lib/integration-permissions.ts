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
import { organizations, integrations } from '@skillomatic/db/schema';
import { eq, and, or } from 'drizzle-orm';

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
export type IntegrationCategory = 'ats' | 'email' | 'calendar';

/**
 * Org-level integration permissions
 */
export interface OrgIntegrationPermissions {
  ats: AccessLevel;
  email: AccessLevel;
  calendar: AccessLevel;
}

/**
 * User's effective access per category (after three-way intersection)
 */
export interface EffectiveAccess {
  ats: AccessLevel;
  email: AccessLevel;
  calendar: AccessLevel;
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
 * Map provider to category
 */
export function providerToCategory(provider: string): IntegrationCategory | null {
  switch (provider) {
    case 'ats':
    case 'greenhouse':
    case 'lever':
    case 'ashby':
    case 'workable':
      return 'ats';
    case 'email':
    case 'gmail':
    case 'outlook':
      return 'email';
    case 'calendar':
    case 'google-calendar':
    case 'outlook-calendar':
    case 'calendly':
      return 'calendar';
    default:
      return null;
  }
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
 * Get the effective access for all categories for a user
 */
export async function getEffectiveAccessForUser(
  userId: string,
  organizationId: string
): Promise<EffectiveAccess> {
  const orgPermissions = await getOrgIntegrationPermissions(organizationId);
  const integrationsByCategory = await getUserIntegrationsByCategory(userId, organizationId);

  return {
    ats: getEffectiveAccess('ats', orgPermissions, integrationsByCategory.ats),
    email: getEffectiveAccess('email', orgPermissions, integrationsByCategory.email),
    calendar: getEffectiveAccess('calendar', orgPermissions, integrationsByCategory.calendar),
  };
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
    throw new Error('Invalid access level. Must be "read-write" or "read-only"');
  }

  const [integration] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1);

  if (!integration) {
    throw new Error('Integration not found');
  }

  // Verify ownership
  if (integration.userId !== userId) {
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

  metadata.accessLevel = accessLevel;

  await db
    .update(integrations)
    .set({
      metadata: JSON.stringify(metadata),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integrationId));
}
