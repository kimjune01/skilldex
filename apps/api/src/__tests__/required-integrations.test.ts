import { describe, it, expect } from 'vitest';
import type { SkillAccessLevel } from '@skillomatic/shared';

/**
 * Tests for requiredIntegrations parsing
 *
 * The database stores requiredIntegrations as a JSON object:
 *   {"ats": "read-write", "email": "read-only"}
 *
 * The SkillPublic interface expects the same object format:
 *   {"ats": "read-write", "email": "read-only"}
 *
 * This test file verifies the parsing logic works correctly.
 */

// Helper function that mirrors the parsing logic in skills.ts
function parseRequiredIntegrations(dbValue: string | null): Record<string, SkillAccessLevel> {
  if (!dbValue) {
    return {};
  }
  return JSON.parse(dbValue);
}

describe('requiredIntegrations parsing', () => {
  describe('parseRequiredIntegrations (preserves object format)', () => {
    it('should preserve object format with access levels', () => {
      const dbValue = '{"ats": "read-write", "email": "read-only"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual({ ats: 'read-write', email: 'read-only' });
    });

    it('should handle single integration', () => {
      const dbValue = '{"ats": "read-only"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual({ ats: 'read-only' });
    });

    it('should handle empty object', () => {
      const dbValue = '{}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual({});
    });

    it('should handle null value', () => {
      const result = parseRequiredIntegrations(null);

      expect(result).toEqual({});
    });

    it('should handle all integration types with different access levels', () => {
      const dbValue = '{"ats": "read-write", "email": "read-only", "calendar": "disabled"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result.ats).toBe('read-write');
      expect(result.email).toBe('read-only');
      expect(result.calendar).toBe('disabled');
      expect(Object.keys(result)).toHaveLength(3);
    });

    it('should throw on invalid JSON', () => {
      const dbValue = 'not valid json';

      expect(() => parseRequiredIntegrations(dbValue)).toThrow();
    });
  });

  describe('real-world skill examples', () => {
    it('should parse linkedin-lookup (no integrations)', () => {
      const dbValue = '{}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual({});
    });

    it('should parse ats-candidate-search', () => {
      const dbValue = '{"ats":"read-only"}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual({ ats: 'read-only' });
    });

    it('should parse ats-candidate-crud', () => {
      const dbValue = '{"ats":"read-write"}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual({ ats: 'read-write' });
    });

    it('should parse candidate-pipeline-builder', () => {
      const dbValue = '{"ats":"read-write","email":"read-write"}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual({ ats: 'read-write', email: 'read-write' });
    });

    it('should parse daily-report', () => {
      const dbValue = '{"ats":"read-only"}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual({ ats: 'read-only' });
    });
  });

  describe('frontend consumption', () => {
    it('should support Object.keys() for iteration', () => {
      const integrations = parseRequiredIntegrations('{"ats":"read-write","email":"read-only"}');
      const keys = Object.keys(integrations);

      expect(keys).toEqual(['ats', 'email']);
    });

    it('should support Object.entries() for access level display', () => {
      const integrations = parseRequiredIntegrations('{"ats":"read-write","email":"read-only"}');
      const entries = Object.entries(integrations);

      expect(entries).toEqual([
        ['ats', 'read-write'],
        ['email', 'read-only'],
      ]);
    });
  });
});
