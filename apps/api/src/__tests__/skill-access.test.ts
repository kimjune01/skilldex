import { describe, it, expect } from 'vitest';
import {
  getSkillStatus,
  checkSkillRequirements,
  parseSkillRequirements,
  canPerformAction,
  type SkillRequirements,
} from '../lib/skill-access.js';
import type { EffectiveAccess } from '../lib/integration-permissions.js';

describe('skill-access', () => {
  describe('checkSkillRequirements', () => {
    const fullAccess: EffectiveAccess = {
      ats: 'read-write',
      email: 'read-write',
      calendar: 'read-write',
      database: 'read-write',
    };

    describe('when skill has no requirements', () => {
      it('should be satisfied with null requirements', () => {
        const result = checkSkillRequirements(null, fullAccess);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });

      it('should be satisfied with empty requirements', () => {
        const result = checkSkillRequirements({}, fullAccess);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });
    });

    describe('when skill requires read-only access', () => {
      const requirements: SkillRequirements = { ats: 'read-only' };

      it('should be satisfied with read-write access', () => {
        const result = checkSkillRequirements(requirements, fullAccess);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });

      it('should be satisfied with read-only access', () => {
        const access: EffectiveAccess = { ...fullAccess, ats: 'read-only' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });

      it('should not be satisfied when integration is not connected', () => {
        const access: EffectiveAccess = { ...fullAccess, ats: 'none' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toContain('Requires ats integration (not connected)');
      });

      it('should not be satisfied when disabled by admin', () => {
        const access: EffectiveAccess = { ...fullAccess, ats: 'disabled' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toContain('Requires ats (disabled by admin)');
      });
    });

    describe('when skill requires read-write access', () => {
      const requirements: SkillRequirements = { email: 'read-write' };

      it('should be satisfied with read-write access', () => {
        const result = checkSkillRequirements(requirements, fullAccess);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });

      it('should not be satisfied with read-only access', () => {
        const access: EffectiveAccess = { ...fullAccess, email: 'read-only' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toContain('Requires email write access (you have read-only)');
      });

      it('should not be satisfied when integration is not connected', () => {
        const access: EffectiveAccess = { ...fullAccess, email: 'none' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toContain('Requires email integration (not connected)');
      });

      it('should not be satisfied when disabled by admin', () => {
        const access: EffectiveAccess = { ...fullAccess, email: 'disabled' };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toContain('Requires email (disabled by admin)');
      });
    });

    describe('when skill requires multiple integrations', () => {
      const requirements: SkillRequirements = {
        ats: 'read-write',
        email: 'read-write',
      };

      it('should be satisfied when all requirements are met', () => {
        const result = checkSkillRequirements(requirements, fullAccess);
        expect(result.satisfied).toBe(true);
        expect(result.limitations).toEqual([]);
      });

      it('should report all limitations when multiple are missing', () => {
        const access: EffectiveAccess = {
          ats: 'read-only',
          email: 'none',
          calendar: 'read-write',
          database: 'read-write',
        };
        const result = checkSkillRequirements(requirements, access);
        expect(result.satisfied).toBe(false);
        expect(result.limitations).toHaveLength(2);
        expect(result.limitations).toContain('Requires ats write access (you have read-only)');
        expect(result.limitations).toContain('Requires email integration (not connected)');
      });
    });
  });

  describe('getSkillStatus', () => {
    const fullAccess: EffectiveAccess = {
      ats: 'read-write',
      email: 'read-write',
      calendar: 'read-write',
      database: 'read-write',
    };

    describe('disabled skills', () => {
      it('should return disabled when skill is in disabled list', () => {
        const result = getSkillStatus('my-skill', null, fullAccess, ['my-skill', 'other-skill']);
        expect(result.status).toBe('disabled');
        expect(result.limitations).toBeUndefined();
        expect(result.guidance).toBeUndefined();
      });

      it('should not be disabled when skill is not in disabled list', () => {
        const result = getSkillStatus('my-skill', null, fullAccess, ['other-skill']);
        expect(result.status).toBe('available');
      });
    });

    describe('available skills', () => {
      it('should return available when all requirements are met', () => {
        const requirements: SkillRequirements = { ats: 'read-write' };
        const result = getSkillStatus('my-skill', requirements, fullAccess, []);
        expect(result.status).toBe('available');
        expect(result.limitations).toBeUndefined();
        expect(result.guidance).toBeUndefined();
      });

      it('should return available when skill has no requirements', () => {
        const result = getSkillStatus('my-skill', null, fullAccess, []);
        expect(result.status).toBe('available');
      });
    });

    describe('limited skills', () => {
      it('should return limited with guidance when requirements not met', () => {
        const requirements: SkillRequirements = { email: 'read-write' };
        const access: EffectiveAccess = { ...fullAccess, email: 'none' };
        const result = getSkillStatus('my-skill', requirements, access, []);

        expect(result.status).toBe('limited');
        expect(result.limitations).toContain('Requires email integration (not connected)');
        expect(result.guidance).toContain('connect the required integration');
      });

      it('should provide appropriate guidance for read-only limitation', () => {
        const requirements: SkillRequirements = { email: 'read-write' };
        const access: EffectiveAccess = { ...fullAccess, email: 'read-only' };
        const result = getSkillStatus('my-skill', requirements, access, []);

        expect(result.status).toBe('limited');
        expect(result.guidance).toContain('update your integration access level');
      });

      it('should provide admin guidance for admin-disabled limitations', () => {
        const requirements: SkillRequirements = { email: 'read-write' };
        const access: EffectiveAccess = { ...fullAccess, email: 'disabled' };

        const resultNonAdmin = getSkillStatus('my-skill', requirements, access, [], false);
        expect(resultNonAdmin.guidance).toContain('contact your admin');

        const resultAdmin = getSkillStatus('my-skill', requirements, access, [], true);
        expect(resultAdmin.guidance).toContain('enable this integration category');
      });
    });
  });

  describe('parseSkillRequirements', () => {
    it('should return null for empty frontmatter', () => {
      expect(parseSkillRequirements({})).toBeNull();
    });

    it('should return null when requires is not present', () => {
      expect(parseSkillRequirements({ name: 'test' })).toBeNull();
    });

    it('should return null when requires is not an object', () => {
      expect(parseSkillRequirements({ requires: 'string' })).toBeNull();
      expect(parseSkillRequirements({ requires: ['array'] })).toBeNull();
    });

    it('should parse valid requirements', () => {
      const result = parseSkillRequirements({
        requires: {
          ats: 'read-write',
          email: 'read-only',
        },
      });

      expect(result).toEqual({
        ats: 'read-write',
        email: 'read-only',
      });
    });

    it('should filter out invalid categories', () => {
      const result = parseSkillRequirements({
        requires: {
          ats: 'read-write',
          invalid: 'read-write', // Should be ignored
        },
      });

      expect(result).toEqual({ ats: 'read-write' });
    });

    it('should filter out invalid access levels', () => {
      const result = parseSkillRequirements({
        requires: {
          ats: 'read-write',
          email: 'invalid', // Should be ignored
        },
      });

      expect(result).toEqual({ ats: 'read-write' });
    });

    it('should return null when all requirements are invalid', () => {
      const result = parseSkillRequirements({
        requires: {
          invalid: 'read-write',
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('canPerformAction', () => {
    const fullAccess: EffectiveAccess = {
      ats: 'read-write',
      email: 'read-only',
      calendar: 'none',
      database: 'read-write',
    };

    describe('read actions', () => {
      it('should allow read with read-write access', () => {
        expect(canPerformAction('ats', 'read', fullAccess)).toBe(true);
      });

      it('should allow read with read-only access', () => {
        expect(canPerformAction('email', 'read', fullAccess)).toBe(true);
      });

      it('should not allow read with no access', () => {
        expect(canPerformAction('calendar', 'read', fullAccess)).toBe(false);
      });
    });

    describe('write actions', () => {
      it('should allow write with read-write access', () => {
        expect(canPerformAction('ats', 'write', fullAccess)).toBe(true);
      });

      it('should not allow write with read-only access', () => {
        expect(canPerformAction('email', 'write', fullAccess)).toBe(false);
      });

      it('should not allow write with no access', () => {
        expect(canPerformAction('calendar', 'write', fullAccess)).toBe(false);
      });
    });
  });
});
