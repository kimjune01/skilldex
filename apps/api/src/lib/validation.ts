/**
 * Input Validation Schemas
 *
 * Centralized Zod schemas for request validation.
 * Industry standard approach to prevent injection attacks and ensure data integrity.
 *
 * @see https://zod.dev/
 */

import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '@skillomatic/shared';

// ============ Common Validators ============

/** Valid email format */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase().trim());

/** Password with minimum requirements */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'Password too long');

/** UUID v4 format */
export const uuidSchema = z.string().uuid('Invalid ID format');

/** Non-empty string with max length */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .transform((s) => s.trim());

/** URL validation */
export const urlSchema = z.string().url('Invalid URL format').max(2048, 'URL too long');

/** Slug format (lowercase, alphanumeric, hyphens) */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only');

// ============ Auth Schemas ============

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequestValidated = z.infer<typeof loginRequestSchema>;

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});
export type SignupRequestValidated = z.infer<typeof signupRequestSchema>;

// ============ API Key Schemas ============

export const apiKeyCreateSchema = z.object({
  name: z
    .string()
    .max(100, 'Name too long')
    .transform((s) => s?.trim() || 'API Key')
    .optional(),
});
export type ApiKeyCreateValidated = z.infer<typeof apiKeyCreateSchema>;

// ============ Organization Schemas ============

export const createOrgSchema = z.object({
  name: nameSchema.refine(
    (name) => name.length >= 2,
    'Organization name must be at least 2 characters'
  ),
});
export type CreateOrgValidated = z.infer<typeof createOrgSchema>;

export const joinOrgSchema = z.object({
  orgId: uuidSchema,
});
export type JoinOrgValidated = z.infer<typeof joinOrgSchema>;

export const updateOrgSchema = z.object({
  name: nameSchema.optional(),
  allowedDomains: z.array(z.string().max(255)).max(50).optional(),
  logoUrl: urlSchema.optional().nullable(),
});
export type UpdateOrgValidated = z.infer<typeof updateOrgSchema>;

// ============ Skill Schemas ============

export const skillCategorySchema = z.enum([
  'sourcing',
  'ats',
  'communication',
  'scheduling',
  'productivity',
  'system',
]);

export const skillVisibilitySchema = z.enum(['private', 'organization']);

export const skillCreateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
  category: skillCategorySchema.optional(),
  visibility: skillVisibilitySchema.optional().default('private'),
});
export type SkillCreateValidated = z.infer<typeof skillCreateSchema>;

export const skillUpdateSchema = z.object({
  content: z.string().min(1).max(100000).optional(),
  name: nameSchema.optional(),
  description: z.string().max(1000).optional(),
  category: skillCategorySchema.optional(),
  intent: z.string().max(500).optional(),
  capabilities: z.array(z.string().max(200)).max(20).optional(),
  isEnabled: z.boolean().optional(),
});
export type SkillUpdateValidated = z.infer<typeof skillUpdateSchema>;

// ============ Integration Schemas ============

export const integrationConnectSchema = z.object({
  provider: z.string().min(1).max(50),
  subProvider: z.string().max(50).optional(),
});
export type IntegrationConnectValidated = z.infer<typeof integrationConnectSchema>;

// ============ Scrape Task Schemas ============

export const createScrapeTaskSchema = z.object({
  url: urlSchema.refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must be HTTP or HTTPS'
  ),
});
export type CreateScrapeTaskValidated = z.infer<typeof createScrapeTaskSchema>;

export const updateScrapeTaskSchema = z.object({
  status: z.enum(['completed', 'failed']),
  result: z.string().max(1000000).optional(), // 1MB max for scraped content
  errorMessage: z.string().max(1000).optional(),
});
export type UpdateScrapeTaskValidated = z.infer<typeof updateScrapeTaskSchema>;

// ============ Error Report Schemas ============

export const errorCodeSchema = z.enum([
  'LLM_AUTH_FAILED',
  'LLM_RATE_LIMITED',
  'LLM_TIMEOUT',
  'LLM_INVALID_RESPONSE',
  'LLM_CONTEXT_TOO_LONG',
  'LLM_CONTENT_FILTERED',
  'ATS_AUTH_FAILED',
  'ATS_NOT_FOUND',
  'ATS_RATE_LIMITED',
  'ATS_TIMEOUT',
  'ATS_INVALID_REQUEST',
  'SKILL_NOT_FOUND',
  'SKILL_DISABLED',
  'SKILL_MISSING_CAPABILITY',
  'SKILL_RENDER_FAILED',
  'SCRAPE_TIMEOUT',
  'SCRAPE_BLOCKED',
  'SCRAPE_NOT_LOGGED_IN',
  'SCRAPE_INVALID_URL',
  'INTEGRATION_NOT_CONNECTED',
  'INTEGRATION_TOKEN_EXPIRED',
  'INTEGRATION_OAUTH_FAILED',
  'NETWORK_ERROR',
  'VALIDATION_ERROR',
  'UNKNOWN_ERROR',
]);

export const errorCategorySchema = z.enum([
  'llm',
  'ats',
  'skill',
  'scrape',
  'integration',
  'system',
]);

export const errorReportSchema = z.object({
  errorCode: errorCodeSchema,
  errorCategory: errorCategorySchema,
  skillSlug: slugSchema.optional(),
  provider: z.string().max(50).optional(),
  action: z.string().max(100).optional(),
  httpStatus: z.number().int().min(100).max(599).optional(),
  sessionId: z.string().max(100),
  timestamp: z.number().int().positive(),
});
export type ErrorReportValidated = z.infer<typeof errorReportSchema>;

// ============ Pay Intention Schemas ============

export const payIntentionTriggerSchema = z.enum(['individual_ats', 'premium_integration']);

export const createPayIntentionSchema = z.object({
  triggerType: payIntentionTriggerSchema,
  triggerProvider: z.string().max(50).optional(),
});
export type CreatePayIntentionValidated = z.infer<typeof createPayIntentionSchema>;

// ============ User/Invite Schemas ============

export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member']).optional().default('member'),
});
export type InviteUserValidated = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  isAdmin: z.boolean().optional(),
});
export type UpdateUserValidated = z.infer<typeof updateUserSchema>;

// ============ Pagination Schemas ============

export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '20', 10);
      return Math.min(Math.max(1, num), 100); // Clamp between 1 and 100
    }),
  offset: z
    .string()
    .optional()
    .transform((v) => {
      const num = parseInt(v || '0', 10);
      return Math.max(0, num);
    }),
});
export type PaginationValidated = z.infer<typeof paginationSchema>;

// ============ Search Schemas ============

export const searchQuerySchema = z.object({
  q: z
    .string()
    .max(200, 'Query too long')
    .transform((s) => s.trim())
    .optional(),
  ...paginationSchema.shape,
});
export type SearchQueryValidated = z.infer<typeof searchQuerySchema>;

// ============ Utility Functions ============

/**
 * Validate request body with a schema
 * Returns validated data or throws validation error
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(`Invalid request body: ${errors.join(', ')}`);
  }
  return result.data;
}

/**
 * Validate query parameters with a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, string>): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(`Invalid query parameters: ${errors.join(', ')}`);
  }
  return result.data;
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Sanitize string input (trim and normalize whitespace)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Check if string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick=, onload=, etc.
    /data:/i,
    /vbscript:/i,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(input));
}
