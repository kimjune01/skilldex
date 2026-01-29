/**
 * Email Service
 *
 * Shared email operations for use by routes and MCP server.
 * Handles Gmail client initialization with token refresh.
 */

import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { GmailClient } from '../lib/gmail.js';
import { createLogger } from '../lib/logger.js';

const log = createLogger('EmailService');

/**
 * Get a Gmail client for the user.
 * Returns null if no Gmail integration is connected.
 *
 * Supports both:
 * - Direct Google OAuth (provider: 'email', tokens in metadata)
 * - Nango OAuth (provider: 'gmail', tokens via Nango) - legacy/future
 */
export async function getGmailClient(userId: string): Promise<GmailClient | null> {
  // Find the user's email integration (Google OAuth stores as 'email' with subProvider: 'gmail')
  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'email')))
    .limit(1);

  if (integration.length === 0 || integration[0].status !== 'connected') {
    return null;
  }

  const int = integration[0];

  // Parse metadata to get tokens
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(int.metadata || '{}');
  } catch {
    log.error('metadata_parse_failed', { userId });
    return null;
  }

  // Check if this is a Gmail integration (subProvider check)
  if (metadata.subProvider !== 'gmail') {
    // Not Gmail (could be Outlook), skip
    return null;
  }

  let accessToken = metadata.accessToken as string | undefined;
  const refreshToken = metadata.refreshToken as string | undefined;
  const expiresAt = metadata.expiresAt as string | undefined;
  const userEmail = metadata.gmailEmail as string | undefined;

  // Check if token is expired and needs refresh
  if (expiresAt && new Date(expiresAt) < new Date() && refreshToken) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      log.error('oauth_not_configured', { userId });
      return null;
    }

    try {
      const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json() as {
          access_token: string;
          expires_in?: number;
        };
        accessToken = newTokens.access_token;

        // Update stored token in DB
        metadata.accessToken = accessToken;
        metadata.expiresAt = newTokens.expires_in
          ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          : undefined;

        await db
          .update(integrations)
          .set({
            metadata: JSON.stringify(metadata),
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, int.id));

        log.info('token_refreshed', { userId });
      } else {
        // Refresh failed - mark integration as error
        await db
          .update(integrations)
          .set({ status: 'error', updatedAt: new Date() })
          .where(eq(integrations.id, int.id));

        log.error('token_refresh_failed', { userId });
        return null;
      }
    } catch (error) {
      log.error('token_refresh_error', { userId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  if (!accessToken) {
    log.error('no_access_token', { userId });
    return null;
  }

  // If we don't have user email cached, fetch it
  if (!userEmail) {
    try {
      const tempClient = new GmailClient(accessToken, '');
      const profile = await tempClient.getProfile();
      return new GmailClient(accessToken, profile.emailAddress);
    } catch (error) {
      log.error('profile_fetch_failed', { userId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  return new GmailClient(accessToken, userEmail);
}

/**
 * Email profile for MCP tools
 */
export interface EmailProfile {
  email: string;
  messagesTotal?: number;
  threadsTotal?: number;
}

/**
 * Email search result for MCP tools
 */
export interface EmailSearchResult {
  emails: Array<{
    id: string;
    threadId?: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet?: string;
    body?: string;
  }>;
  total: number;
}

/**
 * Email draft result
 */
export interface EmailDraft {
  draftId: string;
  messageId?: string;
  to?: string;
  subject?: string;
  body?: string;
}

/**
 * Sent email result
 */
export interface SentEmail {
  messageId: string;
  threadId?: string;
}

/**
 * Extract header value from Gmail message
 */
function getHeader(message: { payload?: { headers: Array<{ name: string; value: string }> } }, name: string): string {
  if (!message.payload?.headers) return '';
  const header = message.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

/**
 * Decode base64url encoded body
 */
function decodeBody(body?: { data?: string }): string {
  if (!body?.data) return '';
  return Buffer.from(body.data, 'base64url').toString('utf-8');
}

/**
 * Get email profile for a user
 */
export async function getEmailProfile(userId: string): Promise<EmailProfile> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.');
  }

  const profile = await gmail.getProfile();
  return {
    email: profile.emailAddress,
    messagesTotal: profile.messagesTotal,
    threadsTotal: profile.threadsTotal,
  };
}

/**
 * Search emails for a user
 */
export async function searchEmails(userId: string, query: string, maxResults: number = 10): Promise<EmailSearchResult> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.');
  }

  const result = await gmail.searchMessages(query, maxResults);
  return {
    emails: result.messages.map((m) => {
      // Extract body from message payload
      let body = '';
      if (m.payload?.body?.data) {
        body = decodeBody(m.payload.body);
      } else if (m.payload?.parts) {
        const textPart = m.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart) {
          body = decodeBody(textPart.body);
        }
      }

      return {
        id: m.id,
        threadId: m.threadId,
        subject: getHeader(m, 'Subject'),
        from: getHeader(m, 'From'),
        to: getHeader(m, 'To'),
        date: getHeader(m, 'Date'),
        snippet: m.snippet,
        body: body || undefined,
      };
    }),
    total: result.messages.length,
  };
}

/**
 * List email drafts for a user
 */
export async function listDrafts(userId: string, maxResults: number = 10): Promise<{ drafts: EmailDraft[] }> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.');
  }

  const drafts = await gmail.listDrafts(maxResults);
  return {
    drafts: drafts.map((d) => ({
      draftId: d.id,
      messageId: d.message?.id,
    })),
  };
}

/**
 * Create an email draft
 */
export async function createDraft(
  userId: string,
  data: { to: string; subject: string; body: string; cc?: string; bcc?: string }
): Promise<EmailDraft> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.');
  }

  const result = await gmail.createDraft({
    to: [{ email: data.to }],
    cc: data.cc ? [{ email: data.cc }] : undefined,
    bcc: data.bcc ? [{ email: data.bcc }] : undefined,
    subject: data.subject,
    body: data.body,
  });

  return {
    draftId: result.id,
    messageId: result.message?.id,
    to: data.to,
    subject: data.subject,
    body: data.body,
  };
}

/**
 * Send an email
 */
export async function sendEmail(
  userId: string,
  data: { to: string; subject: string; body: string; cc?: string; bcc?: string }
): Promise<SentEmail> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail integration not connected. Please connect Gmail in the Skillomatic dashboard.');
  }

  const result = await gmail.sendEmail({
    to: [{ email: data.to }],
    cc: data.cc ? [{ email: data.cc }] : undefined,
    bcc: data.bcc ? [{ email: data.bcc }] : undefined,
    subject: data.subject,
    body: data.body,
  });

  return {
    messageId: result.id,
    threadId: result.threadId,
  };
}
