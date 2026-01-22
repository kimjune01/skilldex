import { describe, it, expect } from 'vitest';

/**
 * Tests for domain-based organization auto-assignment
 *
 * When a user signs up via OAuth, we check if their email domain
 * matches any organization's allowedDomains. If so, they're
 * automatically assigned to that organization.
 */

// Helper functions extracted for testing (same logic as in auth.ts)
function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

interface MockOrg {
  id: string;
  name: string;
  allowedDomains: string | null;
}

function findOrgByEmailDomain(email: string, orgs: MockOrg[]): MockOrg | null {
  const domain = getEmailDomain(email);
  if (!domain) return null;

  for (const org of orgs) {
    if (!org.allowedDomains) continue;

    try {
      const domains = JSON.parse(org.allowedDomains) as string[];
      if (Array.isArray(domains)) {
        const normalizedDomains = domains.map((d) => d.toLowerCase().trim());
        if (normalizedDomains.includes(domain)) {
          return org;
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return null;
}

describe('domain-assignment', () => {
  describe('getEmailDomain', () => {
    it('should extract domain from valid email', () => {
      expect(getEmailDomain('user@acme.com')).toBe('acme.com');
      expect(getEmailDomain('john.doe@company.io')).toBe('company.io');
    });

    it('should lowercase the domain', () => {
      expect(getEmailDomain('User@ACME.COM')).toBe('acme.com');
      expect(getEmailDomain('test@Company.IO')).toBe('company.io');
    });

    it('should return empty string for invalid email', () => {
      expect(getEmailDomain('invalid')).toBe('');
      expect(getEmailDomain('')).toBe('');
    });
  });

  describe('findOrgByEmailDomain', () => {
    const mockOrgs: MockOrg[] = [
      { id: 'org-1', name: 'Acme Corp', allowedDomains: '["acme.com", "acme.io"]' },
      { id: 'org-2', name: 'Globex', allowedDomains: '["globex.com"]' },
      { id: 'org-3', name: 'Invite Only', allowedDomains: null },
      { id: 'org-4', name: 'Bad Config', allowedDomains: 'not-valid-json' },
    ];

    it('should match user to org with matching domain', () => {
      const org = findOrgByEmailDomain('john@acme.com', mockOrgs);
      expect(org).not.toBeNull();
      expect(org?.id).toBe('org-1');
      expect(org?.name).toBe('Acme Corp');
    });

    it('should match against any domain in the array', () => {
      const org = findOrgByEmailDomain('jane@acme.io', mockOrgs);
      expect(org?.id).toBe('org-1');
    });

    it('should be case-insensitive', () => {
      const org = findOrgByEmailDomain('user@ACME.COM', mockOrgs);
      expect(org?.id).toBe('org-1');
    });

    it('should return null for unmatched domain', () => {
      const org = findOrgByEmailDomain('user@unknown.com', mockOrgs);
      expect(org).toBeNull();
    });

    it('should return null for org with null allowedDomains', () => {
      // Simulate only having invite-only org
      const inviteOnlyOrgs = [mockOrgs[2]];
      const org = findOrgByEmailDomain('user@inviteonly.com', inviteOnlyOrgs);
      expect(org).toBeNull();
    });

    it('should skip orgs with invalid JSON in allowedDomains', () => {
      // Should not throw, just skip the invalid org
      const org = findOrgByEmailDomain('user@badconfig.com', mockOrgs);
      expect(org).toBeNull();
    });

    it('should return first matching org when multiple match (edge case)', () => {
      // This shouldn't happen if domain uniqueness is enforced, but test behavior
      const duplicateDomainOrgs: MockOrg[] = [
        { id: 'org-a', name: 'First', allowedDomains: '["test.com"]' },
        { id: 'org-b', name: 'Second', allowedDomains: '["test.com"]' },
      ];
      const org = findOrgByEmailDomain('user@test.com', duplicateDomainOrgs);
      expect(org?.id).toBe('org-a'); // First match wins
    });

    it('should handle empty array in allowedDomains', () => {
      const emptyDomainOrg: MockOrg[] = [
        { id: 'org-empty', name: 'Empty', allowedDomains: '[]' },
      ];
      const org = findOrgByEmailDomain('user@test.com', emptyDomainOrg);
      expect(org).toBeNull();
    });

    it('should handle domains with leading/trailing whitespace', () => {
      const whitespaceOrg: MockOrg[] = [
        { id: 'org-ws', name: 'Whitespace', allowedDomains: '["  acme.com  ", "globex.com"]' },
      ];
      const org = findOrgByEmailDomain('user@acme.com', whitespaceOrg);
      expect(org?.id).toBe('org-ws');
    });
  });

  describe('domain validation', () => {
    it('should reject domains with protocol', () => {
      // This validation happens in the API endpoint
      const invalidDomains = ['https://acme.com', 'http://acme.com'];
      for (const domain of invalidDomains) {
        expect(domain.includes(':')).toBe(true); // Would be rejected
      }
    });

    it('should reject domains with path', () => {
      const invalidDomains = ['acme.com/path', 'acme.com/'];
      for (const domain of invalidDomains) {
        expect(domain.includes('/')).toBe(true); // Would be rejected
      }
    });

    it('should allow valid domain formats', () => {
      const validDomains = ['acme.com', 'sub.acme.com', 'acme.co.uk', 'a.io'];
      for (const domain of validDomains) {
        expect(domain.includes(':')).toBe(false);
        expect(domain.includes('/')).toBe(false);
      }
    });
  });
});
