import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============ USERS & AUTH ============

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ API KEYS ============

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // Full API key (sk_live_...) - retrievable anytime
  name: text('name').notNull(), // User-provided name like "My MacBook"
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ RBAC (Phase 2 Ready) ============

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

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'linkedin-lookup'
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'sourcing', 'communication', 'ats'
  version: text('version').notNull().default('1.0.0'),

  // Metadata stored as JSON strings
  requiredIntegrations: text('required_integrations'), // JSON array
  requiredScopes: text('required_scopes'), // JSON array
  // Note: intent and capabilities are parsed from SKILL.md frontmatter, not stored in DB

  // File references
  skillMdPath: text('skill_md_path').notNull(), // Relative path to SKILL.md

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

  status: text('status').notNull(), // 'success', 'error', 'partial'
  durationMs: integer('duration_ms'),
  inputSummary: text('input_summary'), // Truncated/anonymized input
  errorMessage: text('error_message'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============ SCRAPE TASKS ============

export const scrapeTasks = sqliteTable('scrape_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyId: text('api_key_id').references(() => apiKeys.id),

  url: text('url').notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
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
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
  skills: many(roleSkills),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
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
}));

// ============ TYPE EXPORTS ============

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
