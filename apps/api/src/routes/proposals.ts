import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import { db } from '@skillomatic/db';
import { skillProposals, users } from '@skillomatic/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { SkillProposalCreateRequest, SkillProposalReviewRequest } from '@skillomatic/shared';

export const proposalsRoutes = new Hono();

// All routes require JWT auth
proposalsRoutes.use('*', jwtAuth);

// GET /api/proposals - List proposals (user sees own, admin sees all)
proposalsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const status = c.req.query('status'); // 'pending', 'approved', 'denied'

  // Build conditions
  const conditions = [];
  if (!user.isAdmin) {
    conditions.push(eq(skillProposals.userId, user.id));
  }
  if (status) {
    conditions.push(eq(skillProposals.status, status));
  }

  const results = await db
    .select()
    .from(skillProposals)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(skillProposals.createdAt));

  // Get users for admin view
  const userIds = [...new Set(results.map(p => p.userId))];
  const usersData = userIds.length > 0
    ? await db.select().from(users)
    : [];
  const userMap = new Map(usersData.map(u => [u.id, { id: u.id, name: u.name, email: u.email }]));

  return c.json({
    data: results.map((p) => {
      const proposalUser = userMap.get(p.userId);
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        useCases: p.useCases ? JSON.parse(p.useCases) : [],
        status: p.status,
        reviewFeedback: p.reviewFeedback,
        reviewedAt: p.reviewedAt?.toISOString(),
        createdAt: p.createdAt?.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
        // Only include user info for admins
        ...(user.isAdmin && {
          userId: p.userId,
          userName: proposalUser?.name,
          userEmail: proposalUser?.email,
        }),
      };
    }),
  });
});

// POST /api/proposals - Create a new skill proposal
proposalsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<SkillProposalCreateRequest>();

  if (!body.title || !body.description) {
    return c.json({ error: { message: 'Title and description are required' } }, 400);
  }

  const id = randomUUID();
  await db.insert(skillProposals).values({
    id,
    userId: user.id,
    title: body.title,
    description: body.description,
    useCases: body.useCases ? JSON.stringify(body.useCases) : null,
    status: 'pending',
  });

  const [created] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  return c.json({
    data: {
      id: created.id,
      title: created.title,
      description: created.description,
      useCases: created.useCases ? JSON.parse(created.useCases) : [],
      status: created.status,
      createdAt: created.createdAt?.toISOString(),
    },
  }, 201);
});

// GET /api/proposals/:id - Get a specific proposal
proposalsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [proposal] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  if (!proposal) {
    return c.json({ error: { message: 'Proposal not found' } }, 404);
  }

  // Non-admin can only view their own
  if (!user.isAdmin && proposal.userId !== user.id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  // Get user info
  const [proposalUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, proposal.userId));

  return c.json({
    data: {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      useCases: proposal.useCases ? JSON.parse(proposal.useCases) : [],
      status: proposal.status,
      reviewFeedback: proposal.reviewFeedback,
      reviewedAt: proposal.reviewedAt?.toISOString(),
      createdAt: proposal.createdAt?.toISOString(),
      updatedAt: proposal.updatedAt?.toISOString(),
      ...(user.isAdmin && {
        userId: proposal.userId,
        userName: proposalUser?.name,
      }),
    },
  });
});

// PUT /api/proposals/:id - Update a proposal (only owner, only if pending)
proposalsRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json<SkillProposalCreateRequest>();

  const [existing] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  if (!existing) {
    return c.json({ error: { message: 'Proposal not found' } }, 404);
  }

  if (existing.userId !== user.id) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  if (existing.status !== 'pending') {
    return c.json({ error: { message: 'Cannot edit a proposal that has been reviewed' } }, 400);
  }

  await db
    .update(skillProposals)
    .set({
      title: body.title || existing.title,
      description: body.description || existing.description,
      useCases: body.useCases ? JSON.stringify(body.useCases) : existing.useCases,
      updatedAt: new Date(),
    })
    .where(eq(skillProposals.id, id));

  const [updated] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  return c.json({
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      useCases: updated.useCases ? JSON.parse(updated.useCases) : [],
      status: updated.status,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    },
  });
});

// DELETE /api/proposals/:id - Delete a proposal (only owner, only if pending)
proposalsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  if (!existing) {
    return c.json({ error: { message: 'Proposal not found' } }, 404);
  }

  if (existing.userId !== user.id && !user.isAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  if (existing.status !== 'pending' && !user.isAdmin) {
    return c.json({ error: { message: 'Cannot delete a proposal that has been reviewed' } }, 400);
  }

  await db.delete(skillProposals).where(eq(skillProposals.id, id));

  return c.json({ data: { success: true } });
});

// POST /api/proposals/:id/review - Admin review (approve/deny)
proposalsRoutes.post('/:id/review', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json<SkillProposalReviewRequest>();

  if (!user.isAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  if (!body.status || !['approved', 'denied'].includes(body.status)) {
    return c.json({ error: { message: 'Status must be "approved" or "denied"' } }, 400);
  }

  const [existing] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  if (!existing) {
    return c.json({ error: { message: 'Proposal not found' } }, 404);
  }

  await db
    .update(skillProposals)
    .set({
      status: body.status,
      reviewFeedback: body.feedback || null,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(skillProposals.id, id));

  const [updated] = await db
    .select()
    .from(skillProposals)
    .where(eq(skillProposals.id, id));

  return c.json({
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      useCases: updated.useCases ? JSON.parse(updated.useCases) : [],
      status: updated.status,
      reviewFeedback: updated.reviewFeedback,
      reviewedAt: updated.reviewedAt?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    },
  });
});
