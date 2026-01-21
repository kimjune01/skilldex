import { createMiddleware } from 'hono/factory';
import { db } from '@skilldex/db';
import { organizations } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';

// Organization info
export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
}

// Extend Hono's context
declare module 'hono' {
  interface ContextVariableMap {
    organization: OrganizationContext | null;
  }
}

/**
 * Middleware to inject organization context from JWT payload
 * Must be used AFTER jwtAuth middleware
 */
export const withOrganization = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (user?.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    c.set('organization', org ? { id: org.id, name: org.name, slug: org.slug } : null);
  } else {
    c.set('organization', null);
  }

  await next();
});

/**
 * Middleware to require organization context
 * Returns 403 if user has no organization
 * Must be used AFTER withOrganization middleware
 */
export const requireOrganization = createMiddleware(async (c, next) => {
  const org = c.get('organization');

  if (!org) {
    return c.json(
      { error: { message: 'Organization context required' } },
      403
    );
  }

  await next();
});

/**
 * Middleware to inject organization context from API key user
 * Must be used AFTER apiKeyAuth middleware
 */
export const withOrganizationFromApiKey = createMiddleware(async (c, next) => {
  const apiKeyUser = c.get('apiKeyUser');

  if (apiKeyUser?.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, apiKeyUser.organizationId))
      .limit(1);

    c.set('organization', org ? { id: org.id, name: org.name, slug: org.slug } : null);
  } else {
    c.set('organization', null);
  }

  await next();
});
