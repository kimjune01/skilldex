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

import { loadRenderedSkill } from './skills-client';

// Action types
export type ActionType =
  | 'load_skill'
  | 'search_candidates'
  | 'get_candidate'
  | 'create_candidate'
  | 'update_candidate'
  | 'list_jobs'
  | 'get_job'
  | 'scrape_url'
  | 'update_application_stage'
  | 'list_applications';

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
      method: 'PATCH',
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
 * Creates scrape task and waits for result
 */
async function executeScrapeUrl(
  params: { url: string },
  _context: ActionContext
): Promise<ActionResult> {
  try {
    // Create scrape task
    const task = await serverRequest<{ id: string; status: string }>(
      '/v1/scrape/tasks',
      {
        method: 'POST',
        body: JSON.stringify({ url: params.url }),
      }
    );

    // Poll for result (in ephemeral architecture, this would use IndexedDB cache)
    // For now, return task creation success
    return {
      success: true,
      action: 'scrape_url',
      data: {
        taskId: task.id,
        status: task.status,
        message: 'Scrape task created. Extension will process and return results.',
      },
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

    default:
      return {
        success: false,
        action: action,
        error: `Unknown action: ${action}`,
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
