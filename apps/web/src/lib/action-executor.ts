/**
 * Action Executor for Ephemeral Architecture
 *
 * Executes actions from LLM responses on the client side.
 * Routes actions to appropriate handlers based on type.
 *
 * Actions are parsed from ```action blocks in LLM responses:
 * ```action
 * {"action": "load_skill", "slug": "linkedin-lookup"}
 * ```
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { loadRenderedSkill, clearMetadataCache } from './skills-client';

// Action types - local actions handled by frontend
export type LocalActionType =
  | 'load_skill'
  | 'create_skill'
  | 'search_candidates'
  | 'get_candidate'
  | 'create_candidate'
  | 'update_candidate'
  | 'delete_candidate'
  | 'list_jobs'
  | 'get_job'
  | 'scrape_url'
  | 'update_application_stage'
  | 'list_applications';

// All action types including server-side ones
export type ActionType = LocalActionType | string;

// Action result
export interface ActionResult {
  success: boolean;
  action: ActionType;
  data?: unknown;
  error?: string;
}

// Context passed to action handlers (contains rendered credentials)
export interface ActionContext {
  atsToken?: string;
  atsBaseUrl?: string;
  atsProvider?: string;
  skillomaticApiKey?: string;
  skillomaticApiUrl?: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Make authenticated API request to our server
 */
async function serverRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Execute load_skill action
 */
async function executeLoadSkill(params: { slug: string }): Promise<ActionResult> {
  try {
    const skill = await loadRenderedSkill(params.slug);
    return {
      success: true,
      action: 'load_skill',
      data: {
        slug: skill.slug,
        name: skill.name,
        instructions: skill.instructions,
      },
    };
  } catch (error) {
    return {
      success: false,
      action: 'load_skill',
      error: error instanceof Error ? error.message : 'Failed to load skill',
    };
  }
}

/**
 * Execute create_skill action
 * Creates or updates a skill via the API
 */
async function executeCreateSkill(
  params: { content: string; force?: boolean }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<{
      slug: string;
      name: string;
      description: string;
    }>('/skills', {
      method: 'POST',
      body: JSON.stringify({
        content: params.content,
        force: params.force ?? false,
      }),
    });

    // Clear metadata cache so skills list refreshes immediately
    clearMetadataCache();

    return {
      success: true,
      action: 'create_skill',
      data: {
        slug: result.slug,
        name: result.name,
        message: `Skill "${result.name}" created successfully. View at /skills/${result.slug}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      action: 'create_skill',
      error: error instanceof Error ? error.message : 'Failed to create skill',
    };
  }
}

/**
 * Execute ATS search_candidates action
 * Routes through server proxy for CORS
 */
async function executeSearchCandidates(
  params: { query: string; limit?: number },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    // Use server proxy for ATS calls (CORS limitation)
    const result = await serverRequest<{ candidates: unknown[] }>(
      `/v1/ats/candidates?query=${encodeURIComponent(params.query)}&limit=${params.limit || 20}`
    );
    return {
      success: true,
      action: 'search_candidates',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'search_candidates',
      error: error instanceof Error ? error.message : 'Failed to search candidates',
    };
  }
}

/**
 * Execute ATS get_candidate action
 */
async function executeGetCandidate(
  params: { id: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>(`/v1/ats/candidates/${params.id}`);
    return {
      success: true,
      action: 'get_candidate',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'get_candidate',
      error: error instanceof Error ? error.message : 'Failed to get candidate',
    };
  }
}

/**
 * Execute ATS create_candidate action
 */
async function executeCreateCandidate(
  params: { firstName: string; lastName: string; email?: string; phone?: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>('/v1/ats/candidates', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return {
      success: true,
      action: 'create_candidate',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'create_candidate',
      error: error instanceof Error ? error.message : 'Failed to create candidate',
    };
  }
}

/**
 * Execute ATS update_candidate action
 */
async function executeUpdateCandidate(
  params: { id: string } & Record<string, unknown>,
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const { id, ...updates } = params;
    const result = await serverRequest<unknown>(`/v1/ats/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return {
      success: true,
      action: 'update_candidate',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'update_candidate',
      error: error instanceof Error ? error.message : 'Failed to update candidate',
    };
  }
}

/**
 * Execute ATS delete_candidate action
 */
async function executeDeleteCandidate(
  params: { id: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>(`/v1/ats/candidates/${params.id}`, {
      method: 'DELETE',
    });
    return {
      success: true,
      action: 'delete_candidate',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'delete_candidate',
      error: error instanceof Error ? error.message : 'Failed to delete candidate',
    };
  }
}

/**
 * Execute list_jobs action
 */
async function executeListJobs(
  params: { status?: string; limit?: number },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const result = await serverRequest<{ jobs: unknown[] }>(
      `/v1/ats/jobs?${queryParams.toString()}`
    );
    return {
      success: true,
      action: 'list_jobs',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'list_jobs',
      error: error instanceof Error ? error.message : 'Failed to list jobs',
    };
  }
}

/**
 * Execute get_job action
 */
