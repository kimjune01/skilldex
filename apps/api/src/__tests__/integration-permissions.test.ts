import { describe, it, expect } from 'vitest';
import {
  getEffectiveAccess,
  providerToCategory,
  canRead,
  canWrite,
  type OrgIntegrationPermissions,
} from '../lib/integration-permissions.js';

describe('integration-permissions', () => {
  describe('providerToCategory', () => {
    it('should map ATS providers to ats category', () => {
      expect(providerToCategory('ats')).toBe('ats');
      expect(providerToCategory('greenhouse')).toBe('ats');
      expect(providerToCategory('lever')).toBe('ats');
      expect(providerToCategory('ashby')).toBe('ats');
      expect(providerToCategory('workable')).toBe('ats');
    });

    it('should map email providers to email category', () => {
      expect(providerToCategory('email')).toBe('email');
      expect(providerToCategory('gmail')).toBe('email');
      expect(providerToCategory('outlook')).toBe('email');
    });

    it('should map calendar providers to calendar category', () => {
      expect(providerToCategory('calendar')).toBe('calendar');
      expect(providerToCategory('google-calendar')).toBe('calendar');
      expect(providerToCategory('outlook-calendar')).toBe('calendar');
      expect(providerToCategory('calendly')).toBe('calendar');
    });

    it('should return null for unknown providers', () => {
      expect(providerToCategory('unknown')).toBeNull();
      expect(providerToCategory('linkedin')).toBeNull();
      expect(providerToCategory('')).toBeNull();
    });
  });

  describe('canRead', () => {
    it('should return true for read-write', () => {
      expect(canRead('read-write')).toBe(true);
    });

    it('should return true for read-only', () => {
      expect(canRead('read-only')).toBe(true);
    });

    it('should return false for disabled', () => {
      expect(canRead('disabled')).toBe(false);
    });

    it('should return false for none', () => {
      expect(canRead('none')).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should return true for read-write', () => {
      expect(canWrite('read-write')).toBe(true);
    });

    it('should return false for read-only', () => {
      expect(canWrite('read-only')).toBe(false);
    });

    it('should return false for disabled', () => {
      expect(canWrite('disabled')).toBe(false);
    });

    it('should return false for none', () => {
      expect(canWrite('none')).toBe(false);
    });
  });

  describe('getEffectiveAccess', () => {
    const defaultOrgPermissions: OrgIntegrationPermissions = {
      ats: 'read-write',
      email: 'read-write',
      calendar: 'read-write',
      database: 'read-write',
    };

    describe('when admin has disabled the category', () => {
      it('should return disabled regardless of user integrations', () => {
        const orgPermissions: OrgIntegrationPermissions = {
          ...defaultOrgPermissions,
          email: 'disabled',
        };

        // Even with connected integrations, should be disabled
        const userIntegrations = [{ metadata: JSON.stringify({ accessLevel: 'read-write' }) }];

        expect(getEffectiveAccess('email', orgPermissions, userIntegrations)).toBe('disabled');
      });
    });

    describe('when no integrations are connected', () => {
      it('should return none', () => {
        expect(getEffectiveAccess('email', defaultOrgPermissions, [])).toBe('none');
      });
    });

    describe('three-way intersection logic', () => {
      it('should return read-write when both admin and user allow read-write', () => {
        const userIntegrations = [{ metadata: JSON.stringify({ accessLevel: 'read-write' }) }];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-write');
      });

      it('should return read-only when admin allows read-write but user chooses read-only', () => {
        const userIntegrations = [{ metadata: JSON.stringify({ accessLevel: 'read-only' }) }];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-only');
      });

      it('should return read-only when admin restricts to read-only even if user wants read-write', () => {
        const orgPermissions: OrgIntegrationPermissions = {
          ...defaultOrgPermissions,
          email: 'read-only',
        };
        const userIntegrations = [{ metadata: JSON.stringify({ accessLevel: 'read-write' }) }];
        expect(getEffectiveAccess('email', orgPermissions, userIntegrations)).toBe('read-only');
      });

      it('should return read-only when both admin and user are read-only', () => {
        const orgPermissions: OrgIntegrationPermissions = {
          ...defaultOrgPermissions,
          email: 'read-only',
        };
        const userIntegrations = [{ metadata: JSON.stringify({ accessLevel: 'read-only' }) }];
        expect(getEffectiveAccess('email', orgPermissions, userIntegrations)).toBe('read-only');
      });
    });

    describe('integration metadata parsing', () => {
      it('should default to read-write when metadata is null', () => {
        const userIntegrations = [{ metadata: null }];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-write');
      });

      it('should default to read-write when metadata has no accessLevel', () => {
        const userIntegrations = [{ metadata: JSON.stringify({ subProvider: 'gmail' }) }];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-write');
      });

      it('should default to read-write when metadata is invalid JSON', () => {
        const userIntegrations = [{ metadata: 'not-json' }];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-write');
      });
    });

    describe('multiple integrations', () => {
      it('should take the highest user access level among multiple integrations', () => {
        const userIntegrations = [
          { metadata: JSON.stringify({ accessLevel: 'read-only' }) },
          { metadata: JSON.stringify({ accessLevel: 'read-write' }) },
        ];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-write');
      });

      it('should remain read-only if all integrations are read-only', () => {
        const userIntegrations = [
          { metadata: JSON.stringify({ accessLevel: 'read-only' }) },
          { metadata: JSON.stringify({ accessLevel: 'read-only' }) },
        ];
        expect(getEffectiveAccess('email', defaultOrgPermissions, userIntegrations)).toBe('read-only');
      });
    });
  });
});
