/**
 * Email API Routes (v1)
 *
 * API key authenticated routes for email operations.
 * Called by Claude Code skills to send/draft emails via user's Gmail.
 *
 * @see lib/gmail.ts for Gmail client implementation
 */
import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { skillUsageLogs, skills, integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { ErrorCode } from '@skillomatic/shared';
import { GmailClient, GmailError, type EmailMessage, type EmailAddress } from '../../lib/gmail.js';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from '../../lib/nango.js';

export const v1EmailRoutes = new Hono();

// All routes require API key auth
v1EmailRoutes.use('*', apiKeyAuth);

/**
 * Get a Gmail client for the user.
 * Returns null if no Gmail integration is connected.
 */
async function getGmailClient(userId: string): Promise<GmailClient | null> {
  // Find the user's Gmail integration
  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'gmail')))
    .limit(1);

  if (integration.length === 0 || integration[0].status !== 'connected') {
    return null;
  }

  const int = integration[0];
  if (!int.nangoConnectionId) {
    return null;
  }

  try {
    const nango = getNangoClient();
    const providerConfigKey = PROVIDER_CONFIG_KEYS['gmail'];
    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);

    // Get user email from Nango token metadata or Gmail profile
    // For now, we'll get it from the Gmail API
    const tempClient = new GmailClient(token.access_token, '');
    const profile = await tempClient.getProfile();

    return new GmailClient(token.access_token, profile.emailAddress);
  } catch (error) {
    console.error('Failed to get Gmail token:', error);
    return null;
  }
}

/**
 * Classify a raw error into a standardized email error code.
 */
function classifyEmailError(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (error instanceof GmailError) {
    if (error.statusCode === 401 || lowerMessage.includes('unauthorized')) {
      return 'INTEGRATION_TOKEN_EXPIRED';
    }
    if (error.statusCode === 403 || lowerMessage.includes('forbidden')) {
      return 'INTEGRATION_OAUTH_FAILED';
    }
    if (error.statusCode === 429 || lowerMessage.includes('rate limit')) {
      return 'LLM_RATE_LIMITED'; // Using LLM rate limit as generic rate limit
    }
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

// Helper to log skill usage
async function logUsage(
  userId: string,
  apiKeyId: string,
  skillSlug: string,
  status: 'success' | 'error' | 'partial',
  durationMs?: number,
  errorCode?: ErrorCode
) {
  try {
    const skill = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);
    if (skill.length > 0) {
      await db.insert(skillUsageLogs).values({
        id: randomUUID(),
        skillId: skill[0].id,
        userId,
        apiKeyId,
        status,
        durationMs,
        errorMessage: errorCode,
      });
    }
  } catch (err) {
    console.error('Failed to log usage:', err);
  }
}

/**
 * Parse recipient input - supports string or array of EmailAddress
 */
function parseRecipients(input: unknown): EmailAddress[] {
  if (!input) return [];

  if (typeof input === 'string') {
    // Simple email string
    return [{ email: input }];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') {
        return { email: item };
      }
      return item as EmailAddress;
    });
  }

  return [];
}

// GET /api/v1/email/profile - Get user's email profile
v1EmailRoutes.get('/profile', async (c) => {
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    const profile = await gmail.getProfile();
    logUsage(user.id, user.apiKeyId, 'email-draft', 'success', Date.now() - startTime);
    return c.json({ data: profile });
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, classifyEmailError(error));
    return c.json({ error: { message: 'Failed to get Gmail profile' } }, 502);
  }
});

// GET /api/v1/email/labels - List Gmail labels
v1EmailRoutes.get('/labels', async (c) => {
  const user = c.get('apiKeyUser');

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    const labels = await gmail.listLabels();
    return c.json({ data: { labels } });
  } catch (error) {
    return c.json({ error: { message: 'Failed to list Gmail labels' } }, 502);
  }
});

// POST /api/v1/email/search - Search emails
v1EmailRoutes.post('/search', async (c) => {
  const user = c.get('apiKeyUser');
  const body = await c.req.json<{ query: string; maxResults?: number }>();

  if (!body.query) {
    return c.json({ error: { message: 'Query is required' } }, 400);
  }

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    const result = await gmail.searchMessages(body.query, body.maxResults || 10);
    return c.json({ data: result });
  } catch (error) {
    return c.json({ error: { message: 'Failed to search emails' } }, 502);
  }
});

