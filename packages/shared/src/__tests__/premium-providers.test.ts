import { describe, it, expect } from 'vitest';
import {
  FREE_PROVIDERS,
  isPremiumProvider,
  PROVIDERS,
} from '../providers.js';

describe('Premium Provider Detection', () => {
  describe('FREE_PROVIDERS', () => {
    it('should include Gmail', () => {
      expect(FREE_PROVIDERS).toContain('gmail');
    });

    it('should include Google Calendar', () => {
      expect(FREE_PROVIDERS).toContain('google-calendar');
    });

    it('should include Calendly', () => {
      expect(FREE_PROVIDERS).toContain('calendly');
    });

    it('should include Google Sheets', () => {
      expect(FREE_PROVIDERS).toContain('google-sheets');
    });

    it('should include expanded Google stack', () => {
      expect(FREE_PROVIDERS).toContain('google-drive');
      expect(FREE_PROVIDERS).toContain('google-contacts');
      expect(FREE_PROVIDERS).toContain('google-tasks');
    });

    it('should include Cal.com', () => {
      expect(FREE_PROVIDERS).toContain('cal-com');
    });

    it('should include Notion (full-featured free tier)', () => {
      expect(FREE_PROVIDERS).toContain('notion');
    });

    it('should NOT include ATS providers', () => {
      expect(FREE_PROVIDERS).not.toContain('greenhouse');
      expect(FREE_PROVIDERS).not.toContain('lever');
      expect(FREE_PROVIDERS).not.toContain('ashby');
    });

    it('should NOT include Airtable', () => {
      expect(FREE_PROVIDERS).not.toContain('airtable');
    });

    it('should NOT include Outlook', () => {
      expect(FREE_PROVIDERS).not.toContain('outlook');
      expect(FREE_PROVIDERS).not.toContain('outlook-calendar');
    });
  });

  describe('isPremiumProvider', () => {
    it('should return false for free providers', () => {
      expect(isPremiumProvider('gmail')).toBe(false);
      expect(isPremiumProvider('google-calendar')).toBe(false);
      expect(isPremiumProvider('calendly')).toBe(false);
      expect(isPremiumProvider('google-sheets')).toBe(false);
      expect(isPremiumProvider('google-drive')).toBe(false);
      expect(isPremiumProvider('google-contacts')).toBe(false);
      expect(isPremiumProvider('google-tasks')).toBe(false);
      expect(isPremiumProvider('cal-com')).toBe(false);
      expect(isPremiumProvider('notion')).toBe(false);
      expect(isPremiumProvider('trello')).toBe(false);
      expect(isPremiumProvider('github')).toBe(false);
    });

    it('should return true for ATS providers', () => {
      expect(isPremiumProvider('greenhouse')).toBe(true);
      expect(isPremiumProvider('lever')).toBe(true);
      expect(isPremiumProvider('ashby')).toBe(true);
      expect(isPremiumProvider('workable')).toBe(true);
    });

    it('should return true for Outlook (premium)', () => {
      expect(isPremiumProvider('outlook')).toBe(true);
      expect(isPremiumProvider('outlook-calendar')).toBe(true);
    });

    it('should return true for Airtable', () => {
      expect(isPremiumProvider('airtable')).toBe(true);
    });

    it('should return false for unknown providers', () => {
      expect(isPremiumProvider('unknown-provider')).toBe(false);
      expect(isPremiumProvider('')).toBe(false);
    });

    it('should return false for dev-only providers', () => {
      // mock-ats is dev-only and should not be considered premium
      const mockAts = PROVIDERS['mock-ats'];
      if (mockAts?.devOnly) {
        expect(isPremiumProvider('mock-ats')).toBe(false);
      }
    });
  });

  describe('Premium vs Free provider consistency', () => {
    it('free providers should not be premium', () => {
      for (const provider of FREE_PROVIDERS) {
        expect(isPremiumProvider(provider)).toBe(false);
      }
    });

    it('all non-free, non-dev providers should be premium', () => {
      const nonFreeProviders = Object.values(PROVIDERS)
        .filter((p) => !p.devOnly && !FREE_PROVIDERS.includes(p.id as typeof FREE_PROVIDERS[number]));

      for (const provider of nonFreeProviders) {
        expect(isPremiumProvider(provider.id)).toBe(true);
      }
    });
  });
});
