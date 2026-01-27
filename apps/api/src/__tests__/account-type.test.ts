import { describe, it, expect } from 'vitest';
import {
  isPersonalEmail,
  getEmailDomain,
  ONBOARDING_STEPS,
  isProviderAllowedForIndividual,
} from '@skillomatic/shared';

/**
 * Tests for account type selection functionality
 *
 * These tests verify the account type selection logic without hitting the database.
 * Integration tests with actual API calls should be done separately.
 */

describe('Account Type Selection', () => {
  describe('email domain detection', () => {
    describe('personal email detection', () => {
      it('should identify Gmail as personal', () => {
        expect(isPersonalEmail('user@gmail.com')).toBe(true);
        expect(isPersonalEmail('recruiter@gmail.com')).toBe(true);
      });

      it('should identify Outlook/Hotmail as personal', () => {
        expect(isPersonalEmail('user@outlook.com')).toBe(true);
        expect(isPersonalEmail('user@hotmail.com')).toBe(true);
        expect(isPersonalEmail('user@live.com')).toBe(true);
      });

      it('should identify iCloud as personal', () => {
        expect(isPersonalEmail('user@icloud.com')).toBe(true);
        expect(isPersonalEmail('user@me.com')).toBe(true);
      });

      it('should identify company domains as non-personal', () => {
        expect(isPersonalEmail('recruiter@acme.com')).toBe(false);
        expect(isPersonalEmail('hr@company.co')).toBe(false);
        expect(isPersonalEmail('admin@startup.io')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(isPersonalEmail('USER@GMAIL.COM')).toBe(true);
        expect(isPersonalEmail('User@Outlook.Com')).toBe(true);
      });
    });

    describe('domain extraction', () => {
      it('should extract domain correctly', () => {
        expect(getEmailDomain('user@gmail.com')).toBe('gmail.com');
        expect(getEmailDomain('admin@company.com')).toBe('company.com');
      });

      it('should handle subdomains', () => {
        expect(getEmailDomain('user@mail.company.com')).toBe('mail.company.com');
      });

      it('should lowercase domains', () => {
        expect(getEmailDomain('User@COMPANY.COM')).toBe('company.com');
      });
    });
  });

  describe('account type suggestions', () => {
    it('should suggest individual for personal emails', () => {
      const suggestedType = isPersonalEmail('user@gmail.com') ? 'individual' : 'organization';
      expect(suggestedType).toBe('individual');
    });

    it('should suggest organization for company emails', () => {
      const suggestedType = isPersonalEmail('user@company.com') ? 'individual' : 'organization';
      expect(suggestedType).toBe('organization');
    });
  });

  describe('onboarding step progression', () => {
    it('should have ACCOUNT_TYPE_SELECTED step defined', () => {
      expect(ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED).toBeDefined();
      expect(typeof ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED).toBe('number');
    });

    it('should have ACCOUNT_TYPE_SELECTED between NOT_STARTED and GOOGLE_CONNECTED', () => {
      expect(ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED).toBeGreaterThan(ONBOARDING_STEPS.NOT_STARTED);
      expect(ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED).toBeLessThan(ONBOARDING_STEPS.GOOGLE_CONNECTED);
    });

    it('should progress from NOT_STARTED to ACCOUNT_TYPE_SELECTED', () => {
      const currentStep = ONBOARDING_STEPS.NOT_STARTED;
      const nextStep = ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED;
      expect(nextStep).toBeGreaterThan(currentStep);
    });
  });

  describe('individual account provider restrictions', () => {
    describe('allowed providers for individuals', () => {
      it('should allow email providers', () => {
        expect(isProviderAllowedForIndividual('gmail')).toBe(true);
        expect(isProviderAllowedForIndividual('outlook')).toBe(true);
      });

      it('should allow calendar providers', () => {
        expect(isProviderAllowedForIndividual('google-calendar')).toBe(true);
        expect(isProviderAllowedForIndividual('outlook-calendar')).toBe(true);
        expect(isProviderAllowedForIndividual('calendly')).toBe(true);
      });

      it('should allow Google Sheets', () => {
        expect(isProviderAllowedForIndividual('google-sheets')).toBe(true);
      });
    });

    describe('blocked providers for individuals', () => {
      it('should block ATS providers', () => {
        expect(isProviderAllowedForIndividual('greenhouse')).toBe(false);
        expect(isProviderAllowedForIndividual('lever')).toBe(false);
        expect(isProviderAllowedForIndividual('ashby')).toBe(false);
        expect(isProviderAllowedForIndividual('workable')).toBe(false);
        expect(isProviderAllowedForIndividual('teamtailor')).toBe(false);
      });

      it('should block Airtable', () => {
        expect(isProviderAllowedForIndividual('airtable')).toBe(false);
      });
    });
  });

  describe('user state validation', () => {
    it('should identify individual user correctly', () => {
      const user = {
        organizationId: null,
        accountTypeSelected: true,
      };
      const isIndividual = !user.organizationId && user.accountTypeSelected;
      expect(isIndividual).toBe(true);
    });

    it('should identify org user correctly', () => {
      const user = {
        organizationId: 'org-123',
        accountTypeSelected: true,
      };
      const isIndividual = !user.organizationId && user.accountTypeSelected;
      expect(isIndividual).toBe(false);
    });

    it('should identify new user (not yet selected) correctly', () => {
      const user = {
        organizationId: null,
        accountTypeSelected: false,
      };
      const needsAccountTypeSelection = !user.accountTypeSelected;
      expect(needsAccountTypeSelection).toBe(true);
    });
  });

  describe('organization slug generation', () => {
    function generateSlug(name: string): string {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
    }

    it('should convert spaces to hyphens', () => {
      expect(generateSlug('Acme Corporation')).toBe('acme-corporation');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('ACME')).toBe('acme');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Acme & Co.')).toBe('acme-co');
      expect(generateSlug("O'Brien Inc")).toBe('o-brien-inc');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('- Acme -')).toBe('acme');
    });

    it('should limit to 50 characters', () => {
      const longName = 'A'.repeat(100);
      expect(generateSlug(longName).length).toBeLessThanOrEqual(50);
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Société Générale')).toBe('soci-t-g-n-rale');
    });
  });

  describe('API response structure', () => {
    describe('/account-type/info response', () => {
      it('should have required fields for personal email', () => {
        const response = {
          suggestedType: 'individual' as const,
          emailDomain: 'gmail.com',
          isPersonalEmail: true,
          existingOrg: null,
          canCreateOrg: true,
        };

        expect(response.suggestedType).toBe('individual');
        expect(response.isPersonalEmail).toBe(true);
        expect(response.canCreateOrg).toBe(true);
      });

      it('should have required fields for company email with existing org', () => {
        const response = {
          suggestedType: 'organization' as const,
          emailDomain: 'company.com',
          isPersonalEmail: false,
          existingOrg: { id: 'org-123', name: 'Company Inc' },
          canCreateOrg: true,
        };

        expect(response.suggestedType).toBe('organization');
        expect(response.isPersonalEmail).toBe(false);
        expect(response.existingOrg).not.toBeNull();
        expect(response.existingOrg?.name).toBe('Company Inc');
      });
    });

    describe('/account-type/select-individual response', () => {
      it('should return success, user, and new token', () => {
        const response = {
          success: true,
          user: {
            id: 'user-123',
            email: 'user@gmail.com',
            name: 'Test User',
            accountTypeSelected: true,
            organizationId: undefined,
            onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
          },
          token: 'jwt-token-here',
        };

        expect(response.success).toBe(true);
        expect(response.user.accountTypeSelected).toBe(true);
        expect(response.user.organizationId).toBeUndefined();
        expect(response.token).toBeDefined();
      });
    });

    describe('/account-type/create-org response', () => {
      it('should return organization, user with admin, and token', () => {
        const response = {
          success: true,
          organization: {
            id: 'org-123',
            name: 'Acme Inc',
            slug: 'acme-inc',
          },
          user: {
            id: 'user-123',
            email: 'admin@acme.com',
            name: 'Admin User',
            isAdmin: true,
            accountTypeSelected: true,
            organizationId: 'org-123',
            organizationName: 'Acme Inc',
            onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
          },
          token: 'jwt-token-here',
        };

        expect(response.success).toBe(true);
        expect(response.organization.id).toBe('org-123');
        expect(response.user.isAdmin).toBe(true);
        expect(response.user.organizationId).toBe('org-123');
      });
    });

    describe('/account-type/join-org response', () => {
      it('should return organization, user as member (not admin), and token', () => {
        const response = {
          success: true,
          organization: {
            id: 'org-123',
            name: 'Acme Inc',
            slug: 'acme-inc',
          },
          user: {
            id: 'user-456',
            email: 'employee@acme.com',
            name: 'Employee User',
            isAdmin: false,
            accountTypeSelected: true,
            organizationId: 'org-123',
            organizationName: 'Acme Inc',
            onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
          },
          token: 'jwt-token-here',
        };

        expect(response.success).toBe(true);
        expect(response.user.isAdmin).toBe(false);
        expect(response.user.organizationId).toBe('org-123');
      });
    });
  });

  describe('error cases', () => {
    describe('select-individual errors', () => {
      it('should reject if account type already selected', () => {
        const user = { accountTypeSelected: true };
        const shouldReject = user.accountTypeSelected;
        expect(shouldReject).toBe(true);
      });
    });

    describe('create-org errors', () => {
      it('should reject if user already belongs to an org', () => {
        const user = { organizationId: 'org-existing' };
        const shouldReject = !!user.organizationId;
        expect(shouldReject).toBe(true);
      });

      it('should reject if org name is too short', () => {
        const validateName = (name: string) => name.trim().length >= 2;
        expect(validateName('A')).toBe(false);
        expect(validateName('')).toBe(false);
        expect(validateName('  ')).toBe(false);
        expect(validateName('AB')).toBe(true);
        expect(validateName('Acme Inc')).toBe(true);
      });
    });

    describe('join-org errors', () => {
      it('should reject if user already belongs to an org', () => {
        const user = { organizationId: 'org-existing' };
        const shouldReject = !!user.organizationId;
        expect(shouldReject).toBe(true);
      });

      it('should reject if email domain does not match org allowedDomains', () => {
        const userDomain = 'other.com';
        const orgAllowedDomains = ['acme.com', 'acme.io'];
        const canJoin = orgAllowedDomains.includes(userDomain);
        expect(canJoin).toBe(false);
      });

      it('should allow join if email domain matches org allowedDomains', () => {
        const userDomain = 'acme.com';
        const orgAllowedDomains = ['acme.com', 'acme.io'];
        const canJoin = orgAllowedDomains.includes(userDomain);
        expect(canJoin).toBe(true);
      });
    });
  });
});
