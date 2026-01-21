import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { organizations, users } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { jwtAuth, superAdminOnly } from '../middleware/auth.js';
import { withOrganization } from '../middleware/organization.js';
import type { OrganizationPublic } from '@skillomatic/shared';

export const organizationsRoutes = new Hono();

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Helper to get member count for an org
async function getMemberCount(orgId: string): Promise<number> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, orgId));
  return result.length;
}

// Helper to get all member counts in a single query
// This avoids N+1 queries by counting in memory from a single users query
async function getAllMemberCounts(): Promise<Map<string, number>> {
  const allUsers = await db.select().from(users);

  const countMap = new Map<string, number>();
  for (const u of allUsers) {
    if (u.organizationId) {
      countMap.set(u.organizationId, (countMap.get(u.organizationId) ?? 0) + 1);
    }
  }
  return countMap;
}

// GET /api/organizations - List all organizations (super admin only)
organizationsRoutes.get('/', jwtAuth, superAdminOnly, async (c) => {
  const [orgs, countMap] = await Promise.all([
    db.select().from(organizations),
    getAllMemberCounts(),
  ]);

  const publicOrgs: OrganizationPublic[] = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? undefined,
    memberCount: countMap.get(org.id) ?? 0,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }));

  return c.json({ data: publicOrgs });
});

// GET /api/organizations/current - Get current user's organization
organizationsRoutes.get('/current', jwtAuth, withOrganization, async (c) => {
  const org = c.get('organization');

  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 404);
  }

  const memberCount = await getMemberCount(org.id);

  const [fullOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  const publicOrg: OrganizationPublic = {
    id: fullOrg.id,
    name: fullOrg.name,
    slug: fullOrg.slug,
    logoUrl: fullOrg.logoUrl ?? undefined,
    memberCount,
    createdAt: fullOrg.createdAt.toISOString(),
    updatedAt: fullOrg.updatedAt.toISOString(),
  };

  return c.json({ data: publicOrg });
});

// GET /api/organizations/current/deployment - Get deployment settings for current org
organizationsRoutes.get('/current/deployment', jwtAuth, withOrganization, async (c) => {
  const org = c.get('organization');
  const user = c.get('user');

  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 404);
  }

  // Only org admins can view deployment settings
  if (!user.isAdmin && !user.isSuperAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const [fullOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  // Check if LLM is configured (needed for Web UI)
  const hasLlmConfigured = Boolean(fullOrg.llmApiKey);

  return c.json({
    data: {
      webUiEnabled: fullOrg.webUiEnabled ?? false,
      desktopEnabled: fullOrg.desktopEnabled ?? true,
      hasLlmConfigured,
    },
  });
});

// PUT /api/organizations/current/deployment - Update deployment settings for current org
organizationsRoutes.put('/current/deployment', jwtAuth, withOrganization, async (c) => {
  const org = c.get('organization');
  const user = c.get('user');

  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 404);
  }

  // Only org admins can update deployment settings
  if (!user.isAdmin && !user.isSuperAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const body = await c.req.json<{
    webUiEnabled?: boolean;
    desktopEnabled?: boolean;
  }>();

  // Get current org to check LLM config
  const [fullOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  // If enabling Web UI, check that LLM is configured
  if (body.webUiEnabled === true && !fullOrg.llmApiKey) {
    return c.json(
      {
        error: {
          message: 'Cannot enable Web UI without LLM configuration',
          code: 'LLM_NOT_CONFIGURED',
        },
      },
      400
    );
  }

  const now = new Date();

  await db
    .update(organizations)
    .set({
      webUiEnabled: body.webUiEnabled ?? fullOrg.webUiEnabled,
      desktopEnabled: body.desktopEnabled ?? fullOrg.desktopEnabled,
      updatedAt: now,
    })
    .where(eq(organizations.id, org.id));

  const [updated] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  return c.json({
    data: {
      webUiEnabled: updated.webUiEnabled ?? false,
      desktopEnabled: updated.desktopEnabled ?? true,
      hasLlmConfigured: Boolean(updated.llmApiKey),
    },
  });
});

// POST /api/organizations - Create organization (super admin only)
organizationsRoutes.post('/', jwtAuth, superAdminOnly, async (c) => {
  const body = await c.req.json<{
    name: string;
    slug?: string;
    logoUrl?: string;
  }>();

  if (!body.name) {
    return c.json({ error: { message: 'Name is required' } }, 400);
  }

  const slug = body.slug || generateSlug(body.name);

  // Check if slug already exists
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: { message: 'Organization slug already exists' } }, 400);
  }

  const id = randomUUID();
  const now = new Date();

  await db.insert(organizations).values({
    id,
    name: body.name,
    slug,
    logoUrl: body.logoUrl,
    createdAt: now,
    updatedAt: now,
  });

  const publicOrg: OrganizationPublic = {
    id,
    name: body.name,
    slug,
    logoUrl: body.logoUrl,
    memberCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return c.json({ data: publicOrg }, 201);
});

// GET /api/organizations/:id - Get organization by ID (super admin or org member)
organizationsRoutes.get('/:id', jwtAuth, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Allow super admin or members of the org
  if (!user.isSuperAdmin && user.organizationId !== id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!org) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  const memberCount = await getMemberCount(id);

  const publicOrg: OrganizationPublic = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? undefined,
    memberCount,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };

  return c.json({ data: publicOrg });
});

// PUT /api/organizations/:id - Update organization (super admin or org admin)
organizationsRoutes.put('/:id', jwtAuth, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Allow super admin or org admin of the org
  const isOrgAdmin = user.isAdmin && user.organizationId === id;
  if (!user.isSuperAdmin && !isOrgAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  const body = await c.req.json<{
    name?: string;
    slug?: string;
    logoUrl?: string;
  }>();

  // Validate slug uniqueness if changing
  if (body.slug && body.slug !== existing.slug) {
    const slugExists = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, body.slug))
      .limit(1);

    if (slugExists.length > 0) {
      return c.json({ error: { message: 'Organization slug already exists' } }, 400);
    }
  }

  const now = new Date();

  await db
    .update(organizations)
    .set({
      name: body.name ?? existing.name,
      slug: body.slug ?? existing.slug,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
      updatedAt: now,
    })
    .where(eq(organizations.id, id));

  const [updated] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  const memberCount = await getMemberCount(id);

  const publicOrg: OrganizationPublic = {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    logoUrl: updated.logoUrl ?? undefined,
    memberCount,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };

  return c.json({ data: publicOrg });
});

// DELETE /api/organizations/:id - Delete organization (super admin only)
organizationsRoutes.delete('/:id', jwtAuth, superAdminOnly, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: { message: 'Organization not found' } }, 404);
  }

  // Check if org has members
  const memberCount = await getMemberCount(id);

  if (memberCount > 0) {
    return c.json(
      { error: { message: 'Cannot delete organization with members. Remove all members first.' } },
      400
    );
  }

  await db.delete(organizations).where(eq(organizations.id, id));

  return c.json({ data: { message: 'Organization deleted' } });
});
