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
    it('should register dynamic ATS tools when hasATS is true and provider has manifest', async () => {
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

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

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

      await registerTools(
        mockServer as any,
        mockClient as SkillomaticClient,
        profile
      );

      expect(registerAtsTools).not.toHaveBeenCalled();
    });
  });
});
