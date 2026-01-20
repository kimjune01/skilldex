import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skilldex/db';
import { scrapeTasks } from '@skilldex/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type {
  ScrapeTaskPublic,
  CreateScrapeTaskRequest,
  CreateScrapeTaskResponse,
  UpdateScrapeTaskRequest,
} from '@skilldex/shared';

export const v1ScrapeRoutes = new Hono();

// All routes require API key auth
v1ScrapeRoutes.use('*', apiKeyAuth);

// Constants
const TASK_TTL_MS = 60 * 60 * 1000; // 1 hour
const STALL_THRESHOLD_MS = 30 * 1000; // 30 seconds - suggest extension install
const PROCESSING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes - mark as expired

// Helper to format task for API response
function formatTask(task: typeof scrapeTasks.$inferSelect): ScrapeTaskPublic {
  const now = Date.now();
  const createdAtMs = task.createdAt.getTime();
  const waitTime = now - createdAtMs;

  let suggestion: string | undefined;

  // Add suggestions based on task state
  if (task.status === 'pending' && waitTime > STALL_THRESHOLD_MS) {
    suggestion =
      'No Skilldex Scraper extension detected. Install it and ensure it\'s configured with your API key.';
  } else if (task.status === 'failed' && !task.errorMessage) {
    suggestion = 'Task failed unexpectedly. Check extension status in browser toolbar.';
  } else if (task.status === 'processing' && task.claimedAt) {
    const processingTime = now - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      suggestion = 'Extension may have disconnected during scrape. Please check your browser and try again.';
    }
  }

  return {
    id: task.id,
    url: task.url,
    status: task.status as ScrapeTaskPublic['status'],
    result: task.result || undefined,
    errorMessage: task.errorMessage || undefined,
    suggestion,
    createdAt: task.createdAt.toISOString(),
    claimedAt: task.claimedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  };
}

// POST /api/v1/scrape/tasks - Create scrape task, return pointer (task ID)
v1ScrapeRoutes.post('/tasks', async (c) => {
  const user = c.get('apiKeyUser');
  const body = await c.req.json<CreateScrapeTaskRequest>();

  if (!body.url) {
    return c.json({ error: { message: 'URL is required' } }, 400);
  }

  // Validate URL format
  try {
    new URL(body.url);
  } catch {
    return c.json({ error: { message: 'Invalid URL format' } }, 400);
  }

  const now = new Date();
  const taskId = randomUUID();

  const [task] = await db
    .insert(scrapeTasks)
    .values({
      id: taskId,
      userId: user.id,
      apiKeyId: user.apiKeyId,
      url: body.url,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + TASK_TTL_MS),
    })
    .returning();

  const response: CreateScrapeTaskResponse = {
    id: task.id,
    url: task.url,
    status: 'pending',
    createdAt: task.createdAt.toISOString(),
  };

  return c.json(response, 201);
});

// GET /api/v1/scrape/tasks - List tasks or claim pending task (for extension)
v1ScrapeRoutes.get('/tasks', async (c) => {
  const user = c.get('apiKeyUser');
  const status = c.req.query('status');
  const claim = c.req.query('claim') === 'true';

  const now = new Date();

  // If status=pending and claim=true, atomically claim one task for processing
  if (status === 'pending' && claim) {
    // Find oldest pending task that hasn't expired
    const [pendingTask] = await db
      .select()
      .from(scrapeTasks)
      .where(
        and(
          eq(scrapeTasks.userId, user.id),
          eq(scrapeTasks.status, 'pending'),
          gt(scrapeTasks.expiresAt, now)
        )
      )
      .orderBy(scrapeTasks.createdAt)
      .limit(1);

    if (!pendingTask) {
      return c.json({ task: null });
    }

    // Atomically mark as processing
    const [claimed] = await db
      .update(scrapeTasks)
      .set({
        status: 'processing',
        claimedAt: now,
      })
      .where(
        and(
          eq(scrapeTasks.id, pendingTask.id),
          eq(scrapeTasks.status, 'pending') // Ensure still pending (atomic)
        )
      )
      .returning();

    if (!claimed) {
      // Another worker claimed it, return null
      return c.json({ task: null });
    }

    return c.json({ task: formatTask(claimed) });
  }

  // Otherwise, list user's tasks
  const tasks = await db
    .select()
    .from(scrapeTasks)
    .where(eq(scrapeTasks.userId, user.id))
    .orderBy(scrapeTasks.createdAt)
    .limit(50);

  // Filter by status if provided
  const filtered = status
    ? tasks.filter((t) => t.status === status)
    : tasks;

  return c.json({
    tasks: filtered.map(formatTask),
    total: filtered.length,
  });
});

// GET /api/v1/scrape/tasks/:id - Get single task by ID (pointer lookup)
v1ScrapeRoutes.get('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');

  const [task] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    )
    .limit(1);

  if (!task) {
    return c.json({ error: { message: 'Task not found' } }, 404);
  }

  // Check if task should be marked expired
  const now = new Date();
  if (task.status === 'pending' && now > task.expiresAt) {
    // Mark as expired
    const [expired] = await db
      .update(scrapeTasks)
      .set({ status: 'expired' })
      .where(eq(scrapeTasks.id, taskId))
      .returning();

    const formatted = formatTask(expired);
    formatted.suggestion =
      'Task expired. The Skilldex Scraper extension may not be installed or running.';
    return c.json(formatted);
  }

  // Check if processing task timed out
  if (task.status === 'processing' && task.claimedAt) {
    const processingTime = now.getTime() - task.claimedAt.getTime();
    if (processingTime > PROCESSING_TIMEOUT_MS) {
      // Mark as failed due to timeout
      const [failed] = await db
        .update(scrapeTasks)
        .set({
          status: 'failed',
          errorMessage: 'Processing timeout - extension may have disconnected',
        })
        .where(eq(scrapeTasks.id, taskId))
        .returning();

      return c.json(formatTask(failed));
    }
  }

  return c.json(formatTask(task));
});

// PUT /api/v1/scrape/tasks/:id - Update task (extension reports result)
v1ScrapeRoutes.put('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');
  const body = await c.req.json<UpdateScrapeTaskRequest>();

  // Validate status
  if (!['completed', 'failed'].includes(body.status)) {
    return c.json({ error: { message: 'Status must be "completed" or "failed"' } }, 400);
  }

  // Find the task
  const [task] = await db
    .select()
    .from(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    )
    .limit(1);

  if (!task) {
    return c.json({ error: { message: 'Task not found' } }, 404);
  }

  // Only allow updating tasks that are pending or processing
  if (!['pending', 'processing'].includes(task.status)) {
    return c.json(
      { error: { message: `Cannot update task with status "${task.status}"` } },
      400
    );
  }

  // Update the task
  const now = new Date();
  const [updated] = await db
    .update(scrapeTasks)
    .set({
      status: body.status,
      result: body.result,
      errorMessage: body.errorMessage,
      completedAt: now,
    })
    .where(eq(scrapeTasks.id, taskId))
    .returning();

  return c.json(formatTask(updated));
});

// DELETE /api/v1/scrape/tasks/:id - Cancel/delete a task
v1ScrapeRoutes.delete('/tasks/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const taskId = c.req.param('id');

  await db
    .delete(scrapeTasks)
    .where(
      and(
        eq(scrapeTasks.id, taskId),
        eq(scrapeTasks.userId, user.id)
      )
    );

  return c.json({ deleted: true });
});
