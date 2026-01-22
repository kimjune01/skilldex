/**
 * Production migration script for Turso database
 *
 * Run with: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate:prod
 *
 * This script creates all tables if they don't exist.
 * It's idempotent - safe to run multiple times.
 */
import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  console.error('Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate:prod');
  process.exit(1);
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// Full schema - all CREATE TABLE IF NOT EXISTS statements
const migrations = [
  // 1. Organizations (referenced by many tables)
  `CREATE TABLE IF NOT EXISTS organizations (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    llm_provider text DEFAULT 'anthropic',
    llm_api_key text,
    llm_model text,
    ats_provider text,
    ats_base_url text,
    web_ui_enabled integer DEFAULT 0 NOT NULL,
    desktop_enabled integer DEFAULT 1 NOT NULL,
    integration_permissions text,
    disabled_skills text,
    allowed_domains text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique ON organizations (slug)`,

  // Add allowed_domains column if it doesn't exist (for existing databases)
  `ALTER TABLE organizations ADD COLUMN allowed_domains text`,

  // 2. Users
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    avatar_url text,
    is_admin integer DEFAULT 0 NOT NULL,
    is_super_admin integer DEFAULT 0 NOT NULL,
    organization_id text,
    onboarding_step real DEFAULT 0 NOT NULL,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_organization ON users (organization_id)`,

  // 3. Sessions
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    expires_at integer NOT NULL,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // 4. API Keys
  `CREATE TABLE IF NOT EXISTS api_keys (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    organization_id text,
    key text NOT NULL,
    name text NOT NULL,
    last_used_at integer,
    revoked_at integer,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys (organization_id)`,

  // 5. Organization Invites
  `CREATE TABLE IF NOT EXISTS organization_invites (
    id text PRIMARY KEY NOT NULL,
    organization_id text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    token text NOT NULL,
    invited_by text NOT NULL,
    expires_at integer NOT NULL,
    accepted_at integer,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_token_unique ON organization_invites (token)`,
  `CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON organization_invites (email)`,

  // 6. Roles
  `CREATE TABLE IF NOT EXISTS roles (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    description text,
    created_at integer NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS roles_name_unique ON roles (name)`,

  // 7. Permissions
  `CREATE TABLE IF NOT EXISTS permissions (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    description text
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_unique ON permissions (name)`,

  // 8. Role Permissions
  `CREATE TABLE IF NOT EXISTS role_permissions (
    role_id text NOT NULL,
    permission_id text NOT NULL,
    PRIMARY KEY(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
  )`,

  // 9. User Roles
  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL,
    assigned_at integer NOT NULL DEFAULT (unixepoch()),
    assigned_by text,
    PRIMARY KEY(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
  )`,

  // 10. Skills
  `CREATE TABLE IF NOT EXISTS skills (
    id text PRIMARY KEY NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    version text DEFAULT '1.0.0' NOT NULL,
    organization_id text,
    is_global integer DEFAULT 1 NOT NULL,
    intent text,
    capabilities text,
    instructions text,
    required_integrations text,
    required_scopes text,
    is_enabled integer DEFAULT 1 NOT NULL,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS skills_slug_unique ON skills (slug)`,
  `CREATE INDEX IF NOT EXISTS idx_skills_organization ON skills (organization_id)`,

  // 11. Role Skills
  `CREATE TABLE IF NOT EXISTS role_skills (
    role_id text NOT NULL,
    skill_id text NOT NULL,
    assigned_at integer NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY(role_id, skill_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  )`,

  // 12. Integrations
  `CREATE TABLE IF NOT EXISTS integrations (
    id text PRIMARY KEY NOT NULL,
    provider text NOT NULL,
    nango_connection_id text,
    user_id text NOT NULL,
    organization_id text,
    status text DEFAULT 'disconnected' NOT NULL,
    last_sync_at integer,
    metadata text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS integrations_user_provider_idx ON integrations (user_id, provider)`,
  `CREATE INDEX IF NOT EXISTS idx_integrations_organization ON integrations (organization_id)`,

  // 13. Skill Usage Logs
  `CREATE TABLE IF NOT EXISTS skill_usage_logs (
    id text PRIMARY KEY NOT NULL,
    skill_id text NOT NULL,
    user_id text NOT NULL,
    api_key_id text,
    organization_id text,
    status text NOT NULL,
    duration_ms integer,
    input_summary text,
    error_message text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`,
  `CREATE INDEX IF NOT EXISTS skill_usage_logs_user_id_idx ON skill_usage_logs (user_id)`,
  `CREATE INDEX IF NOT EXISTS skill_usage_logs_created_at_idx ON skill_usage_logs (created_at)`,
  `CREATE INDEX IF NOT EXISTS skill_usage_logs_user_created_idx ON skill_usage_logs (user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS skill_usage_logs_status_idx ON skill_usage_logs (status)`,
  `CREATE INDEX IF NOT EXISTS idx_skill_usage_logs_organization ON skill_usage_logs (organization_id)`,

  // 14. Scrape Tasks
  `CREATE TABLE IF NOT EXISTS scrape_tasks (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    api_key_id text,
    organization_id text,
    url text NOT NULL,
    url_hash text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    result text,
    error_message text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    claimed_at integer,
    completed_at integer,
    expires_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS scrape_tasks_url_hash_user_idx ON scrape_tasks (url_hash, user_id)`,
  `CREATE INDEX IF NOT EXISTS scrape_tasks_status_idx ON scrape_tasks (status)`,
  `CREATE INDEX IF NOT EXISTS scrape_tasks_expires_at_idx ON scrape_tasks (expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_scrape_tasks_organization ON scrape_tasks (organization_id)`,

  // 15. Skill Proposals
  `CREATE TABLE IF NOT EXISTS skill_proposals (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    organization_id text,
    title text NOT NULL,
    description text NOT NULL,
    use_cases text,
    status text DEFAULT 'pending' NOT NULL,
    reviewed_by text,
    reviewed_at integer,
    review_feedback text,
    created_skill_id text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (created_skill_id) REFERENCES skills(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_skill_proposals_organization ON skill_proposals (organization_id)`,

  // 16. Error Events
  `CREATE TABLE IF NOT EXISTS error_events (
    id text PRIMARY KEY NOT NULL,
    organization_id text,
    user_id text,
    error_code text NOT NULL,
    error_category text NOT NULL,
    skill_slug text,
    provider text,
    action text,
    http_status integer,
    session_id text,
    created_at integer NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS error_events_created_at_idx ON error_events (created_at)`,
  `CREATE INDEX IF NOT EXISTS error_events_category_idx ON error_events (error_category)`,
  `CREATE INDEX IF NOT EXISTS error_events_org_created_idx ON error_events (organization_id, created_at)`,

  // 17. System Settings
  `CREATE TABLE IF NOT EXISTS system_settings (
    key text PRIMARY KEY NOT NULL,
    value text NOT NULL,
    is_secret integer DEFAULT 0 NOT NULL,
    updated_at integer NOT NULL DEFAULT (unixepoch()),
    updated_by text,
    FOREIGN KEY (updated_by) REFERENCES users(id)
  )`,
];

async function migrate() {
  console.log('Running production migrations against Turso...');
  console.log(`Database: ${TURSO_URL}`);

  let successCount = 0;
  let skipCount = 0;

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      // Check if it's a CREATE TABLE or CREATE INDEX
      if (sql.includes('CREATE TABLE')) {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        console.log(`✓ Table: ${tableName}`);
      } else if (sql.includes('CREATE INDEX') || sql.includes('CREATE UNIQUE INDEX')) {
        const indexName = sql.match(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+)/)?.[1];
        console.log(`  ✓ Index: ${indexName}`);
      }
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Ignore "already exists" errors
      if (message.includes('already exists')) {
        skipCount++;
      } else {
        console.error(`✗ Error: ${message}`);
        console.error(`  SQL: ${sql.slice(0, 100)}...`);
      }
    }
  }

  console.log('\n========================================');
  console.log(`Migration complete!`);
  console.log(`  Executed: ${successCount}`);
  console.log(`  Skipped (already exists): ${skipCount}`);
  console.log('========================================\n');

  // Verify by listing tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables in database:');
  for (const row of tables.rows) {
    console.log(`  - ${row.name}`);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
