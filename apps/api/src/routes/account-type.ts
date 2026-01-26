/**
 * Account Type Routes
 *
 * Handles account type selection during onboarding:
 * - Individual accounts (free, limited integrations)
 * - Organization accounts (full access)
 *
 * Flow:
 * 1. GET /account-type/info - Get suggestions based on email domain
 * 2. POST /account-type/select-individual - Choose individual account
 * 3. POST /account-type/create-org - Create new organization
 * 4. POST /account-type/join-org - Join existing organization
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, organizations, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { jwtAuth } from '../middleware/auth.js';
import { createToken } from '../lib/jwt.js';
import {
  isPersonalEmail,
  getEmailDomain,
  type AccountTypeInfo,
  type UserPublic,
  type CreateOrgRequest,
  type JoinOrgRequest,
} from '@skillomatic/shared';

export const accountTypeRoutes = new Hono();

// Default organization slug - users in this org shouldn't see the org name in UI
const DEFAULT_ORG_SLUG = 'default';

/**
 * Helper to find an organization by email domain
 */
async function findOrgByEmailDomain(email: string): Promise<{ id: string; name: string } | null> {
  const domain = getEmailDomain(email);
  if (!domain) return null;

  const orgsWithDomains = await db.select().from(organizations);

  for (const org of orgsWithDomains) {
    if (!org.allowedDomains) continue;

    try {
      const domains = JSON.parse(org.allowedDomains) as string[];
      if (Array.isArray(domains)) {
        const normalizedDomains = domains.map((d) => d.toLowerCase().trim());
        if (normalizedDomains.includes(domain)) {
          return { id: org.id, name: org.name };
        }
      }
    } catch {
      // Invalid JSON in allowedDomains, skip this org
    }
  }

  return null;
}

/**
 * Helper to build UserPublic response
 */
async function buildUserPublic(dbUser: typeof users.$inferSelect): Promise<UserPublic> {
  let organizationName: string | undefined;
  if (dbUser.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, dbUser.organizationId))
      .limit(1);
    // Don't show org name for users in the default organization
    if (org && org.slug !== DEFAULT_ORG_SLUG) {
      organizationName = org.name;
    }
  }

  // Check if individual user has an available org to join
  let availableOrg: { id: string; name: string } | undefined;
  if (!dbUser.organizationId && dbUser.accountTypeSelected) {
    const matchedOrg = await findOrgByEmailDomain(dbUser.email);
    if (matchedOrg) {
      availableOrg = matchedOrg;
    }
  }

  return {
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
    availableOrg,
  };
}

/**
 * Helper to generate a URL-friendly slug from org name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * GET /account-type/info
 * Get account type suggestions based on user's email domain.
 */
accountTypeRoutes.get('/info', jwtAuth, async (c) => {
  const user = c.get('user');

  // Get fresh user data
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  const emailDomain = getEmailDomain(dbUser.email);
  const isPersonal = isPersonalEmail(dbUser.email);
  const existingOrg = await findOrgByEmailDomain(dbUser.email);

  const info: AccountTypeInfo = {
    suggestedType: isPersonal ? 'individual' : 'organization',
    emailDomain,
    isPersonalEmail: isPersonal,
    existingOrg,
    canCreateOrg: true, // Anyone can create an org, but messaging differs
  };

  return c.json({ data: info });
});

/**
 * POST /account-type/select-individual
 * Select individual (free) account type.
 */
accountTypeRoutes.post('/select-individual', jwtAuth, async (c) => {
  const user = c.get('user');

  // Get fresh user data
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Already selected account type
  if (dbUser.accountTypeSelected) {
    return c.json({ error: { message: 'Account type already selected' } }, 400);
  }

  // Update user: set accountTypeSelected, advance onboarding
  await db
    .update(users)
    .set({
      accountTypeSelected: true,
      organizationId: null, // Ensure no org
      onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.sub));

  // Get updated user
  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  const userPublic = await buildUserPublic(updatedUser);
  const token = await createToken(userPublic);

  return c.json({
    data: {
      success: true,
      user: userPublic,
      token, // New token with updated user info
    },
  });
});

