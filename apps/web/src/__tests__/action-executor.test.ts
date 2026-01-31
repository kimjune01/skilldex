import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as { fetch: typeof fetch }).fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
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

// Import functions that don't depend on env vars
import { parseAction, parseAllActions, formatActionResult } from '../lib/action-executor';

describe('create_skill action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validSkillMarkdown = `---
name: Test Skill
description: A test skill for unit testing
category: Productivity
---

# Test Skill

This is the instruction body.`;

  describe('executeAction - create_skill', () => {
    it('should create a skill successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            slug: 'test-skill',
            name: 'Test Skill',
            description: 'A test skill for unit testing',
          },
        }),
      });

      // Dynamic import to pick up mocked env
      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: validSkillMarkdown });

      expect(result.success).toBe(true);
      expect(result.action).toBe('create_skill');
      expect(result.data).toEqual({
        slug: 'test-skill',
        name: 'Test Skill',
        message: 'Skill "Test Skill" created successfully. View at /skills/test-skill',
      });

      // Verify fetch was called with correct body
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/skills');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ content: validSkillMarkdown, force: false });
    });

    it('should update an existing skill with force=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            slug: 'test-skill',
            name: 'Test Skill Updated',
            description: 'Updated description',
          },
        }),
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', {
        content: validSkillMarkdown,
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('create_skill');
      expect(result.data).toEqual({
        slug: 'test-skill',
        name: 'Test Skill Updated',
        message: 'Skill "Test Skill Updated" created successfully. View at /skills/test-skill',
      });

      // Verify force was passed
      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ content: validSkillMarkdown, force: true });
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid skill format: missing required field "name"' },
        }),
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: 'invalid content' });

      expect(result.success).toBe(false);
      expect(result.action).toBe('create_skill');
      expect(result.error).toBe('Invalid skill format: missing required field "name"');
    });

    it('should handle 409 conflict error (slug exists)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: { message: 'Skill with slug "test-skill" already exists. Use force=true to overwrite.' },
        }),
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: validSkillMarkdown });

      expect(result.success).toBe(false);
      expect(result.action).toBe('create_skill');
      expect(result.error).toBe('Skill with slug "test-skill" already exists. Use force=true to overwrite.');
    });

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Unauthorized' },
        }),
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: validSkillMarkdown });

      expect(result.success).toBe(false);
      expect(result.action).toBe('create_skill');
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: validSkillMarkdown });

      expect(result.success).toBe(false);
      expect(result.action).toBe('create_skill');
      expect(result.error).toBe('Network error');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      const result = await executeAction('create_skill', { content: validSkillMarkdown });

      expect(result.success).toBe(false);
      expect(result.action).toBe('create_skill');
      // The serverRequest catches malformed JSON and returns default error message
      expect(result.error).toBe('Request failed');
    });

    it('should default force to false when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            slug: 'test-skill',
            name: 'Test Skill',
            description: 'A test skill',
          },
        }),
      });

      vi.resetModules();
      const { executeAction } = await import('../lib/action-executor');
      await executeAction('create_skill', { content: validSkillMarkdown });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body).force).toBe(false);
    });
  });

  describe('parseAction - create_skill', () => {
    it('should parse create_skill action from text', () => {
      const text = `I'll create this skill for you.

\`\`\`action
{"action": "create_skill", "content": "---\\nname: My Skill\\n---\\nInstructions"}
\`\`\``;

      const result = parseAction(text);

      expect(result).toEqual({
        action: 'create_skill',
        params: {
          content: '---\nname: My Skill\n---\nInstructions',
        },
      });
    });

    it('should parse create_skill action with force param', () => {
      const text = `\`\`\`action
{"action": "create_skill", "content": "---\\nname: My Skill\\n---", "force": true}
\`\`\``;

      const result = parseAction(text);

      expect(result).toEqual({
        action: 'create_skill',
        params: {
          content: '---\nname: My Skill\n---',
          force: true,
        },
      });
    });

    it('should return null for invalid action block', () => {
      const text = 'No action block here';
      expect(parseAction(text)).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const text = `\`\`\`action
{invalid json}
\`\`\``;
      expect(parseAction(text)).toBeNull();
    });
  });

  describe('parseAllActions - create_skill', () => {
    it('should parse multiple actions including create_skill', () => {
      const text = `First, let me load the skill:

\`\`\`action
{"action": "load_skill", "slug": "sourcing"}
\`\`\`

Now I'll save a new skill:

\`\`\`action
{"action": "create_skill", "content": "---\\nname: New Skill\\n---\\nInstructions"}
\`\`\``;

      const results = parseAllActions(text);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        action: 'load_skill',
        params: { slug: 'sourcing' },
      });
      expect(results[1]).toEqual({
        action: 'create_skill',
        params: { content: '---\nname: New Skill\n---\nInstructions' },
      });
    });
  });

  describe('formatActionResult - create_skill', () => {
    it('should format successful create_skill result', () => {
      const result = {
        success: true,
        action: 'create_skill' as const,
        data: {
          slug: 'my-skill',
          name: 'My Skill',
          message: 'Skill "My Skill" created successfully. View at /skills/my-skill',
        },
      };

      const formatted = formatActionResult(result);
      expect(formatted).toBe('Skill "My Skill" created successfully. View at /skills/my-skill');
    });

    it('should format failed create_skill result', () => {
      const result = {
        success: false,
        action: 'create_skill' as const,
        error: 'Invalid skill format',
      };

      const formatted = formatActionResult(result);
      expect(formatted).toBe('Error: Invalid skill format');
    });
  });
});

describe('action executor - general', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for unknown actions without making a server call', async () => {
    vi.resetModules();

    // Mock fetch should NOT be called for unknown actions
    globalThis.fetch = vi.fn();

    const { executeAction } = await import('../lib/action-executor');
    const result = await executeAction('unknown_action' as any, {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown action: unknown_action');
    expect(result.error).toContain('MCP connection');
    // fetch should not be called for unknown actions
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('should route email actions to v1/email endpoints', async () => {
    vi.resetModules();

    // Mock fetch to return success for email search
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { emails: [], total: 0 } }),
    });

    const { executeAction } = await import('../lib/action-executor');
    const result = await executeAction('search_emails' as any, { query: 'test' });

    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/email/search'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
