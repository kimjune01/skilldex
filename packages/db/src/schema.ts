/**
 * Skillomatic Database Schema
 *
 * This file defines all database tables using Drizzle ORM.
 * SQLite is used for local development, Turso (libSQL) for production.
 *
 * Key design decisions:
 * - UUIDs (text) for all primary keys
 * - Timestamps stored as integers (Unix epoch milliseconds)
 * - API keys stored in full (not hashed) so users can retrieve them
 * - RBAC tables (roles, permissions) are ready but not fully enforced yet
 *
 * IMPORTANT: When removing columns, deprecate them first (mark as optional,
 * stop using in code) before dropping. This ensures rollbacks to older code
 * versions can still run against the current schema. See /rollback command.
 *
 * AFTER MODIFYING THIS FILE:
 * - Local: Run `pnpm db:push` to apply changes
 * - Production: Run `pnpm db:push:prod` (or include in /deploy)
 * - If db:push fails with index conflicts, delete local db and reseed:
 *   `rm packages/db/data/skillomatic.db && pnpm db:push && pnpm db:seed`
 *
 * @see docs/ADMIN_GUIDE.md for admin operations
 * @see docs/IT_DEPLOYMENT.md for database deployment
 */
import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============ ONBOARDING STEPS ============

/**
 * Onboarding step definitions using floats for future flexibility.
 * New steps can be shimmed between existing steps (e.g., 1.5 between 1 and 2).
 *
 * To check if onboarding is complete:
 *   user.onboardingStep >= ONBOARDING_STEPS.COMPLETE
 *
 * To get the max step value:
 *   Math.max(...Object.values(ONBOARDING_STEPS))
 */
/**
 * To insert a new step: bisect the two surrounding values.
 * Example: to add a step between 1 and 2, use 1.5
 */
