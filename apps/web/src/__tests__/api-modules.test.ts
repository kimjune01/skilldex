/**
 * Tests for API modules
 *
 * Tests the modular API client structure and backwards compatibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as { fetch: typeof fetch }).fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3000',
    },
  },
});

describe('API modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('request function', () => {
    it('should include authorization header when token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { success: true } }),
      });

      const { request } = await import('../lib/api/request');
      await request('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not include authorization when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { success: true } }),
      });

      // Need to reset the module to pick up new localStorage mock
      vi.resetModules();
      const { request } = await import('../lib/api/request');
      await request('/test');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('should throw on non-ok response with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      });

      const { request } = await import('../lib/api/request');
      await expect(request('/test')).rejects.toThrow('Unauthorized');
    });

    it('should throw generic error when no message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const { request } = await import('../lib/api/request');
      await expect(request('/test')).rejects.toThrow('Request failed (500)');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const { request } = await import('../lib/api/request');
      await expect(request('/test')).rejects.toThrow(
        'Network error. Please check your connection.'
      );
    });
  });

  describe('backwards compatibility', () => {
    it('should export all modules from index', async () => {
      const api = await import('../lib/api');

      // All modules should be defined
      expect(api.auth).toBeDefined();
      expect(api.skills).toBeDefined();
      expect(api.apiKeys).toBeDefined();
      expect(api.integrations).toBeDefined();
      expect(api.users).toBeDefined();
      expect(api.analytics).toBeDefined();
      expect(api.scrape).toBeDefined();
      expect(api.settings).toBeDefined();
      expect(api.organizations).toBeDefined();
      expect(api.invites).toBeDefined();
      expect(api.onboarding).toBeDefined();
      expect(api.accountType).toBeDefined();
    });

    it('should export request function from request module', async () => {
      const { request } = await import('../lib/api/request');

      expect(request).toBeDefined();
      expect(typeof request).toBe('function');
    });

    it('should export type interfaces', async () => {
      // This tests that the types are re-exported correctly
      // TypeScript will fail compilation if types are missing
      const api = await import('../lib/api');

      // These are runtime checks for the actual exports
      expect(api.auth.login).toBeDefined();
      expect(api.auth.me).toBeDefined();
      expect(api.auth.logout).toBeDefined();
      expect(api.skills.list).toBeDefined();
      expect(api.integrations.list).toBeDefined();
    });
  });

  describe('auth module', () => {
    it('should have login method', async () => {
      const { auth } = await import('../lib/api/auth');
      expect(auth.login).toBeDefined();
      expect(typeof auth.login).toBe('function');
    });

    it('should have me method', async () => {
      const { auth } = await import('../lib/api/auth');
      expect(auth.me).toBeDefined();
      expect(typeof auth.me).toBe('function');
    });

    it('should clear token on logout', async () => {
      const { auth } = await import('../lib/api/auth');
      await auth.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('skills module', () => {
    it('should have all CRUD methods', async () => {
      const { skills } = await import('../lib/api/skills');
      expect(skills.list).toBeDefined();
      expect(skills.get).toBeDefined();
      expect(skills.create).toBeDefined();
      expect(skills.update).toBeDefined();
      expect(skills.delete).toBeDefined();
    });

    it('should have visibility methods', async () => {
      const { skills } = await import('../lib/api/skills');
      expect(skills.requestVisibility).toBeDefined();
      expect(skills.approveVisibility).toBeDefined();
      expect(skills.denyVisibility).toBeDefined();
    });
  });

});
