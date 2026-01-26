/**
 * Skillomatic API client for the MCP server.
 * Handles authentication and API calls using the user's API key.
 */

import { log } from './logger.js';
import type {
  SkillPublic,
  RenderedSkill,
  CapabilityProfile,
  ConfigResponse,
  Candidate,
  ScrapeTask,
  EmailProfile,
  EmailDraft,
  SentEmail,
  EmailSearchResult,
  TabConfig,
  TabsResponse,
  CreateTabRequest,
  UpdateTabSchemaRequest,
  TabRow,
} from './types.js';

// Re-export types for consumers
export type {
  SkillPublic,
  RenderedSkill,
  CapabilityProfile,
  ConfigResponse,
  Candidate,
  ScrapeTask,
  ApiError,
  EmailProfile,
  EmailDraft,
  SentEmail,
  EmailSearchResult,
  TabConfig,
  TabsResponse,
  CreateTabRequest,
  UpdateTabSchemaRequest,
  TabRow,
} from './types.js';

export class SkillomaticClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: { baseUrl: string; apiKey: string }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = options.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    log.debug(`API request: ${options.method || 'GET'} ${path}`);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch (error) {
      // Network-level errors (connection refused, DNS failure, etc.)
      const cause = error instanceof Error ? error.message : String(error);
      if (cause.includes('fetch failed') || cause.includes('ECONNREFUSED')) {
        throw new Error(
          `Cannot connect to Skillomatic API at ${this.baseUrl}. ` +
          `Is the server running? (${cause})`
        );
      }
      if (cause.includes('ENOTFOUND') || cause.includes('getaddrinfo')) {
        throw new Error(
          `Cannot resolve hostname for ${this.baseUrl}. ` +
          `Check SKILLOMATIC_API_URL is correct. (${cause})`
        );
      }
      if (cause.includes('ETIMEDOUT') || cause.includes('timeout')) {
        throw new Error(
          `Connection to ${this.baseUrl} timed out. ` +
          `The server may be overloaded or unreachable. (${cause})`
        );
      }
      throw new Error(`Network error connecting to ${this.baseUrl}: ${cause}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error?.message || parsed.message || errorBody;
      } catch {
        errorMessage = errorBody || `HTTP ${response.status}`;
      }
      log.error(`API error: ${response.status} - ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  }

  /**
   * Get all skills available to the authenticated user.
   */
  async getSkills(): Promise<SkillPublic[]> {
    return this.request<SkillPublic[]>('/skills');
  }

  /**
   * Get a specific skill by slug (metadata only).
   */
  async getSkill(slug: string): Promise<SkillPublic> {
    return this.request<SkillPublic>(`/skills/${slug}`);
  }

  /**
   * Get a skill with rendered instructions (credentials injected).
   */
  async getRenderedSkill(slug: string): Promise<RenderedSkill> {
    return this.request<RenderedSkill>(`/skills/${slug}/rendered`);
  }

  /**
   * Get user's capability profile (which integrations are connected).
   */
  async getCapabilities(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/skills/config');
  }

  /**
   * Verify the API key is valid by fetching user info.
   */
  async verifyAuth(): Promise<{ id: string; email: string; name: string }> {
    return this.request<{ id: string; email: string; name: string }>('/v1/me');
  }

  // ============ ATS Operations ============

