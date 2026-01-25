/**
 * Production seed script for Turso database
 *
 * Creates essential data:
 * - Default organization
 * - Users for each role type (super admin, org admin, member)
 * - Roles and role assignments
 * - All skills from skills/ directory
 * - Super admin API key for debugging
 *
 * IDEMPOTENT: Safe to run multiple times. Uses INSERT ... ON CONFLICT DO UPDATE
 * to ensure records exist with correct values without duplicating.
 *
 * Run with: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:seed:prod
 */
import { createClient } from '@libsql/client';
import { hashSync } from 'bcrypt-ts';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '../../../skills');

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  process.exit(1);
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// Fixed IDs for consistency across deploys
const DEFAULT_ORG_ID = 'org-default';

// User IDs
const SUPER_ADMIN_ID = 'user-super-admin';
const ORG_ADMIN_ID = 'user-org-admin';
const MEMBER_ID = 'user-member';

// Role IDs
const ADMIN_ROLE_ID = 'role-admin';
const RECRUITER_ROLE_ID = 'role-recruiter';
const VIEWER_ROLE_ID = 'role-viewer';

// API Key
const SUPER_ADMIN_API_KEY_ID = 'apikey-super-admin';
const SUPER_ADMIN_API_KEY = 'sk_live_prod_super_admin_debug_key_2024';

// Default password for all seed users
const DEFAULT_PASSWORD = 'Skillomatic2024';

// Parse YAML-like frontmatter from SKILL.md files
function parseSkillFrontmatter(slug: string): {
  name?: string;
  description?: string;
  intent?: string;
  capabilities?: string[];
  requires?: Record<string, string>;
  instructions?: string;
} {
  const skillPath = join(skillsDir, slug, 'SKILL.md');
  if (!existsSync(skillPath)) {
    return {};
  }

  const content = readFileSync(skillPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { instructions: content };
  }

  const frontmatter = frontmatterMatch[1];
  const instructions = content.slice(frontmatterMatch[0].length).trim();

  let name: string | undefined;
  let description: string | undefined;
  let intent: string | undefined;
  let capabilities: string[] = [];
  let requires: Record<string, string> | undefined;

  // Parse name
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  // Parse description
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // Parse intent
  const intentMatch = frontmatter.match(/^intent:\s*(.+)$/m);
  if (intentMatch) {
    intent = intentMatch[1].trim();
  }

  // Parse capabilities (YAML array)
  const capabilitiesMatch = frontmatter.match(/^capabilities:\n((?:\s+-\s+.+\n?)+)/m);
  if (capabilitiesMatch) {
    capabilities = capabilitiesMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
  }

  // Parse requires (YAML object with category: access-level)
  const requiresMatch = frontmatter.match(/^requires:\n((?:\s+\w+:\s+.+\n?)+)/m);
  if (requiresMatch) {
    requires = {};
    const lines = requiresMatch[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^\s+(\w+):\s+(.+)$/);
      if (match) {
        requires[match[1].trim()] = match[2].trim();
      }
    }
  }

  return { name, description, intent, capabilities, requires, instructions };
}

// Skills to seed (from skills/ directory, not .claude/commands/)
const SKILLS = [
  { slug: 'linkedin-lookup', category: 'sourcing', isEnabled: true },
  { slug: 'ats-candidate-search', category: 'ats', isEnabled: true },
  { slug: 'ats-candidate-crud', category: 'ats', isEnabled: true },
  { slug: 'email-draft', category: 'communication', isEnabled: false },
  { slug: 'interview-scheduler', category: 'scheduling', isEnabled: false },
  { slug: 'meeting-notes', category: 'productivity', isEnabled: false },
  { slug: 'candidate-pipeline-builder', category: 'sourcing', isEnabled: true },
  { slug: 'daily-report', category: 'productivity', isEnabled: true },
];