export const ONBOARDING_STEPS = {
  /** User just created account, hasn't started onboarding */
  NOT_STARTED: 0,
  /** User has selected individual or organization account type */
  ACCOUNT_TYPE_SELECTED: 0.5,
  /** User has connected Google Sheets */
  SHEETS_CONNECTED: 1,
  /** User has connected Email */
  EMAIL_CONNECTED: 1.5,
  /** User has connected Calendar */
  CALENDAR_CONNECTED: 2,
  /** User has generated their API key for desktop chat */
  API_KEY_GENERATED: 3,
  /** User has installed the browser extension */
  EXTENSION_INSTALLED: 3.5,
  /** User has configured deployment mode (web UI or desktop) */
  DEPLOYMENT_CONFIGURED: 4,
  /** Onboarding complete */
  COMPLETE: 5,
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

/** Get the maximum onboarding step value (used to check completion) */
export const MAX_ONBOARDING_STEP = Math.max(...Object.values(ONBOARDING_STEPS));

// ============ USERS & AUTH ============

/**
 * Users table - stores user accounts
 * - isAdmin flag controls access to admin features
 * - Password is bcrypt hashed
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false), // Org admin
  isSuperAdmin: integer('is_super_admin', { mode: 'boolean' }).notNull().default(false), // System-wide admin
  organizationId: text('organization_id'), // FK added via migration (circular ref)
  /** Onboarding progress tracked as float for flexibility (see ONBOARDING_STEPS) */
  onboardingStep: real('onboarding_step').notNull().default(0),
  /** Whether user has completed account type selection (individual vs organization) */
  accountTypeSelected: integer('account_type_selected', { mode: 'boolean' }).notNull().default(false),
  /** Stripe customer ID for billing (set when user completes pay intention checkout) */
  stripeCustomerId: text('stripe_customer_id'),
  /** Quick flag to check if user has confirmed willingness to pay */
  hasConfirmedPayIntention: integer('has_confirmed_pay_intention', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ ORGANIZATIONS ============

/**
 * Organizations table - multi-tenant support
 *
 * Each organization is an isolated tenant. Users belong to exactly one organization.
 * Super admins can manage all organizations; org admins manage their own org.
 */
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier
  description: text('description'), // Optional org description
  logoUrl: text('logo_url'),

  // LLM Configuration (ephemeral architecture)
  llmProvider: text('llm_provider').default('anthropic'), // 'anthropic' | 'openai' | 'groq'
  llmApiKey: text('llm_api_key'), // Encrypted API key for org's LLM
  llmModel: text('llm_model'), // Model override (e.g., 'claude-sonnet-4-20250514')

  // ATS Configuration
  atsProvider: text('ats_provider'), // 'greenhouse' | 'lever' | 'ashby'
  atsBaseUrl: text('ats_base_url'), // ATS API base URL override

  // Deployment modes - which chat interfaces are enabled for the organization
  webUiEnabled: integer('web_ui_enabled', { mode: 'boolean' }).notNull().default(false),
  desktopEnabled: integer('desktop_enabled', { mode: 'boolean' }).notNull().default(true),

  // Integration permissions - admin controls read/write access per category
  // JSON: { "ats": "read-write", "email": "read-only", "calendar": "disabled" }
  // null = all integrations allowed with full access
  integrationPermissions: text('integration_permissions'),

  // Skill allowlist - admin can disable specific skills
  // JSON array: ["skill-slug-1", "skill-slug-2"] or null (all enabled)
  disabledSkills: text('disabled_skills'),

  // Domain-based auto-assignment - users with matching email domains auto-join this org
  // JSON array: ["acme.com", "acme.io"] or null (invite-only)
  // When a user signs up with email@acme.com, they're automatically added to this org
  allowedDomains: text('allowed_domains'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Organization Invites table - invite-only org membership
 *
 * Invites are created by org admins or super admins.
 * Users accept invites to join an organization.
 */
export const organizationInvites = sqliteTable('organization_invites', {
  id: text('id').primaryKey(), // UUID
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'), // 'admin' | 'member'
  token: text('token').notNull().unique(), // Random invite token
  invitedBy: text('invited_by').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ API KEYS ============

/**
 * API Keys table - authentication tokens for skills
 *
 * SECURITY: API keys are encrypted at rest using AES-256-GCM.
 * The encryption key is stored in environment variables, not the database.
 * This provides defense-in-depth: database breach alone doesn't expose keys.
 *
 * Keys are soft-deleted via revokedAt instead of hard deleted for audit trail.
 *
 * Format: sk_live_xxxxxxxx (32 char random string = 64 hex chars)
 */
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // Encrypted API key (AES-256-GCM)
  name: text('name').notNull(), // User-provided name like "My MacBook"
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ RBAC (Phase 2 Ready) ============

/**
 * Role-Based Access Control tables
 *
 * Currently, only isAdmin flag is enforced. These tables are ready for
 * Phase 2 implementation of fine-grained permissions:
 * - roles: Define roles like 'recruiter', 'sourcer', 'admin'
 * - permissions: Define actions like 'skills:read', 'candidates:write'
 * - rolePermissions: Map permissions to roles
 * - userRoles: Assign roles to users
 * - roleSkills: Control which skills each role can access
 */
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // 'admin', 'recruiter', 'viewer'
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // 'skills:read', 'skills:execute', 'integrations:manage'
  resource: text('resource').notNull(), // 'skills', 'integrations', 'users', 'candidates'
  action: text('action').notNull(), // 'read', 'write', 'execute', 'manage'
  description: text('description'),
});

export const rolePermissions = sqliteTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoles = sqliteTable('user_roles', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  assignedBy: text('assigned_by').references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

// Role-Skills many-to-many (skills available to each role)
export const roleSkills = sqliteTable('role_skills', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.skillId] }),
}));

// ============ SKILLS ============

/**
 * Skills table - metadata for downloadable Claude Code skills
 *
 * Skills can be:
 * 1. System skills (isGlobal=true) - seeded from /skills/<slug>/SKILL.md filesystem
 * 2. User-generated skills (sourceType='user-generated') - created via chat/API
 *
 * Visibility levels:
 * - 'private' - Only the creator can see/use (userId must be set)
 * - 'organization' - All members of the org can see/use
 *
 * @see skills/ directory for system skill definitions
 * @see docs/ADMIN_GUIDE.md for adding new skills
 */
export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'linkedin-lookup'
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'sourcing', 'communication', 'ats', 'productivity', 'system'
  version: text('version').notNull().default('1.0.0'),

  // Ownership - who created this skill (null for system skills)
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Organization scoping
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  isGlobal: integer('is_global', { mode: 'boolean' }).notNull().default(true), // System skills visible to all orgs

  // Visibility control for user-generated skills
  visibility: text('visibility').notNull().default('private'), // 'private' | 'organization'
  sourceType: text('source_type').notNull().default('filesystem'), // 'filesystem' | 'user-generated'

  // Visibility request workflow (inline for simplicity)
  pendingVisibility: text('pending_visibility'), // 'organization' if user requested sharing
  visibilityRequestedAt: integer('visibility_requested_at', { mode: 'timestamp' }),

  // Frontmatter fields (progressive disclosure - Level 1 metadata)
  intent: text('intent'), // When to use this skill (e.g., "user asks to find candidates on LinkedIn")
  capabilities: text('capabilities'), // JSON array of what the skill can do

  // Full instructions (progressive disclosure - Level 2, loaded on demand)
  instructions: text('instructions'), // Full skill instructions in markdown

  // Metadata stored as JSON strings
  requiredIntegrations: text('required_integrations'), // JSON object: {"ats": "read-only", "email": "read-write"}
  requiredScopes: text('required_scopes'), // JSON array

  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('skills_user_id_idx').on(table.userId),
  visibilityIdx: index('skills_visibility_idx').on(table.visibility),
}));

