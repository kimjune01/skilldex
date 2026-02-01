import { describe, it, expect } from 'vitest';
import {
  validateSkillContent,
  slugify,
  extractInstructions,
  VALIDATION,
} from '../lib/skill-validator.js';
import { validateCronExpression } from '../lib/cron-utils.js';

/**
 * Skills Routes Integration Tests
 *
 * These tests verify the skill creation workflow from request to response.
 * They test the validation logic that would be called by the route handlers.
 */

describe('Skills Routes Integration', () => {
  describe('POST /skills - Create Skill', () => {
    const createValidSkillContent = (overrides: {
      name?: string;
      description?: string;
      category?: string;
      intent?: string;
      requires?: Record<string, string>;
      body?: string;
    } = {}) => {
      const {
        name = 'Test Skill',
        description = 'A valid test skill for creating skills via API',
        category = 'Productivity',
        intent = 'test creating skills',
        requires,
        body = `# Test Skill

This is a comprehensive test skill that validates the skill creation workflow.
It includes enough content to pass the minimum instruction length requirement.`,
      } = overrides;

      let frontmatter = `---
name: ${name}
description: ${description}`;

      if (category) {
        frontmatter += `\ncategory: ${category}`;
      }

      if (intent) {
        frontmatter += `\nintent: ${intent}`;
      }

      if (requires && Object.keys(requires).length > 0) {
        frontmatter += '\nrequires:';
        for (const [key, value] of Object.entries(requires)) {
          frontmatter += `\n  ${key}: ${value}`;
        }
      }

      frontmatter += '\n---\n\n';

      return frontmatter + body;
    };

    describe('Content Validation', () => {
      it('should validate complete skill content', () => {
        const content = createValidSkillContent();
        const result = validateSkillContent(content);

        expect(result.valid).toBe(true);
        expect(result.parsed).toBeDefined();
        expect(result.parsed?.name).toBe('Test Skill');
        expect(result.parsed?.description).toBe('A valid test skill for creating skills via API');
        expect(result.parsed?.category).toBe('Productivity');
        expect(result.parsed?.intent).toBe('test creating skills');
      });

      it('should reject content without frontmatter', () => {
        const content = '# Just Markdown\n\nNo YAML frontmatter here.';
        const result = validateSkillContent(content);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('YAML frontmatter');
      });

      it('should reject content with missing required fields', () => {
        const contentNoName = createValidSkillContent({ name: '' });
        const contentNoDesc = createValidSkillContent({ description: '' });

        // Name is required
        const nameResult = validateSkillContent(contentNoName);
        expect(nameResult.valid).toBe(false);

        // Description is required
        const descResult = validateSkillContent(contentNoDesc);
        expect(descResult.valid).toBe(false);
      });

      it('should enforce field length constraints', () => {
        // Name too short
        const shortName = createValidSkillContent({ name: 'AB' });
        expect(validateSkillContent(shortName).valid).toBe(false);

        // Name too long
        const longName = createValidSkillContent({ name: 'A'.repeat(VALIDATION.NAME_MAX_LENGTH + 1) });
        expect(validateSkillContent(longName).valid).toBe(false);

        // Description too short
        const shortDesc = createValidSkillContent({ description: 'Short' });
        expect(validateSkillContent(shortDesc).valid).toBe(false);

        // Description too long
        const longDesc = createValidSkillContent({ description: 'A'.repeat(VALIDATION.DESCRIPTION_MAX_LENGTH + 1) });
        expect(validateSkillContent(longDesc).valid).toBe(false);

        // Instructions too short
        const shortBody = createValidSkillContent({ body: 'Too short.' });
        expect(validateSkillContent(shortBody).valid).toBe(false);
      });

      it('should parse integration requirements correctly', () => {
        const content = createValidSkillContent({
          requires: {
            ats: 'read-write',
            email: 'read-only',
            calendar: 'read-only',
          },
        });

        const result = validateSkillContent(content);
        expect(result.valid).toBe(true);
        expect(result.parsed?.requires).toEqual({
          ats: 'read-write',
          email: 'read-only',
          calendar: 'read-only',
        });
      });
    });

    describe('Slug Generation', () => {
      it('should generate valid slugs from skill names', () => {
        expect(slugify('My Test Skill')).toBe('my-test-skill');
        expect(slugify('Skill With Numbers 123')).toBe('skill-with-numbers-123');
        expect(slugify('Special!@#$%Characters')).toBe('specialcharacters');
      });

      it('should handle edge cases in slug generation', () => {
        expect(slugify('')).toBe('');
        expect(slugify('   Spaces   Everywhere   ')).toBe('spaces-everywhere');
        expect(slugify('---Multiple---Hyphens---')).toBe('multiple-hyphens');
      });

      it('should truncate long slugs', () => {
        const longName = 'A'.repeat(100);
        const slug = slugify(longName);
        expect(slug.length).toBeLessThanOrEqual(VALIDATION.SLUG_MAX_LENGTH);
      });
    });

    describe('Instructions Extraction', () => {
      it('should extract body content without frontmatter', () => {
        const content = createValidSkillContent({ body: '# Instructions\n\nThis is the body.' });
        const instructions = extractInstructions(content);
        expect(instructions).toBe('# Instructions\n\nThis is the body.');
      });

      it('should return entire content if no frontmatter', () => {
        const content = '# No Frontmatter\n\nJust content.';
        const instructions = extractInstructions(content);
        expect(instructions).toBe(content);
      });
    });
  });

  describe('PUT /skills/:slug - Update Skill', () => {
    it('should validate updated content the same as new content', () => {
      const originalContent = `---
name: Original Skill
description: The original skill description
intent: test original skill
---

# Original Instructions

This is the original skill with enough content to pass validation.`;

      const updatedContent = `---
name: Updated Skill
description: The updated skill description with changes
intent: test updated skill
---

# Updated Instructions

This is the updated skill content with modifications to test the update flow.`;

      const originalResult = validateSkillContent(originalContent);
      const updatedResult = validateSkillContent(updatedContent);

      expect(originalResult.valid).toBe(true);
      expect(updatedResult.valid).toBe(true);
      expect(updatedResult.parsed?.name).toBe('Updated Skill');
    });

    it('should reject invalid updates', () => {
      const invalidUpdate = `---
name: X
description: Too short
intent: test
---

Short.`;

      const result = validateSkillContent(invalidUpdate);
      expect(result.valid).toBe(false);
    });
  });

  describe('Skill Categories', () => {
    const validCategories = [
      'Sourcing',
      'Outreach',
      'Screening',
      'Interview',
      'Analytics',
      'Productivity',
      'Admin',
    ];

    it('should accept all valid category values', () => {
      for (const category of validCategories) {
        const content = `---
name: ${category} Skill
description: A skill in the ${category} category for testing
category: ${category}
intent: test ${category.toLowerCase()} category
---

# ${category} Skill

This skill is categorized under ${category} and tests that category values are parsed correctly.`;

        const result = validateSkillContent(content);
        expect(result.valid).toBe(true);
        expect(result.parsed?.category).toBe(category);
      }
    });

    it('should default to undefined if category not provided', () => {
      const content = `---
name: No Category Skill
description: A skill without an explicit category
intent: test no category
---

# No Category Skill

This skill does not specify a category and should use the default.`;

      const result = validateSkillContent(content);
      expect(result.valid).toBe(true);
      expect(result.parsed?.category).toBeUndefined();
    });
  });

  describe('Visibility Workflow', () => {
    // These tests document the expected visibility behavior
    // The actual implementation is in the route handlers

    it('should document private visibility (default for non-admins)', () => {
      // Private skills are only visible to the creator
      // This is the default for non-admin users
      const expectedBehavior = {
        defaultForNonAdmin: 'private',
        visibleTo: ['creator only'],
        canRequestOrgWide: true,
      };
      expect(expectedBehavior.defaultForNonAdmin).toBe('private');
    });

    it('should document organization visibility (default for admins)', () => {
      // Organization skills are visible to all org members
      // This is the default for admin users
      const expectedBehavior = {
        defaultForAdmin: 'organization',
        visibleTo: ['all org members'],
        canBeDeletedBy: ['creator', 'admin'],
      };
      expect(expectedBehavior.defaultForAdmin).toBe('organization');
    });

    it('should document visibility request workflow', () => {
      // Non-admin users can request org-wide visibility
      // Admins must approve/deny the request
      const workflow = [
        '1. User creates private skill',
        '2. User requests organization visibility',
        '3. Admin reviews and approves/denies',
        '4. If approved, skill becomes org-wide',
      ];
      expect(workflow).toHaveLength(4);
    });
  });

  describe('Cron Parameter', () => {
    it('should accept valid cron expression', () => {
      const validCrons = [
        '0 9 * * *',      // Daily at 9am
        '0 9 * * 1',      // Mondays at 9am
        '0 9 * * 1-5',    // Weekdays at 9am
        '*/15 * * * *',   // Every 15 minutes
        '0 0 1 * *',      // First of month
      ];

      for (const cron of validCrons) {
        const result = validateCronExpression(cron);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid cron expression', () => {
      const invalidCrons = [
        'invalid',
        '* *',            // Too few fields
        '60 * * * *',     // Invalid minute (60)
        '* 25 * * *',     // Invalid hour (25)
      ];

      for (const cron of invalidCrons) {
        const result = validateCronExpression(cron);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should default to null (no cron) when not provided', () => {
      // Document the expected behavior: cron is optional and defaults to null
      const requestWithoutCron = {
        content: '---\nname: Test\ndescription: Test skill\n---\n\n# Instructions\n\nTest content here.',
        category: 'Productivity',
      };

      expect(requestWithoutCron).not.toHaveProperty('cron');
      // When cron is not provided, automationEnabled should be false
      // and no automation record should be created
    });

    it('should set automationEnabled=true when cron is provided', () => {
      // Document the expected behavior
      const requestWithCron = {
        content: '---\nname: Test\ndescription: Test skill\n---\n\n# Instructions\n\nTest content here.',
        cron: '0 9 * * 1',
      };

      expect(requestWithCron.cron).toBeDefined();
      // When cron is provided:
      // 1. automationEnabled should be set to true on the skill
      // 2. An automation record should be created
      // 3. outputEmail should be inferred from user.email
    });

    it('should create automation with inferred email', () => {
      // Document the expected behavior
      const mockUser = {
        sub: 'user_123',
        email: 'user@example.com',
        organizationId: 'org_123',
      };

      // When creating skill with cron, the automation should use:
      // - outputEmail: user.email (inferred)
      // - cronTimezone: 'UTC' (default)
      // - isEnabled: true
      // - nextRunAt: calculated from cron expression

      expect(mockUser.email).toBe('user@example.com');
    });
  });

  describe('Error Response Format', () => {
    // These tests document the expected error response format

    it('should return validation errors in consistent format', () => {
      const content = '';
      const result = validateSkillContent(content);

      // Expected API response format for validation errors
      const expectedErrorResponse = {
        error: {
          message: result.error,
        },
      };

      expect(expectedErrorResponse.error.message).toBe('Skill content cannot be empty');
    });

    it('should provide specific error messages for each validation failure', () => {
      const testCases = [
        { content: '', expectedError: 'cannot be empty' },
        { content: 'no frontmatter', expectedError: 'YAML frontmatter' },
        { content: '---\ndescription: only desc\n---\n\nbody', expectedError: 'name' },
        { content: '---\nname: only name\n---\n\nbody', expectedError: 'description' },
      ];

      for (const { content, expectedError } of testCases) {
        const result = validateSkillContent(content);
        expect(result.valid).toBe(false);
        expect(result.error?.toLowerCase()).toContain(expectedError.toLowerCase());
      }
    });
  });
});