async function seed() {
  console.log('Seeding production database (idempotent)...');
  console.log(`Database: ${TURSO_URL}`);

  // 1. Upsert default organization
  console.log('\n1. Ensuring default organization exists...');
  await client.execute({
    sql: `INSERT INTO organizations (id, name, slug, web_ui_enabled, desktop_enabled, created_at, updated_at)
          VALUES (?, ?, ?, 1, 1, unixepoch(), unixepoch())
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            updated_at = unixepoch()`,
    args: [DEFAULT_ORG_ID, 'Default Organization', 'default'],
  });
  console.log('   ✓ Default organization');

  // 2. Create roles
  console.log('\n2. Ensuring roles exist...');
  const roles = [
    { id: ADMIN_ROLE_ID, name: 'admin', description: 'Full system access' },
    { id: RECRUITER_ROLE_ID, name: 'recruiter', description: 'Standard recruiter access' },
    { id: VIEWER_ROLE_ID, name: 'viewer', description: 'Read-only access' },
  ];

  for (const role of roles) {
    await client.execute({
      sql: `INSERT INTO roles (id, name, description, created_at)
            VALUES (?, ?, ?, unixepoch())
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              description = excluded.description`,
      args: [role.id, role.name, role.description],
    });
    console.log(`   ✓ Role: ${role.name}`);
  }

  // 3. Create users for each role type
  console.log('\n3. Ensuring users exist...');
  const passwordHash = hashSync(DEFAULT_PASSWORD, 10);

  const users = [
    {
      id: SUPER_ADMIN_ID,
      email: 'superadmin@skillomatic.technology',
      name: 'Super Admin',
      isAdmin: 1,
      isSuperAdmin: 1,
      roleId: ADMIN_ROLE_ID,
    },
    {
      id: ORG_ADMIN_ID,
      email: 'orgadmin@skillomatic.technology',
      name: 'Org Admin',
      isAdmin: 1,
      isSuperAdmin: 0,
      roleId: ADMIN_ROLE_ID,
    },
    {
      id: MEMBER_ID,
      email: 'member@skillomatic.technology',
      name: 'Member User',
      isAdmin: 0,
      isSuperAdmin: 0,
      roleId: RECRUITER_ROLE_ID,
    },
  ];

  for (const user of users) {
    await client.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, is_admin, is_super_admin, organization_id, onboarding_step, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 4, unixepoch(), unixepoch())
            ON CONFLICT(id) DO UPDATE SET
              email = excluded.email,
              password_hash = excluded.password_hash,
              name = excluded.name,
              is_admin = excluded.is_admin,
              is_super_admin = excluded.is_super_admin,
              updated_at = unixepoch()`,
      args: [user.id, user.email, passwordHash, user.name, user.isAdmin, user.isSuperAdmin, DEFAULT_ORG_ID],
    });
    console.log(`   ✓ User: ${user.email} (${user.isSuperAdmin ? 'super admin' : user.isAdmin ? 'org admin' : 'member'})`);

    // Assign role to user
    await client.execute({
      sql: `INSERT INTO user_roles (user_id, role_id, assigned_at)
            VALUES (?, ?, unixepoch())
            ON CONFLICT(user_id, role_id) DO NOTHING`,
      args: [user.id, user.roleId],
    });
  }

  // 4. Seed skills from SKILL.md files
  console.log('\n4. Ensuring skills exist...');
  for (const skillDef of SKILLS) {
    const frontmatter = parseSkillFrontmatter(skillDef.slug);
    const skillId = `skill-${skillDef.slug}`;

    if (!frontmatter.name) {
      console.log(`   ⚠ Skipping ${skillDef.slug}: no SKILL.md found`);
      continue;
    }

    const requiredIntegrations = frontmatter.requires ? JSON.stringify(frontmatter.requires) : '{}';
    const capabilities = frontmatter.capabilities?.length ? JSON.stringify(frontmatter.capabilities) : null;

    await client.execute({
      sql: `INSERT INTO skills (id, slug, name, description, category, is_global, is_enabled, intent, capabilities, instructions, required_integrations, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              description = excluded.description,
              intent = excluded.intent,
              capabilities = excluded.capabilities,
              instructions = excluded.instructions,
              required_integrations = excluded.required_integrations,
              is_enabled = excluded.is_enabled,
              updated_at = unixepoch()`,
      args: [
        skillId,
        skillDef.slug,
        frontmatter.name,
        frontmatter.description || '',
        skillDef.category,
        skillDef.isEnabled ? 1 : 0,
        frontmatter.intent || null,
        capabilities,
        frontmatter.instructions || null,
        requiredIntegrations,
      ],
    });
    console.log(`   ✓ Skill: ${frontmatter.name} (${skillDef.isEnabled ? 'enabled' : 'disabled'})`);
  }

  // 5. Upsert API key for super admin
  console.log('\n5. Ensuring super admin API key exists...');
  await client.execute({
    sql: `INSERT INTO api_keys (id, user_id, organization_id, key, name, created_at)
          VALUES (?, ?, ?, ?, ?, unixepoch())
          ON CONFLICT(id) DO UPDATE SET
            key = excluded.key,
            revoked_at = NULL`,
    args: [SUPER_ADMIN_API_KEY_ID, SUPER_ADMIN_ID, DEFAULT_ORG_ID, SUPER_ADMIN_API_KEY, 'Production Debug Key'],
  });
  console.log('   ✓ Super admin API key');

  // 6. Verify the setup
  console.log('\n6. Verifying setup...');
  const verifyUsers = await client.execute({
    sql: `SELECT u.id, u.email, u.is_admin, u.is_super_admin, r.name as role_name
          FROM users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON r.id = ur.role_id
          WHERE u.organization_id = ?
          ORDER BY u.is_super_admin DESC, u.is_admin DESC`,
    args: [DEFAULT_ORG_ID],
  });

  console.log('\n   Users in Default Organization:');
  for (const row of verifyUsers.rows) {
    const type = row.is_super_admin ? 'super admin' : row.is_admin ? 'org admin' : 'member';
    console.log(`   - ${row.email} (${type}, role: ${row.role_name || 'none'})`);
  }

  const verifyKey = await client.execute({
    sql: `SELECT key, revoked_at FROM api_keys WHERE id = ?`,
    args: [SUPER_ADMIN_API_KEY_ID],
  });

  if (verifyKey.rows.length > 0) {
    const key = verifyKey.rows[0];
    console.log(`\n   API Key: ${key.revoked_at === null ? 'active' : 'REVOKED'}`);
  }

  // Summary
  console.log('\n========================================');
  console.log('Production seed complete!');
  console.log('========================================\n');
  console.log('Test Users (all use same password):');
  console.log(`  Password: ${DEFAULT_PASSWORD}\n`);
  console.log('  Super Admin: superadmin@skillomatic.technology');
  console.log('  Org Admin:   orgadmin@skillomatic.technology');
  console.log('  Member:      member@skillomatic.technology');
  console.log('\nFor prod-debugger skill:');
  console.log(`  export SKILLOMATIC_API_KEY=${SUPER_ADMIN_API_KEY}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
