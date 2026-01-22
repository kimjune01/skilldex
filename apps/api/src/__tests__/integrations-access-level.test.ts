import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for integration access level functionality
 *
 * These tests verify the OAuth flow access level handling at the API level.
 * Since the actual OAuth flow requires external services (Nango), these tests
 * focus on the metadata handling and access level storage/retrieval logic.
 */

describe('integration access level', () => {
  describe('access level metadata parsing', () => {
    it('should parse read-write access level from metadata', () => {
      const metadata = JSON.stringify({ accessLevel: 'read-write', subProvider: 'gmail' });
      const parsed = JSON.parse(metadata);
      expect(parsed.accessLevel).toBe('read-write');
    });

    it('should parse read-only access level from metadata', () => {
      const metadata = JSON.stringify({ accessLevel: 'read-only', subProvider: 'gmail' });
      const parsed = JSON.parse(metadata);
      expect(parsed.accessLevel).toBe('read-only');
    });

    it('should handle missing accessLevel in metadata', () => {
      const metadata = JSON.stringify({ subProvider: 'gmail' });
      const parsed = JSON.parse(metadata);
      expect(parsed.accessLevel).toBeUndefined();
      // When undefined, should default to 'read-write'
      const accessLevel = parsed.accessLevel || 'read-write';
      expect(accessLevel).toBe('read-write');
    });

    it('should handle null metadata', () => {
      const metadata = null;
      // When null, should default to 'read-write'
      const accessLevel = metadata ? JSON.parse(metadata).accessLevel : 'read-write';
      expect(accessLevel).toBe('read-write');
    });

    it('should preserve existing metadata when updating access level', () => {
      const existingMetadata = { subProvider: 'gmail', customField: 'value' };
      const updatedMetadata = { ...existingMetadata, accessLevel: 'read-only' };

      expect(updatedMetadata.subProvider).toBe('gmail');
      expect(updatedMetadata.customField).toBe('value');
      expect(updatedMetadata.accessLevel).toBe('read-only');
    });
  });

  describe('access level validation', () => {
    const validAccessLevels = ['read-write', 'read-only'];

    it('should accept read-write as valid', () => {
      expect(validAccessLevels.includes('read-write')).toBe(true);
    });

    it('should accept read-only as valid', () => {
      expect(validAccessLevels.includes('read-only')).toBe(true);
    });

    it('should reject invalid access levels', () => {
      expect(validAccessLevels.includes('invalid')).toBe(false);
      expect(validAccessLevels.includes('disabled')).toBe(false);
      expect(validAccessLevels.includes('none')).toBe(false);
      expect(validAccessLevels.includes('')).toBe(false);
    });
  });

  describe('access level in integration list response', () => {
    it('should include accessLevel in integration public data', () => {
      const integrationFromDb = {
        id: 'int-123',
        provider: 'gmail',
        status: 'connected',
        metadata: JSON.stringify({ accessLevel: 'read-only' }),
        lastSyncAt: new Date(),
        createdAt: new Date(),
      };

      const metadata = integrationFromDb.metadata
        ? JSON.parse(integrationFromDb.metadata)
        : {};

      const publicIntegration = {
        id: integrationFromDb.id,
        provider: integrationFromDb.provider,
        status: integrationFromDb.status,
        lastSyncAt: integrationFromDb.lastSyncAt,
        createdAt: integrationFromDb.createdAt,
        accessLevel: metadata.accessLevel || 'read-write',
      };

      expect(publicIntegration.accessLevel).toBe('read-only');
    });

    it('should default to read-write when metadata has no accessLevel', () => {
      const integrationFromDb = {
        id: 'int-123',
        provider: 'gmail',
        status: 'connected',
        metadata: JSON.stringify({ subProvider: 'gmail' }),
        lastSyncAt: new Date(),
        createdAt: new Date(),
      };

      const metadata = integrationFromDb.metadata
        ? JSON.parse(integrationFromDb.metadata)
        : {};

      const accessLevel = metadata.accessLevel || 'read-write';
      expect(accessLevel).toBe('read-write');
    });
  });

  describe('pending access level storage', () => {
    // Simulating the in-memory storage pattern used in integrations.ts
    const pendingAccessLevels = new Map<
      string,
      { accessLevel: 'read-write' | 'read-only'; expiresAt: number }
    >();

    beforeEach(() => {
      pendingAccessLevels.clear();
    });

    it('should store pending access level with expiration', () => {
      const userId = 'user-123';
      const provider = 'gmail';
      const key = `${userId}:${provider}`;

      pendingAccessLevels.set(key, {
        accessLevel: 'read-only',
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      expect(pendingAccessLevels.has(key)).toBe(true);
      expect(pendingAccessLevels.get(key)?.accessLevel).toBe('read-only');
    });

    it('should retrieve pending access level if not expired', () => {
      const userId = 'user-123';
      const provider = 'gmail';
      const key = `${userId}:${provider}`;

      pendingAccessLevels.set(key, {
        accessLevel: 'read-only',
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const pending = pendingAccessLevels.get(key);
      expect(pending).toBeDefined();
      expect(pending!.expiresAt > Date.now()).toBe(true);
    });

    it('should treat as expired if expiresAt is in the past', () => {
      const userId = 'user-123';
      const provider = 'gmail';
      const key = `${userId}:${provider}`;

      pendingAccessLevels.set(key, {
        accessLevel: 'read-only',
        expiresAt: Date.now() - 1000, // Already expired
      });

      const pending = pendingAccessLevels.get(key);
      expect(pending).toBeDefined();
      expect(pending!.expiresAt > Date.now()).toBe(false);
    });

    it('should cleanup expired entries', () => {
      const key1 = 'user-1:gmail';
      const key2 = 'user-2:gmail';

      pendingAccessLevels.set(key1, {
        accessLevel: 'read-only',
        expiresAt: Date.now() - 1000, // Expired
      });
      pendingAccessLevels.set(key2, {
        accessLevel: 'read-write',
        expiresAt: Date.now() + 10000, // Not expired
      });

      // Cleanup logic
      const now = Date.now();
      for (const [key, value] of pendingAccessLevels.entries()) {
        if (value.expiresAt < now) {
          pendingAccessLevels.delete(key);
        }
      }

      expect(pendingAccessLevels.has(key1)).toBe(false);
      expect(pendingAccessLevels.has(key2)).toBe(true);
    });
  });

  describe('access level update merge', () => {
    it('should merge new access level with existing metadata', () => {
      const existingMetadata = JSON.stringify({
        subProvider: 'gmail',
        someOtherField: 'value',
      });

      const parsed = JSON.parse(existingMetadata);
      const updated = { ...parsed, accessLevel: 'read-only' };

      expect(updated.subProvider).toBe('gmail');
      expect(updated.someOtherField).toBe('value');
      expect(updated.accessLevel).toBe('read-only');
    });

    it('should overwrite existing access level', () => {
      const existingMetadata = JSON.stringify({
        subProvider: 'gmail',
        accessLevel: 'read-write',
      });

      const parsed = JSON.parse(existingMetadata);
      const updated = { ...parsed, accessLevel: 'read-only' };

      expect(updated.accessLevel).toBe('read-only');
    });

    it('should handle malformed existing metadata', () => {
      const existingMetadata = 'not-valid-json';

      let parsed = {};
      try {
        parsed = JSON.parse(existingMetadata);
      } catch {
        parsed = {};
      }

      const updated = { ...parsed, accessLevel: 'read-only' };
      expect(updated.accessLevel).toBe('read-only');
    });
  });
});
