import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, organizations } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';
import { jwtAuth, adminOnly } from '../middleware/auth.js';
import { withOrganization } from '../middleware/organization.js';
import type { UserPublic } from '@skillomatic/shared';

export const usersRoutes = new Hono();

// All routes require JWT auth and admin (org admin or super admin)
usersRoutes.use('*', jwtAuth);
usersRoutes.use('*', adminOnly);
usersRoutes.use('*', withOrganization);

// GET /users - List users (super admin sees all, org admin sees their org)
usersRoutes.get('/', async (c) => {
  const currentUser = c.get('user');
  const org = c.get('organization');

  let allUsersWithOrg;
  if (currentUser.isSuperAdmin) {
    // Super admin sees all users
    allUsersWithOrg = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id));
  } else if (org) {
    // Org admin sees users in their org
    allUsersWithOrg = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.organizationId, org.id));
  } else {
    return c.json({ data: [] });
  }

  const publicUsers: UserPublic[] = allUsersWithOrg.map((row) => ({
    id: row.users.id,
    email: row.users.email,
    name: row.users.name,
    avatarUrl: row.users.avatarUrl ?? undefined,
    isAdmin: row.users.isAdmin,
    isSuperAdmin: row.users.isSuperAdmin ?? false,
    organizationId: row.users.organizationId ?? undefined,
    organizationName: row.organizations?.name ?? undefined,
    onboardingStep: row.users.onboardingStep ?? 0,
    accountTypeSelected: row.users.accountTypeSelected ?? false,
  }));

  return c.json({ data: publicUsers });
});

// GET /users/:id - Get user by ID (admin only)
usersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');
  const org = c.get('organization');

  const result = await db
    .select()
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const row = result[0];
  const user = row.users;
  const orgData = row.organizations;

  // Org admins can only view users in their org
  if (!currentUser.isSuperAdmin && user.organizationId !== org?.id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const publicUser: UserPublic = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? undefined,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? undefined,
    organizationName: orgData?.name ?? undefined,
    onboardingStep: user.onboardingStep ?? 0,
    accountTypeSelected: user.accountTypeSelected ?? false,
  };

  return c.json({ data: publicUser });
});

// POST /users - Create user (admin only)
usersRoutes.post('/', async (c) => {
  const currentUser = c.get('user');
  const org = c.get('organization');

  const body = await c.req.json<{
    email: string;
    password: string;
    name: string;
    isAdmin?: boolean;
    organizationId?: string; // Super admin can specify org
  }>();

  if (!body.email || !body.password || !body.name) {
    return c.json({ error: { message: 'Email, password, and name are required' } }, 400);
  }

  // Determine target organization
  let targetOrgId = body.organizationId;
  if (!currentUser.isSuperAdmin) {
    // Org admins can only create users in their org
    if (!org) {
      return c.json({ error: { message: 'No organization assigned' } }, 400);
    }
    targetOrgId = org.id;
  }

  if (!targetOrgId) {
    return c.json({ error: { message: 'Organization ID required' } }, 400);
  }

  // Check if email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: { message: 'Email already exists' } }, 400);
  }

  // Get org name for response
  const [targetOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, targetOrgId))
    .limit(1);

  if (!targetOrg) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  const id = randomUUID();
  const passwordHash = hashSync(body.password, 10);

  await db.insert(users).values({
    id,
    email: body.email.toLowerCase(),
    passwordHash,
    name: body.name,
    isAdmin: body.isAdmin ?? false,
    isSuperAdmin: false, // Only super admins can create super admins via direct DB
    organizationId: targetOrgId,
  });

  const publicUser: UserPublic = {
    id,
    email: body.email.toLowerCase(),
    name: body.name,
    isAdmin: body.isAdmin ?? false,
    isSuperAdmin: false,
    organizationId: targetOrgId,
    organizationName: targetOrg.name,
    onboardingStep: 0,
    accountTypeSelected: true, // Admin-created users join an org, so account type is selected
  };

  return c.json({ data: publicUser }, 201);
});

// DELETE /users/:id - Delete user (admin only)
usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');
  const org = c.get('organization');

  // Prevent self-deletion
  if (id === currentUser.sub) {
    return c.json({ error: { message: 'Cannot delete yourself' } }, 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Org admins can only delete users in their org
  if (!currentUser.isSuperAdmin && user.organizationId !== org?.id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  // Prevent deleting super admins (only super admin can delete super admins)
  if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
    return c.json({ error: { message: 'Cannot delete super admin' } }, 403);
  }

  await db.delete(users).where(eq(users.id, id));

  return c.json({ data: { message: 'User deleted' } });
});
