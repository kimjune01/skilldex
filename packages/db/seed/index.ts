import { db } from '../src/client.js';
import { users, skills, roles, permissions, roleSkills, userRoles } from '../src/schema.js';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminId = randomUUID();
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  await db.insert(users).values({
    id: adminId,
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    passwordHash: hashSync(adminPassword, 10),
    name: 'Admin',
    isAdmin: true,
  }).onConflictDoNothing();

  console.log('Created admin user');

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

  // Assign admin role to admin user
  await db.insert(userRoles).values({
    userId: adminId,
    roleId: adminRoleId,
  }).onConflictDoNothing();
  console.log('Assigned admin role to admin user');

  // Create permissions
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

  // Create default skills with fixed IDs for role assignment
  const skillIds = {
    linkedinLookup: 'skill-linkedin-lookup',
    atsCandidateSearch: 'skill-ats-candidate-search',
    atsCandidateCrud: 'skill-ats-candidate-crud',
    emailDraft: 'skill-email-draft',
    interviewScheduler: 'skill-interview-scheduler',
    meetingNotes: 'skill-meeting-notes',
    skilldexSync: 'skill-skilldex-sync',
    proposeNewSkill: 'skill-propose-new-skill',
  };

  const skillData = [
    {
      id: skillIds.skilldexSync,
      slug: 'skilldex-sync',
      name: 'Skilldex Sync',
      description: 'Sync all available skills from Skilldex server to your local Claude Desktop',
      category: 'system',
      requiredIntegrations: JSON.stringify([]),
      requiredScopes: JSON.stringify(['skills:read']),
      intentions: JSON.stringify(['Download skills', 'Update local skill files', 'Remove revoked skills']),
      skillMdPath: 'skills/skilldex-sync/SKILL.md',
    },
    {
      id: skillIds.proposeNewSkill,
      slug: 'propose-new-skill',
      name: 'Propose New Skill',
      description: 'Submit a proposal for a new skill to be added to Skilldex',
      category: 'system',
      requiredIntegrations: JSON.stringify([]),
      requiredScopes: JSON.stringify(['proposals:write']),
      intentions: JSON.stringify(['Submit skill idea', 'Describe desired functionality']),
      skillMdPath: 'skills/propose-new-skill/SKILL.md',
    },
    {
      id: skillIds.linkedinLookup,
      slug: 'linkedin-lookup',
      name: 'LinkedIn Profile Lookup',
      description: 'Look up candidate profiles on LinkedIn using linky-scraper-addon Chrome extension',
      category: 'sourcing',
      requiredIntegrations: JSON.stringify(['linky-scraper']),
      requiredScopes: JSON.stringify(['candidates:read']),
      intentions: JSON.stringify(['Search for candidate profiles', 'Extract profile information']),
      skillMdPath: 'skills/linkedin-lookup/SKILL.md',
    },
    {
      id: skillIds.atsCandidateSearch,
      slug: 'ats-candidate-search',
      name: 'ATS Candidate Search',
      description: 'Search for candidates in your Applicant Tracking System',
      category: 'ats',
      requiredIntegrations: JSON.stringify(['ats']),
      requiredScopes: JSON.stringify(['candidates:read']),
      intentions: JSON.stringify(['Search candidates by skills', 'Filter by job requisition']),
      skillMdPath: 'skills/ats-candidate-search/SKILL.md',
    },
    {
      id: skillIds.atsCandidateCrud,
      slug: 'ats-candidate-crud',
      name: 'ATS Candidate Management',
      description: 'Create, update, and manage candidates in your ATS',
      category: 'ats',
      requiredIntegrations: JSON.stringify(['ats']),
      requiredScopes: JSON.stringify(['candidates:read', 'candidates:write']),
      intentions: JSON.stringify(['Create new candidates', 'Update candidate information', 'Move candidates through pipeline']),
      skillMdPath: 'skills/ats-candidate-crud/SKILL.md',
    },
    {
      id: skillIds.emailDraft,
      slug: 'email-draft',
      name: 'Recruitment Email Drafting',
      description: 'Draft personalized recruitment emails for candidates',
      category: 'communication',
      requiredIntegrations: JSON.stringify(['email']),
      requiredScopes: JSON.stringify(['email:draft', 'candidates:read']),
      intentions: JSON.stringify(['Draft outreach emails', 'Create follow-up emails']),
      skillMdPath: 'skills/email-draft/SKILL.md',
      isEnabled: false, // Stub - not fully implemented
    },
    {
      id: skillIds.interviewScheduler,
      slug: 'interview-scheduler',
      name: 'Interview Scheduler',
      description: 'Schedule interviews with candidates',
      category: 'scheduling',
      requiredIntegrations: JSON.stringify(['calendar']),
      requiredScopes: JSON.stringify(['calendar:write', 'candidates:read']),
      intentions: JSON.stringify(['Schedule interview slots', 'Send calendar invites']),
      skillMdPath: 'skills/interview-scheduler/SKILL.md',
      isEnabled: false, // Stub
    },
    {
      id: skillIds.meetingNotes,
      slug: 'meeting-notes',
      name: 'Meeting Notes Sync',
      description: 'Sync meeting notes from recording apps to ATS',
      category: 'productivity',
      requiredIntegrations: JSON.stringify(['granola']),
      requiredScopes: JSON.stringify(['meetings:read', 'candidates:write']),
      intentions: JSON.stringify(['Import meeting transcripts', 'Attach notes to candidates']),
      skillMdPath: 'skills/meeting-notes/SKILL.md',
      isEnabled: false, // Stub
    },
  ];

  for (const skill of skillData) {
    await db.insert(skills).values(skill).onConflictDoNothing();
  }
  console.log('Created skills');

  // Assign skills to roles (many-to-many)
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

    // Recruiter gets operational skills
    { roleId: recruiterRoleId, skillId: skillIds.linkedinLookup },
    { roleId: recruiterRoleId, skillId: skillIds.atsCandidateSearch },
    { roleId: recruiterRoleId, skillId: skillIds.atsCandidateCrud },
    { roleId: recruiterRoleId, skillId: skillIds.emailDraft },
    { roleId: recruiterRoleId, skillId: skillIds.interviewScheduler },
    { roleId: recruiterRoleId, skillId: skillIds.meetingNotes },

    // Viewer gets read-only skills
    { roleId: viewerRoleId, skillId: skillIds.atsCandidateSearch },
  ];

  for (const assignment of roleSkillAssignments) {
    await db.insert(roleSkills).values(assignment).onConflictDoNothing();
  }
  console.log('Assigned skills to roles');

  console.log('Seeding complete!');
}

seed().catch(console.error);
