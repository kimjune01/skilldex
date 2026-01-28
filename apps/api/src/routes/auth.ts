import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, organizations } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcrypt-ts';
import { randomUUID } from 'crypto';
import { createToken, verifyToken } from '../lib/jwt.js';
import { sendWelcomeEmail } from '../lib/email.js';
import { getUrlsFromRequest } from '../lib/google-oauth.js';
import { createDefaultApiKey } from '../lib/api-keys.js';
import type { LoginResponse, UserPublic, UserTier } from '@skillomatic/shared';
import { loginRateLimit } from '../middleware/rate-limit.js';
import { loginRequestSchema, validateBody, ValidationError } from '../lib/validation.js';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Extract email domain from an email address
 */
function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/**
 * Find an organization that allows the given email domain
 * Returns null if no matching org found
 */
async function findOrgByEmailDomain(email: string): Promise<{ id: string; name: string } | null> {
  const domain = getEmailDomain(email);
  if (!domain) return null;

  // Get all orgs - we'll filter by allowedDomains in JS
  // (drizzle-orm doesn't have a clean IS NOT NULL for this case)
  const orgsWithDomains = await db
    .select()
    .from(organizations);

  for (const org of orgsWithDomains) {
    if (!org.allowedDomains) continue;

    try {
      const domains = JSON.parse(org.allowedDomains) as string[];
      if (Array.isArray(domains)) {
        // Check if the email domain matches any allowed domain (case-insensitive)
        const normalizedDomains = domains.map(d => d.toLowerCase().trim());
        if (normalizedDomains.includes(domain)) {
          console.log(`[Auth] Domain match: ${email} -> org ${org.name} (${org.id})`);
          return { id: org.id, name: org.name };
        }
      }
    } catch {
      // Invalid JSON in allowedDomains, skip this org
      console.warn(`[Auth] Invalid allowedDomains JSON for org ${org.id}`);
    }
  }

  return null;
}

export const authRoutes = new Hono();

// POST /auth/login
// Rate limited: 5 attempts per 15 minutes per IP (prevents brute force)
authRoutes.post('/login', loginRateLimit, async (c) => {
  // Validate request body with Zod schema
  let body;
  try {
    const rawBody = await c.req.json();
    body = validateBody(loginRequestSchema, rawBody);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: { message: error.message } }, 400);
    }
    return c.json({ error: { message: 'Invalid request body' } }, 400);
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
    accountTypeSelected: user[0].accountTypeSelected ?? false,
    tier: (user[0].tier as UserTier) ?? 'free',
    hiddenSkills: user[0].hiddenSkills ? JSON.parse(user[0].hiddenSkills) : undefined,
  };

  const token = await createToken(userPublic);

  const response: LoginResponse = {
    token,
    user: userPublic,
  };

  return c.json({ data: response });
});

// GET /auth/me
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

  // Check if individual user has an available org to join
  let availableOrg: { id: string; name: string } | undefined;
  if (!user[0].organizationId && user[0].accountTypeSelected) {
    const matchedOrg = await findOrgByEmailDomain(user[0].email);
    if (matchedOrg) {
      availableOrg = matchedOrg;
    }
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
    accountTypeSelected: user[0].accountTypeSelected ?? false,
    availableOrg,
    tier: (user[0].tier as UserTier) ?? 'free',
    hiddenSkills: user[0].hiddenSkills ? JSON.parse(user[0].hiddenSkills) : undefined,
  };

  return c.json({ data: userPublic });
});

// POST /auth/logout (client-side token removal, this is a no-op)
authRoutes.post('/logout', (c) => {
  return c.json({ data: { message: 'Logged out' } });
});

// GET /auth/stats - Public stats (total user count)
authRoutes.get('/stats', async (c) => {
  const result = await db.select().from(users);
  return c.json({ data: { totalUsers: result.length } });
});

// GET /auth/google - Redirect to Google OAuth
authRoutes.get('/google', (c) => {
  if (!GOOGLE_CLIENT_ID) {
    return c.json({ error: { message: 'Google OAuth not configured' } }, 500);
  }

  const { baseUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/auth/google/callback`;

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

// GET /auth/google/callback - Handle Google OAuth callback
authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  const { baseUrl, webUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/auth/google/callback`;

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
    let isNewUser = false;

    if (!dbUser) {
      isNewUser = true;
      // Check for domain-based org assignment
      const matchedOrg = await findOrgByEmailDomain(googleUser.email);

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
        organizationId: matchedOrg?.id ?? null, // Auto-assign to org if domain matches
        onboardingStep: 0,
      });

      if (matchedOrg) {
        console.log(`[Auth] New user ${googleUser.email} auto-assigned to org ${matchedOrg.name}`);
      }

      // Create default API key for extension auto-config
      await createDefaultApiKey(newUserId, matchedOrg?.id ?? null);

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
      accountTypeSelected: dbUser.accountTypeSelected ?? false,
      tier: (dbUser.tier as UserTier) ?? 'free',
      hiddenSkills: dbUser.hiddenSkills ? JSON.parse(dbUser.hiddenSkills) : undefined,
    };

    const token = await createToken(userPublic);

    // Send welcome email to new users (non-blocking)
    if (isNewUser) {
      sendWelcomeEmail(dbUser.email, {
        userName: dbUser.name,
        organizationName: organizationName || 'Skillomatic',
        webUrl,
      }).catch((err) => {
        console.error('[Auth] Failed to send welcome email:', err);
      });
    }

    // Redirect to frontend with token
    return c.redirect(`${webUrl}/login?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return c.redirect(`${webUrl}/login?error=oauth_failed`);
  }
});
