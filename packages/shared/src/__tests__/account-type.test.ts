import { describe, it, expect } from 'vitest';
import {
  PERSONAL_EMAIL_DOMAINS,
  isPersonalEmail,
  getEmailDomain,
  INDIVIDUAL_ALLOWED_PROVIDERS,
  isProviderAllowedForIndividual,
  getProvidersBlockedForIndividual,
} from '../index.js';

describe('Account Type Utilities', () => {
  describe('PERSONAL_EMAIL_DOMAINS', () => {
    it('should include common personal email providers', () => {
      expect(PERSONAL_EMAIL_DOMAINS).toContain('gmail.com');
      expect(PERSONAL_EMAIL_DOMAINS).toContain('outlook.com');
      expect(PERSONAL_EMAIL_DOMAINS).toContain('yahoo.com');
      expect(PERSONAL_EMAIL_DOMAINS).toContain('icloud.com');
      expect(PERSONAL_EMAIL_DOMAINS).toContain('hotmail.com');
      expect(PERSONAL_EMAIL_DOMAINS).toContain('protonmail.com');
    });

    it('should not include company domains', () => {
      expect(PERSONAL_EMAIL_DOMAINS).not.toContain('company.com');
      expect(PERSONAL_EMAIL_DOMAINS).not.toContain('acme.com');
      expect(PERSONAL_EMAIL_DOMAINS).not.toContain('example.com');
    });
  });

  describe('isPersonalEmail', () => {
    it('should return true for gmail addresses', () => {
      expect(isPersonalEmail('user@gmail.com')).toBe(true);
      expect(isPersonalEmail('John.Doe@gmail.com')).toBe(true);
    });

    it('should return true for outlook addresses', () => {
      expect(isPersonalEmail('user@outlook.com')).toBe(true);
      expect(isPersonalEmail('user@hotmail.com')).toBe(true);
      expect(isPersonalEmail('user@live.com')).toBe(true);
    });

    it('should return true for yahoo addresses', () => {
      expect(isPersonalEmail('user@yahoo.com')).toBe(true);
      expect(isPersonalEmail('user@ymail.com')).toBe(true);
    });

    it('should return true for iCloud addresses', () => {
      expect(isPersonalEmail('user@icloud.com')).toBe(true);
      expect(isPersonalEmail('user@me.com')).toBe(true);
      expect(isPersonalEmail('user@mac.com')).toBe(true);
    });

    it('should return true for protonmail addresses', () => {
      expect(isPersonalEmail('user@protonmail.com')).toBe(true);
      expect(isPersonalEmail('user@proton.me')).toBe(true);
    });

    it('should return false for company email addresses', () => {
      expect(isPersonalEmail('user@company.com')).toBe(false);
      expect(isPersonalEmail('recruiter@acme.com')).toBe(false);
      expect(isPersonalEmail('admin@skillomatic.technology')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isPersonalEmail('USER@GMAIL.COM')).toBe(true);
      expect(isPersonalEmail('User@Gmail.Com')).toBe(true);
      expect(isPersonalEmail('user@OUTLOOK.COM')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isPersonalEmail('notanemail')).toBe(false);
      expect(isPersonalEmail('')).toBe(false);
      expect(isPersonalEmail('user@')).toBe(false);
    });
  });

  describe('getEmailDomain', () => {
    it('should extract domain from valid email', () => {
      expect(getEmailDomain('user@gmail.com')).toBe('gmail.com');
      expect(getEmailDomain('test@company.com')).toBe('company.com');
      expect(getEmailDomain('admin@skillomatic.technology')).toBe('skillomatic.technology');
    });

    it('should return lowercase domain', () => {
      expect(getEmailDomain('USER@GMAIL.COM')).toBe('gmail.com');
      expect(getEmailDomain('Test@Company.Com')).toBe('company.com');
    });

    it('should return empty string for invalid emails', () => {
      expect(getEmailDomain('notanemail')).toBe('');
      expect(getEmailDomain('')).toBe('');
    });
  });
});

