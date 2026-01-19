import { Hono } from 'hono';
import { db } from '@skilldex/db';
import { users } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hashSync } from 'bcrypt-ts';
import { jwtAuth, adminOnly } from '../middleware/auth.js';
import type { UserPublic } from '@skilldex/shared';

export const usersRoutes = new Hono();

// All routes require JWT auth and admin
usersRoutes.use('*', jwtAuth);
usersRoutes.use('*', adminOnly);

// GET /api/users - List all users (admin only)
usersRoutes.get('/', async (c) => {
  const allUsers = await db.select().from(users);

  const publicUsers: UserPublic[] = allUsers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? undefined,
    isAdmin: user.isAdmin,
  }));

  return c.json({ data: publicUsers });
});

// GET /api/users/:id - Get user by ID (admin only)
usersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (user.length === 0) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const publicUser: UserPublic = {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    avatarUrl: user[0].avatarUrl ?? undefined,
    isAdmin: user[0].isAdmin,
  };

  return c.json({ data: publicUser });
});

// POST /api/users - Create user (admin only)
usersRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    name: string;
    isAdmin?: boolean;
  }>();

  if (!body.email || !body.password || !body.name) {
    return c.json({ error: { message: 'Email, password, and name are required' } }, 400);
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

  const id = randomUUID();
  const passwordHash = hashSync(body.password, 10);

  await db.insert(users).values({
    id,
    email: body.email.toLowerCase(),
    passwordHash,
    name: body.name,
    isAdmin: body.isAdmin ?? false,
  });

  const publicUser: UserPublic = {
    id,
    email: body.email.toLowerCase(),
    name: body.name,
    isAdmin: body.isAdmin ?? false,
  };

  return c.json({ data: publicUser }, 201);
});

// DELETE /api/users/:id - Delete user (admin only)
usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');

  // Prevent self-deletion
  if (id === currentUser.sub) {
    return c.json({ error: { message: 'Cannot delete yourself' } }, 400);
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (user.length === 0) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  await db.delete(users).where(eq(users.id, id));

  return c.json({ data: { message: 'User deleted' } });
});
