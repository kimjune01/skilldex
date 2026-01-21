import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerResources } from '../resources.js';
import type { SkillomaticClient, SkillPublic, RenderedSkill } from '../api-client.js';

describe('registerResources', () => {
  let mockServer: {
    resource: ReturnType<typeof vi.fn>;
  };
  let mockClient: Partial<SkillomaticClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      resource: vi.fn(),
    };
    mockClient = {
      getSkills: vi.fn(),
      getRenderedSkill: vi.fn(),
    };
  });

  describe('resource registration', () => {
    it('should register skills list resource', () => {
      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillsListCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills'
      );

      expect(skillsListCall).toBeDefined();
      expect(skillsListCall![1]).toBe('List all available Skillomatic skills');
    });

    it('should register individual skill resource template', () => {
      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillTemplateCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills/{slug}'
      );

      expect(skillTemplateCall).toBeDefined();
      expect(skillTemplateCall![1]).toBe('Get Skillomatic skill instructions by slug');
    });
  });

  describe('skills list handler', () => {
    it('should return only enabled skills', async () => {
      const mockSkills: SkillPublic[] = [
        {
          id: '1',
          slug: 'skill-enabled',
          name: 'Enabled Skill',
          description: 'An enabled skill',
          category: 'ats',
          version: '1.0.0',
          requiredIntegrations: [],
          requiredScopes: [],
          intent: 'Do something',
          capabilities: ['capability1'],
          isEnabled: true,
        },
        {
          id: '2',
          slug: 'skill-disabled',
          name: 'Disabled Skill',
          description: 'A disabled skill',
          category: 'ats',
          version: '1.0.0',
          requiredIntegrations: [],
          requiredScopes: [],
          intent: 'Do something else',
          capabilities: [],
          isEnabled: false,
        },
      ];

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockResolvedValue(mockSkills);

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillsListCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills'
      );
      const handler = skillsListCall![2];

      const result = await handler();

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('skillomatic://skills');
      expect(result.contents[0].mimeType).toBe('application/json');

      const parsed = JSON.parse(result.contents[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.skills).toHaveLength(1);
      expect(parsed.skills[0].slug).toBe('skill-enabled');
    });

    it('should include URI for each skill', async () => {
      const mockSkills: SkillPublic[] = [
        {
          id: '1',
          slug: 'test-skill',
          name: 'Test Skill',
          description: 'A test skill',
          category: 'ats',
          version: '1.0.0',
          requiredIntegrations: [],
          requiredScopes: [],
          intent: 'Test',
          capabilities: [],
          isEnabled: true,
        },
      ];

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockResolvedValue(mockSkills);

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillsListCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills'
      );
      const handler = skillsListCall![2];

      const result = await handler();
      const parsed = JSON.parse(result.contents[0].text);

      expect(parsed.skills[0].uri).toBe('skillomatic://skills/test-skill');
    });

    it('should throw on API error', async () => {
      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillsListCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills'
      );
      const handler = skillsListCall![2];

      await expect(handler()).rejects.toThrow('Failed to fetch skills: Network error');
    });
  });

  describe('individual skill handler', () => {
    it('should return formatted skill content', async () => {
      const mockSkill: RenderedSkill = {
        id: '1',
        slug: 'linkedin-lookup',
        name: 'LinkedIn Lookup',
        description: 'Look up LinkedIn profiles',
        category: 'scrape',
        version: '1.0.0',
        requiredIntegrations: ['browser-extension'],
        requiredScopes: [],
        intent: 'Find candidate info',
        capabilities: ['scrape profiles', 'extract data'],
        isEnabled: true,
        rendered: true,
        instructions: '# Steps\n1. Go to profile\n2. Extract data',
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSkill
      );

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillTemplateCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills/{slug}'
      );
      const handler = skillTemplateCall![2];

      const mockUri = {
        href: 'skillomatic://skills/linkedin-lookup',
        pathname: '/skills/linkedin-lookup',
      };

      const result = await handler(mockUri);

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('skillomatic://skills/linkedin-lookup');
      expect(result.contents[0].mimeType).toBe('text/markdown');

      const text = result.contents[0].text;
      expect(text).toContain('# LinkedIn Lookup');
      expect(text).toContain('Look up LinkedIn profiles');
      expect(text).toContain('## Skill Info');
      expect(text).toContain('**Category:** scrape');
      expect(text).toContain('**Version:** 1.0.0');
      expect(text).toContain('**Intent:** Find candidate info');
      expect(text).toContain('## Capabilities');
      expect(text).toContain('- scrape profiles');
      expect(text).toContain('- extract data');
      expect(text).toContain('## Required Integrations');
      expect(text).toContain('- browser-extension');
      expect(text).toContain('## Instructions');
      expect(text).toContain('# Steps');
    });

    it('should throw on missing slug', async () => {
      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillTemplateCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills/{slug}'
      );
      const handler = skillTemplateCall![2];

      const mockUri = {
        href: 'skillomatic://skills/',
        pathname: '/skills/',
      };

      await expect(handler(mockUri)).rejects.toThrow('Invalid skill URI: missing slug');
    });

    it('should throw on API error', async () => {
      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Skill not found')
      );

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillTemplateCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills/{slug}'
      );
      const handler = skillTemplateCall![2];

      const mockUri = {
        href: 'skillomatic://skills/nonexistent',
        pathname: '/skills/nonexistent',
      };

      await expect(handler(mockUri)).rejects.toThrow(
        "Failed to fetch skill 'nonexistent': Skill not found"
      );
    });

    it('should handle skill without optional fields', async () => {
      const mockSkill: RenderedSkill = {
        id: '1',
        slug: 'minimal-skill',
        name: 'Minimal Skill',
        description: 'A minimal skill',
        category: 'other',
        version: '1.0.0',
        requiredIntegrations: [],
        requiredScopes: [],
        intent: '',
        capabilities: [],
        isEnabled: true,
        rendered: true,
        instructions: '',
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSkill
      );

      registerResources(mockServer as any, mockClient as SkillomaticClient);

      const skillTemplateCall = mockServer.resource.mock.calls.find(
        (call) => call[0] === 'skillomatic://skills/{slug}'
      );
      const handler = skillTemplateCall![2];

      const mockUri = {
        href: 'skillomatic://skills/minimal-skill',
        pathname: '/skills/minimal-skill',
      };

      const result = await handler(mockUri);
      const text = result.contents[0].text;

      // Should have header and skill info
      expect(text).toContain('# Minimal Skill');
      expect(text).toContain('A minimal skill');
      expect(text).toContain('## Skill Info');

      // Should NOT have capabilities or required integrations sections (empty)
      expect(text).not.toContain('## Capabilities');
      expect(text).not.toContain('## Required Integrations');

      // Should NOT have Intent when empty
      expect(text).not.toContain('**Intent:**');
    });
  });
});
