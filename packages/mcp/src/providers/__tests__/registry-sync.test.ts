/**
 * Registry Sync Validation Tests
 *
 * These tests ensure that the provider registry (packages/shared/src/providers.ts)
 * stays in sync with the MCP manifests (packages/mcp/src/providers/manifests/).
 *
 * When adding a new provider, both must be updated consistently.
 * These tests will catch any drift between the two systems.
 */

import { describe, it, expect } from 'vitest';
import { PROVIDERS, getProvider, type ProviderConfig } from '@skillomatic/shared';
import { manifests, getManifest, getAvailableProviders } from '../manifests/index.js';

describe('Provider Registry and Manifest Sync', () => {
  describe('all manifests have matching registry entries', () => {
    const manifestProviders = getAvailableProviders();

    it.each(manifestProviders)('manifest "%s" has matching registry entry', (providerId) => {
      const manifest = getManifest(providerId);
      const registryEntry = getProvider(providerId);

      expect(registryEntry).toBeDefined();
      expect(manifest).toBeDefined();

      if (!registryEntry || !manifest) return;

      // Core identity must match
      expect(manifest.provider).toBe(registryEntry.id);
      expect(manifest.displayName).toBe(registryEntry.displayName);
      expect(manifest.category).toBe(registryEntry.category);

      // API base URL must match
      expect(manifest.baseUrl).toBe(registryEntry.apiBaseUrl);

      // Auth type must match
      expect(manifest.auth.type).toBe(registryEntry.apiAuth.type);

      // Rate limits should match (if defined in both)
      if (manifest.rateLimit && registryEntry.rateLimit) {
        expect(manifest.rateLimit.requests).toBe(registryEntry.rateLimit.requests);
        expect(manifest.rateLimit.windowSeconds).toBe(registryEntry.rateLimit.windowSeconds);
      }
    });
  });

  describe('registry entries with hasManifest=true have manifests', () => {
    const providersWithManifest = (Object.values(PROVIDERS) as ProviderConfig[]).filter(
      (p) => p.hasManifest
    );

    it.each(providersWithManifest.map((p) => p.id))(
      'registry entry "%s" with hasManifest=true has a manifest',
      (providerId) => {
        const manifest = getManifest(providerId);
        expect(manifest).toBeDefined();
      }
    );
  });

  describe('blocked paths consistency', () => {
    const manifestProviders = getAvailableProviders();

    it.each(manifestProviders)(
      'manifest "%s" blocklist is subset of registry blockedPaths',
      (providerId) => {
        const manifest = getManifest(providerId);
        const registryEntry = getProvider(providerId);

        if (!manifest || !registryEntry) return;
        if (!manifest.blocklist || manifest.blocklist.length === 0) return;
        if (!registryEntry.blockedPaths || registryEntry.blockedPaths.length === 0) return;

        // Each manifest blocklist entry should be caught by at least one registry regex
        for (const blockedPath of manifest.blocklist) {
          const isCaughtByRegistry = registryEntry.blockedPaths.some((pattern: RegExp) =>
            pattern.test(blockedPath)
          );
          expect(isCaughtByRegistry).toBe(true);
        }
      }
    );
  });

  describe('provider IDs are consistent', () => {
    it('all manifest provider IDs match their key in the manifests object', () => {
      for (const [key, manifest] of Object.entries(manifests)) {
        expect(manifest.provider).toBe(key);
      }
    });

    it('all registry provider IDs match their key in PROVIDERS object', () => {
      for (const [key, config] of Object.entries(PROVIDERS) as [string, ProviderConfig][]) {
        expect(config.id).toBe(key);
      }
    });
  });

  describe('category mapping consistency', () => {
    const manifestProviders = getAvailableProviders();

    it.each(manifestProviders)('manifest "%s" category matches registry', (providerId) => {
      const manifest = getManifest(providerId);
      const registryEntry = getProvider(providerId);

      if (!manifest || !registryEntry) return;

      // Categories should match exactly
      expect(manifest.category).toBe(registryEntry.category);
    });
  });

  describe('summary statistics', () => {
    it('logs sync status summary', () => {
      const registryCount = Object.keys(PROVIDERS).length;
      const manifestCount = getAvailableProviders().length;
      const withManifestFlag = (Object.values(PROVIDERS) as ProviderConfig[]).filter(
        (p) => p.hasManifest
      ).length;

      console.log(`
Registry Sync Summary:
- Total providers in registry: ${registryCount}
- Total manifests available: ${manifestCount}
- Registry entries with hasManifest=true: ${withManifestFlag}
      `);

      // Basic sanity check - we should have manifests for providers that claim to have them
      expect(manifestCount).toBeGreaterThanOrEqual(withManifestFlag);
    });
  });
});
