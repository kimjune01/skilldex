import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerTools } from '../tools/index.js';
import type { SkillomaticClient, CapabilityProfile } from '../api-client.js';

// Mock the sub-modules
vi.mock('../tools/ats.js', () => ({
  registerAtsTools: vi.fn(),
}));

vi.mock('../tools/scrape.js', () => ({
  registerScrapeTools: vi.fn(),
}));

import { registerAtsTools } from '../tools/ats.js';
import { registerScrapeTools } from '../tools/scrape.js';

describe('registerTools', () => {
  let mockServer: {
    tool: ReturnType<typeof vi.fn>;
  };
  let mockClient: Partial<SkillomaticClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      tool: vi.fn(),
    };
    mockClient = {
      getSkills: vi.fn(),
      getRenderedSkill: vi.fn(),
    };
  });

  describe('base tools registration', () => {
    it('should always register list_skills tool', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(mockServer.tool).toHaveBeenCalledWith(
        'list_skills',
        'List all available Skillomatic skills for the current user',
        {},
        expect.any(Function)
      );
    });

    it('should always register get_skill tool', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(mockServer.tool).toHaveBeenCalledWith(
        'get_skill',
        'Get the full instructions for a specific skill',
        expect.objectContaining({ slug: expect.any(Object) }),
        expect.any(Function)
      );
    });

    it('should always register scrape tools', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(registerScrapeTools).toHaveBeenCalledWith(mockServer, mockClient);
    });
  });

  describe('conditional ATS tools registration', () => {
    it('should register ATS tools when hasATS is true', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: true,
        hasCalendar: false,
        hasEmail: false,
        atsProvider: 'greenhouse',
      };

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(registerAtsTools).toHaveBeenCalledWith(mockServer, mockClient);
    });

    it('should NOT register ATS tools when hasATS is false', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(registerAtsTools).not.toHaveBeenCalled();
    });
  });

  describe('list_skills handler', () => {
    it('should return filtered enabled skills', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      const mockSkills = [
        {
          id: '1',
          slug: 'skill-1',
          name: 'Skill 1',
          description: 'Desc 1',
          category: 'ats',
          intent: 'Intent 1',
          isEnabled: true,
        },
        {
          id: '2',
          slug: 'skill-2',
          name: 'Skill 2',
          description: 'Desc 2',
          category: 'ats',
          intent: 'Intent 2',
          isEnabled: false,
        },
        {
          id: '3',
          slug: 'skill-3',
          name: 'Skill 3',
          description: 'Desc 3',
          category: 'email',
          intent: 'Intent 3',
          isEnabled: true,
        },
      ];

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockResolvedValue(mockSkills);

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      // Get the handler for list_skills
      const listSkillsCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'list_skills'
      );
      const handler = listSkillsCall![3];

      const result = await handler({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(2); // Only enabled skills
      expect(parsed.skills).toHaveLength(2);
      expect(parsed.skills.map((s: any) => s.slug)).toEqual(['skill-1', 'skill-3']);
    });

    it('should handle errors gracefully', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      const listSkillsCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'list_skills'
      );
      const handler = listSkillsCall![3];

      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error listing skills: Network error');
    });
  });

  describe('get_skill handler', () => {
    it('should return skill instructions', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      const mockSkill = {
        slug: 'test-skill',
        rendered: true,
        instructions: '# Test Skill\n\nInstructions here.',
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSkill
      );

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      const getSkillCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_skill'
      );
      const handler = getSkillCall![3];

      const result = await handler({ slug: 'test-skill' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe('# Test Skill\n\nInstructions here.');
    });

    it('should handle missing instructions', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      const mockSkill = {
        slug: 'test-skill',
        rendered: true,
        instructions: '',
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSkill
      );

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      const getSkillCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_skill'
      );
      const handler = getSkillCall![3];

      const result = await handler({ slug: 'test-skill' });

      expect(result.content[0].text).toBe('No instructions found for skill: test-skill');
    });

    it('should handle errors gracefully', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Skill not found')
      );

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      const getSkillCall = mockServer.tool.mock.calls.find(
        (call) => call[0] === 'get_skill'
      );
      const handler = getSkillCall![3];

      const result = await handler({ slug: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching skill: Skill not found');
    });
  });
});
