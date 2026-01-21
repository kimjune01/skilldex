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
 * @see docs/ADMIN_GUIDE.md for admin operations
 * @see docs/IT_DEPLOYMENT.md for database deployment
 */
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

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
  logoUrl: text('logo_url'),

  // LLM Configuration (ephemeral architecture)
  llmProvider: text('llm_provider').default('anthropic'), // 'anthropic' | 'openai' | 'groq'
  llmApiKey: text('llm_api_key'), // Encrypted API key for org's LLM
  llmModel: text('llm_model'), // Model override (e.g., 'claude-sonnet-4-20250514')

  // ATS Configuration
  atsProvider: text('ats_provider'), // 'greenhouse' | 'lever' | 'ashby'
  atsBaseUrl: text('ats_base_url'), // ATS API base URL override

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
 * Design: Full API key is stored (not hashed) so users can retrieve it.
 * This is intentional - users need to copy their key to use in Claude.
 * Keys are soft-deleted via revokedAt instead of hard deleted.
 *
 * Format: sk_live_xxxxxxxx (32 char random string)
 */
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // Full API key (sk_live_...) - retrievable anytime
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
 * Skills are markdown files in /skills/<slug>/SKILL.md with YAML frontmatter.
 * The frontmatter contains: name, description, intent, capabilities, allowed-tools.
 * This table stores the database record; actual skill content is in the filesystem.
 *
 * @see skills/ directory for skill definitions
 * @see docs/ADMIN_GUIDE.md for adding new skills
 */
export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'linkedin-lookup'
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'sourcing', 'communication', 'ats'
  version: text('version').notNull().default('1.0.0'),

  // Organization scoping
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  isGlobal: integer('is_global', { mode: 'boolean' }).notNull().default(true), // Global skills visible to all orgs

  // Frontmatter fields (progressive disclosure - Level 1 metadata)
  intent: text('intent'), // When to use this skill (e.g., "user asks to find candidates on LinkedIn")
  capabilities: text('capabilities'), // JSON array of what the skill can do

  // Full instructions (progressive disclosure - Level 2, loaded on demand)
  instructions: text('instructions'), // Full skill instructions in markdown

  // Metadata stored as JSON strings
  requiredIntegrations: text('required_integrations'), // JSON array
  requiredScopes: text('required_scopes'), // JSON array

  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

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
});

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
});

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
});

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
