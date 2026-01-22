import { describe, it, expect } from 'vitest';

/**
 * Tests for ATS proxy endpoint helper functions.
 * Note: Full integration tests require database and Nango mocking.
 */

// Inline the functions we're testing (since they're not exported from the route file)
// In a real codebase, these would be extracted to a separate utility file

const BLOCKLISTED_PATHS: Record<string, RegExp[]> = {
  greenhouse: [
    /^\/users/i,
    /^\/user_roles/i,
    /^\/custom_fields/i,
    /^\/webhooks/i,
    /^\/tracking_links/i,
    /^\/eeoc/i,
    /^\/demographics/i,
  ],
  'zoho-recruit': [
    /^\/settings/i,
    /^\/org/i,
    /^\/users/i,
    /\/__schedule_mass_delete/i,
  ],
};

function isPathBlocklisted(provider: string, path: string): boolean {
  const patterns = BLOCKLISTED_PATHS[provider] || [];
  return patterns.some((pattern) => pattern.test(path));
}

function requiresWriteAccess(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

describe('isPathBlocklisted', () => {
  describe('greenhouse', () => {
    it('blocks /users path', () => {
      expect(isPathBlocklisted('greenhouse', '/users')).toBe(true);
      expect(isPathBlocklisted('greenhouse', '/users/123')).toBe(true);
    });

    it('blocks /user_roles path', () => {
      expect(isPathBlocklisted('greenhouse', '/user_roles')).toBe(true);
    });

    it('blocks /custom_fields path', () => {
      expect(isPathBlocklisted('greenhouse', '/custom_fields')).toBe(true);
    });

    it('blocks /webhooks path', () => {
      expect(isPathBlocklisted('greenhouse', '/webhooks')).toBe(true);
    });

    it('blocks /eeoc path (case insensitive)', () => {
      expect(isPathBlocklisted('greenhouse', '/EEOC')).toBe(true);
      expect(isPathBlocklisted('greenhouse', '/eeoc')).toBe(true);
    });

    it('allows /candidates path', () => {
      expect(isPathBlocklisted('greenhouse', '/candidates')).toBe(false);
      expect(isPathBlocklisted('greenhouse', '/candidates/123')).toBe(false);
    });

    it('allows /jobs path', () => {
      expect(isPathBlocklisted('greenhouse', '/jobs')).toBe(false);
    });

    it('allows /applications path', () => {
      expect(isPathBlocklisted('greenhouse', '/applications')).toBe(false);
    });

    it('allows /scorecards path', () => {
      expect(isPathBlocklisted('greenhouse', '/scorecards')).toBe(false);
    });
  });

  describe('zoho-recruit', () => {
    it('blocks /settings path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/settings')).toBe(true);
    });

    it('blocks /org path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/org')).toBe(true);
    });

    it('blocks /users path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/users')).toBe(true);
    });

    it('blocks __schedule_mass_delete path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/Candidates/__schedule_mass_delete')).toBe(true);
    });

    it('allows /Candidates path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/Candidates')).toBe(false);
    });

    it('allows /Job_Openings path', () => {
      expect(isPathBlocklisted('zoho-recruit', '/Job_Openings')).toBe(false);
    });
  });

  describe('unknown provider', () => {
    it('allows all paths for unknown provider', () => {
      expect(isPathBlocklisted('unknown', '/users')).toBe(false);
      expect(isPathBlocklisted('unknown', '/anything')).toBe(false);
    });
  });
});

describe('requiresWriteAccess', () => {
  it('returns true for POST', () => {
    expect(requiresWriteAccess('POST')).toBe(true);
    expect(requiresWriteAccess('post')).toBe(true);
  });

  it('returns true for PUT', () => {
    expect(requiresWriteAccess('PUT')).toBe(true);
    expect(requiresWriteAccess('put')).toBe(true);
  });

  it('returns true for PATCH', () => {
    expect(requiresWriteAccess('PATCH')).toBe(true);
    expect(requiresWriteAccess('patch')).toBe(true);
  });

  it('returns true for DELETE', () => {
    expect(requiresWriteAccess('DELETE')).toBe(true);
    expect(requiresWriteAccess('delete')).toBe(true);
  });

  it('returns false for GET', () => {
    expect(requiresWriteAccess('GET')).toBe(false);
    expect(requiresWriteAccess('get')).toBe(false);
  });

  it('returns false for HEAD', () => {
    expect(requiresWriteAccess('HEAD')).toBe(false);
  });

  it('returns false for OPTIONS', () => {
    expect(requiresWriteAccess('OPTIONS')).toBe(false);
  });
});

// Test for URL construction edge cases
describe('URL path handling', () => {
  it('handles paths with leading slash', () => {
    const baseUrl = 'https://api.example.com/v1';
    const path = '/candidates';
    const url = new URL(path, baseUrl);
    expect(url.toString()).toBe('https://api.example.com/candidates');
  });

  it('handles paths without leading slash', () => {
    const baseUrl = 'https://api.example.com/v1/';
    const path = 'candidates';
    const url = new URL(path, baseUrl);
    expect(url.toString()).toBe('https://api.example.com/v1/candidates');
  });

  it('handles query parameters correctly', () => {
    const baseUrl = 'https://api.example.com/v1';
    const path = '/candidates';
    const url = new URL(path, baseUrl);
    url.searchParams.set('limit', '10');
    url.searchParams.set('search', 'hello world');
    expect(url.toString()).toBe('https://api.example.com/candidates?limit=10&search=hello+world');
  });
});
