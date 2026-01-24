/**
 * End-to-End Test: Dynamic Tools Flow
 *
 * This test verifies that:
 * 1. User integrations are correctly identified
 * 2. Organization permissions are respected
 * 3. Effective access is calculated correctly
 * 4. Provider manifests are loaded and filtered
 * 5. Tools are generated with correct access levels
 * 6. The proxy would route correctly (mocked)
 *
 * This test uses mocked data to simulate the full flow without requiring
 * a running database or API server.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateToolsFromManifest,
  getToolSummary,
} from '../generator.js';
import { filterOperationsByAccess } from '../types.js';
import { getManifest, isProviderSupported } from '../manifests/index.js';
import type { AccessLevel } from '../permissions.js';

// ============ Mock Data Structures ============

interface MockUser {
  id: string;
  email: string;
  organizationId: string;
  isAdmin: boolean;
}

interface MockOrganization {
  id: string;
  name: string;
  integrationPermissions: {
    ats: AccessLevel;
    email: AccessLevel;
    calendar: AccessLevel;
  } | null;
  disabledSkills: string[] | null;
}

interface MockIntegration {
  id: string;
  userId: string;
  organizationId: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  metadata: {
    subProvider?: string;
    accessLevel?: AccessLevel;
    zohoRegion?: string;
  } | null;
}

// ============ Mock Permission Logic ============

function getEffectiveAccess(
  category: 'ats' | 'email' | 'calendar',
  orgPermissions: MockOrganization['integrationPermissions'],
  userIntegrations: MockIntegration[]
): AccessLevel {
  // If admin has disabled this category
  const adminLevel = orgPermissions?.[category] ?? 'read-write';
  if (adminLevel === 'disabled') {
    return 'disabled';
  }

  // If no integrations connected
  const categoryIntegrations = userIntegrations.filter((i) => {
    if (category === 'ats') {
      return ['ats', 'greenhouse', 'zoho-recruit', 'lever'].includes(i.provider);
    }
    if (category === 'email') {
      return ['email', 'gmail', 'outlook'].includes(i.provider);
    }
    if (category === 'calendar') {
      return ['calendar', 'google-calendar'].includes(i.provider);
    }
    return i.provider === category;
  });

  if (categoryIntegrations.length === 0 || !categoryIntegrations.some((i) => i.status === 'connected')) {
    return 'none';
  }

  // Get user's chosen access level (highest among connected integrations)
  let userLevel: AccessLevel = 'none';
  for (const integration of categoryIntegrations) {
    if (integration.status !== 'connected') continue;
    const level = integration.metadata?.accessLevel ?? 'read-write';
    if (level === 'read-write') {
      userLevel = 'read-write';
      break;
    } else if (level === 'read-only' && userLevel === 'none') {
      userLevel = 'read-only';
    }
  }

  // Three-way intersection: min(admin, user)
  const order: AccessLevel[] = ['none', 'disabled', 'read-only', 'read-write'];
  const adminIdx = order.indexOf(adminLevel);
  const userIdx = order.indexOf(userLevel);
  return order[Math.min(adminIdx, userIdx)];
}

function buildCapabilityProfile(
  user: MockUser,
  org: MockOrganization,
  integrations: MockIntegration[]
) {
  const userIntegrations = integrations.filter(
    (i) => i.userId === user.id || i.organizationId === user.organizationId
  );

  const atsIntegration = userIntegrations.find(
    (i) => ['ats', 'greenhouse', 'zoho-recruit', 'lever'].includes(i.provider) && i.status === 'connected'
  );

  return {
    hasATS: !!atsIntegration,
    atsProvider: atsIntegration?.metadata?.subProvider || atsIntegration?.provider || undefined,
    hasEmail: userIntegrations.some((i) => ['email', 'gmail', 'outlook'].includes(i.provider) && i.status === 'connected'),
    hasCalendar: userIntegrations.some((i) => ['calendar', 'google-calendar'].includes(i.provider) && i.status === 'connected'),
    effectiveAccess: {
      ats: getEffectiveAccess('ats', org.integrationPermissions, userIntegrations),
      email: getEffectiveAccess('email', org.integrationPermissions, userIntegrations),
      calendar: getEffectiveAccess('calendar', org.integrationPermissions, userIntegrations),
    },
  };
}

// ============ Test Scenarios ============

describe('E2E: Dynamic Tools Flow', () => {
  describe('Scenario 1: Full access Greenhouse user', () => {
    const user: MockUser = {
      id: 'user-1',
      email: 'recruiter@acme.com',
      organizationId: 'org-acme',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-acme',
      name: 'Acme Corp',
      integrationPermissions: null, // No restrictions
      disabledSkills: null,
    };

    const integrations: MockIntegration[] = [
      {
        id: 'int-1',
        userId: 'user-1',
        organizationId: 'org-acme',
        provider: 'ats',
        status: 'connected',
        metadata: {
          subProvider: 'greenhouse',
          accessLevel: 'read-write',
        },
      },
    ];

    it('builds correct capability profile', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.hasATS).toBe(true);
      expect(profile.atsProvider).toBe('greenhouse');
      expect(profile.effectiveAccess.ats).toBe('read-write');
    });

    it('loads Greenhouse manifest', () => {
      expect(isProviderSupported('greenhouse')).toBe(true);

      const manifest = getManifest('greenhouse');
      expect(manifest).toBeDefined();
      expect(manifest?.provider).toBe('greenhouse');
      expect(manifest?.operations.length).toBeGreaterThan(20);
    });

    it('generates full tool set for read-write access', () => {
      const manifest = getManifest('greenhouse')!;
      const profile = buildCapabilityProfile(user, org, integrations);

      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);

      // Should have read + write tools, but not dangerous
      expect(tools.length).toBeGreaterThan(15);

      // Check tool naming
      expect(tools.some((t) => t.name === 'greenhouse_list_candidates')).toBe(true);
      expect(tools.some((t) => t.name === 'greenhouse_create_candidate')).toBe(true);
      expect(tools.some((t) => t.name === 'greenhouse_advance_application')).toBe(true);

      // Dangerous tools should NOT be included
      expect(tools.some((t) => t.name === 'greenhouse_delete_candidate')).toBe(false);
      expect(tools.some((t) => t.name === 'greenhouse_anonymize_candidate')).toBe(false);
    });

    it('generates correct metadata for proxy routing', () => {
      const manifest = getManifest('greenhouse')!;
      const profile = buildCapabilityProfile(user, org, integrations);
      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);

      const advanceTool = tools.find((t) => t.name === 'greenhouse_advance_application');
      expect(advanceTool).toBeDefined();
      expect(advanceTool?.meta).toEqual({
        provider: 'greenhouse',
        method: 'POST',
        path: '/applications/{id}/advance',
        category: 'ats',
        requiresOnBehalfOf: true,
        wrapInData: undefined,
      });
    });
  });

  describe('Scenario 2: Read-only Zoho user (org restricted)', () => {
    const user: MockUser = {
      id: 'user-2',
      email: 'viewer@bigcorp.com',
      organizationId: 'org-bigcorp',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-bigcorp',
      name: 'BigCorp',
      integrationPermissions: {
        ats: 'read-only', // Admin restricted to read-only
        email: 'disabled',
        calendar: 'read-write',
      },
      disabledSkills: ['bulk-email', 'candidate-delete'],
    };

    const integrations: MockIntegration[] = [
      {
        id: 'int-2',
        userId: 'user-2',
        organizationId: 'org-bigcorp',
        provider: 'ats',
        status: 'connected',
        metadata: {
          subProvider: 'zoho-recruit',
          accessLevel: 'read-write', // User wants read-write, but org says read-only
          zohoRegion: 'us',
        },
      },
    ];

    it('effective access is read-only (org overrides user)', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.hasATS).toBe(true);
      expect(profile.atsProvider).toBe('zoho-recruit');
      expect(profile.effectiveAccess.ats).toBe('read-only'); // Org restriction wins
      expect(profile.effectiveAccess.email).toBe('disabled');
    });

    it('generates only read tools for Zoho', () => {
      const manifest = getManifest('zoho-recruit')!;
      const profile = buildCapabilityProfile(user, org, integrations);

      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);

      // Should only have read operations
      const summary = getToolSummary(manifest, profile.effectiveAccess.ats);
      expect(summary.write).toBe(0);
      expect(summary.read).toBeGreaterThan(0);

      // Check specific tools
      expect(tools.some((t) => t.name === 'zoho_recruit_list_candidates')).toBe(true);
      expect(tools.some((t) => t.name === 'zoho_recruit_search_candidates')).toBe(true);
      expect(tools.some((t) => t.name === 'zoho_recruit_coql_query')).toBe(true);

      // Write tools should NOT be present
      expect(tools.some((t) => t.name === 'zoho_recruit_create_candidate')).toBe(false);
      expect(tools.some((t) => t.name === 'zoho_recruit_update_candidate')).toBe(false);
    });
  });

  describe('Scenario 3: No ATS connected', () => {
    const user: MockUser = {
      id: 'user-3',
      email: 'newuser@startup.io',
      organizationId: 'org-startup',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-startup',
      name: 'Startup Inc',
      integrationPermissions: null,
      disabledSkills: null,
    };

    const integrations: MockIntegration[] = [
      // Only email connected, no ATS
      {
        id: 'int-3',
        userId: 'user-3',
        organizationId: 'org-startup',
        provider: 'gmail',
        status: 'connected',
        metadata: null,
      },
    ];

    it('effective ATS access is none', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.hasATS).toBe(false);
      expect(profile.atsProvider).toBeUndefined();
      expect(profile.effectiveAccess.ats).toBe('none');
      expect(profile.effectiveAccess.email).toBe('read-write');
    });

    it('generates no ATS tools', () => {
      const manifest = getManifest('greenhouse')!;
      const profile = buildCapabilityProfile(user, org, integrations);

      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);

      expect(tools.length).toBe(0);
    });
  });

  describe('Scenario 4: ATS disabled by admin', () => {
    const user: MockUser = {
      id: 'user-4',
      email: 'contractor@agency.com',
      organizationId: 'org-agency',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-agency',
      name: 'Agency LLC',
      integrationPermissions: {
        ats: 'disabled', // Admin completely disabled ATS
        email: 'read-write',
        calendar: 'read-write',
      },
      disabledSkills: null,
    };

    const integrations: MockIntegration[] = [
      {
        id: 'int-4',
        userId: 'user-4',
        organizationId: 'org-agency',
        provider: 'ats',
        status: 'connected',
        metadata: {
          subProvider: 'greenhouse',
          accessLevel: 'read-write',
        },
      },
    ];

    it('effective ATS access is disabled even with connected integration', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.hasATS).toBe(true); // Integration exists
      expect(profile.effectiveAccess.ats).toBe('disabled'); // But disabled by admin
    });

    it('generates no tools when disabled', () => {
      const manifest = getManifest('greenhouse')!;
      const profile = buildCapabilityProfile(user, org, integrations);

      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);

      expect(tools.length).toBe(0);
    });
  });

  describe('Scenario 5: User self-restricts to read-only', () => {
    const user: MockUser = {
      id: 'user-5',
      email: 'cautious@careful.com',
      organizationId: 'org-careful',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-careful',
      name: 'Careful Corp',
      integrationPermissions: null, // No org restrictions
      disabledSkills: null,
    };

    const integrations: MockIntegration[] = [
      {
        id: 'int-5',
        userId: 'user-5',
        organizationId: 'org-careful',
        provider: 'ats',
        status: 'connected',
        metadata: {
          subProvider: 'greenhouse',
          accessLevel: 'read-only', // User chose read-only
        },
      },
    ];

    it('effective access respects user choice', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.effectiveAccess.ats).toBe('read-only');
    });

    it('generates only read tools', () => {
      const manifest = getManifest('greenhouse')!;
      const profile = buildCapabilityProfile(user, org, integrations);

      const tools = generateToolsFromManifest(manifest, profile.effectiveAccess.ats);
      const summary = getToolSummary(manifest, profile.effectiveAccess.ats);

      expect(summary.write).toBe(0);
      expect(tools.every((t) => t.meta.method === 'GET')).toBe(true);
    });
  });

  describe('Scenario 6: Unsupported provider fallback', () => {
    const user: MockUser = {
      id: 'user-6',
      email: 'fancy@enterprise.com',
      organizationId: 'org-enterprise',
      isAdmin: false,
    };

    const org: MockOrganization = {
      id: 'org-enterprise',
      name: 'Enterprise Inc',
      integrationPermissions: null,
      disabledSkills: null,
    };

    const integrations: MockIntegration[] = [
      {
        id: 'int-6',
        userId: 'user-6',
        organizationId: 'org-enterprise',
        provider: 'ats',
        status: 'connected',
        metadata: {
          subProvider: 'workday', // Not supported yet
          accessLevel: 'read-write',
        },
      },
    ];

    it('profile shows ATS connected but provider not supported', () => {
      const profile = buildCapabilityProfile(user, org, integrations);

      expect(profile.hasATS).toBe(true);
      expect(profile.atsProvider).toBe('workday');
      expect(isProviderSupported('workday')).toBe(false);
    });

    it('getManifest returns undefined for unsupported provider', () => {
      const manifest = getManifest('workday');
      expect(manifest).toBeUndefined();
    });
  });
});

describe('E2E: Tool Generation Details', () => {
  describe('Greenhouse manifest completeness', () => {
    const manifest = getManifest('greenhouse')!;

    it('has all expected candidate operations', () => {
      const ops = manifest.operations.map((o) => o.id);

      expect(ops).toContain('list_candidates');
      expect(ops).toContain('get_candidate');
      expect(ops).toContain('create_candidate');
      expect(ops).toContain('update_candidate');
      expect(ops).toContain('add_candidate_note');
    });

    it('has all expected application operations', () => {
      const ops = manifest.operations.map((o) => o.id);

      expect(ops).toContain('list_applications');
      expect(ops).toContain('get_application');
      expect(ops).toContain('create_application');
      expect(ops).toContain('advance_application');
      expect(ops).toContain('move_application');
      expect(ops).toContain('reject_application');
      expect(ops).toContain('hire_application');
    });

    it('has dangerous operations marked correctly', () => {
      const dangerous = manifest.operations.filter((o) => o.access === 'dangerous');

      expect(dangerous.length).toBeGreaterThan(0);
      expect(dangerous.some((o) => o.id === 'delete_candidate')).toBe(true);
      expect(dangerous.some((o) => o.id === 'anonymize_candidate')).toBe(true);
    });

    it('has correct auth configuration', () => {
      expect(manifest.auth.type).toBe('basic');
      expect(manifest.baseUrl).toBe('https://harvest.greenhouse.io/v1');
    });
  });

  describe('Zoho Recruit manifest completeness', () => {
    const manifest = getManifest('zoho-recruit')!;

    it('has all expected candidate operations', () => {
      const ops = manifest.operations.map((o) => o.id);

      expect(ops).toContain('list_candidates');
      expect(ops).toContain('search_candidates');
      expect(ops).toContain('get_candidate');
      expect(ops).toContain('create_candidate');
      expect(ops).toContain('update_candidate');
    });

    it('has COQL query operation', () => {
      const coql = manifest.operations.find((o) => o.id === 'coql_query');

      expect(coql).toBeDefined();
      expect(coql?.access).toBe('read');
      expect(coql?.method).toBe('POST'); // COQL uses POST but is read-only
    });

    it('has regional support', () => {
      expect(manifest.regions).toBeDefined();
      expect(manifest.regions?.us).toBeDefined();
      expect(manifest.regions?.eu).toBeDefined();
      expect(manifest.regions?.eu.baseUrl).toBe('https://recruit.zoho.eu/recruit/v2');
    });

    it('has correct auth configuration', () => {
      expect(manifest.auth.type).toBe('bearer');
    });
  });

  describe('Tool schema generation', () => {
    it('generates required params correctly', () => {
      const manifest = getManifest('greenhouse')!;
      const tools = generateToolsFromManifest(manifest, 'read-write');

      const getTool = tools.find((t) => t.name === 'greenhouse_get_candidate');
      expect(getTool).toBeDefined();

      // id should be required
      const idSchema = getTool?.inputSchema.id;
      expect(idSchema).toBeDefined();
      // Zod schema - check it's not optional
      expect(idSchema?.isOptional?.()).toBeFalsy();
    });

    it('generates optional params correctly', () => {
      const manifest = getManifest('greenhouse')!;
      const tools = generateToolsFromManifest(manifest, 'read-write');

      const listTool = tools.find((t) => t.name === 'greenhouse_list_candidates');
      expect(listTool).toBeDefined();

      // per_page should be optional with default
      const perPageSchema = listTool?.inputSchema.per_page;
      expect(perPageSchema).toBeDefined();
    });

    it('generates body params for write operations', () => {
      const manifest = getManifest('greenhouse')!;
      const tools = generateToolsFromManifest(manifest, 'read-write');

      const createTool = tools.find((t) => t.name === 'greenhouse_create_candidate');
      expect(createTool).toBeDefined();

      // Should have body params like first_name, last_name
      expect(createTool?.inputSchema.first_name).toBeDefined();
      expect(createTool?.inputSchema.last_name).toBeDefined();
    });
  });
});

describe('E2E: Access Level Filtering Edge Cases', () => {
  it('handles empty operations array', () => {
    const ops = filterOperationsByAccess([], 'read-write');
    expect(ops).toEqual([]);
  });

  it('handles all dangerous operations', () => {
    const allDangerous = [
      { id: 'op1', method: 'DELETE' as const, path: '/x', access: 'dangerous' as const, description: '' },
      { id: 'op2', method: 'DELETE' as const, path: '/y', access: 'dangerous' as const, description: '' },
    ];

    const result = filterOperationsByAccess(allDangerous, 'read-write');
    expect(result.length).toBe(0);
  });

  it('includes delete operations for read-write (delete != dangerous)', () => {
    const withDelete = [
      { id: 'delete_item', method: 'DELETE' as const, path: '/items/{id}', access: 'delete' as const, description: '' },
    ];

    const result = filterOperationsByAccess(withDelete, 'read-write');
    expect(result.length).toBe(1);
  });

  it('excludes delete operations for read-only', () => {
    const withDelete = [
      { id: 'delete_item', method: 'DELETE' as const, path: '/items/{id}', access: 'delete' as const, description: '' },
    ];

    const result = filterOperationsByAccess(withDelete, 'read-only');
    expect(result.length).toBe(0);
  });
});

describe('E2E: Mock ATS Provider', () => {
  it('loads mock-ats manifest', () => {
    const manifest = getManifest('mock-ats');
    expect(manifest).toBeDefined();
    expect(manifest!.provider).toBe('mock-ats');
    expect(manifest!.displayName).toBe('Mock ATS');
  });

  it('has expected operations', () => {
    const manifest = getManifest('mock-ats')!;

    // Should have candidate, job, and application operations
    expect(manifest.operations.some(op => op.id === 'list_candidates')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'get_candidate')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'create_candidate')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'update_candidate')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'list_jobs')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'list_applications')).toBe(true);
    expect(manifest.operations.some(op => op.id === 'advance_application')).toBe(true);
  });

  it('generates tools for read-write access', () => {
    const manifest = getManifest('mock-ats')!;
    const tools = generateToolsFromManifest(manifest, 'read-write');

    expect(tools.length).toBe(14); // All 14 operations (8 read + 6 write, including delete_candidate)
    expect(tools.some(t => t.name === 'mock_ats_list_candidates')).toBe(true);
    expect(tools.some(t => t.name === 'mock_ats_create_candidate')).toBe(true);
  });

  it('generates only read tools for read-only access', () => {
    const manifest = getManifest('mock-ats')!;
    const tools = generateToolsFromManifest(manifest, 'read-only');

    // Should only have read operations (8 of them)
    expect(tools.length).toBe(8);

    // Should not include any write operations
    expect(tools.some(t => t.name === 'mock_ats_create_candidate')).toBe(false);
    expect(tools.some(t => t.name === 'mock_ats_update_candidate')).toBe(false);
    expect(tools.some(t => t.name === 'mock_ats_advance_application')).toBe(false);

    // Should include read operations
    expect(tools.some(t => t.name === 'mock_ats_list_candidates')).toBe(true);
    expect(tools.some(t => t.name === 'mock_ats_list_jobs')).toBe(true);
  });
});
