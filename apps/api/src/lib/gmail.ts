/**
 * Gmail API Client Library
 *
 * Provides Gmail API v1 operations for sending emails and creating drafts.
 * Used by v1/email routes to enable email functionality via skills.
 *
 * @see https://developers.google.com/gmail/api/reference/rest
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * Email address with optional display name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email message structure for sending/drafting
 */
export interface EmailMessage {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyType?: 'text' | 'html';
  replyTo?: string; // Message ID to reply to
  threadId?: string; // Thread ID to add to existing thread
}

/**
 * Gmail message metadata
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload?: {
    mimeType: string;
    headers: Array<{ name: string; value: string }>;
    body?: { size: number; data?: string };
    parts?: Array<{
      mimeType: string;
      body: { size: number; data?: string };
    }>;
  };
}

/**
 * Gmail draft metadata
 */
export interface GmailDraft {
  id: string;
  message: GmailMessage;
}

/**
 * Gmail label
 */
export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
}

/**
 * Gmail API error
 */
export class GmailError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GmailError';
  }
}

/**
 * Format email address for RFC 2822
 */
function formatEmailAddress(addr: EmailAddress): string {
  if (addr.name) {
    // Escape quotes in name
    const escapedName = addr.name.replace(/"/g, '\\"');
    return `"${escapedName}" <${addr.email}>`;
  }
  return addr.email;
}

/**
 * Format email addresses list for header
 */
function formatEmailAddresses(addrs: EmailAddress[]): string {
  return addrs.map(formatEmailAddress).join(', ');
}

/**
 * Create raw email message (RFC 2822 format, base64url encoded)
 */
function createRawMessage(msg: EmailMessage, fromEmail: string): string {
  const lines: string[] = [];

  // Headers
  lines.push(`From: ${fromEmail}`);
  lines.push(`To: ${formatEmailAddresses(msg.to)}`);

  if (msg.cc && msg.cc.length > 0) {
    lines.push(`Cc: ${formatEmailAddresses(msg.cc)}`);
  }

  if (msg.bcc && msg.bcc.length > 0) {
    lines.push(`Bcc: ${formatEmailAddresses(msg.bcc)}`);
  }

  lines.push(`Subject: ${msg.subject}`);

  if (msg.replyTo) {
    lines.push(`In-Reply-To: ${msg.replyTo}`);
    lines.push(`References: ${msg.replyTo}`);
  }

  // Content type
  const contentType = msg.bodyType === 'html' ? 'text/html' : 'text/plain';
  lines.push(`Content-Type: ${contentType}; charset=utf-8`);
  lines.push('MIME-Version: 1.0');

  // Empty line separates headers from body
  lines.push('');
  lines.push(msg.body);

  const rawMessage = lines.join('\r\n');

  // Base64url encode
  return Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Gmail API client
 */
export class GmailClient {
  private accessToken: string;
  private userEmail: string;

  constructor(accessToken: string, userEmail: string) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
  }

  /**
   * Make authenticated request to Gmail API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${GMAIL_API_BASE}/users/me${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GmailError(
        error.error?.message || `Gmail API error: ${response.status}`,
        response.status,
        error.error?.code
      );
    }

    return response.json();
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile(): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number }> {
    return this.request('GET', '/profile');
  }

  /**
   * List Gmail labels
   */
  async listLabels(): Promise<GmailLabel[]> {
    const response = await this.request<{ labels: GmailLabel[] }>('GET', '/labels');
    return response.labels || [];
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, maxResults = 10): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(maxResults),
    });

    const response = await this.request<{
      messages?: Array<{ id: string; threadId: string }>;
      nextPageToken?: string;
    }>('GET', `/messages?${params}`);

    if (!response.messages || response.messages.length === 0) {
      return { messages: [] };
    }

    // Fetch full message details for each result
    const messages = await Promise.all(
      response.messages.slice(0, maxResults).map((m) => this.getMessage(m.id))
    );

    return { messages, nextPageToken: response.nextPageToken };
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    return this.request('GET', `/messages/${messageId}`);
  }

  /**
   * Send an email
   */
  async sendEmail(message: EmailMessage): Promise<GmailMessage> {
    const raw = createRawMessage(message, this.userEmail);

    const body: Record<string, unknown> = { raw };
    if (message.threadId) {
      body.threadId = message.threadId;
    }

    return this.request('POST', '/messages/send', body);
  }

  /**
   * Create a draft
   */
  async createDraft(message: EmailMessage): Promise<GmailDraft> {
    const raw = createRawMessage(message, this.userEmail);

    const body: Record<string, unknown> = {
      message: { raw },
    };
    if (message.threadId) {
      body.message = { raw, threadId: message.threadId };
    }

    return this.request('POST', '/drafts', body);
  }

  /**
   * List drafts
   */
  async listDrafts(maxResults = 10): Promise<GmailDraft[]> {
    const params = new URLSearchParams({
      maxResults: String(maxResults),
    });

    const response = await this.request<{
      drafts?: Array<{ id: string; message: { id: string; threadId: string } }>;
    }>('GET', `/drafts?${params}`);

    if (!response.drafts || response.drafts.length === 0) {
      return [];
    }

    // Fetch full draft details
    const drafts = await Promise.all(
      response.drafts.slice(0, maxResults).map((d) => this.getDraft(d.id))
    );

    return drafts;
  }

  /**
   * Get a draft by ID
   */
  async getDraft(draftId: string): Promise<GmailDraft> {
    return this.request('GET', `/drafts/${draftId}`);
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    await this.request('DELETE', `/drafts/${draftId}`);
  }

  /**
   * Send a draft
   */
  async sendDraft(draftId: string): Promise<GmailMessage> {
    return this.request('POST', '/drafts/send', { id: draftId });
  }
}
