import { createMiddleware } from 'hono/factory';
import { verifyToken, type JWTPayload } from '../lib/jwt.js';

// Extend Hono's context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * JWT authentication middleware
 * Expects: Authorization: Bearer <token>
 */
export const jwtAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Missing or invalid Authorization header' } }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token' } }, 401);
  }

  c.set('user', payload);
  await next();
});

/**
 * Admin-only middleware (must be used after jwtAuth)
 * Allows both org admins and super admins
 */
export const adminOnly = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user?.isAdmin && !user?.isSuperAdmin) {
    return c.json({ error: { message: 'Admin access required' } }, 403);
  }

  await next();
});

/**
 * Super admin-only middleware (must be used after jwtAuth)
 * Only allows system-wide super admins
 */
export const superAdminOnly = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user?.isSuperAdmin) {
    return c.json({ error: { message: 'Super admin access required' } }, 403);
  }

  await next();
});

/**
 * Org admin-only middleware (must be used after jwtAuth)
 * Allows org admins (within their org) and super admins
 */
export const orgAdminOnly = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user?.isAdmin && !user?.isSuperAdmin) {
    return c.json({ error: { message: 'Organization admin access required' } }, 403);
  }

  await next();
});
