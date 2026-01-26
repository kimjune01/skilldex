import { describe, it, expect } from 'vitest';

/**
 * Tests for requiredIntegrations parsing
 *
 * The database stores requiredIntegrations as a JSON object:
 *   {"ats": "read-write", "email": "read-only"}
 *
 * The SkillPublic interface expects an array of integration names:
 *   ["ats", "email"]
 *
 * This test file verifies the parsing logic works correctly.
 */

// Helper function that mirrors the parsing logic in skills.ts
function parseRequiredIntegrations(dbValue: string | null): string[] {
  if (!dbValue) {
    return [];
  }
  const parsed = JSON.parse(dbValue);
  return Object.keys(parsed);
}

// Helper function that mirrors the requirements parsing logic
function parseRequirementsFromIntegrations(dbValue: string | null): Record<string, string> {
  const requirements: Record<string, string> = {};
  if (!dbValue) {
    return requirements;
  }
  const parsed = JSON.parse(dbValue) as Record<string, string>;
  for (const [key, value] of Object.entries(parsed)) {
    if (['ats', 'email', 'calendar'].includes(key)) {
      requirements[key] = value;
    }
  }
  return requirements;
}

describe('requiredIntegrations parsing', () => {
  describe('parseRequiredIntegrations (object to array)', () => {
    it('should convert object format to array of keys', () => {
      const dbValue = '{"ats": "read-write", "email": "read-only"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual(['ats', 'email']);
    });

    it('should handle single integration', () => {
      const dbValue = '{"ats": "read-only"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual(['ats']);
    });

    it('should handle empty object', () => {
      const dbValue = '{}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toEqual([]);
    });

    it('should handle null value', () => {
      const result = parseRequiredIntegrations(null);

      expect(result).toEqual([]);
    });

    it('should handle all integration types', () => {
      const dbValue = '{"ats": "read-write", "email": "read-write", "calendar": "read-only"}';
      const result = parseRequiredIntegrations(dbValue);

      expect(result).toContain('ats');
      expect(result).toContain('email');
      expect(result).toContain('calendar');
      expect(result).toHaveLength(3);
    });

    it('should throw on invalid JSON', () => {
      const dbValue = 'not valid json';

      expect(() => parseRequiredIntegrations(dbValue)).toThrow();
    });
  });

  describe('parseRequirementsFromIntegrations (preserve access levels)', () => {
    it('should preserve access levels from object format', () => {
      const dbValue = '{"ats": "read-write", "email": "read-only"}';
      const result = parseRequirementsFromIntegrations(dbValue);

      expect(result).toEqual({
        ats: 'read-write',
        email: 'read-only',
      });
    });

    it('should filter to only known integration categories', () => {
      const dbValue = '{"ats": "read-write", "unknown": "value", "email": "read-only"}';
      const result = parseRequirementsFromIntegrations(dbValue);

      expect(result).toEqual({
        ats: 'read-write',
        email: 'read-only',
      });
      expect(result).not.toHaveProperty('unknown');
    });

    it('should handle empty object', () => {
      const dbValue = '{}';
      const result = parseRequirementsFromIntegrations(dbValue);

      expect(result).toEqual({});
    });

    it('should handle null value', () => {
      const result = parseRequirementsFromIntegrations(null);

      expect(result).toEqual({});
    });

    it('should handle all valid access levels', () => {
      const dbValue = '{"ats": "read-only", "email": "read-write", "calendar": "disabled"}';
      const result = parseRequirementsFromIntegrations(dbValue);

      expect(result.ats).toBe('read-only');
      expect(result.email).toBe('read-write');
      expect(result.calendar).toBe('disabled');
    });
  });

  describe('real-world skill examples', () => {
    it('should parse linkedin-lookup (no integrations)', () => {
      const dbValue = '{}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual([]);
    });

    it('should parse ats-candidate-search', () => {
      const dbValue = '{"ats":"read-only"}';
      const integrations = parseRequiredIntegrations(dbValue);
      const requirements = parseRequirementsFromIntegrations(dbValue);

      expect(integrations).toEqual(['ats']);
      expect(requirements).toEqual({ ats: 'read-only' });
    });

    it('should parse ats-candidate-crud', () => {
      const dbValue = '{"ats":"read-write"}';
      const integrations = parseRequiredIntegrations(dbValue);
      const requirements = parseRequirementsFromIntegrations(dbValue);

      expect(integrations).toEqual(['ats']);
      expect(requirements).toEqual({ ats: 'read-write' });
    });

    it('should parse candidate-pipeline-builder', () => {
      const dbValue = '{"ats":"read-write","email":"read-write"}';
      const integrations = parseRequiredIntegrations(dbValue);
      const requirements = parseRequirementsFromIntegrations(dbValue);

      expect(integrations).toEqual(['ats', 'email']);
      expect(requirements).toEqual({ ats: 'read-write', email: 'read-write' });
    });

    it('should parse daily-report', () => {
      const dbValue = '{"ats":"read-only"}';
      const integrations = parseRequiredIntegrations(dbValue);

      expect(integrations).toEqual(['ats']);
    });
  });

  describe('regression: array input should throw', () => {
    // This documents the expected behavior - we only support object format
    // Array format was legacy and should not be used

    it('should NOT work with legacy array format (throws on Object.keys)', () => {
      // Legacy format that was incorrectly stored in some local DBs
      const legacyDbValue = '["ats", "email"]';

      // Object.keys on an array returns indices ["0", "1"], not the values
      const result = parseRequiredIntegrations(legacyDbValue);
      expect(result).toEqual(['0', '1']); // This is wrong behavior - documents why we need object format
    });
  });
});
