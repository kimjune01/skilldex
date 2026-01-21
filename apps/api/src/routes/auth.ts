import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, organizations } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcrypt-ts';
import { randomUUID } from 'crypto';
import { createToken, verifyToken } from '../lib/jwt.js';
import type { LoginRequest, LoginResponse, UserPublic } from '@skillomatic/shared';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

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
    onboardingStep: user[0].onboardingStep ?? 0,
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
    onboardingStep: user[0].onboardingStep ?? 0,
  };

  return c.json({ data: userPublic });
});

// POST /api/auth/logout (client-side token removal, this is a no-op)
authRoutes.post('/logout', (c) => {
  return c.json({ data: { message: 'Logged out' } });
});

// GET /api/auth/google - Redirect to Google OAuth
authRoutes.get('/google', (c) => {
  if (!GOOGLE_CLIENT_ID) {
    return c.json({ error: { message: 'Google OAuth not configured' } }, 500);
  }

  // Determine the redirect URI based on the request origin
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'offline',
    prompt: 'consent',
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /api/auth/google/callback - Handle Google OAuth callback
authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  // Determine URLs
  const host = c.req.header('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const webUrl = baseUrl.replace('/api', '').replace(':3000', ':5173'); // Adjust for dev
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (error) {
    return c.redirect(`${webUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return c.redirect(`${webUrl}/login?error=missing_code`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return c.redirect(`${webUrl}/login?error=oauth_not_configured`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google token exchange failed:', errorText);
      return c.redirect(`${webUrl}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json() as { access_token: string };

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return c.redirect(`${webUrl}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Find or create user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email.toLowerCase()))
      .limit(1);

    let dbUser = user[0];

    if (!dbUser) {
      // Create new user
      const newUserId = randomUUID();
      await db.insert(users).values({
        id: newUserId,
        email: googleUser.email.toLowerCase(),
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        passwordHash: '', // No password for OAuth users
        isAdmin: false,
        isSuperAdmin: false,
        onboardingStep: 0,
      });

      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, newUserId))
        .limit(1);
      dbUser = newUser;
    } else {
      // Update avatar if changed
      if (googleUser.picture && googleUser.picture !== dbUser.avatarUrl) {
        await db
          .update(users)
          .set({ avatarUrl: googleUser.picture, updatedAt: new Date() })
          .where(eq(users.id, dbUser.id));
      }
    }

    // Get organization name if user has one
    let organizationName: string | undefined;
    if (dbUser.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, dbUser.organizationId))
        .limit(1);
      organizationName = org?.name;
    }

    const userPublic: UserPublic = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl ?? undefined,
      isAdmin: dbUser.isAdmin,
      isSuperAdmin: dbUser.isSuperAdmin ?? false,
      organizationId: dbUser.organizationId ?? undefined,
      organizationName,
      onboardingStep: dbUser.onboardingStep ?? 0,
    };

    const token = await createToken(userPublic);

    // Redirect to frontend with token
    return c.redirect(`${webUrl}/login?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return c.redirect(`${webUrl}/login?error=oauth_failed`);
  }
});