/**
 * POST /account-type/create-org
 * Create a new organization and become admin.
 */
accountTypeRoutes.post('/create-org', jwtAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<CreateOrgRequest>();

  if (!body.name || body.name.trim().length < 2) {
    return c.json({ error: { message: 'Organization name is required (min 2 characters)' } }, 400);
  }

  // Get fresh user data
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Check if user already has an org
  if (dbUser.organizationId) {
    return c.json({ error: { message: 'You already belong to an organization' } }, 400);
  }

  const emailDomain = getEmailDomain(dbUser.email);
  const isPersonal = isPersonalEmail(dbUser.email);

  // Generate unique slug
  let slug = generateSlug(body.name);
  let slugCounter = 0;
  while (true) {
    const candidateSlug = slugCounter === 0 ? slug : `${slug}-${slugCounter}`;
    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, candidateSlug))
      .limit(1);

    if (existing.length === 0) {
      slug = candidateSlug;
      break;
    }
    slugCounter++;
  }

  // Create organization
  const orgId = randomUUID();
  const now = new Date();

  await db.insert(organizations).values({
    id: orgId,
    name: body.name.trim(),
    slug,
    // Only set allowedDomains for non-personal emails
    allowedDomains: isPersonal ? null : JSON.stringify([emailDomain]),
    createdAt: now,
    updatedAt: now,
  });

  // Update user: join org as admin, set accountTypeSelected
  await db
    .update(users)
    .set({
      organizationId: orgId,
      isAdmin: true, // Creator is admin
      accountTypeSelected: true,
      onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
      updatedAt: now,
    })
    .where(eq(users.id, user.sub));

  // Get updated data
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  const userPublic = await buildUserPublic(updatedUser);
  const token = await createToken(userPublic);

  return c.json({
    data: {
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? undefined,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      },
      user: userPublic,
      token,
    },
  });
});

/**
 * POST /account-type/join-org
 * Join an existing organization as a member.
 */
accountTypeRoutes.post('/join-org', jwtAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<JoinOrgRequest>();

  if (!body.orgId) {
    return c.json({ error: { message: 'Organization ID is required' } }, 400);
  }

  // Get fresh user data
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: { message: 'User not found' } }, 404);
  }

  // Check if user already has an org
  if (dbUser.organizationId) {
    return c.json({ error: { message: 'You already belong to an organization' } }, 400);
  }

  // Get the organization
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, body.orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  // Verify user's domain matches org's allowedDomains
  const emailDomain = getEmailDomain(dbUser.email);
  let canJoin = false;

  if (org.allowedDomains) {
    try {
      const domains = JSON.parse(org.allowedDomains) as string[];
      if (Array.isArray(domains)) {
        const normalizedDomains = domains.map((d) => d.toLowerCase().trim());
        canJoin = normalizedDomains.includes(emailDomain);
      }
    } catch {
      // Invalid JSON
    }
  }

  if (!canJoin) {
    return c.json({
      error: {
        message: `Your email domain (${emailDomain}) is not authorized to join this organization`,
      },
    }, 403);
  }

  // Update user: join org as member (not admin), set accountTypeSelected
  const now = new Date();
  await db
    .update(users)
    .set({
      organizationId: org.id,
      isAdmin: false, // Joining as member, not admin
      accountTypeSelected: true,
      onboardingStep: ONBOARDING_STEPS.ACCOUNT_TYPE_SELECTED,
      updatedAt: now,
    })
    .where(eq(users.id, user.sub));

  // Get updated user
  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  const userPublic = await buildUserPublic(updatedUser);
  const token = await createToken(userPublic);

  return c.json({
    data: {
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? undefined,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      },
      user: userPublic,
      token,
    },
  });
});
