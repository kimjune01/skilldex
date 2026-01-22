import { sqlite } from './client.js';

// NOTE: This migration script is for local development only.
// For Turso (production), use the Turso CLI or dashboard to run migrations.
// You can copy the SQL below and execute it in the Turso shell.

// Create tables manually since drizzle-kit push has issues
const createTables = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_super_admin INTEGER NOT NULL DEFAULT 0,
  organization_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- API Keys (full key stored, retrievable anytime)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  assigned_by TEXT REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Role Skills (many-to-many: which skills each role can access)
CREATE TABLE IF NOT EXISTS role_skills (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (role_id, skill_id)
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  organization_id TEXT,
  is_global INTEGER NOT NULL DEFAULT 1,
  intent TEXT,
  capabilities TEXT,
  instructions TEXT,
  required_integrations TEXT,
  required_scopes TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  nango_connection_id TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Skill Usage Logs
CREATE TABLE IF NOT EXISTS skill_usage_logs (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  api_key_id TEXT REFERENCES api_keys(id),
  organization_id TEXT,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  input_summary TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Skill Proposals (user-submitted skill ideas for admin review)
CREATE TABLE IF NOT EXISTS skill_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  use_cases TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  review_feedback TEXT,
  created_skill_id TEXT REFERENCES skills(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- System Settings (LLM API keys, etc.)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by TEXT REFERENCES users(id)
);

-- Scrape Tasks (queue for web scraping jobs)
CREATE TABLE IF NOT EXISTS scrape_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id TEXT REFERENCES api_keys(id),
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  claimed_at INTEGER,
  completed_at INTEGER,
  expires_at INTEGER NOT NULL
);

-- Organizations (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  allowed_domains TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Organization Invites
CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON organization_invites(email);
`;

// Migration to add organization columns to existing tables
const addOrganizationColumns = `
-- Add organization columns to users (run separately due to SQLite ALTER TABLE limitations)
ALTER TABLE users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization columns to skills
ALTER TABLE skills ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE skills ADD COLUMN is_global INTEGER NOT NULL DEFAULT 1;

-- Add organization columns to api_keys
ALTER TABLE api_keys ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization columns to integrations
ALTER TABLE integrations ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization columns to skill_usage_logs
ALTER TABLE skill_usage_logs ADD COLUMN organization_id TEXT REFERENCES organizations(id);

-- Add organization columns to scrape_tasks
ALTER TABLE scrape_tasks ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization columns to skill_proposals
ALTER TABLE skill_proposals ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_organization ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_skill_usage_logs_organization ON skill_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scrape_tasks_organization ON scrape_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_skill_proposals_organization ON skill_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_skills_organization ON skills(organization_id);

-- Add allowed_domains column to organizations (for domain-based auto-assignment)
ALTER TABLE organizations ADD COLUMN allowed_domains TEXT;
`;

export function migrate() {
  if (!sqlite) {
    console.error('Migration script only works with local SQLite database.');
    console.error('For Turso, use the Turso CLI: turso db shell <db-name>');
    console.error('Then paste the SQL from this file.');
    process.exit(1);
  }

  console.log('Running migrations...');
  sqlite.exec(createTables);
  console.log('Base tables created.');

  // Run ALTER TABLE migrations (will fail silently if columns already exist)
  console.log('Adding organization columns...');
  try {
    // Split by statements and run each separately (ALTER TABLE can't be batched in SQLite)
    const statements = addOrganizationColumns
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        sqlite.exec(stmt + ';');
      } catch (e: unknown) {
        // Ignore "duplicate column" errors
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (!errorMessage.includes('duplicate column')) {
          console.warn(`Warning: ${errorMessage}`);
        }
      }
    }
    console.log('Organization columns added (or already exist).');
  } catch (e) {
    console.warn('Warning: Could not add organization columns:', e);
  }

  console.log('Migrations complete!');
}

// Export the SQL for use with Turso CLI
export { createTables as migrationSQL };
export { addOrganizationColumns as organizationMigrationSQL };

// Run if called directly
migrate();