async function executeGetJob(
  params: { id: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>(`/v1/ats/jobs/${params.id}`);
    return {
      success: true,
      action: 'get_job',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'get_job',
      error: error instanceof Error ? error.message : 'Failed to get job',
    };
  }
}

/**
 * Execute scrape_url action
 * Creates scrape task and polls for result
 */
async function executeScrapeUrl(
  params: { url: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    // Create scrape task (uses JWT auth route, not API key route)
    const task = await serverRequest<{
      id: string;
      status: string;
      result?: string;
      cached?: boolean;
    }>('/scrape/tasks', {
      method: 'POST',
      body: JSON.stringify({ url: params.url }),
    });

    // If we got a cached result, return it immediately
    if (task.status === 'completed' && task.result) {
      return {
        success: true,
        action: 'scrape_url',
        data: {
          url: params.url,
          content: task.result,
          cached: task.cached ?? false,
        },
      };
    }

    // Poll for result (extension processes the scrape)
    const taskId = task.id;
    const maxWaitMs = 120000; // 2 minutes
    const pollIntervalMs = 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const polled = await serverRequest<{
        id: string;
        status: string;
        result?: string;
        errorMessage?: string;
        suggestion?: string;
      }>(`/scrape/tasks/${taskId}`);

      if (polled.status === 'completed' && polled.result) {
        return {
          success: true,
          action: 'scrape_url',
          data: {
            url: params.url,
            content: polled.result,
            cached: false,
          },
        };
      }

      if (polled.status === 'failed') {
        return {
          success: false,
          action: 'scrape_url',
          error: polled.errorMessage || 'Scrape failed',
        };
      }

      if (polled.status === 'expired') {
        return {
          success: false,
          action: 'scrape_url',
          error: polled.suggestion || 'Scrape task expired. Is the browser extension running?',
        };
      }
    }

    // Timeout
    return {
      success: false,
      action: 'scrape_url',
      error: 'Scrape timed out. Make sure the Skillomatic browser extension is installed and running.',
    };
  } catch (error) {
    return {
      success: false,
      action: 'scrape_url',
      error: error instanceof Error ? error.message : 'Failed to create scrape task',
    };
  }
}

/**
 * Execute update_application_stage action
 */
async function executeUpdateApplicationStage(
  params: { applicationId: string; stage: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>(
      `/v1/ats/applications/${params.applicationId}/stage`,
      {
        method: 'PUT',
        body: JSON.stringify({ stage: params.stage }),
      }
    );
    return {
      success: true,
      action: 'update_application_stage',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'update_application_stage',
      error: error instanceof Error ? error.message : 'Failed to update application stage',
    };
  }
}

/**
 * Execute list_applications action
 */
async function executeListApplications(
  params: { candidateId?: string; jobId?: string; status?: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    const queryParams = new URLSearchParams();
    if (params.candidateId) queryParams.set('candidateId', params.candidateId);
    if (params.jobId) queryParams.set('jobId', params.jobId);
    if (params.status) queryParams.set('status', params.status);

    const result = await serverRequest<{ applications: unknown[] }>(
      `/v1/ats/applications?${queryParams.toString()}`
    );
    return {
      success: true,
      action: 'list_applications',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'list_applications',
      error: error instanceof Error ? error.message : 'Failed to list applications',
    };
  }
}

/**
 * Execute search_emails action via v1/email/search endpoint
 */
async function executeSearchEmails(
  params: { query: string; maxResults?: number }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<{ emails: unknown[]; total: number }>(
      '/v1/email/search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: params.query,
          maxResults: params.maxResults || 10,
        }),
      }
    );
    return {
      success: true,
      action: 'search_emails',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'search_emails',
      error: error instanceof Error ? error.message : 'Failed to search emails',
    };
  }
}

/**
 * Execute draft_email action via v1/email/draft endpoint
 */
async function executeDraftEmail(
  params: { to: string; subject: string; body: string; cc?: string; bcc?: string }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<{ draftId: string; messageId: string }>(
      '/v1/email/draft',
      {
        method: 'POST',
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          bodyType: 'text',
        }),
      }
    );
    return {
      success: true,
      action: 'draft_email',
      data: {
        ...result,
        message: 'Draft created successfully. You can find it in your Gmail Drafts folder.',
      },
    };
  } catch (error) {
    return {
      success: false,
      action: 'draft_email',
      error: error instanceof Error ? error.message : 'Failed to create draft',
    };
  }
}

/**
 * Execute send_email action via v1/email/send endpoint
 */
