import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkillomaticClient } from '../api-client.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SkillomaticClient', () => {
  let client: SkillomaticClient;

  beforeEach(() => {
    client = new SkillomaticClient({
      baseUrl: 'http://localhost:3000',
      apiKey: 'sk_live_test123',
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const clientWithSlash = new SkillomaticClient({
        baseUrl: 'http://localhost:3000/',
        apiKey: 'sk_live_test',
      });
      // We can verify by checking request URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      clientWithSlash.getSkills();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills',
        expect.any(Object)
      );
    });
  });

  describe('request', () => {
    it('should include Authorization header with API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getSkills();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_live_test123',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should unwrap data from response', async () => {
      const skills = [{ id: '1', slug: 'test-skill', name: 'Test Skill' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: skills }),
      });

      const result = await client.getSkills();
      expect(result).toEqual(skills);
    });

    it('should return response directly if no data wrapper', async () => {
      const directResponse = { message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => directResponse,
      });

      const result = await client.verifyAuth();
      expect(result).toEqual(directResponse);
    });

    it('should throw error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: 'Invalid API key' } }),
      });

      await expect(client.getSkills()).rejects.toThrow('Invalid API key');
    });

    it('should handle non-JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.getSkills()).rejects.toThrow('Internal Server Error');
    });

    it('should handle empty error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
      });

      await expect(client.getSkills()).rejects.toThrow('HTTP 500');
    });
  });

  describe('getSkills', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getSkills();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills',
        expect.any(Object)
      );
    });
  });

  describe('getSkill', () => {
    it('should call correct endpoint with slug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { slug: 'test-skill' } }),
      });

      await client.getSkill('test-skill');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills/test-skill',
        expect.any(Object)
      );
    });
  });

  describe('getRenderedSkill', () => {
    it('should call correct endpoint with slug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { slug: 'test-skill', rendered: true, instructions: '# Test' },
        }),
      });

      const result = await client.getRenderedSkill('test-skill');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills/test-skill/rendered',
        expect.any(Object)
      );
      expect(result.rendered).toBe(true);
    });
  });

  describe('getCapabilities', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            profile: { hasLLM: true, hasATS: false },
          },
        }),
      });

      await client.getCapabilities();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/skills/config',
        expect.any(Object)
      );
    });
  });

  describe('verifyAuth', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', email: 'test@example.com', name: 'Test' }),
      });

      await client.verifyAuth();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/me',
        expect.any(Object)
      );
    });
  });

  describe('searchCandidates', () => {
    it('should call endpoint without query params when none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { candidates: [], total: 0 } }),
      });

      await client.searchCandidates({});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/ats/candidates',
        expect.any(Object)
      );
    });

    it('should include query params when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { candidates: [], total: 0 } }),
      });

      await client.searchCandidates({
        q: 'engineer',
        tags: 'frontend',
        limit: 10,
        offset: 20,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/ats/candidates?q=engineer&tags=frontend&limit=10&offset=20',
        expect.any(Object)
      );
    });
  });

  describe('getCandidate', () => {
    it('should call correct endpoint with id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'cand-123' } }),
      });

      await client.getCandidate('cand-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/ats/candidates/cand-123',
        expect.any(Object)
      );
    });
  });

  describe('createCandidate', () => {
    it('should POST to correct endpoint with data', async () => {
      const candidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-123', ...candidateData } }),
      });

      await client.createCandidate(candidateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/ats/candidates',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(candidateData),
        })
      );
    });
  });

  describe('updateCandidate', () => {
    it('should PATCH to correct endpoint with data', async () => {
      const updateData = { firstName: 'Jane' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'cand-123', ...updateData } }),
      });

      await client.updateCandidate('cand-123', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/ats/candidates/cand-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('createScrapeTask', () => {
    it('should POST to correct endpoint with URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'task-123', url: 'https://linkedin.com/in/test', status: 'pending' },
        }),
      });

      await client.createScrapeTask('https://linkedin.com/in/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/scrape/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'https://linkedin.com/in/test' }),
        })
      );
    });
  });

  describe('getScrapeTask', () => {
    it('should call correct endpoint with id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'task-123', status: 'completed' } }),
      });

      await client.getScrapeTask('task-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/scrape/tasks/task-123',
        expect.any(Object)
      );
    });
  });

  describe('waitForScrapeResult', () => {
    it('should return immediately if task is completed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'task-123', status: 'completed', result: 'scraped content' },
        }),
      });

      const result = await client.waitForScrapeResult('task-123');

      expect(result.status).toBe('completed');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return immediately if task failed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'task-123', status: 'failed', errorMessage: 'Page not found' },
        }),
      });

      const result = await client.waitForScrapeResult('task-123');

      expect(result.status).toBe('failed');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should poll until completed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'task-123', status: 'pending' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'task-123', status: 'processing' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { id: 'task-123', status: 'completed', result: 'done' },
          }),
        });

      const result = await client.waitForScrapeResult('task-123', { interval: 10 });

      expect(result.status).toBe('completed');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should timeout if task never completes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'task-123', status: 'pending' } }),
      });

      await expect(
        client.waitForScrapeResult('task-123', { timeout: 50, interval: 10 })
      ).rejects.toThrow('Scrape task task-123 timed out after 50ms');
    });
  });
});
