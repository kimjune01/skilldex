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

  describe('skill discovery tools', () => {
    it('should always register get_skill_catalog tool', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      expect(mockServer.tool).toHaveBeenCalledWith(
        'get_skill_catalog',
        expect.stringContaining('automation workflows'),
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

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      expect(mockServer.tool).toHaveBeenCalledWith(
        'get_skill',
        expect.stringContaining('detailed instructions'),
        expect.objectContaining({ slug: expect.any(Object) }),
        expect.any(Function)
      );
    });
  });

  describe('base tools registration', () => {
    it('should register scrape tools when hasExtension is true', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
        hasExtension: true,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      expect(registerScrapeTools).toHaveBeenCalledWith(mockServer, mockClient);
    });

    it('should not register scrape tools when hasExtension is false', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
        hasExtension: false,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      expect(registerScrapeTools).not.toHaveBeenCalled();
    });
  });

  describe('conditional ATS tools registration', () => {
    it('should register dynamic ATS tools when hasATS is true and provider has manifest', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: true,
        hasCalendar: false,
        hasEmail: false,
        atsProvider: 'greenhouse',
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      // With dynamic tools, registerAtsTools is NOT called - tools are generated from manifest
      // Instead, server.tool() is called directly for each generated tool
      expect(registerAtsTools).not.toHaveBeenCalled();
      // Verify server.tool was called for dynamic tools
      expect(mockServer.tool).toHaveBeenCalled();
    });

    it('should register static ATS tools when provider has no manifest', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: true,
        hasCalendar: false,
        hasEmail: false,
        atsProvider: 'unsupported-ats', // Provider without a manifest
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      // Static tools are used for unsupported providers
      expect(registerAtsTools).toHaveBeenCalledWith(mockServer, mockClient);
    });

    it('should NOT register ATS tools when hasATS is false', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      expect(registerAtsTools).not.toHaveBeenCalled();
    });
  });

  describe('conditional Google Workspace tools registration', () => {
    it('should register Google Drive tools when hasGoogleDrive is true', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
        hasGoogleDrive: true,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      // Google Drive manifest has tools like list_files, get_file, export_file
      // Check that server.tool was called for Drive tools
      const toolCalls = mockServer.tool.mock.calls.map((c: any[]) => c[0]);
      expect(toolCalls).toContain('google_drive_list_files');
    });

    it('should NOT register Google Drive tools when hasGoogleDrive is false', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
        hasGoogleDrive: false,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const toolCalls = mockServer.tool.mock.calls.map((c: any[]) => c[0]);
      expect(toolCalls).not.toContain('google_drive_list_files');
    });

    it('should register multiple Google Workspace tools when connected', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
        hasGoogleDrive: true,
        hasGoogleDocs: true,
        hasGoogleTasks: true,
      };

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const toolCalls = mockServer.tool.mock.calls.map((c: any[]) => c[0]);
      expect(toolCalls).toContain('google_drive_list_files');
      expect(toolCalls).toContain('google_docs_get_document');
      expect(toolCalls).toContain('google_tasks_list_tasks');
    });
  });

  describe('get_skill_catalog handler', () => {
    it('should return formatted skill catalog', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      const mockSkills = [
        {
          slug: 'linkedin-lookup',
          name: 'LinkedIn Lookup',
          description: 'Look up candidate profiles on LinkedIn',
          intent: 'find someone on LinkedIn',
          capabilities: ['scraping'],
          isEnabled: true,
        },
        {
          slug: 'disabled-skill',
          name: 'Disabled',
          description: 'This is disabled',
          isEnabled: false,
        },
        {
          slug: 'ats-search',
          name: 'ATS Search',
          description: 'Search candidates in ATS',
          intent: 'find candidates in database',
          capabilities: ['ats'],
          isEnabled: true,
        },
      ];

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockResolvedValue(mockSkills);

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      // Get the handler for get_skill_catalog
      const catalogCall = mockServer.tool.mock.calls.find((call) => call[0] === 'get_skill_catalog');
      const handler = catalogCall![3];

      const result = await handler({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('LinkedIn Lookup');
      expect(result.content[0].text).toContain('ATS Search');
      expect(result.content[0].text).not.toContain('Disabled'); // disabled skill excluded
      expect(result.content[0].text).toContain('find someone on LinkedIn'); // intent included
    });

    it('should handle errors gracefully', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      (mockClient.getSkills as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const catalogCall = mockServer.tool.mock.calls.find((call) => call[0] === 'get_skill_catalog');
      const handler = catalogCall![3];

      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching skill catalog');
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
        slug: 'linkedin-lookup',
        instructions: '# LinkedIn Lookup\n\nFollow these steps...',
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue(mockSkill);

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const skillCall = mockServer.tool.mock.calls.find((call) => call[0] === 'get_skill');
      const handler = skillCall![3];

      const result = await handler({ slug: 'linkedin-lookup' });

      expect(result.content[0].text).toBe('# LinkedIn Lookup\n\nFollow these steps...');
    });

    it('should handle missing instructions', async () => {
      const profile: CapabilityProfile = {
        hasLLM: false,
        hasATS: false,
        hasCalendar: false,
        hasEmail: false,
      };

      (mockClient.getRenderedSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        slug: 'empty-skill',
        instructions: '',
      });

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const skillCall = mockServer.tool.mock.calls.find((call) => call[0] === 'get_skill');
      const handler = skillCall![3];

      const result = await handler({ slug: 'empty-skill' });

      expect(result.content[0].text).toBe('No instructions found for skill: empty-skill');
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

      await registerTools(mockServer as any, mockClient as SkillomaticClient, profile);

      const skillCall = mockServer.tool.mock.calls.find((call) => call[0] === 'get_skill');
      const handler = skillCall![3];

      const result = await handler({ slug: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching skill');
    });
  });
});
