/**
 * Skill Validator
 *
 * Validates user-generated skill content and provides helpers for
 * slug generation and uniqueness checks.
 */

import { db } from '@skillomatic/db';
import { skills } from '@skillomatic/db/schema';
import { eq, like } from 'drizzle-orm';
import { parse as parseYaml } from 'yaml';
import { containsInjectionPatterns } from './prompt-sanitizer.js';

// Validation constants
export const VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,
  INSTRUCTIONS_MIN_LENGTH: 50,
  SLUG_MAX_LENGTH: 50,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  parsed?: {
    name: string;
    description: string;
    category?: string;
    intent: string;
    requires?: Record<string, string>;
    requiresInput?: boolean;
  };
}

interface SkillFrontmatter {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  intent?: unknown;
  requires?: unknown;
  requiresInput?: unknown;
}

/**
 * Parse YAML frontmatter from skill content
 */
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  try {
    const frontmatter = parseYaml(match[1]) as SkillFrontmatter;
    return {
      frontmatter: frontmatter || {},
      body: match[2].trim(),
    };
  } catch {
    // Invalid YAML
    return null;
  }
}

/**
 * Validate skill content (markdown with YAML frontmatter)
 *
 * Required frontmatter fields:
 * - name: string (non-empty)
 * - description: string (non-empty)
 *
 * Optional frontmatter fields:
 * - category: string (skill category)
 * - intent: string (when to use this skill)
 * - capabilities: string[] (what the skill can do)
 * - requires: object (integration requirements, e.g., { ats: "read-only" })
 */
export function validateSkillContent(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Skill content cannot be empty' };
  }

  // Check for frontmatter
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return {
      valid: false,
      error: 'Skill must have valid YAML frontmatter (content between --- markers at the start)',
    };
  }

  const { frontmatter, body } = parsed;

  // Parse and validate name
  if (typeof frontmatter.name !== 'string' || !frontmatter.name) {
    return { valid: false, error: 'Frontmatter must include a "name" field' };
  }
  const name = frontmatter.name.trim();
  if (name.length === 0) {
    return { valid: false, error: 'Skill name cannot be empty' };
  }
  if (name.length < VALIDATION.NAME_MIN_LENGTH) {
    return { valid: false, error: `Skill name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters` };
  }
  if (name.length > VALIDATION.NAME_MAX_LENGTH) {
    return { valid: false, error: `Skill name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters` };
  }

  // Parse and validate description
  if (typeof frontmatter.description !== 'string' || !frontmatter.description) {
    return { valid: false, error: 'Frontmatter must include a "description" field' };
  }
  const description = frontmatter.description.trim();
  if (description.length === 0) {
    return { valid: false, error: 'Skill description cannot be empty' };
  }
  if (description.length < VALIDATION.DESCRIPTION_MIN_LENGTH) {
    return { valid: false, error: `Skill description must be at least ${VALIDATION.DESCRIPTION_MIN_LENGTH} characters` };
  }
  if (description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    return { valid: false, error: `Skill description must be at most ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters` };
  }

  // Check for prompt injection patterns in description
  if (containsInjectionPatterns(description)) {
    return { valid: false, error: 'Skill description contains invalid formatting' };
  }

  // Validate body (instructions) length
  if (body.length < VALIDATION.INSTRUCTIONS_MIN_LENGTH) {
    return { valid: false, error: `Skill instructions must be at least ${VALIDATION.INSTRUCTIONS_MIN_LENGTH} characters` };
  }

  // Parse category (optional)
  const category = typeof frontmatter.category === 'string' && frontmatter.category.trim()
    ? frontmatter.category.trim()
    : undefined;

  // Parse and validate intent (required)
  if (typeof frontmatter.intent !== 'string' || !frontmatter.intent.trim()) {
    return { valid: false, error: 'Frontmatter must include an "intent" field (trigger phrases for matching user requests). Load the "compose-skill" skill first for the correct format.' };
  }
  const intent = frontmatter.intent.trim();
  if (containsInjectionPatterns(intent)) {
    return { valid: false, error: 'Skill intent contains invalid formatting' };
  }

  // Parse and validate requires (must be object with valid integration names and access levels)
  const VALID_INTEGRATIONS = ['email', 'sheets', 'calendar', 'ats'];
  const VALID_ACCESS_LEVELS = ['read-only', 'read-write'];

  let requires: Record<string, string> | undefined;
  if (
    frontmatter.requires &&
    typeof frontmatter.requires === 'object' &&
    !Array.isArray(frontmatter.requires)
  ) {
    const validRequires: Record<string, string> = {};
    for (const [key, value] of Object.entries(frontmatter.requires)) {
      if (typeof value === 'string') {
        const integration = key.trim();
        const level = value.trim();

        // Validate integration name
        if (!VALID_INTEGRATIONS.includes(integration)) {
          return {
            valid: false,
            error: `Unknown integration '${integration}'. Valid integrations: ${VALID_INTEGRATIONS.join(', ')}`,
          };
        }

        // Validate access level
        if (!VALID_ACCESS_LEVELS.includes(level)) {
          return {
            valid: false,
            error: `Invalid access level '${level}' for ${integration}. Use 'read-only' or 'read-write'`,
          };
        }

        validRequires[integration] = level;
      }
    }
    if (Object.keys(validRequires).length > 0) {
      requires = validRequires;
    }
  }

  // Parse requiresInput (boolean - skills that need user input cannot be automated)
  const requiresInput = frontmatter.requiresInput === true;

  return {
    valid: true,
    parsed: {
      name,
      description,
      category,
      intent,
      requires,
      requiresInput: requiresInput || undefined,
    },
  };
}

/**
 * Generate a URL-safe slug from a skill name
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Trim leading/trailing hyphens
    .slice(0, VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Escape SQL LIKE wildcards in a string
 */
function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_]/g, '\\$&');
}

/**
 * Ensure a unique slug by appending a suffix if needed
 *
 * Strategy:
 * 1. Try the base slug
 * 2. If collision, append user ID prefix (first 8 chars)
 * 3. If still collision, append incrementing number
 */
export async function ensureUniqueSlug(baseSlug: string, userId: string): Promise<string> {
  // Check if base slug is available
  const [existing] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, baseSlug))
    .limit(1);

  if (!existing) {
    return baseSlug;
  }

  // Try with user ID prefix
  const userSlug = `${baseSlug}-${userId.slice(0, 8)}`;
  const [existingUser] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, userSlug))
    .limit(1);

  if (!existingUser) {
    return userSlug;
  }

  // Find the highest number suffix for this slug pattern
  const escapedSlug = escapeLikePattern(userSlug);
  const existingSlugs = await db
    .select()
    .from(skills)
    .where(like(skills.slug, `${escapedSlug}-%`));

  // Parse numbers from slugs like "my-skill-abc12345-1", "my-skill-abc12345-2"
  const numbers = existingSlugs
    .map(skill => {
      const match = skill.slug.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n) && n > 0);

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${userSlug}-${nextNumber}`;
}

/**
 * Extract the body (instructions) from skill content, excluding frontmatter
 */
export function extractInstructions(content: string): string {
  const parsed = parseFrontmatter(content);
  return parsed ? parsed.body : content;
}

/**
 * Parse JSON safely with a fallback value
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
