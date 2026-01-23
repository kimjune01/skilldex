import { db } from '../src/client.js';
import { users, skills, roles, permissions, roleSkills, userRoles, organizations, organizationInvites } from '../src/schema.js';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, '../../../skills');

// Parse YAML-like frontmatter from SKILL.md files
function parseSkillFrontmatter(slug: string): {
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

  let intent: string | undefined;
  let capabilities: string[] = [];
  let requires: Record<string, string> | undefined;

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
        const [, category, accessLevel] = match;
        requires[category.trim()] = accessLevel.trim();
      }
    }
  }

  return { intent, capabilities, requires, instructions };
}

async function seed() {
  console.log('Seeding database...');

  // ============ ORGANIZATIONS ============

  // Create default organization
  const defaultOrgId = 'org-default';
  const acmeOrgId = 'org-acme';
  // Fixed user IDs for consistent foreign key references
  const superAdminIdFixed = 'user-super-admin';

  const orgData = [
    {
      id: defaultOrgId,
      name: 'Default Organization',
      slug: 'default',
      logoUrl: null,
    },
    {
      id: acmeOrgId,
      name: 'Acme Corp',
      slug: 'acme',
      logoUrl: null,
    },
  ];

  for (const org of orgData) {
    await db.insert(organizations).values(org).onConflictDoNothing();
  }
  console.log('Created organizations');

  // ============ USERS ============

  // Create super admin user (system-wide admin)
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
    organizationId: defaultOrgId,
  }).onConflictDoNothing();

  console.log('Created super admin user');

  // Create org admin for Default Org
  const defaultOrgAdminId = randomUUID();
  await db.insert(users).values({
    id: defaultOrgAdminId,
    email: 'orgadmin@example.com',
    passwordHash: hashSync('changeme', 10),
    name: 'Org Admin',
    isAdmin: true,
    isSuperAdmin: false,
    organizationId: defaultOrgId,
  }).onConflictDoNothing();

  console.log('Created org admin user');

  // Create regular member for Default Org
  const defaultMemberId = randomUUID();
  await db.insert(users).values({
    id: defaultMemberId,
    email: 'member@example.com',
    passwordHash: hashSync('changeme', 10),
    name: 'Member User',
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: defaultOrgId,
  }).onConflictDoNothing();

  console.log('Created member user');

  // Create org admin for Acme Corp
  const acmeOrgAdminId = randomUUID();
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
  const acmeMemberId = randomUUID();
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

  // Create demo user for dev environment
  const demoUserId = 'user-demo';
  await db.insert(users).values({
    id: demoUserId,
    email: 'demo@skillomatic.technology',
    passwordHash: hashSync('demopassword123', 10),
    name: 'Demo User',
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: defaultOrgId,
  }).onConflictDoNothing();

  console.log('Created demo user');

  // ============ SAMPLE INVITE ============

  // Create a sample pending invite (for demo purposes)
  const inviteToken = randomUUID().replace(/-/g, ''); // Remove hyphens for cleaner token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await db.insert(organizationInvites).values({
    id: randomUUID(),
    organizationId: defaultOrgId,
    email: 'newuser@example.com',
    role: 'member',
    token: inviteToken,
    invitedBy: superAdminId,
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

  const skillIds = {
    linkedinLookup: 'skill-linkedin-lookup',
    atsCandidateSearch: 'skill-ats-candidate-search',
    atsCandidateCrud: 'skill-ats-candidate-crud',
    emailDraft: 'skill-email-draft',
    interviewScheduler: 'skill-interview-scheduler',
    meetingNotes: 'skill-meeting-notes',
    skillBuilder: 'skill-skill-builder',
    candidatePipelineBuilder: 'skill-candidate-pipeline-builder',
    dailyReport: 'skill-daily-report',
  };

  // Helper to build skill with frontmatter from SKILL.md
  const buildSkill = (id: string, slug: string, name: string, description: string, category: string, requiredIntegrations: string[], requiredScopes: string[], isEnabled = true) => {
    const frontmatter = parseSkillFrontmatter(slug);

    // Use 'requires' from frontmatter if available, otherwise fall back to requiredIntegrations list
    // New format: {"ats": "read-write", "email": "read-only"}
    // Old format: ["ats", "email"] (will be treated as read-write for each)
    let requiredIntegrationsJson: string;
    if (frontmatter.requires && Object.keys(frontmatter.requires).length > 0) {
      requiredIntegrationsJson = JSON.stringify(frontmatter.requires);
    } else {
      // Convert old format to new format (assuming read-write for backwards compatibility)
      const legacyFormat: Record<string, string> = {};
      for (const provider of requiredIntegrations) {
        // Map provider names to categories
        const category = provider === 'gmail' || provider === 'email' ? 'email' :
                        provider === 'ats' || provider === 'greenhouse' || provider === 'lever' ? 'ats' :
                        provider === 'calendar' || provider === 'calendly' ? 'calendar' : provider;
        legacyFormat[category] = 'read-write';
      }
      requiredIntegrationsJson = Object.keys(legacyFormat).length > 0 ? JSON.stringify(legacyFormat) : JSON.stringify({});
    }

    return {
      id,
      slug,
      name,
      description,
      category,
      requiredIntegrations: requiredIntegrationsJson,
      requiredScopes: JSON.stringify(requiredScopes),
      intent: frontmatter.intent || null,
      capabilities: frontmatter.capabilities?.length ? JSON.stringify(frontmatter.capabilities) : null,
      instructions: frontmatter.instructions || null,
      isEnabled,
      isGlobal: true,
      organizationId: null,
    };
  };

  // Note: All these skills are global (isGlobal: true, organizationId: null)
  // Organization-specific skills would have isGlobal: false and organizationId set
  const skillData = [
    buildSkill(skillIds.skillBuilder, 'skill-builder', 'Skill Builder', 'Create a new custom skill for your recruiting workflow. I\'ll guide you through defining what the skill does and how it works.', 'Productivity', [], ['skills:write']),
    buildSkill(skillIds.linkedinLookup, 'linkedin-lookup', 'LinkedIn Profile Lookup', 'Find candidate profiles on LinkedIn that match a job description using browser automation', 'sourcing', [], ['candidates:read']),
    buildSkill(skillIds.atsCandidateSearch, 'ats-candidate-search', 'ATS Candidate Search', 'Search for candidates in your Applicant Tracking System', 'ats', ['ats'], ['candidates:read']),
    buildSkill(skillIds.atsCandidateCrud, 'ats-candidate-crud', 'ATS Candidate Management', 'Create, update, and manage candidates in your ATS', 'ats', ['ats'], ['candidates:read', 'candidates:write']),
    buildSkill(skillIds.emailDraft, 'email-draft', 'Recruitment Email Drafting', 'Draft personalized recruitment emails for candidates', 'communication', ['email'], ['email:draft', 'candidates:read'], false),
    buildSkill(skillIds.interviewScheduler, 'interview-scheduler', 'Interview Scheduler', 'Schedule interviews with candidates', 'scheduling', ['calendar'], ['calendar:write', 'candidates:read'], false),
    buildSkill(skillIds.meetingNotes, 'meeting-notes', 'Meeting Notes Sync', 'Sync meeting notes from recording apps to ATS', 'productivity', ['granola'], ['meetings:read', 'candidates:write'], false),
    buildSkill(skillIds.candidatePipelineBuilder, 'candidate-pipeline-builder', 'Candidate Pipeline Builder', 'End-to-end candidate sourcing: search LinkedIn profiles, add to ATS, generate personalized outreach emails, and log activity.', 'sourcing', ['ats', 'email'], ['candidates:read', 'candidates:write', 'email:draft']),
    buildSkill(skillIds.dailyReport, 'daily-report', 'Daily Recruiting Report', 'Generate a summary report of recruiting activity from the ATS for standups, syncs, or tracking progress.', 'productivity', ['ats'], ['candidates:read', 'applications:read', 'jobs:read']),
  ];

  for (const skill of skillData) {
    await db.insert(skills).values(skill).onConflictDoUpdate({
      target: skills.id,
      set: {
        intent: skill.intent,
        capabilities: skill.capabilities,
        instructions: skill.instructions,
      },
    });
  }
  console.log('Created/updated global skills (with frontmatter from SKILL.md files)');

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

  const roleSkillAssignments = [
    // Skill Builder available to everyone - allows creating custom skills
    { roleId: adminRoleId, skillId: skillIds.skillBuilder },
    { roleId: recruiterRoleId, skillId: skillIds.skillBuilder },
    { roleId: viewerRoleId, skillId: skillIds.skillBuilder },

    // Admin gets all skills
    { roleId: adminRoleId, skillId: skillIds.linkedinLookup },
    { roleId: adminRoleId, skillId: skillIds.atsCandidateSearch },
    { roleId: adminRoleId, skillId: skillIds.atsCandidateCrud },
    { roleId: adminRoleId, skillId: skillIds.emailDraft },
    { roleId: adminRoleId, skillId: skillIds.interviewScheduler },
    { roleId: adminRoleId, skillId: skillIds.meetingNotes },
    { roleId: adminRoleId, skillId: skillIds.candidatePipelineBuilder },

    // Recruiter gets operational skills
    { roleId: recruiterRoleId, skillId: skillIds.linkedinLookup },
    { roleId: recruiterRoleId, skillId: skillIds.atsCandidateSearch },
    { roleId: recruiterRoleId, skillId: skillIds.atsCandidateCrud },
    { roleId: recruiterRoleId, skillId: skillIds.emailDraft },
    { roleId: recruiterRoleId, skillId: skillIds.interviewScheduler },
    { roleId: recruiterRoleId, skillId: skillIds.meetingNotes },
    { roleId: recruiterRoleId, skillId: skillIds.candidatePipelineBuilder },

    // Viewer gets read-only skills
    { roleId: viewerRoleId, skillId: skillIds.atsCandidateSearch },
  ];

  for (const assignment of roleSkillAssignments) {
    await db.insert(roleSkills).values(assignment).onConflictDoNothing();
  }
  console.log('Assigned skills to roles');

  // ============ SUMMARY ============

  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================\n');

  console.log('Organizations:');
  console.log('  - Default Organization (slug: default)');
  console.log('  - Acme Corp (slug: acme)');

  console.log('\nUsers:');
  console.log('  Demo User:');
  console.log('    - demo@skillomatic.technology / demopassword123 (member, Default Org)');
  console.log('  Super Admin (password: changeme):');
  console.log('    - admin@example.com (super admin, Default Org)');
  console.log('  Org Admins (password: changeme):');
  console.log('    - orgadmin@example.com (org admin, Default Org)');
  console.log('    - admin@acme.com (org admin, Acme Corp)');
  console.log('  Members (password: changeme):');
  console.log('    - member@example.com (member, Default Org)');
  console.log('    - recruiter@acme.com (member, Acme Corp)');

  console.log('\nSample Invite:');
  console.log(`  URL: http://localhost:5173/invite/${inviteToken}`);
  console.log('  Email: newuser@example.com');
  console.log('  Role: member');
  console.log('  Org: Default Organization');
}

seed().catch(console.error);