describe('Individual Account Provider Restrictions', () => {
  describe('INDIVIDUAL_ALLOWED_PROVIDERS', () => {
    it('should include email providers', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('gmail');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('outlook');
    });

    it('should include calendar providers', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('google-calendar');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('outlook-calendar');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('calendly');
    });

    it('should include Google Sheets', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('google-sheets');
    });

    it('should include expanded Google stack', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('google-drive');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('google-contacts');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('google-tasks');
    });

    it('should include Notion (full-featured free tier)', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).toContain('notion');
    });

    it('should NOT include ATS providers', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).not.toContain('greenhouse');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).not.toContain('lever');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).not.toContain('ashby');
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).not.toContain('workable');
    });

    it('should NOT include Airtable', () => {
      expect(INDIVIDUAL_ALLOWED_PROVIDERS).not.toContain('airtable');
    });
  });

  describe('isProviderAllowedForIndividual', () => {
    it('should return true for allowed email providers', () => {
      expect(isProviderAllowedForIndividual('gmail')).toBe(true);
      expect(isProviderAllowedForIndividual('outlook')).toBe(true);
    });

    it('should return true for allowed calendar providers', () => {
      expect(isProviderAllowedForIndividual('google-calendar')).toBe(true);
      expect(isProviderAllowedForIndividual('outlook-calendar')).toBe(true);
      expect(isProviderAllowedForIndividual('calendly')).toBe(true);
    });

    it('should return true for Google Sheets', () => {
      expect(isProviderAllowedForIndividual('google-sheets')).toBe(true);
    });

    it('should return true for expanded Google stack', () => {
      expect(isProviderAllowedForIndividual('google-drive')).toBe(true);
      expect(isProviderAllowedForIndividual('google-contacts')).toBe(true);
      expect(isProviderAllowedForIndividual('google-tasks')).toBe(true);
    });

    it('should return true for Notion', () => {
      expect(isProviderAllowedForIndividual('notion')).toBe(true);
    });

    it('should return false for ATS providers', () => {
      expect(isProviderAllowedForIndividual('greenhouse')).toBe(false);
      expect(isProviderAllowedForIndividual('lever')).toBe(false);
      expect(isProviderAllowedForIndividual('ashby')).toBe(false);
      expect(isProviderAllowedForIndividual('workable')).toBe(false);
      expect(isProviderAllowedForIndividual('teamtailor')).toBe(false);
    });

    it('should return false for Airtable', () => {
      expect(isProviderAllowedForIndividual('airtable')).toBe(false);
    });

    it('should return false for unknown providers', () => {
      expect(isProviderAllowedForIndividual('unknown')).toBe(false);
      expect(isProviderAllowedForIndividual('')).toBe(false);
    });
  });

  describe('getProvidersBlockedForIndividual', () => {
    it('should return providers that require organization', () => {
      const blockedProviders = getProvidersBlockedForIndividual();
      const blockedIds = blockedProviders.map((p) => p.id);

      // Should include ATS providers
      expect(blockedIds).toContain('greenhouse');
      expect(blockedIds).toContain('lever');

      // Should include Airtable
      expect(blockedIds).toContain('airtable');
    });

    it('should NOT include allowed providers', () => {
      const blockedProviders = getProvidersBlockedForIndividual();
      const blockedIds = blockedProviders.map((p) => p.id);

      // Should not include email
      expect(blockedIds).not.toContain('gmail');
      expect(blockedIds).not.toContain('outlook');

      // Should not include calendar
      expect(blockedIds).not.toContain('google-calendar');
      expect(blockedIds).not.toContain('calendly');

      // Should not include Google Sheets
      expect(blockedIds).not.toContain('google-sheets');

      // Should not include expanded Google stack
      expect(blockedIds).not.toContain('google-drive');
      expect(blockedIds).not.toContain('google-contacts');
      expect(blockedIds).not.toContain('google-tasks');

      // Should not include Notion, Trello, GitHub
      expect(blockedIds).not.toContain('notion');
      expect(blockedIds).not.toContain('trello');
      expect(blockedIds).not.toContain('github');
    });
  });
});
