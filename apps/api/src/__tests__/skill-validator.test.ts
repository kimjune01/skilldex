import { describe, it, expect } from 'vitest';
import {
  validateSkillContent,
  slugify,
  extractInstructions,
  safeJsonParse,
  VALIDATION,
} from '../lib/skill-validator.js';

describe('Skill Validator', () => {
  describe('validateSkillContent', () => {
    const validContent = `---
name: Test Skill
description: A valid test skill for testing purposes
category: Productivity
intent: test the validator
requires:
  ats: read-only
---

# Test Skill

This is a comprehensive test skill that demonstrates proper markdown format.
It includes enough content to pass the minimum instruction length requirement.`;

    it('should validate valid skill content', () => {
      const result = validateSkillContent(validContent);
      expect(result.valid).toBe(true);
      expect(result.parsed).toBeDefined();
      expect(result.parsed?.name).toBe('Test Skill');
      expect(result.parsed?.description).toBe('A valid test skill for testing purposes');
      expect(result.parsed?.category).toBe('Productivity');
      expect(result.parsed?.intent).toBe('test the validator');
      expect(result.parsed?.requires).toEqual({ ats: 'read-only' });
    });

    it('should reject empty content', () => {
      const result = validateSkillContent('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Skill content cannot be empty');
    });

    it('should reject whitespace-only content', () => {
      const result = validateSkillContent('   \n\t  ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Skill content cannot be empty');
    });

    it('should reject content without frontmatter', () => {
      const result = validateSkillContent('# Just Markdown\n\nNo frontmatter here.');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('YAML frontmatter');
    });

    it('should reject content missing name field', () => {
      const content = `---
description: A description
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject content missing description field', () => {
      const content = `---
name: Test Skill
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('description');
    });

    it('should reject missing name value', () => {
      // When name: has nothing after it, YAML parser treats it as missing
      // (regex requires at least one char after "name: ")
      const content = `---
name:
description: A valid description for testing
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      // YAML parser treats empty value as missing field
      expect(result.error).toContain('name');
    });

    it('should reject missing description value', () => {
      // When description: has nothing after it, YAML parser treats it as missing
      const content = `---
name: Valid Name
description:
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      // YAML parser treats empty value as missing field
      expect(result.error).toContain('description');
    });

    it('should reject name that is too short', () => {
      const content = `---
name: AB
description: A valid description for testing
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at least ${VALIDATION.NAME_MIN_LENGTH}`);
    });

    it('should reject name that is too long', () => {
      const longName = 'A'.repeat(VALIDATION.NAME_MAX_LENGTH + 1);
      const content = `---
name: ${longName}
description: A valid description for testing
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at most ${VALIDATION.NAME_MAX_LENGTH}`);
    });

    it('should reject description that is too short', () => {
      const content = `---
name: Valid Name
description: Short
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at least ${VALIDATION.DESCRIPTION_MIN_LENGTH}`);
    });

    it('should reject description that is too long', () => {
      const longDescription = 'A'.repeat(VALIDATION.DESCRIPTION_MAX_LENGTH + 1);
      const content = `---
name: Valid Name
description: ${longDescription}
intent: test intent
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at most ${VALIDATION.DESCRIPTION_MAX_LENGTH}`);
    });

    it('should reject instructions that are too short', () => {
      const content = `---
name: Valid Name
description: A valid description for testing
intent: test intent
---

Short.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at least ${VALIDATION.INSTRUCTIONS_MIN_LENGTH}`);
    });

    it('should reject missing intent field', () => {
      const content = `---
name: Test Skill
description: A skill without intent field
---

# Content

Some instructions here that are long enough to pass validation.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('intent');
    });

    it('should handle optional fields gracefully', () => {
      const content = `---
name: Minimal Skill
description: A skill with only required fields
intent: test the minimal skill
---

# Minimal Skill

This skill has no optional fields like category or requires.
It only includes the required frontmatter fields.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(true);
      expect(result.parsed?.requires).toBeUndefined();
      expect(result.parsed?.category).toBeUndefined();
    });

    it('should trim whitespace from parsed values', () => {
      const content = `---
name:   Spaced Name
description:   Description with spaces
intent:   Spaced intent
---

# Content with extra spaces

Instructions that are long enough to pass the validation requirements.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(true);
      expect(result.parsed?.name).toBe('Spaced Name');
      expect(result.parsed?.description).toBe('Description with spaces');
      expect(result.parsed?.intent).toBe('Spaced intent');
    });

    it('should parse requires object correctly', () => {
      const content = `---
name: Test Skill
description: A test skill description
intent: test intent
requires:
  ats: read-write
  email: read-only
---

# Content

Instructions that are long enough to pass the validation requirements.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(true);
      expect(result.parsed?.requires).toEqual({
        ats: 'read-write',
        email: 'read-only',
      });
    });

    it('should reject unknown integration names', () => {
      const content = `---
name: Test Skill
description: A test skill description
intent: test intent
requires:
  linkedin_scraper: read-only
---

# Content

Instructions that are long enough to pass the validation requirements.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown integration 'linkedin_scraper'");
      expect(result.error).toContain('email, sheets, calendar, ats');
    });

    it('should reject invalid access levels', () => {
      const content = `---
name: Test Skill
description: A test skill description
intent: test intent
requires:
  email: full-access
---

# Content

Instructions that are long enough to pass the validation requirements.`;
      const result = validateSkillContent(content);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid access level 'full-access'");
      expect(result.error).toContain('read-only');
      expect(result.error).toContain('read-write');
    });
  });

  describe('slugify', () => {
    it('should convert name to lowercase slug', () => {
      expect(slugify('My Test Skill')).toBe('my-test-skill');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('skill with spaces')).toBe('skill-with-spaces');
    });

    it('should remove special characters', () => {
      expect(slugify('Skill @#$% Name!')).toBe('skill-name');
    });

    it('should collapse multiple hyphens', () => {
      expect(slugify('skill---name')).toBe('skill-name');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(slugify('--skill-name--')).toBe('skill-name');
    });

    it('should truncate to max length', () => {
      const longName = 'a'.repeat(100);
      const result = slugify(longName);
      expect(result.length).toBe(VALIDATION.SLUG_MAX_LENGTH);
    });

    it('should handle unicode characters', () => {
      expect(slugify('Café Résumé')).toBe('caf-rsum');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle numbers', () => {
      expect(slugify('Skill V2.0')).toBe('skill-v20');
    });
  });

  describe('extractInstructions', () => {
    it('should extract body content without frontmatter', () => {
      const content = `---
name: Test
description: Test description
---

# Instructions

This is the body.`;
      const result = extractInstructions(content);
      expect(result).toBe('# Instructions\n\nThis is the body.');
    });

    it('should return entire content if no frontmatter', () => {
      const content = '# Just Content\n\nNo frontmatter.';
      const result = extractInstructions(content);
      expect(result).toBe(content);
    });

    it('should handle empty body', () => {
      const content = `---
name: Test
description: Test description
---`;
      const result = extractInstructions(content);
      expect(result).toBe('');
    });

    it('should trim body content', () => {
      const content = `---
name: Test
description: Test
---

   Trimmed content

`;
      const result = extractInstructions(content);
      expect(result).toBe('Trimmed content');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const result = safeJsonParse('not valid json', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for null', () => {
      const result = safeJsonParse(null, []);
      expect(result).toEqual([]);
    });

    it('should return fallback for undefined', () => {
      const result = safeJsonParse(undefined, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return fallback for empty string', () => {
      const result = safeJsonParse('', { empty: true });
      expect(result).toEqual({ empty: true });
    });

    it('should parse arrays correctly', () => {
      const result = safeJsonParse('["a", "b", "c"]', []);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('VALIDATION constants', () => {
    it('should have sensible default values', () => {
      expect(VALIDATION.NAME_MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION.NAME_MAX_LENGTH).toBeGreaterThan(VALIDATION.NAME_MIN_LENGTH);
      expect(VALIDATION.DESCRIPTION_MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION.DESCRIPTION_MAX_LENGTH).toBeGreaterThan(VALIDATION.DESCRIPTION_MIN_LENGTH);
      expect(VALIDATION.INSTRUCTIONS_MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION.SLUG_MAX_LENGTH).toBeGreaterThan(0);
    });
  });
});
