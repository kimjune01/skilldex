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
  required_integrations TEXT,
  required_scopes TEXT,
  skill_md_path TEXT NOT NULL,
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
  console.log('Migrations complete!');
}

// Export the SQL for use with Turso CLI
export { createTables as migrationSQL };

// Run if called directly
migrate();
