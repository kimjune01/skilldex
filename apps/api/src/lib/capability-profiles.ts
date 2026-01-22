/**
 * @deprecated This module has been replaced by integration-permissions.ts
 * @see integration-permissions.ts for the new three-way intersection model
 */

// Re-export from new location for backwards compatibility
export {
  getEffectiveAccessForUser,
  getUserIntegrationsByCategory,
  getOrgIntegrationPermissions,
  getOrgDisabledSkills,
  canRead,
  canWrite,
  type AccessLevel,
  type EffectiveAccess,
  type IntegrationCategory,
} from './integration-permissions.js';

// Legacy types - kept for migration
export interface EffectiveCapabilityProfile {
  id: string;
  name: string;
  organizationId: string;
  allowedIntegrations: string[] | null;
  allowedSkills: string[] | null;
  canSendEmail: boolean;
  canAccessAts: boolean;
  canUseWebChat: boolean;
  canUseMcp: boolean;
  source: 'user' | 'role' | 'org-default';
}

export interface AvailableIntegrations {
  providers: string[];
  perUser: Array<{ provider: string; integrationId: string }>;
  orgWide: Array<{ provider: string; integrationId: string }>;
}

// Stub functions - these are no longer needed but kept to prevent import errors
export async function getEffectiveCapabilityProfile(
  _userId: string
): Promise<null> {
  console.warn('getEffectiveCapabilityProfile is deprecated. Use getEffectiveAccessForUser instead.');
  return null;
}

export async function getAvailableIntegrations(
  userId: string,
  organizationId: string
): Promise<AvailableIntegrations> {
  const { getUserIntegrationsByCategory } = await import('./integration-permissions.js');
  const byCategory = await getUserIntegrationsByCategory(userId, organizationId);

  const allIntegrations = [
    ...byCategory.ats,
    ...byCategory.email,
    ...byCategory.calendar,
  ];

  return {
    providers: allIntegrations.map(i => i.provider),
    perUser: allIntegrations.map(i => ({ provider: i.provider, integrationId: i.id })),
    orgWide: [],
  };
}

export function filterIntegrationsByProfile(
  available: AvailableIntegrations,
  _profile: EffectiveCapabilityProfile | null
): string[] {
  console.warn('filterIntegrationsByProfile is deprecated. Use getEffectiveAccessForUser instead.');
  return available.providers;
}

export async function getIntegrationForProvider(
  userId: string,
  organizationId: string,
  provider: string
): Promise<{ integrationId: string; isOrgWide: boolean } | null> {
  const { getUserIntegrationsByCategory, providerToCategory } = await import('./integration-permissions.js');
  const byCategory = await getUserIntegrationsByCategory(userId, organizationId);
  const category = providerToCategory(provider);

  if (!category) return null;

  const integration = byCategory[category].find(i => i.provider === provider);
  if (!integration) return null;

  return { integrationId: integration.id, isOrgWide: false };
}
