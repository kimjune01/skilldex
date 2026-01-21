import { db } from '../src/client.js';
import { users, skills, roles, permissions, roleSkills, userRoles, organizations, organizationInvites } from '../src/schema.js';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';

async function seed() {
  console.log('Seeding database...');

  // ============ ORGANIZATIONS ============

  // Create default organization
  const defaultOrgId = 'org-default';
  const acmeOrgId = 'org-acme';

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
  const superAdminId = randomUUID();
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
    skilldexSync: 'skill-skilldex-sync',
    proposeNewSkill: 'skill-propose-new-skill',
    candidatePipelineBuilder: 'skill-candidate-pipeline-builder',
    dailyReport: 'skill-daily-report',
  };

  // Note: All these skills are global (isGlobal: true, organizationId: null)
  // Organization-specific skills would have isGlobal: false and organizationId set
  const skillData = [
    {
      id: skillIds.skilldexSync,
      slug: 'skilldex-sync',
      name: 'Skilldex Sync',
      description: 'Sync all available skills from Skilldex server to your local Claude Desktop',
      category: 'system',
      requiredIntegrations: JSON.stringify([]),
      requiredScopes: JSON.stringify(['skills:read']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.proposeNewSkill,
      slug: 'propose-new-skill',
      name: 'Propose New Skill',
      description: 'Submit a proposal for a new skill to be added to Skilldex',
      category: 'system',
      requiredIntegrations: JSON.stringify([]),
      requiredScopes: JSON.stringify(['proposals:write']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.linkedinLookup,
      slug: 'linkedin-lookup',
      name: 'LinkedIn Profile Lookup',
      description: 'Find candidate profiles on LinkedIn that match a job description using browser automation',
      category: 'sourcing',
      requiredIntegrations: JSON.stringify([]),
      requiredScopes: JSON.stringify(['candidates:read']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.atsCandidateSearch,
      slug: 'ats-candidate-search',
      name: 'ATS Candidate Search',
      description: 'Search for candidates in your Applicant Tracking System',
      category: 'ats',
      requiredIntegrations: JSON.stringify(['ats']),
      requiredScopes: JSON.stringify(['candidates:read']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.atsCandidateCrud,
      slug: 'ats-candidate-crud',
      name: 'ATS Candidate Management',
      description: 'Create, update, and manage candidates in your ATS',
      category: 'ats',
      requiredIntegrations: JSON.stringify(['ats']),
      requiredScopes: JSON.stringify(['candidates:read', 'candidates:write']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.emailDraft,
      slug: 'email-draft',
      name: 'Recruitment Email Drafting',
      description: 'Draft personalized recruitment emails for candidates',
      category: 'communication',
      requiredIntegrations: JSON.stringify(['email']),
      requiredScopes: JSON.stringify(['email:draft', 'candidates:read']),
      isEnabled: false, // Stub - not fully implemented
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.interviewScheduler,
      slug: 'interview-scheduler',
      name: 'Interview Scheduler',
      description: 'Schedule interviews with candidates',
      category: 'scheduling',
      requiredIntegrations: JSON.stringify(['calendar']),
      requiredScopes: JSON.stringify(['calendar:write', 'candidates:read']),
      isEnabled: false, // Stub
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.meetingNotes,
      slug: 'meeting-notes',
      name: 'Meeting Notes Sync',
      description: 'Sync meeting notes from recording apps to ATS',
      category: 'productivity',
      requiredIntegrations: JSON.stringify(['granola']),
      requiredScopes: JSON.stringify(['meetings:read', 'candidates:write']),
      isEnabled: false, // Stub
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.candidatePipelineBuilder,
      slug: 'candidate-pipeline-builder',
      name: 'Candidate Pipeline Builder',
      description: 'End-to-end candidate sourcing: search LinkedIn profiles, add to ATS, generate personalized outreach emails, and log activity.',
      category: 'sourcing',
      requiredIntegrations: JSON.stringify(['ats', 'email']),
      requiredScopes: JSON.stringify(['candidates:read', 'candidates:write', 'email:draft']),
      isGlobal: true,
      organizationId: null,
    },
    {
      id: skillIds.dailyReport,
      slug: 'daily-report',
      name: 'Daily Recruiting Report',
      description: 'Generate a summary report of recruiting activity from the ATS for standups, syncs, or tracking progress.',
      category: 'productivity',
      requiredIntegrations: JSON.stringify(['ats']),
      requiredScopes: JSON.stringify(['candidates:read', 'applications:read', 'jobs:read']),
      isGlobal: true,
      organizationId: null,
    },
  ];

  for (const skill of skillData) {
    await db.insert(skills).values(skill).onConflictDoNothing();
  }
  console.log('Created global skills');

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
    // System skills available to everyone
    { roleId: adminRoleId, skillId: skillIds.skilldexSync },
    { roleId: adminRoleId, skillId: skillIds.proposeNewSkill },
    { roleId: recruiterRoleId, skillId: skillIds.skilldexSync },
    { roleId: recruiterRoleId, skillId: skillIds.proposeNewSkill },
    { roleId: viewerRoleId, skillId: skillIds.skilldexSync },
    { roleId: viewerRoleId, skillId: skillIds.proposeNewSkill },

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

  console.log('\nUsers (password: changeme):');
  console.log('  Super Admin:');
  console.log('    - admin@example.com (super admin, Default Org)');
  console.log('  Org Admins:');
  console.log('    - orgadmin@example.com (org admin, Default Org)');
  console.log('    - admin@acme.com (org admin, Acme Corp)');
  console.log('  Members:');
  console.log('    - member@example.com (member, Default Org)');
  console.log('    - recruiter@acme.com (member, Acme Corp)');

  console.log('\nSample Invite:');
  console.log(`  URL: http://localhost:5173/invite/${inviteToken}`);
  console.log('  Email: newuser@example.com');
  console.log('  Role: member');
  console.log('  Org: Default Organization');
}

seed().catch(console.error);
