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

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

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
    return this.request<SkillPublic[]>('/api/skills');
  }

  /**
   * Get a specific skill by slug (metadata only).
   */
  async getSkill(slug: string): Promise<SkillPublic> {
    return this.request<SkillPublic>(`/api/skills/${slug}`);
  }

  /**
   * Get a skill with rendered instructions (credentials injected).
   */
  async getRenderedSkill(slug: string): Promise<RenderedSkill> {
    return this.request<RenderedSkill>(`/api/skills/${slug}/rendered`);
  }

  /**
   * Get user's capability profile (which integrations are connected).
   */
  async getCapabilities(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/api/skills/config');
  }

  /**
   * Verify the API key is valid by fetching user info.
   */
  async verifyAuth(): Promise<{ id: string; email: string; name: string }> {
    return this.request<{ id: string; email: string; name: string }>('/api/v1/me');
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
      `/api/v1/ats/candidates${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get a specific candidate by ID.
   */
  async getCandidate(id: string): Promise<Candidate> {
    return this.request<Candidate>(`/api/v1/ats/candidates/${id}`);
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
    return this.request<Candidate>('/api/v1/ats/candidates', {
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
    return this.request<Candidate>(`/api/v1/ats/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Scrape Operations ============

  /**
   * Create a scrape task for a URL (e.g., LinkedIn profile).
   */
  async createScrapeTask(url: string): Promise<ScrapeTask> {
    return this.request<ScrapeTask>('/api/v1/scrape/tasks', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  /**
   * Get the status/result of a scrape task.
   */
  async getScrapeTask(id: string): Promise<ScrapeTask> {
    return this.request<ScrapeTask>(`/api/v1/scrape/tasks/${id}`);
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
}
