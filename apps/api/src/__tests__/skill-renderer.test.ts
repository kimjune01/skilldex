/**
 * Skill Renderer Tests
 *
 * Tests for buildCapabilityProfile and related functions.
 * These test the critical path of building user capability profiles
 * which determines what tools and credentials users have access to.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkCapabilityRequirements,
  renderSkillInstructions,
  buildConfigSkill,
  type CapabilityProfile,
} from '../lib/skill-renderer.js';
import type { EffectiveAccess } from '../lib/integration-permissions.js';

// ============ PURE FUNCTION TESTS (no mocking needed) ============

describe('checkCapabilityRequirements', () => {
  const baseProfile: CapabilityProfile & { effectiveAccess: EffectiveAccess } = {
    skillomaticApiUrl: 'http://localhost:3000',
    effectiveAccess: {
      ats: 'read-write',
      email: 'read-write',
      calendar: 'read-write',
      database: 'read-write', docs: 'read-write',
    },
  };

  describe('ATS requirements', () => {
    it('satisfies ATS requirement when connected with read-write access', () => {
      const profile = {
        ...baseProfile,
        ats: { provider: 'greenhouse', token: 'token', baseUrl: 'https://api.greenhouse.io' },
      };

      const result = checkCapabilityRequirements(['ats'], profile);
      expect(result.satisfied).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('fails ATS requirement when not connected', () => {
      const result = checkCapabilityRequirements(['ats'], baseProfile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('ATS (Greenhouse, Lever, etc.)');
    });

    it('fails ATS requirement when disabled by admin', () => {
      const profile = {
        ...baseProfile,
        effectiveAccess: { ...baseProfile.effectiveAccess, ats: 'disabled' as const },
      };

      const result = checkCapabilityRequirements(['ats'], profile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('ATS access (disabled by admin)');
    });

    it('satisfies ATS requirement with read-only access', () => {
      const profile = {
        ...baseProfile,
        ats: { provider: 'greenhouse', token: 'token', baseUrl: 'https://api.greenhouse.io' },
        effectiveAccess: { ...baseProfile.effectiveAccess, ats: 'read-only' as const },
      };

      const result = checkCapabilityRequirements(['ats'], profile);
      expect(result.satisfied).toBe(true);
    });
  });

  describe('Email requirements', () => {
    it('satisfies email-read when connected', () => {
      const profile = {
        ...baseProfile,
        email: { provider: 'gmail' as const, token: 'token' },
      };

      const result = checkCapabilityRequirements(['email-read'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('satisfies email-send when connected with read-write', () => {
      const profile = {
        ...baseProfile,
        email: { provider: 'gmail' as const, token: 'token' },
      };

      const result = checkCapabilityRequirements(['email-send'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('fails email-send with read-only access', () => {
      const profile = {
        ...baseProfile,
        email: { provider: 'gmail' as const, token: 'token' },
        effectiveAccess: { ...baseProfile.effectiveAccess, email: 'read-only' as const },
      };

      const result = checkCapabilityRequirements(['email-send'], profile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('Email write access (you have read-only)');
    });

    it('fails email requirement when disabled by admin', () => {
      const profile = {
        ...baseProfile,
        effectiveAccess: { ...baseProfile.effectiveAccess, email: 'disabled' as const },
      };

      const result = checkCapabilityRequirements(['email-read'], profile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('Email access (disabled by admin)');
    });
  });

  describe('Calendar requirements', () => {
    it('satisfies calendar requirement with iCal', () => {
      const profile = {
        ...baseProfile,
        calendar: {
          ical: { url: 'https://calendar.google.com/ical', provider: 'google' as const },
        },
      };

      const result = checkCapabilityRequirements(['calendar'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('satisfies calendar requirement with Calendly', () => {
      const profile = {
        ...baseProfile,
        calendar: {
          calendly: { token: 'token', userUri: 'uri', schedulingUrl: 'url' },
        },
      };

      const result = checkCapabilityRequirements(['calendar'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('satisfies calendly requirement specifically', () => {
      const profile = {
        ...baseProfile,
        calendar: {
          calendly: { token: 'token', userUri: 'uri', schedulingUrl: 'url' },
        },
      };

      const result = checkCapabilityRequirements(['calendly'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('fails calendly requirement with only iCal', () => {
      const profile = {
        ...baseProfile,
        calendar: {
          ical: { url: 'https://calendar.google.com/ical', provider: 'google' as const },
        },
      };

      const result = checkCapabilityRequirements(['calendly'], profile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('Calendly');
    });
  });

  describe('LLM requirements', () => {
    it('satisfies LLM requirement when configured', () => {
      const profile = {
        ...baseProfile,
        llm: { provider: 'anthropic' as const, apiKey: 'key', model: 'claude-sonnet-4-20250514' },
      };

      const result = checkCapabilityRequirements(['llm'], profile);
      expect(result.satisfied).toBe(true);
    });

    it('fails LLM requirement when not configured', () => {
      const result = checkCapabilityRequirements(['llm'], baseProfile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('LLM API Key');
    });
  });

  describe('Multiple requirements', () => {
    it('checks all requirements', () => {
      const profile = {
        ...baseProfile,
        ats: { provider: 'greenhouse', token: 'token', baseUrl: 'https://api.greenhouse.io' },
        // No email, no llm
      };

      const result = checkCapabilityRequirements(['ats', 'email-read', 'llm'], profile);
      expect(result.satisfied).toBe(false);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain('Email (Gmail or Outlook)');
      expect(result.missing).toContain('LLM API Key');
    });

    it('returns satisfied when all requirements met', () => {
      const profile = {
        ...baseProfile,
        ats: { provider: 'greenhouse', token: 'token', baseUrl: 'https://api.greenhouse.io' },
        email: { provider: 'gmail' as const, token: 'token' },
        llm: { provider: 'anthropic' as const, apiKey: 'key', model: 'claude-sonnet-4-20250514' },
      };

      const result = checkCapabilityRequirements(['ats', 'email-read', 'llm'], profile);
      expect(result.satisfied).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });
});

describe('renderSkillInstructions', () => {
  it('replaces all template variables', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
      skillomaticApiKey: 'sk_test_123',
      llm: { provider: 'anthropic', apiKey: 'sk-ant-xxx', model: 'claude-sonnet-4-20250514' },
      ats: { provider: 'greenhouse', token: 'ats-token', baseUrl: 'https://harvest.greenhouse.io/v1' },
    };

    const instructions = `
      API URL: {{SKILLOMATIC_API_URL}}
      API Key: {{SKILLOMATIC_API_KEY}}
      LLM Provider: {{LLM_PROVIDER}}
      LLM Model: {{LLM_MODEL}}
      ATS Token: {{ATS_TOKEN}}
      ATS Provider: {{ATS_PROVIDER}}
    `;

    const rendered = renderSkillInstructions(instructions, profile);

    expect(rendered).toContain('API URL: http://localhost:3000');
    expect(rendered).toContain('API Key: sk_test_123');
    expect(rendered).toContain('LLM Provider: anthropic');
    expect(rendered).toContain('LLM Model: claude-sonnet-4-20250514');
    expect(rendered).toContain('ATS Token: ats-token');
    expect(rendered).toContain('ATS Provider: greenhouse');
  });

  it('uses placeholder values for missing config', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
    };

    const instructions = '{{ATS_TOKEN}} {{EMAIL_ACCESS_TOKEN}}';
    const rendered = renderSkillInstructions(instructions, profile);

    expect(rendered).toContain('[ATS_NOT_CONNECTED]');
    expect(rendered).toContain('[EMAIL_NOT_CONNECTED]');
  });

  it('renders Calendly variables', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
      calendar: {
        calendly: {
          token: 'calendly-token',
          userUri: 'https://api.calendly.com/users/123',
          schedulingUrl: 'https://calendly.com/user/30min',
        },
      },
    };

    const instructions = `
      Token: {{CALENDLY_ACCESS_TOKEN}}
      User: {{CALENDLY_USER_URI}}
      Schedule: {{CALENDLY_SCHEDULING_URL}}
    `;

    const rendered = renderSkillInstructions(instructions, profile);

    expect(rendered).toContain('Token: calendly-token');
    expect(rendered).toContain('User: https://api.calendly.com/users/123');
    expect(rendered).toContain('Schedule: https://calendly.com/user/30min');
  });
});

describe('buildConfigSkill', () => {
  it('builds config with all sections', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
      skillomaticApiKey: 'sk_test_123',
      llm: { provider: 'anthropic', apiKey: 'sk-ant-xxx', model: 'claude-sonnet-4-20250514' },
      ats: { provider: 'greenhouse', token: 'ats-token', baseUrl: 'https://harvest.greenhouse.io/v1' },
      calendar: {
        calendly: { token: 'cal-token', userUri: 'uri', schedulingUrl: 'url' },
      },
      email: { provider: 'gmail', token: 'email-token' },
    };

    const config = buildConfigSkill(profile);

    expect(config).toContain('## LLM Configuration');
    expect(config).toContain('Provider: anthropic');
    expect(config).toContain('## ATS Configuration');
    expect(config).toContain('Provider: greenhouse');
    expect(config).toContain('## Calendar Configuration');
    expect(config).toContain('Calendly Token: cal-token');
    expect(config).toContain('## Email Configuration');
    expect(config).toContain('Provider: gmail');
  });

  it('shows not configured for missing integrations', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
    };

    const config = buildConfigSkill(profile);

    expect(config).toContain('LLM Configuration');
    expect(config).toContain('Status: Not configured');
    expect(config).toContain('ATS Configuration');
    expect(config).toContain('Status: Not connected');
  });

  it('includes frontmatter', () => {
    const profile: CapabilityProfile = {
      skillomaticApiUrl: 'http://localhost:3000',
    };

    const config = buildConfigSkill(profile);

    expect(config).toContain('---');
    expect(config).toContain('name: _config');
    expect(config).toContain('intent: System configuration');
  });
});

// ============ buildCapabilityProfile TESTS (require mocking) ============

// Mock the db module
vi.mock('@skillomatic/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

// Mock the nango module
vi.mock('../lib/nango.js', () => ({
  getNangoClient: vi.fn(() => ({
    getToken: vi.fn(() => Promise.resolve({ access_token: 'mock-token', raw: {} })),
  })),
  PROVIDER_CONFIG_KEYS: {
    calendly: 'calendly',
    gmail: 'google-mail',
    greenhouse: 'greenhouse',
  },
}));

// Mock the integration-permissions module
vi.mock('../lib/integration-permissions.js', () => ({
  getEffectiveAccessForUser: vi.fn(() =>
    Promise.resolve({
      ats: 'read-write',
      email: 'read-write',
      calendar: 'read-write',
      database: 'read-write',
      docs: 'read-write',
    })
  ),
  getUserIntegrationsByCategory: vi.fn(() =>
    Promise.resolve({
      ats: [],
      email: [],
      calendar: [],
      database: [],
      docs: [],
    })
  ),
  canRead: vi.fn((level: string) => level === 'read-write' || level === 'read-only'),
  canWrite: vi.fn((level: string) => level === 'read-write'),
  PERMISSION_CATEGORIES: ['ats', 'email', 'calendar', 'database', 'docs'],
}));

describe('buildCapabilityProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns minimal profile when user not found', async () => {
    const { buildCapabilityProfile } = await import('../lib/skill-renderer.js');
    const { db } = await import('@skillomatic/db');

    // Mock user not found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const profile = await buildCapabilityProfile('nonexistent-user');

    expect(profile.skillomaticApiUrl).toBeDefined();
    expect(profile.effectiveAccess).toBeNull();
    expect(profile.ats).toBeUndefined();
    expect(profile.email).toBeUndefined();
    expect(profile.calendar).toBeUndefined();
  });

  it('returns minimal profile when user has no organization', async () => {
    const { buildCapabilityProfile } = await import('../lib/skill-renderer.js');
    const { db } = await import('@skillomatic/db');

    // Mock user without org
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-1', organizationId: null }]),
        }),
      }),
    } as any);

    const profile = await buildCapabilityProfile('user-1');

    expect(profile.effectiveAccess).toBeNull();
  });

  it('includes API key when user has one', async () => {
    const { buildCapabilityProfile } = await import('../lib/skill-renderer.js');
    const { db } = await import('@skillomatic/db');

    let callCount = 0;
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // User query
              return Promise.resolve([{ id: 'user-1', organizationId: 'org-1' }]);
            } else if (callCount === 2) {
              // API key query
              return Promise.resolve([{ key: 'sk_test_user_key' }]);
            }
            return Promise.resolve([]);
          }),
        }),
      }),
    } as any);

    const profile = await buildCapabilityProfile('user-1');

    expect(profile.skillomaticApiKey).toBe('sk_test_user_key');
  });

  it('uses subProvider for Nango config key lookup', async () => {
    // This tests the specific bug fix: using metadata.subProvider (e.g., 'calendly')
    // instead of integration.provider (e.g., 'calendar') when fetching tokens
    const { buildCapabilityProfile } = await import('../lib/skill-renderer.js');
    const { db } = await import('@skillomatic/db');
    const { getNangoClient } = await import('../lib/nango.js');
    const { getUserIntegrationsByCategory } = await import('../lib/integration-permissions.js');

    // Mock user with org
    let queryCount = 0;
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            queryCount++;
            if (queryCount === 1) {
              return Promise.resolve([{ id: 'user-1', organizationId: 'org-1' }]);
            } else if (queryCount === 2) {
              return Promise.resolve([]); // No API key
            } else if (queryCount === 3) {
              return Promise.resolve([]); // No org LLM config
            } else if (queryCount === 4) {
              return Promise.resolve([]); // No system settings
            } else if (queryCount === 5) {
              // Integration record with subProvider
              return Promise.resolve([{
                id: 'int-1',
                provider: 'calendar', // Generic provider
                nangoConnectionId: 'nango-123',
                metadata: JSON.stringify({ subProvider: 'calendly', accessLevel: 'read-write' }),
              }]);
            }
            return Promise.resolve([]);
          }),
        }),
      }),
    } as any);

    // Mock calendar integration in category list
    vi.mocked(getUserIntegrationsByCategory).mockResolvedValue({
      ats: [],
      email: [],
      calendar: [{ id: 'int-1', provider: 'calendar', metadata: null }],
      database: [],
      docs: [],
    });

    const mockGetToken = vi.fn().mockResolvedValue({
      access_token: 'calendly-token',
      raw: { user_uri: 'https://api.calendly.com/users/123', scheduling_url: 'https://calendly.com/user' },
    });
    vi.mocked(getNangoClient).mockReturnValue({ getToken: mockGetToken } as any);

    const profile = await buildCapabilityProfile('user-1');

    // Verify getToken was called with 'calendly' (subProvider), not 'calendar' (provider)
    expect(mockGetToken).toHaveBeenCalledWith('calendly', 'nango-123');
    expect(profile.calendar?.calendly?.token).toBe('calendly-token');
  });
});
