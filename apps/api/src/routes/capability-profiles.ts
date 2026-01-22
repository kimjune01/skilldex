/**
 * Integration Permissions Admin Routes
 *
 * Manages org-level integration permissions and skill access.
 * Uses a three-way intersection model:
 * 1. Admin allows (org-level permissions) - managed here
 * 2. Integration connected - managed in integrations.ts
 * 3. User's personal choice - managed in integrations.ts during OAuth
 *
 * Only org admins can modify these settings.
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import { withOrganization } from '../middleware/organization.js';
import {
  getOrgIntegrationPermissions,
  getOrgDisabledSkills,
  updateOrgIntegrationPermissions,
  updateOrgDisabledSkills,
  type OrgIntegrationPermissions,
  type AccessLevel,
} from '../lib/integration-permissions.js';

export const capabilityProfilesRoutes = new Hono();

/** Structured logging for permissions admin routes */
const log = {
  info: (event: string, data?: Record<string, unknown>) =>
    console.log(`[Permissions:Admin] ${event}`, data ? JSON.stringify(data) : ''),
  warn: (event: string, data?: Record<string, unknown>) =>
    console.warn(`[Permissions:Admin] ${event}`, data ? JSON.stringify(data) : ''),
};

// All routes require JWT auth and org context
capabilityProfilesRoutes.use('*', jwtAuth);
capabilityProfilesRoutes.use('*', withOrganization);

// Middleware to require org admin
async function requireOrgAdmin(c: Context, next: Next) {
  const user = c.get('user') as { sub?: string; isAdmin?: boolean; isSuperAdmin?: boolean } | undefined;
  if (!user?.isAdmin && !user?.isSuperAdmin) {
    const org = c.get('organization') as { id?: string } | undefined;
    log.warn('admin_access_denied', {
      userId: user?.sub,
      orgId: org?.id,
      path: c.req.path,
    });
    return c.json({ error: { message: 'Forbidden - Org admin required' } }, 403);
  }
  await next();
}

/**
 * GET /capability-profiles
 *
 * Get the organization's integration permissions and disabled skills.
 * This is the new simplified API replacing the old capability profiles CRUD.
 */
capabilityProfilesRoutes.get('/', async (c) => {
  const org = c.get('organization');
  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 400);
  }

  const permissions = await getOrgIntegrationPermissions(org.id);
  const disabledSkills = await getOrgDisabledSkills(org.id);

  return c.json({
    data: {
      integrations: permissions,
      disabledSkills,
    },
  });
});

/**
 * PUT /capability-profiles
 *
 * Update the organization's integration permissions and/or disabled skills.
 * Only org admins can modify these settings.
 *
 * Body:
 * {
 *   integrations?: { ats: "read-write"|"read-only"|"disabled", ... },
 *   disabledSkills?: ["skill-slug-1", "skill-slug-2"]
 * }
 */
capabilityProfilesRoutes.put('/', requireOrgAdmin, async (c) => {
  const org = c.get('organization');
  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 400);
  }

  let body: {
    integrations?: Partial<OrgIntegrationPermissions>;
    disabledSkills?: string[];
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  // Validate access levels
  const validLevels: AccessLevel[] = ['read-write', 'read-only', 'disabled'];
  if (body.integrations) {
    for (const [key, value] of Object.entries(body.integrations)) {
      if (!['ats', 'email', 'calendar'].includes(key)) {
        return c.json(
          { error: { message: `Invalid integration category: ${key}` } },
          400
        );
      }
      if (!validLevels.includes(value as AccessLevel)) {
        return c.json(
          { error: { message: `Invalid access level: ${value}. Must be one of: ${validLevels.join(', ')}` } },
          400
        );
      }
    }
  }

  // Update permissions
  if (body.integrations) {
    await updateOrgIntegrationPermissions(org.id, body.integrations);
  }

  // Update disabled skills
  if (body.disabledSkills !== undefined) {
    // Validate all slugs are strings
    if (!Array.isArray(body.disabledSkills) || !body.disabledSkills.every(s => typeof s === 'string')) {
      return c.json(
        { error: { message: 'disabledSkills must be an array of strings' } },
        400
      );
    }
    await updateOrgDisabledSkills(org.id, body.disabledSkills);
  }

  // Return updated settings
  const permissions = await getOrgIntegrationPermissions(org.id);
  const disabledSkills = await getOrgDisabledSkills(org.id);

  return c.json({
    data: {
      integrations: permissions,
      disabledSkills,
    },
  });
});

/**
 * PUT /capability-profiles/integrations
 *
 * Update only the integration permissions.
 */
capabilityProfilesRoutes.put('/integrations', requireOrgAdmin, async (c) => {
  const org = c.get('organization');
  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 400);
  }

  let body: Partial<OrgIntegrationPermissions>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  // Validate access levels
  const validLevels: AccessLevel[] = ['read-write', 'read-only', 'disabled'];
  for (const [key, value] of Object.entries(body)) {
    if (!['ats', 'email', 'calendar'].includes(key)) {
      return c.json(
        { error: { message: `Invalid integration category: ${key}` } },
        400
      );
    }
    if (!validLevels.includes(value as AccessLevel)) {
      return c.json(
        { error: { message: `Invalid access level: ${value}. Must be one of: ${validLevels.join(', ')}` } },
        400
      );
    }
  }

  await updateOrgIntegrationPermissions(org.id, body);

  const permissions = await getOrgIntegrationPermissions(org.id);
  return c.json({ data: permissions });
});

/**
 * PUT /capability-profiles/disabled-skills
 *
 * Update only the disabled skills list.
 */
capabilityProfilesRoutes.put('/disabled-skills', requireOrgAdmin, async (c) => {
  const org = c.get('organization');
  if (!org) {
    return c.json({ error: { message: 'No organization assigned' } }, 400);
  }

  let body: { skills: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  if (!Array.isArray(body.skills) || !body.skills.every(s => typeof s === 'string')) {
    return c.json(
      { error: { message: 'skills must be an array of strings' } },
      400
    );
  }

  await updateOrgDisabledSkills(org.id, body.skills);

  const disabledSkills = await getOrgDisabledSkills(org.id);
  return c.json({ data: { disabledSkills } });
});
