import { Hono } from 'hono';
import { db } from '@skilldex/db';
import { users, organizations } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcrypt-ts';
import { createToken, verifyToken } from '../lib/jwt.js';
import type { LoginRequest, LoginResponse, UserPublic } from '@skilldex/shared';

export const authRoutes = new Hono();

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json<LoginRequest>();

  if (!body.email || !body.password) {
    return c.json({ error: { message: 'Email and password are required' } }, 400);
  }

  // Find user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (user.length === 0) {
    return c.json({ error: { message: 'Invalid email or password' } }, 401);
  }

  // Verify password
  const isValid = compareSync(body.password, user[0].passwordHash);
  if (!isValid) {
    return c.json({ error: { message: 'Invalid email or password' } }, 401);
  }

  // Get organization name if user has one
  let organizationName: string | undefined;
  if (user[0].organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user[0].organizationId))
      .limit(1);
    organizationName = org?.name;
  }

  const userPublic: UserPublic = {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    avatarUrl: user[0].avatarUrl ?? undefined,
    isAdmin: user[0].isAdmin,
    isSuperAdmin: user[0].isSuperAdmin ?? false,
    organizationId: user[0].organizationId ?? undefined,
    organizationName,
  };

  const token = await createToken(userPublic);

  const response: LoginResponse = {
    token,
    user: userPublic,
  };

  return c.json({ data: response });
});

// GET /api/auth/me
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Not authenticated' } }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token' } }, 401);
  }

  // Get fresh user data
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (user.length === 0) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Get organization name if user has one
  let organizationName: string | undefined;
  if (user[0].organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user[0].organizationId))
      .limit(1);
    organizationName = org?.name;
  }

  const userPublic: UserPublic = {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    avatarUrl: user[0].avatarUrl ?? undefined,
    isAdmin: user[0].isAdmin,
    isSuperAdmin: user[0].isSuperAdmin ?? false,
    organizationId: user[0].organizationId ?? undefined,
    organizationName,
  };

  return c.json({ data: userPublic });
});

// POST /api/auth/logout (client-side token removal, this is a no-op)
authRoutes.post('/logout', (c) => {
  return c.json({ data: { message: 'Logged out' } });
});
