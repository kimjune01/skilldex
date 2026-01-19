import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';

export const v1MeRoutes = new Hono();

// All routes require API key auth
v1MeRoutes.use('*', apiKeyAuth);

// GET /api/v1/me - Get current user info (for skills to verify auth)
v1MeRoutes.get('/', async (c) => {
  const user = c.get('apiKeyUser');

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