// ============ INTEGRATIONS ============

export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(), // 'linkedin', 'ats', 'email', 'google'
  nangoConnectionId: text('nango_connection_id'), // Nango's connection ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  status: text('status').notNull().default('disconnected'), // 'connected', 'disconnected', 'error'
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  metadata: text('metadata'), // JSON

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userProviderIdx: index('integrations_user_provider_idx').on(table.userId, table.provider),
}));

// ============ SKILL USAGE LOGS ============

export const skillUsageLogs = sqliteTable('skill_usage_logs', {
  id: text('id').primaryKey(),
  skillId: text('skill_id').notNull().references(() => skills.id),
  userId: text('user_id').notNull().references(() => users.id),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),
  organizationId: text('organization_id').references(() => organizations.id),

  status: text('status').notNull(), // 'success', 'error', 'partial'
  durationMs: integer('duration_ms'),
  inputSummary: text('input_summary'), // Truncated/anonymized input
  errorMessage: text('error_message'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('skill_usage_logs_user_id_idx').on(table.userId),
  createdAtIdx: index('skill_usage_logs_created_at_idx').on(table.createdAt),
  userCreatedIdx: index('skill_usage_logs_user_created_idx').on(table.userId, table.createdAt),
  statusIdx: index('skill_usage_logs_status_idx').on(table.status),
}));

// ============ SCRAPE TASKS ============

/**
 * Scrape Tasks table - queue for web scraping jobs
 *
 * Used by /linkedin-lookup to request profile scraping via browser automation.
 * Tasks are cached by URL hash to avoid redundant scrapes.
 *
 * Lifecycle:
 * 1. pending - Task created, waiting for scraper
 * 2. processing - Scraper claimed the task (claimedAt set)
 * 3. completed/failed - Scraper finished (completedAt set)
 * 4. expired - Task TTL exceeded (expiresAt passed)
 *
 * Cache behavior:
 * - Results cached for 24 hours (expiresAt)
 * - Tasks stale after 30 seconds of processing
 * - URLs normalized and hashed for deduplication
 */
export const scrapeTasks = sqliteTable('scrape_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  url: text('url').notNull(),
  urlHash: text('url_hash').notNull(), // SHA-256 hash of normalized URL for deduplication
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed, expired
  result: text('result'), // Markdown content
  errorMessage: text('error_message'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  urlHashUserIdx: index('scrape_tasks_url_hash_user_idx').on(table.urlHash, table.userId),
  statusIdx: index('scrape_tasks_status_idx').on(table.status),
  expiresAtIdx: index('scrape_tasks_expires_at_idx').on(table.expiresAt),
}));

// ============ SKILL PROPOSALS ============

export const skillProposals = sqliteTable('skill_proposals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Proposal content
  title: text('title').notNull(),
  description: text('description').notNull(), // Natural language description of desired functionality
  useCases: text('use_cases'), // JSON array of example use cases

  // Review status
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'denied'
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewFeedback: text('review_feedback'), // Admin feedback (especially on denial)

  // If approved, link to created skill
  createdSkillId: text('created_skill_id').references(() => skills.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ RELATIONS ============

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invites: many(organizationInvites),
  apiKeys: many(apiKeys),
  skills: many(skills),
  integrations: many(integrations),
  skillUsageLogs: many(skillUsageLogs),
  scrapeTasks: many(scrapeTasks),
  skillProposals: many(skillProposals),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [organizationInvites.invitedBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  roles: many(userRoles),
  integrations: many(integrations),
  skillUsage: many(skillUsageLogs),
  scrapeTasks: many(scrapeTasks),
  createdSkills: many(skills),
}));

