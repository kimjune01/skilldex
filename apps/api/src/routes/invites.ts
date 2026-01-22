import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { organizationInvites, organizations, users } from '@skillomatic/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';
import { hashSync } from 'bcrypt-ts';
import { jwtAuth, orgAdminOnly } from '../middleware/auth.js';
import { withOrganization } from '../middleware/organization.js';
import { createToken } from '../lib/jwt.js';
import { sendInviteEmail, sendWelcomeEmail } from '../lib/email.js';
import type { UserPublic } from '@skillomatic/shared';

export interface InvitePublic {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  organizationId: string;
  organizationName: string;
  expiresAt: string;
  createdAt: string;
}

export const invitesRoutes = new Hono();

// Generate secure invite token
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

// Helper to get invite status
function getInviteStatus(acceptedAt: Date | null, expiresAt: Date): 'pending' | 'accepted' | 'expired' {
  if (acceptedAt) return 'accepted';
  if (new Date() > expiresAt) return 'expired';
  return 'pending';
}

// GET /api/invites - List invites for current org (org admin) or all (super admin)
invitesRoutes.get('/', jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const user = c.get('user');
  const org = c.get('organization');

  // Get all invites with org info
  let invitesWithOrg;
  if (user.isSuperAdmin) {
    invitesWithOrg = await db
      .select()
      .from(organizationInvites)
      .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id));
  } else if (org) {
    invitesWithOrg = await db
      .select()
      .from(organizationInvites)
      .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
      .where(eq(organizationInvites.organizationId, org.id));
  } else {
    return c.json({ data: [] });
  }

  const publicInvites: InvitePublic[] = invitesWithOrg.map((row) => ({
    id: row.organization_invites.id,
    email: row.organization_invites.email,
    role: row.organization_invites.role as 'admin' | 'member',
    status: getInviteStatus(row.organization_invites.acceptedAt, row.organization_invites.expiresAt),
    organizationId: row.organizations.id,
    organizationName: row.organizations.name,
    expiresAt: row.organization_invites.expiresAt.toISOString(),
    createdAt: row.organization_invites.createdAt.toISOString(),
  }));

  return c.json({ data: publicInvites });
});

// POST /api/invites - Create invite (org admin for their org, super admin for any org)
invitesRoutes.post('/', jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const user = c.get('user');
  const currentOrg = c.get('organization');

  const body = await c.req.json<{
    email: string;
    role?: 'admin' | 'member';
    organizationId?: string; // Only super admin can specify
  }>();

  if (!body.email) {
    return c.json({ error: { message: 'Email is required' } }, 400);
  }

  // Determine target organization
  let targetOrgId = body.organizationId;
  if (!user.isSuperAdmin) {
    // Non-super admins can only invite to their own org
    if (!currentOrg) {
      return c.json({ error: { message: 'No organization assigned' } }, 400);
    }
    targetOrgId = currentOrg.id;
  }

  if (!targetOrgId) {
    return c.json({ error: { message: 'Organization ID required' } }, 400);
  }

  // Verify org exists
  const [targetOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, targetOrgId))
    .limit(1);

  if (!targetOrg) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  // Check if email already has an account
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    return c.json({ error: { message: 'User already exists with this email' } }, 400);
  }

  // Check for pending invite to same org
  const existingInvite = await db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.email, body.email.toLowerCase()),
        eq(organizationInvites.organizationId, targetOrgId),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existingInvite.length > 0) {
    return c.json({ error: { message: 'Pending invite already exists for this email' } }, 400);
  }

  const id = randomUUID();
  const token = generateInviteToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(organizationInvites).values({
    id,
    organizationId: targetOrgId,
    email: body.email.toLowerCase(),
    role: body.role ?? 'member',
    token,
    invitedBy: user.sub,
    expiresAt,
    createdAt: now,
  });

  const publicInvite: InvitePublic = {
    id,
    email: body.email.toLowerCase(),
    role: (body.role ?? 'member') as 'admin' | 'member',
    status: 'pending',
    organizationId: targetOrgId,
    organizationName: targetOrg.name,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  // Send invite email (non-blocking, log errors but don't fail the request)
  const webUrl = process.env.WEB_URL || 'https://skillomatic.technology';
  const inviteUrl = `${webUrl}/invite/${token}`;

  // Get inviter name from the authenticated user
  const [inviter] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  sendInviteEmail(body.email.toLowerCase(), {
    inviterName: inviter?.name || 'A team member',
    organizationName: targetOrg.name,
    inviteUrl,
    role: body.role ?? 'member',
  }).catch((err) => {
    console.error('[Invites] Failed to send invite email:', err);
  });

  return c.json({ data: { ...publicInvite, token } }, 201);
});

