import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { users, organizations, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import { apiKeyAuth } from '../../middleware/apiKey.js';

export const v1MeRoutes = new Hono();

// All routes require API key auth
v1MeRoutes.use('*', apiKeyAuth);

// GET /v1/me - Get current user info (for skills to verify auth)
v1MeRoutes.get('/', async (c) => {
  const user = c.get('apiKeyUser');

  /*
   * =======================================================================
   * MCP ONBOARDING: This endpoint is called when the MCP server first
   * connects and verifies authentication. When this endpoint is hit,
   * it means the user has successfully:
   *   1. Generated an API key
   *   2. Added the MCP config to their Claude Desktop (or other MCP app)
   *   3. Started the MCP server which called this endpoint
   *
   * Only advance onboarding if the organization has desktop BYOAI enabled.
   * If desktopEnabled is false, this endpoint shouldn't affect onboarding
   * since users would be using a different flow (e.g., web UI only).
   * =======================================================================
   */

  // Check if org has desktop BYOAI enabled before advancing onboarding
  if (user.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    // Only advance onboarding if desktop is enabled and user hasn't completed this step
    if (org?.desktopEnabled && user.onboardingStep < ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED) {
      // MCP connection proves API key is working - advance to DEPLOYMENT_CONFIGURED
      await db
        .update(users)
        .set({
          onboardingStep: ONBOARDING_STEPS.DEPLOYMENT_CONFIGURED,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }
  }

  // For Phase 2, this would include permissions from RBAC
  // For now, return basic user info
  return c.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      // Phase 2: permissions would be looked up from user_roles + role_permissions
      permissions: user.isAdmin
        ? ['admin:*']
        : ['skills:read', 'skills:execute', 'candidates:read', 'candidates:write'],
    },
  });
});