export const scrapeTasksRelations = relations(scrapeTasks, ({ one }) => ({
  user: one(users, {
    fields: [scrapeTasks.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [scrapeTasks.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
  skills: many(roleSkills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [skills.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [skills.userId],
    references: [users.id],
  }),
  usageLogs: many(skillUsageLogs),
  roles: many(roleSkills),
}));

export const skillProposalsRelations = relations(skillProposals, ({ one }) => ({
  user: one(users, {
    fields: [skillProposals.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [skillProposals.reviewedBy],
    references: [users.id],
  }),
  createdSkill: one(skills, {
    fields: [skillProposals.createdSkillId],
    references: [skills.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

// ============ ERROR EVENTS ============

/**
 * Error Events table - persistent error attribution for telemetry
 *
 * Stores standardized error codes (no PII) for debugging and trend analysis.
 * Part of the ephemeral architecture - no raw error messages stored.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */
export const errorEvents = sqliteTable('error_events', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Classification (no PII - standardized codes only)
  errorCode: text('error_code').notNull(), // e.g., 'LLM_RATE_LIMITED', 'ATS_AUTH_FAILED'
  errorCategory: text('error_category').notNull(), // 'llm', 'ats', 'skill', 'scrape', 'integration', 'system'

  // Attribution context (no PII)
  skillSlug: text('skill_slug'),
  provider: text('provider'), // 'anthropic', 'openai', 'greenhouse', etc.
  action: text('action'), // 'search_candidates', 'load_skill', etc.
  httpStatus: integer('http_status'),

  // Correlation
  sessionId: text('session_id'), // Client session UUID (not user identity)

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  createdAtIdx: index('error_events_created_at_idx').on(table.createdAt),
  categoryIdx: index('error_events_category_idx').on(table.errorCategory),
  orgCreatedIdx: index('error_events_org_created_idx').on(table.organizationId, table.createdAt),
}));

export const errorEventsRelations = relations(errorEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [errorEvents.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [errorEvents.userId],
    references: [users.id],
  }),
}));

// ============ SYSTEM SETTINGS ============

/**
 * System Settings table - key-value store for configuration
 *
 * Used for storing LLM API keys and other system-wide settings.
 * Sensitive values (isSecret=true) should be encrypted in transit.
 *
 * Example keys:
 * - 'llm.groq_api_key' - Groq API key for chat feature
 * - 'llm.default_provider' - Which LLM provider to use
 */
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(), // 'llm.anthropic_api_key', 'llm.openai_api_key', etc.
  value: text('value').notNull(), // Encrypted for sensitive values
  isSecret: integer('is_secret', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedBy: text('updated_by').references(() => users.id),
});

// ============ PAY INTENTIONS ============

/**
 * Pay Intentions table - tracks user intent to pay for premium features
 *
 * When users attempt to access premium features (ATS for individuals,
 * premium integrations), they're redirected to Stripe Checkout ($0)
 * to add a payment method. This signals willingness to pay.
 *
 * Lifecycle:
 * 1. pending - User triggered premium feature, redirect to Stripe
 * 2. confirmed - User completed Stripe checkout, payment method on file
 * 3. cancelled - User abandoned checkout
 *
 * @see docs/BILLING.md for billing strategy
 */
export const payIntentions = sqliteTable('pay_intentions', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // What triggered the pay intention
  triggerType: text('trigger_type').notNull(), // 'individual_ats' | 'premium_integration'
  triggerProvider: text('trigger_provider'), // e.g., 'greenhouse', 'airtable', 'outlook'

  // Stripe data
  stripeCustomerId: text('stripe_customer_id'),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  stripeSetupIntentId: text('stripe_setup_intent_id'),

  // Status tracking
  status: text('status').notNull().default('pending'), // 'pending' | 'confirmed' | 'cancelled'
  confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),

  // Additional context
  metadata: text('metadata'), // JSON for extensibility

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('pay_intentions_user_id_idx').on(table.userId),
  statusIdx: index('pay_intentions_status_idx').on(table.status),
  triggerTypeIdx: index('pay_intentions_trigger_type_idx').on(table.triggerType),
}));

export const payIntentionsRelations = relations(payIntentions, ({ one }) => ({
  user: one(users, {
    fields: [payIntentions.userId],
    references: [users.id],
  }),
}));

// ============ TYPE EXPORTS ============

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvites.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type SkillUsageLog = typeof skillUsageLogs.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type SkillProposal = typeof skillProposals.$inferSelect;
export type NewSkillProposal = typeof skillProposals.$inferInsert;
export type RoleSkill = typeof roleSkills.$inferSelect;
export type ScrapeTask = typeof scrapeTasks.$inferSelect;
export type NewScrapeTask = typeof scrapeTasks.$inferInsert;
export type ErrorEvent = typeof errorEvents.$inferSelect;
export type NewErrorEvent = typeof errorEvents.$inferInsert;
export type PayIntention = typeof payIntentions.$inferSelect;
export type NewPayIntention = typeof payIntentions.$inferInsert;