  /**
   * Search for candidates in the connected ATS.
   */
  async searchCandidates(params: {
    q?: string;
    tags?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ candidates: Candidate[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.tags) searchParams.set('tags', params.tags);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<{ candidates: Candidate[]; total: number }>(
      `/v1/ats/candidates${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get a specific candidate by ID.
   */
  async getCandidate(id: string): Promise<Candidate> {
    return this.request<Candidate>(`/v1/ats/candidates/${id}`);
  }

  /**
   * Create a new candidate in the ATS.
   */
  async createCandidate(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    headline?: string;
    summary?: string;
    source?: string;
    tags?: string[];
  }): Promise<Candidate> {
    return this.request<Candidate>('/v1/ats/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing candidate.
   */
  async updateCandidate(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    headline?: string;
    summary?: string;
    tags?: string[];
  }>): Promise<Candidate> {
    return this.request<Candidate>(`/v1/ats/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Scrape Operations ============

  /**
   * Create a scrape task for a URL (e.g., LinkedIn profile).
   */
  async createScrapeTask(url: string): Promise<ScrapeTask> {
    return this.request<ScrapeTask>('/v1/scrape/tasks', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  /**
   * Get the status/result of a scrape task.
   */
  async getScrapeTask(id: string): Promise<ScrapeTask> {
    return this.request<ScrapeTask>(`/v1/scrape/tasks/${id}`);
  }

  /**
   * Poll for scrape task completion with timeout.
   */
  async waitForScrapeResult(id: string, options: { timeout?: number; interval?: number } = {}): Promise<ScrapeTask> {
    const timeout = options.timeout || 60000; // 60 seconds default
    const interval = options.interval || 2000; // 2 seconds default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const task = await this.getScrapeTask(id);

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'expired') {
        return task;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Scrape task ${id} timed out after ${timeout}ms`);
  }

  // ============ Email Operations ============

  /**
   * Get the user's email profile.
   */
  async getEmailProfile(): Promise<EmailProfile> {
    return this.request<EmailProfile>('/v1/email/profile');
  }

  /**
   * Create an email draft.
   */
  async createDraft(data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    bodyType?: 'text' | 'html';
  }): Promise<EmailDraft> {
    return this.request<EmailDraft>('/v1/email/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Send an email directly.
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    bodyType?: 'text' | 'html';
  }): Promise<SentEmail> {
    return this.request<SentEmail>('/v1/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Search user's mailbox.
   */
  async searchEmails(query: string, maxResults?: number): Promise<EmailSearchResult> {
    return this.request<EmailSearchResult>('/v1/email/search', {
      method: 'POST',
      body: JSON.stringify({ query, maxResults: maxResults || 10 }),
    });
  }

  /**
   * List email drafts.
   */
  async listDrafts(maxResults?: number): Promise<{ drafts: EmailDraft[] }> {
    const params = maxResults ? `?maxResults=${maxResults}` : '';
    return this.request<{ drafts: EmailDraft[] }>(`/v1/email/drafts${params}`);
  }

  // ============ Database Operations (Super Admin Only) ============

  /**
   * List available database tables.
   */
  async listDatabaseTables(): Promise<{ tables: string[]; redactedColumns: string[] }> {
    return this.request<{ tables: string[]; redactedColumns: string[] }>('/v1/database/tables');
  }

  /**
   * Get schema for a specific table.
   */
  async getTableSchema(table: string): Promise<{ table: string; columns: unknown[] }> {
    return this.request<{ table: string; columns: unknown[] }>(`/v1/database/schema/${table}`);
  }

  /**
   * Execute a read-only SQL query.
   */
  async queryDatabase(query: string, limit?: number): Promise<{
    rows: Record<string, unknown>[];
    rowCount: number;
    durationMs: number;
    query: string;
  }> {
    return this.request<{
      rows: Record<string, unknown>[];
      rowCount: number;
      durationMs: number;
      query: string;
    }>('/v1/database/query', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  /**
   * Get row counts for all tables.
   */
  async getDatabaseStats(): Promise<{ stats: Record<string, number> }> {
    return this.request<{ stats: Record<string, number> }>('/v1/database/stats');
  }

  // ============ ATS Proxy Operations (Dynamic Tools) ============

  /**
   * Proxy a request to the connected ATS provider.
   * Used by dynamically generated tools to make provider-specific API calls.
   */
  async proxyAtsRequest(request: {
    provider: string;
    method: string;
    path: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<unknown> {
    return this.request<unknown>('/v1/ats/proxy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Proxy a request to the connected calendar provider.
   * Used by dynamically generated tools to make provider-specific API calls.
   */
  async proxyCalendarRequest(request: {
    provider: string;
    method: string;
    path: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<unknown> {
    return this.request<unknown>('/v1/calendar/proxy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Proxy a request to the connected data provider (Airtable, etc.).
   * Used by dynamically generated tools to make provider-specific API calls.
   */
  async proxyDataRequest(request: {
    provider: string;
    method: string;
    path: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<unknown> {
    return this.request<unknown>('/v1/data/proxy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ============ Google Sheets Tab Operations ============

  /**
   * List all tabs in the user's Skillomatic spreadsheet.
   * Returns tabs with their purposes, columns, and a version number for tool regeneration.
   */
  async listTabs(): Promise<TabsResponse> {
    return this.request<TabsResponse>('/v1/sheets/tabs');
  }

  /**
   * Create a new tab in the user's spreadsheet.
   */
  async createTab(config: CreateTabRequest): Promise<TabConfig> {
    const response = await this.request<{ tab: TabConfig; version: number }>('/v1/sheets/tabs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return response.tab;
  }

  /**
   * Update a tab's schema (columns and optionally purpose).
   */
  async updateTabSchema(tabName: string, data: UpdateTabSchemaRequest): Promise<TabConfig> {
    const response = await this.request<{ tab: TabConfig; version: number }>(`/v1/sheets/tabs/${encodeURIComponent(tabName)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.tab;
  }

  /**
   * Delete a tab from the user's spreadsheet.
   */
  async deleteTab(tabName: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/v1/sheets/tabs/${encodeURIComponent(tabName)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Read rows from a tab.
   */
  async readTabRows(tabName: string, options: { limit?: number; offset?: number } = {}): Promise<{ rows: TabRow[]; total: number }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    const query = params.toString();
    return this.request<{ rows: TabRow[]; total: number }>(
      `/v1/sheets/tabs/${encodeURIComponent(tabName)}/rows${query ? `?${query}` : ''}`
    );
  }

  /**
   * Append a row to a tab.
   * Returns the updated range string (e.g., "Contacts!A2:F2").
   */
  async appendTabRow(tabName: string, data: Record<string, string>): Promise<{ success: boolean; updatedRange: string }> {
    return this.request<{ success: boolean; updatedRange: string }>(`/v1/sheets/tabs/${encodeURIComponent(tabName)}/rows`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  /**
   * Update a row in a tab.
   */
  async updateTabRow(tabName: string, rowNumber: number, data: Record<string, string>): Promise<{ success: boolean; rowNumber: number }> {
    return this.request<{ success: boolean; rowNumber: number }>(`/v1/sheets/tabs/${encodeURIComponent(tabName)}/rows/${rowNumber}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  /**
   * Delete a row from a tab.
   */
  async deleteTabRow(tabName: string, rowNumber: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/v1/sheets/tabs/${encodeURIComponent(tabName)}/rows/${rowNumber}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search rows in a tab.
   */
  async searchTab(tabName: string, query: string, limit?: number): Promise<{ rows: TabRow[]; total: number }> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', String(limit));
    return this.request<{ rows: TabRow[]; total: number }>(
      `/v1/sheets/tabs/${encodeURIComponent(tabName)}/search?${params.toString()}`
    );
  }
}
