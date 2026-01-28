import { db } from '../src/client.js';
import { users, skills, roles, permissions, roleSkills, userRoles, organizations, organizationInvites } from '../src/schema.js';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '../../../skills');

// Parse YAML-like frontmatter from SKILL.md files
function parseSkillFrontmatter(slug: string): {
  name?: string;
  description?: string;
  intent?: string;
  capabilities?: string[];
  requires?: Record<string, string>;
  requiresInput?: boolean;
  instructions?: string;
  category?: string;
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
  let requiresInput: boolean | undefined;
  let category: string | undefined;

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

  // Parse category
  const categoryMatch = frontmatter.match(/^category:\s*(.+)$/m);
  if (categoryMatch) {
    category = categoryMatch[1].trim();
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
        const [, cat, accessLevel] = match;
        requires[cat.trim()] = accessLevel.trim();
      }
    }
  }

  // Parse requiresInput (boolean)
  const requiresInputMatch = frontmatter.match(/^requiresInput:\s*(.+)$/m);
  if (requiresInputMatch) {
    requiresInput = requiresInputMatch[1].trim().toLowerCase() === 'true';
  }

  return { name, description, intent, capabilities, requires, requiresInput, instructions, category };
}

// Auto-discover all skills from the skills/ directory
function discoverSkills(): { slug: string; frontmatter: ReturnType<typeof parseSkillFrontmatter> }[] {
  if (!existsSync(skillsDir)) {
    console.warn('Skills directory not found:', skillsDir);
    return [];
  }

  const entries = readdirSync(skillsDir);
  const discoveredSkills: { slug: string; frontmatter: ReturnType<typeof parseSkillFrontmatter> }[] = [];

  for (const entry of entries) {
    const entryPath = join(skillsDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const skillPath = join(entryPath, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const frontmatter = parseSkillFrontmatter(entry);
    if (frontmatter.name || frontmatter.description) {
      discoveredSkills.push({ slug: entry, frontmatter });
    }
  }

  return discoveredSkills;
}

async function seed() {
  console.log('Seeding database...');

  // ============ ORGANIZATIONS ============

  // Create test organization (for testing org-specific features)
  const acmeOrgId = 'org-acme';
  // Fixed user IDs for consistent foreign key references
  const superAdminIdFixed = 'user-super-admin';

  await db.insert(organizations).values({
    id: acmeOrgId,
    name: 'Acme Corp',
    slug: 'acme',
    logoUrl: null,
  }).onConflictDoNothing();
  console.log('Created test organization (Acme Corp)');

  // ============ USERS ============

  // Create super admin user (system-wide admin, no org)
  // Use fixed ID for consistent foreign key references
  const superAdminId = superAdminIdFixed;
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  await db.insert(users).values({
    id: superAdminId,
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    passwordHash: hashSync(adminPassword, 10),
    name: 'Super Admin',
    isAdmin: true,
    isSuperAdmin: true,
    organizationId: null,
  }).onConflictDoNothing();

  console.log('Created super admin user');

  // Create org admin for Acme Corp (fixed ID for FK references)
  const acmeOrgAdminId = 'user-acme-admin';
  await db.insert(users).values({
    id: acmeOrgAdminId,
    email: 'admin@acme.com',
    passwordHash: hashSync('changeme', 10),
    name: 'Acme Admin',
    isAdmin: true,
    isSuperAdmin: false,
    organizationId: acmeOrgId,
  }).onConflictDoNothing();

  console.log('Created Acme org admin');

  // Create member for Acme Corp
  const acmeMemberId = 'user-acme-member';
  await db.insert(users).values({
    id: acmeMemberId,
    email: 'recruiter@acme.com',
    passwordHash: hashSync('changeme', 10),
    name: 'Acme Recruiter',
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: acmeOrgId,
  }).onConflictDoNothing();

  console.log('Created Acme member');

  // Create demo user for dev environment (individual user, no org)
  const demoUserId = 'user-demo';
  await db.insert(users).values({
    id: demoUserId,
    email: 'demo@skillomatic.technology',
    passwordHash: hashSync('demopassword123', 10),
    name: 'Demo User',
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: null,
  }).onConflictDoNothing();

  console.log('Created demo user');

  // ============ SAMPLE INVITE ============

  // Create a sample pending invite for Acme Corp (for demo purposes)
  const inviteToken = randomUUID().replace(/-/g, ''); // Remove hyphens for cleaner token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await db.insert(organizationInvites).values({
    id: randomUUID(),
    organizationId: acmeOrgId,
    email: 'newuser@example.com',
    role: 'member',
    token: inviteToken,
    invitedBy: acmeOrgAdminId,
    expiresAt,
  }).onConflictDoNothing();

  console.log(`Created sample invite (token: ${inviteToken})`);
  console.log(`  Accept invite at: http://localhost:5173/invite/${inviteToken}`);

  // ============ ROLES ============

  // Create default roles with fixed IDs for referencing
  const adminRoleId = 'role-admin';
  const recruiterRoleId = 'role-recruiter';
  const viewerRoleId = 'role-viewer';

  const roleData = [
    { id: adminRoleId, name: 'admin', description: 'Full system access' },
    { id: recruiterRoleId, name: 'recruiter', description: 'Standard recruiter access' },
    { id: viewerRoleId, name: 'viewer', description: 'Read-only access' },
  ];

  for (const role of roleData) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }
  console.log('Created default roles');

  // Assign admin role to super admin user
  await db.insert(userRoles).values({
    userId: superAdminId,
    roleId: adminRoleId,
  }).onConflictDoNothing();
  console.log('Assigned admin role to super admin user');

  // ============ PERMISSIONS ============

  const permissionData = [
    { id: randomUUID(), name: 'admin:*', resource: 'admin', action: '*', description: 'Full admin access' },
    { id: randomUUID(), name: 'skills:read', resource: 'skills', action: 'read', description: 'View skills' },
    { id: randomUUID(), name: 'skills:execute', resource: 'skills', action: 'execute', description: 'Execute skills' },
    { id: randomUUID(), name: 'skills:manage', resource: 'skills', action: 'manage', description: 'Manage skills' },
    { id: randomUUID(), name: 'integrations:read', resource: 'integrations', action: 'read', description: 'View integrations' },
    { id: randomUUID(), name: 'integrations:manage', resource: 'integrations', action: 'manage', description: 'Manage integrations' },
    { id: randomUUID(), name: 'candidates:read', resource: 'candidates', action: 'read', description: 'View candidates' },
    { id: randomUUID(), name: 'candidates:write', resource: 'candidates', action: 'write', description: 'Create/update candidates' },
    { id: randomUUID(), name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
    { id: randomUUID(), name: 'users:manage', resource: 'users', action: 'manage', description: 'Manage users' },
  ];

  for (const perm of permissionData) {
    await db.insert(permissions).values(perm).onConflictDoNothing();
  }
  console.log('Created permissions');

  // ============ SKILLS ============

  // Auto-discover all skills from the skills/ directory
  const discoveredSkills = discoverSkills();
  console.log(`Discovered ${discoveredSkills.length} skills from filesystem`);

  const seededSkillIds: string[] = [];

  for (const { slug, frontmatter } of discoveredSkills) {
    const skillId = `skill-${slug}`;
    const name = frontmatter.name || slug;
    const description = frontmatter.description || '';
    const category = (frontmatter.category || 'productivity').toLowerCase();
    const requiredIntegrations = frontmatter.requires ? JSON.stringify(frontmatter.requires) : '{}';

    await db.insert(skills).values({
      id: skillId,
      slug,
      name,
      description,
      category,
      requiredIntegrations,
      requiredScopes: '[]',
      intent: frontmatter.intent || null,
      capabilities: frontmatter.capabilities?.length ? JSON.stringify(frontmatter.capabilities) : null,
      instructions: frontmatter.instructions || null,
      requiresInput: frontmatter.requiresInput || false,
      isEnabled: true,
      isGlobal: true,
      organizationId: null,
    }).onConflictDoUpdate({
      target: skills.id,
      set: {
        name,
        description,
        category,
        intent: frontmatter.intent || null,
        capabilities: frontmatter.capabilities?.length ? JSON.stringify(frontmatter.capabilities) : null,
        instructions: frontmatter.instructions || null,
        requiredIntegrations,
        requiresInput: frontmatter.requiresInput || false,
      },
    });

    seededSkillIds.push(skillId);
    console.log(`  ✓ ${name} (${slug})`);
  }

  console.log('Created/updated global skills from SKILL.md files');

  // Keep track of skill IDs for role assignments
  const skillIds = {
    skillBuilder: 'skill-skill-builder',
  };

  // Create an example org-specific skill for Acme Corp
  const acmeSkillId = 'skill-acme-internal';
  await db.insert(skills).values({
    id: acmeSkillId,
    slug: 'acme-internal-process',
    name: 'Acme Internal Process',
    description: 'Acme Corp internal recruiting workflow and compliance checks',
    category: 'custom',
    requiredIntegrations: JSON.stringify([]),
    requiredScopes: JSON.stringify([]),
    isGlobal: false,
    organizationId: acmeOrgId,
  }).onConflictDoNothing();
  console.log('Created org-specific skill for Acme Corp');

  // ============ ROLE-SKILL ASSIGNMENTS ============

  // Assign all discovered skills to admin and recruiter roles
  const roleSkillAssignments: { roleId: string; skillId: string }[] = [];

  for (const skillId of seededSkillIds) {
    // Admin gets all skills
    roleSkillAssignments.push({ roleId: adminRoleId, skillId });
    // Recruiter gets all skills too (can be restricted later)
    roleSkillAssignments.push({ roleId: recruiterRoleId, skillId });
  }

  // Viewer only gets skill-builder
  if (seededSkillIds.includes(skillIds.skillBuilder)) {
    roleSkillAssignments.push({ roleId: viewerRoleId, skillId: skillIds.skillBuilder });
  }

  for (const assignment of roleSkillAssignments) {
    await db.insert(roleSkills).values(assignment).onConflictDoNothing();
  }
  console.log('Assigned skills to roles');

  // ============ SUMMARY ============

  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================\n');

  console.log('Organizations:');
  console.log('  - Acme Corp (slug: acme)');

  console.log('\nUsers:');
  console.log('  Demo User:');
  console.log('    - demo@skillomatic.technology / demopassword123 (individual, no org)');
  console.log('  Super Admin (password: changeme):');
  console.log('    - admin@example.com (super admin, no org)');
  console.log('  Acme Corp (password: changeme):');
  console.log('    - admin@acme.com (org admin)');
  console.log('    - recruiter@acme.com (member)');

  console.log('\nSample Invite:');
  console.log(`  URL: http://localhost:5173/invite/${inviteToken}`);
  console.log('  Email: newuser@example.com');
  console.log('  Role: member');
  console.log('  Org: Acme Corp');
}

seed().catch(console.error);