// POST /api/v1/email/send - Send an email
v1EmailRoutes.post('/send', async (c) => {
  const user = c.get('apiKeyUser');
  const startTime = Date.now();
  const body = await c.req.json<{
    to: unknown;
    cc?: unknown;
    bcc?: unknown;
    subject: string;
    body: string;
    bodyType?: 'text' | 'html';
    replyTo?: string;
    threadId?: string;
  }>();

  // Validate required fields
  if (!body.to) {
    return c.json({ error: { message: 'Recipient (to) is required' } }, 400);
  }
  if (!body.subject) {
    return c.json({ error: { message: 'Subject is required' } }, 400);
  }
  if (!body.body) {
    return c.json({ error: { message: 'Body is required' } }, 400);
  }

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, 'INTEGRATION_NOT_CONNECTED');
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  const message: EmailMessage = {
    to: parseRecipients(body.to),
    cc: parseRecipients(body.cc),
    bcc: parseRecipients(body.bcc),
    subject: body.subject,
    body: body.body,
    bodyType: body.bodyType || 'text',
    replyTo: body.replyTo,
    threadId: body.threadId,
  };

  try {
    const result = await gmail.sendEmail(message);
    logUsage(user.id, user.apiKeyId, 'email-draft', 'success', Date.now() - startTime);
    return c.json({
      data: {
        success: true,
        messageId: result.id,
        threadId: result.threadId,
      },
    });
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, classifyEmailError(error));
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return c.json({ error: { message } }, 502);
  }
});

// POST /api/v1/email/draft - Create a draft
v1EmailRoutes.post('/draft', async (c) => {
  const user = c.get('apiKeyUser');
  const startTime = Date.now();
  const body = await c.req.json<{
    to: unknown;
    cc?: unknown;
    bcc?: unknown;
    subject: string;
    body: string;
    bodyType?: 'text' | 'html';
    replyTo?: string;
    threadId?: string;
  }>();

  // Validate required fields
  if (!body.to) {
    return c.json({ error: { message: 'Recipient (to) is required' } }, 400);
  }
  if (!body.subject) {
    return c.json({ error: { message: 'Subject is required' } }, 400);
  }
  if (!body.body) {
    return c.json({ error: { message: 'Body is required' } }, 400);
  }

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, 'INTEGRATION_NOT_CONNECTED');
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  const message: EmailMessage = {
    to: parseRecipients(body.to),
    cc: parseRecipients(body.cc),
    bcc: parseRecipients(body.bcc),
    subject: body.subject,
    body: body.body,
    bodyType: body.bodyType || 'text',
    replyTo: body.replyTo,
    threadId: body.threadId,
  };

  try {
    const result = await gmail.createDraft(message);
    logUsage(user.id, user.apiKeyId, 'email-draft', 'success', Date.now() - startTime);
    return c.json({
      data: {
        success: true,
        draftId: result.id,
        messageId: result.message.id,
        threadId: result.message.threadId,
      },
    });
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, classifyEmailError(error));
    const message = error instanceof Error ? error.message : 'Failed to create draft';
    return c.json({ error: { message } }, 502);
  }
});

// GET /api/v1/email/drafts - List drafts
v1EmailRoutes.get('/drafts', async (c) => {
  const user = c.get('apiKeyUser');
  const maxResults = parseInt(c.req.query('maxResults') || '10');

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    const drafts = await gmail.listDrafts(maxResults);
    return c.json({ data: { drafts } });
  } catch (error) {
    return c.json({ error: { message: 'Failed to list drafts' } }, 502);
  }
});

// POST /api/v1/email/drafts/:id/send - Send a draft
v1EmailRoutes.post('/drafts/:id/send', async (c) => {
  const user = c.get('apiKeyUser');
  const draftId = c.req.param('id');
  const startTime = Date.now();

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, 'INTEGRATION_NOT_CONNECTED');
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    const result = await gmail.sendDraft(draftId);
    logUsage(user.id, user.apiKeyId, 'email-draft', 'success', Date.now() - startTime);
    return c.json({
      data: {
        success: true,
        messageId: result.id,
        threadId: result.threadId,
      },
    });
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'email-draft', 'error', Date.now() - startTime, classifyEmailError(error));
    const message = error instanceof Error ? error.message : 'Failed to send draft';
    return c.json({ error: { message } }, 502);
  }
});

// DELETE /api/v1/email/drafts/:id - Delete a draft
v1EmailRoutes.delete('/drafts/:id', async (c) => {
  const user = c.get('apiKeyUser');
  const draftId = c.req.param('id');

  const gmail = await getGmailClient(user.id);
  if (!gmail) {
    return c.json(
      {
        error: {
          message: 'Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.',
          code: 'GMAIL_NOT_CONNECTED',
        },
      },
      400
    );
  }

  try {
    await gmail.deleteDraft(draftId);
    return c.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete draft';
    return c.json({ error: { message } }, 502);
  }
});