async function executeSendEmail(
  params: { to: string; subject: string; body: string; cc?: string; bcc?: string }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<{ messageId: string; threadId: string }>(
      '/v1/email/send',
      {
        method: 'POST',
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          bodyType: 'text',
        }),
      }
    );
    return {
      success: true,
      action: 'send_email',
      data: {
        ...result,
        message: `Email sent successfully to ${params.to}.`,
      },
    };
  } catch (error) {
    return {
      success: false,
      action: 'send_email',
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Execute web_search action via v1/search endpoint
 */
async function executeWebSearch(
  params: { query: string; maxResults?: number; topic?: string; includeAnswer?: boolean }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<{
      query: string;
      answer?: string;
      results: Array<{ title: string; url: string; content: string; score: number }>;
      total: number;
    }>('/v1/search', {
      method: 'POST',
      body: JSON.stringify({
        query: params.query,
        maxResults: params.maxResults || 5,
        topic: params.topic || 'general',
        includeAnswer: params.includeAnswer !== false,
      }),
    });
    return {
      success: true,
      action: 'web_search',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'web_search',
      error: error instanceof Error ? error.message : 'Failed to search web',
    };
  }
}

/**
 * Execute google_workspace action via v1/google endpoint
 */
async function executeGoogleWorkspace(
  params: { provider: string; operation: string; params?: Record<string, unknown>; body?: Record<string, unknown> }
): Promise<ActionResult> {
  try {
    const result = await serverRequest<unknown>('/v1/google/action', {
      method: 'POST',
      body: JSON.stringify({
        provider: params.provider,
        operation: params.operation,
        params: params.params,
        body: params.body,
      }),
    });
    return {
      success: true,
      action: 'google_workspace',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      action: 'google_workspace',
      error: error instanceof Error ? error.message : 'Failed to execute Google Workspace action',
    };
  }
}

/**
 * Main action executor - routes actions to appropriate handlers
 */
export async function executeAction(
  action: ActionType,
  params: Record<string, unknown>,
  context: ActionContext = {}
): Promise<ActionResult> {
  switch (action) {
    case 'load_skill':
      return executeLoadSkill(params as { slug: string });

    case 'create_skill':
      return executeCreateSkill(params as { content: string; force?: boolean });

    case 'search_candidates':
      return executeSearchCandidates(
        params as { query: string; limit?: number },
        context
      );

    case 'get_candidate':
      return executeGetCandidate(params as { id: string }, context);

    case 'create_candidate':
      return executeCreateCandidate(
        params as { firstName: string; lastName: string; email?: string; phone?: string },
        context
      );

    case 'update_candidate':
      return executeUpdateCandidate(
        params as { id: string } & Record<string, unknown>,
        context
      );

    case 'delete_candidate':
      return executeDeleteCandidate(params as { id: string }, context);

    case 'list_jobs':
      return executeListJobs(
        params as { status?: string; limit?: number },
        context
      );

    case 'get_job':
      return executeGetJob(params as { id: string }, context);

    case 'scrape_url':
      return executeScrapeUrl(params as { url: string }, context);

    case 'update_application_stage':
      return executeUpdateApplicationStage(
        params as { applicationId: string; stage: string },
        context
      );

    case 'list_applications':
      return executeListApplications(
        params as { candidateId?: string; jobId?: string; status?: string },
        context
      );

    // Email actions - route to v1/email endpoints
    case 'search_emails':
      return executeSearchEmails(params as { query: string; maxResults?: number });

    case 'draft_email':
      return executeDraftEmail(
        params as { to: string; subject: string; body: string; cc?: string; bcc?: string }
      );

    case 'send_email':
      return executeSendEmail(
        params as { to: string; subject: string; body: string; cc?: string; bcc?: string }
      );

    // Web search - route to v1/search endpoint
    case 'web_search':
      return executeWebSearch(
        params as { query: string; maxResults?: number; topic?: string; includeAnswer?: boolean }
      );

    // Google Workspace - route to v1/google endpoint
    case 'google_workspace':
      return executeGoogleWorkspace(
        params as { provider: string; operation: string; params?: Record<string, unknown>; body?: Record<string, unknown> }
      );

    default:
      // Unknown action - not supported
      return {
        success: false,
        action: action as ActionType,
        error: `Unknown action: ${action}. This action may only be available through MCP connection.`,
      };
  }
}

/**
 * Format action result for display in chat
 */
export function formatActionResult(result: ActionResult): string {
  if (!result.success) {
    return `Error: ${result.error}`;
  }

  // Special formatting for load_skill
  if (result.action === 'load_skill' && result.data) {
    const data = result.data as { slug: string; name: string; instructions: string };
    return `Loaded skill "${data.name}":\n\n${data.instructions}`;
  }

  // Special formatting for create_skill
  if (result.action === 'create_skill' && result.data) {
    const data = result.data as { slug: string; name: string; message: string };
    return data.message;
  }

  // Default JSON formatting
  return JSON.stringify(result.data, null, 2);
}

/**
 * Parse action from LLM response text
 */
export function parseAction(
  text: string
): { action: ActionType; params: Record<string, unknown> } | null {
  const match = text.match(/```action\n([\s\S]*?)```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.action) {
      const { action, ...params } = parsed;
      return { action, params };
    }
  } catch {
    // Malformed JSON
  }

  return null;
}

/**
 * Parse all actions from LLM response text
 */
export function parseAllActions(
  text: string
): Array<{ action: ActionType; params: Record<string, unknown> }> {
  const actions: Array<{ action: ActionType; params: Record<string, unknown> }> = [];
  const regex = /```action\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.action) {
        const { action, ...params } = parsed;
        actions.push({ action, params });
      }
    } catch {
      // Skip malformed actions
    }
  }

  return actions;
}