// GET /api/invites/validate/:token - Validate invite token (public)
invitesRoutes.get('/validate/:token', async (c) => {
  const token = c.req.param('token');

  const result = await db
    .select()
    .from(organizationInvites)
    .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
    .where(eq(organizationInvites.token, token))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: { message: 'Invalid invite token' } }, 404);
  }

  const row = result[0];
  const invite = row.organization_invites;
  const org = row.organizations;

  if (invite.acceptedAt) {
    return c.json({ error: { message: 'Invite already accepted' } }, 400);
  }

  if (new Date() > invite.expiresAt) {
    return c.json({ error: { message: 'Invite has expired' } }, 400);
  }

  return c.json({
    data: {
      valid: true,
      email: invite.email,
      organizationName: org.name,
      role: invite.role,
    },
  });
});

// POST /api/invites/accept - Accept invite and create user (public)
invitesRoutes.post('/accept', async (c) => {
  const body = await c.req.json<{
    token: string;
    password: string;
    name: string;
  }>();

  if (!body.token || !body.password || !body.name) {
    return c.json({ error: { message: 'Token, password, and name are required' } }, 400);
  }

  if (body.password.length < 8) {
    return c.json({ error: { message: 'Password must be at least 8 characters' } }, 400);
  }

  // Find valid invite
  const result = await db
    .select()
    .from(organizationInvites)
    .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
    .where(
      and(
        eq(organizationInvites.token, body.token),
        isNull(organizationInvites.acceptedAt),
        gt(organizationInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: { message: 'Invalid or expired invite' } }, 400);
  }

  const row = result[0];
  const invite = row.organization_invites;
  const org = row.organizations;

  // Double check email isn't taken (race condition protection)
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  if (existingUser.length > 0) {
    return c.json({ error: { message: 'User already exists with this email' } }, 400);
  }

  // Create user
  const userId = randomUUID();
  const now = new Date();

  await db.insert(users).values({
    id: userId,
    email: invite.email,
    passwordHash: hashSync(body.password, 10),
    name: body.name,
    organizationId: invite.organizationId,
    isAdmin: invite.role === 'admin',
    isSuperAdmin: false,
    createdAt: now,
    updatedAt: now,
  });

  // Mark invite as accepted
  await db
    .update(organizationInvites)
    .set({ acceptedAt: now })
    .where(eq(organizationInvites.id, invite.id));

  // Create JWT token
  const userPublic: UserPublic = {
    id: userId,
    email: invite.email,
    name: body.name,
    isAdmin: invite.role === 'admin',
    isSuperAdmin: false,
    organizationId: invite.organizationId,
    organizationName: org.name,
    onboardingStep: 0,
  };

  const jwtToken = await createToken(userPublic);

  // Send welcome email (non-blocking)
  const webUrl = process.env.WEB_URL || 'https://skillomatic.technology';
  sendWelcomeEmail(invite.email, {
    userName: body.name,
    organizationName: org.name,
    webUrl,
  }).catch((err) => {
    console.error('[Invites] Failed to send welcome email:', err);
  });

  return c.json({
    data: {
      token: jwtToken,
      user: userPublic,
    },
  });
});

// DELETE /api/invites/:id - Cancel invite (org admin)
invitesRoutes.delete('/:id', jwtAuth, orgAdminOnly, withOrganization, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const org = c.get('organization');

  const [invite] = await db
    .select()
    .from(organizationInvites)
    .where(eq(organizationInvites.id, id))
    .limit(1);

  if (!invite) {
    return c.json({ error: { message: 'Invite not found' } }, 404);
  }

  // Verify permission
  if (!user.isSuperAdmin && invite.organizationId !== org?.id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  if (invite.acceptedAt) {
    return c.json({ error: { message: 'Cannot cancel accepted invite' } }, 400);
  }

  await db.delete(organizationInvites).where(eq(organizationInvites.id, id));

  return c.json({ data: { message: 'Invite cancelled' } });
});
