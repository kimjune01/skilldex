/**
 * Pay Intentions API Routes
 *
 * Handles pay intention tracking for premium features.
 * Users express intent to pay by completing Stripe checkout ($0 setup).
 *
 * User routes:
 * - POST /pay-intentions - Create pay intention, get Stripe checkout URL
 * - GET /pay-intentions/status - Check if user has confirmed for a trigger
 * - GET /pay-intentions/my - List user's pay intentions
 *
 * Admin routes (super admin only):
 * - GET /pay-intentions/admin/stats - Dashboard stats
 * - GET /pay-intentions/admin/list - Paginated list with user info
 */

import { Hono } from 'hono';
import { jwtAuth, superAdminOnly } from '../middleware/auth.js';
import { db } from '@skillomatic/db';
import { payIntentions, users } from '@skillomatic/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { createLogger } from '../lib/logger.js';
import type {
  CreatePayIntentionRequest,
  PayIntentionTrigger,
} from '@skillomatic/shared';

const log = createLogger('PayIntentions');

export const payIntentionsRoutes = new Hono();

// All routes require JWT auth
payIntentionsRoutes.use('*', jwtAuth);

// ============ USER ROUTES ============

/**
 * POST /pay-intentions
 * Create a pay intention and get Stripe checkout URL
 */
payIntentionsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<CreatePayIntentionRequest>();

  // Validate trigger type
  if (!VALID_TRIGGER_TYPES.includes(body.triggerType)) {
    return c.json({ error: { message: 'Invalid trigger type' } }, 400);
  }

  // Check if user already has a confirmed pay intention for this trigger
  const existing = await db
    .select()
    .from(payIntentions)
    .where(
      and(
        eq(payIntentions.userId, user.sub),
        eq(payIntentions.triggerType, body.triggerType),
        eq(payIntentions.status, 'confirmed')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return c.json({
      data: {
        payIntentionId: existing[0].id,
        confirmed: true,
        message: 'Thanks for your interest! This feature is coming soon.',
      },
    });
  }

  // Create pay intention record - immediately confirmed (no Stripe)
  const payIntentionId = crypto.randomUUID();
  const now = new Date();

  await db.insert(payIntentions).values({
    id: payIntentionId,
    userId: user.sub,
    triggerType: body.triggerType,
    triggerProvider: body.triggerProvider,
    status: 'confirmed',
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Update user's hasConfirmedPayIntention flag
  await db
    .update(users)
    .set({
      hasConfirmedPayIntention: true,
      updatedAt: now,
    })
    .where(eq(users.id, user.sub));

  log.info('pay_intention_confirmed', {
    payIntentionId,
    userId: user.sub,
    triggerType: body.triggerType,
    triggerProvider: body.triggerProvider,
  });

  return c.json({
    data: {
      payIntentionId,
      confirmed: true,
    },
  });
});

// Valid trigger types for validation
const VALID_TRIGGER_TYPES: PayIntentionTrigger[] = ['individual_ats', 'premium_integration', 'subscription'];

/**
 * GET /pay-intentions/status
 * Check if user has confirmed pay intention for a feature
 */
payIntentionsRoutes.get('/status', async (c) => {
  const user = c.get('user');
  const triggerType = c.req.query('triggerType');

  if (!triggerType) {
    return c.json({ error: { message: 'triggerType query param required' } }, 400);
  }

  if (!VALID_TRIGGER_TYPES.includes(triggerType as PayIntentionTrigger)) {
    return c.json({ error: { message: 'Invalid triggerType' } }, 400);
  }

  const intention = await db
    .select()
    .from(payIntentions)
    .where(
      and(
        eq(payIntentions.userId, user.sub),
        eq(payIntentions.triggerType, triggerType),
        eq(payIntentions.status, 'confirmed')
      )
    )
    .limit(1);

  return c.json({
    data: {
      hasConfirmed: intention.length > 0,
      confirmedAt: intention[0]?.confirmedAt?.toISOString(),
    },
  });
});

/**
 * GET /pay-intentions/my
 * Get user's pay intentions
 */
payIntentionsRoutes.get('/my', async (c) => {
  const user = c.get('user');

  const intentions = await db
    .select()
    .from(payIntentions)
    .where(eq(payIntentions.userId, user.sub))
    .orderBy(desc(payIntentions.createdAt));

  return c.json({
    data: intentions.map((i) => ({
      id: i.id,
      triggerType: i.triggerType,
      triggerProvider: i.triggerProvider,
      status: i.status,
      confirmedAt: i.confirmedAt?.toISOString(),
      createdAt: i.createdAt.toISOString(),
    })),
  });
});

// ============ ADMIN ROUTES ============

/**
 * GET /pay-intentions/admin/stats
 * SuperAdmin stats dashboard
 */
payIntentionsRoutes.get('/admin/stats', superAdminOnly, async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all intentions with user data
  const allIntentions = await db
    .select()
    .from(payIntentions)
    .leftJoin(users, eq(payIntentions.userId, users.id))
    .where(gte(payIntentions.createdAt, since))
    .orderBy(desc(payIntentions.createdAt));

  // Calculate stats
  const total = allIntentions.length;
  const confirmed = allIntentions.filter((i) => i.pay_intentions.status === 'confirmed').length;
  const pending = allIntentions.filter((i) => i.pay_intentions.status === 'pending').length;

  const byTriggerType: Record<PayIntentionTrigger, number> = {
    individual_ats: allIntentions.filter((i) => i.pay_intentions.triggerType === 'individual_ats').length,
    premium_integration: allIntentions.filter((i) => i.pay_intentions.triggerType === 'premium_integration').length,
    subscription: allIntentions.filter((i) => i.pay_intentions.triggerType === 'subscription').length,
  };

  // Recent intentions with user info (top 50)
  const recentIntentions = allIntentions.slice(0, 50).map((i) => ({
    id: i.pay_intentions.id,
    triggerType: i.pay_intentions.triggerType,
    triggerProvider: i.pay_intentions.triggerProvider,
    status: i.pay_intentions.status,
    confirmedAt: i.pay_intentions.confirmedAt?.toISOString(),
    createdAt: i.pay_intentions.createdAt.toISOString(),
    user: i.users
      ? {
          id: i.users.id,
          email: i.users.email,
          name: i.users.name,
          organizationId: i.users.organizationId,
        }
      : null,
  }));

  return c.json({
    data: {
      total,
      confirmed,
      pending,
      byTriggerType,
      recentIntentions,
    },
  });
});

/**
 * GET /pay-intentions/admin/list
 * SuperAdmin paginated list
 */
payIntentionsRoutes.get('/admin/list', superAdminOnly, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  const intentions = await db
    .select()
    .from(payIntentions)
    .leftJoin(users, eq(payIntentions.userId, users.id))
    .orderBy(desc(payIntentions.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count (simple approach - acceptable for pay intentions table size)
  const allIntentions = await db.select().from(payIntentions);
  const totalCount = allIntentions.length;

  return c.json({
    data: intentions.map((i) => ({
      id: i.pay_intentions.id,
      triggerType: i.pay_intentions.triggerType,
      triggerProvider: i.pay_intentions.triggerProvider,
      status: i.pay_intentions.status,
      confirmedAt: i.pay_intentions.confirmedAt?.toISOString(),
      createdAt: i.pay_intentions.createdAt.toISOString(),
      user: i.users
        ? {
            id: i.users.id,
            email: i.users.email,
            name: i.users.name,
            organizationId: i.users.organizationId,
          }
        : null,
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: offset + intentions.length < totalCount,
    },
  });
});
