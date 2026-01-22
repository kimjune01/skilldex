import type {
  LoginRequest,
  LoginResponse,
  UserPublic,
  SkillPublic,
  SkillAccessInfo,
  ApiKeyPublic,
  ApiKeyCreateResponse,
  IntegrationPublic,
  SkillProposalPublic,
  SkillProposalCreateRequest,
  SkillProposalReviewRequest,
  ChatRequest,
  ChatEvent,
  ScrapeTaskPublic,
  CreateScrapeTaskResponse,
  OrganizationPublic,
  OrganizationInvitePublic,
  OnboardingStatus,
} from '@skillomatic/shared';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import type { RenderedSkill, ConfigSkill } from './skills-client';
import { isDemoModeEnabled } from '../hooks/useDemo';

// In production, VITE_API_URL points to the Lambda function URL
// In development, we use '/api' which Vite proxies to localhost:3000
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add demo mode header if enabled
  if (isDemoModeEnabled()) {
    headers['X-Demo-Mode'] = 'true';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data.data;
}

// Auth
export const auth = {
  login: (body: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<UserPublic>('/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
};

// Skills
export const skills = {
  list: (options?: { includeAccess?: boolean }) =>
    request<SkillPublic[]>(`/skills${options?.includeAccess ? '?includeAccess=true' : ''}`),

  get: (slug: string) => request<SkillPublic>(`/skills/${slug}`),

  // Get rendered skill with embedded credentials (ephemeral architecture)
  getRendered: (slug: string) => request<RenderedSkill>(`/skills/${slug}/rendered`),

  // Get config skill with all credentials (ephemeral architecture)
  getConfig: () => request<ConfigSkill>('/skills/config'),

  download: async (slug: string): Promise<string> => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/skills/${slug}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Download timeout. Please try again.');
      }
      if (err instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Failed to download skill (${response.status})`);
    }

    return response.text();
  },

  update: (slug: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    intent: string;
    capabilities: string[];
    requiredIntegrations: string[];
    isEnabled: boolean;
  }>) =>
    request<SkillPublic>(`/skills/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get skill access info (permissions debug view)
  getAccessInfo: (slug: string) => request<SkillAccessInfo>(`/skills/${slug}/access`),
};

// API Keys
export const apiKeys = {
  list: () => request<ApiKeyPublic[]>('/api-keys'),

  create: (name?: string) =>
    request<ApiKeyCreateResponse>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  revoke: (id: string) =>
    request<{ message: string }>(`/api-keys/${id}`, {
      method: 'DELETE',
    }),
};

// Integrations
export type IntegrationAccessLevel = 'read-write' | 'read-only';

export const integrations = {
  list: () => request<IntegrationPublic[]>('/integrations'),

  // Get a Connect session token for the Nango Connect UI
  // Optionally pass accessLevel to set user's preferred access level during connection
  getSession: (allowedIntegrations?: string[], accessLevel?: IntegrationAccessLevel, provider?: string) =>
    request<{ token: string; expiresAt: string; connectLink: string }>('/integrations/session', {
      method: 'POST',
      body: JSON.stringify({ allowedIntegrations, accessLevel, provider }),
    }),

  // @deprecated - use getSession + Nango Connect UI instead
  connect: (provider: string, subProvider?: string, accessLevel?: IntegrationAccessLevel) =>
    request<{ url: string; connectionId: string; message: string }>('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, subProvider, accessLevel }),
    }),

  disconnect: (integrationId: string) =>
    request<{ message: string }>('/integrations/disconnect', {
      method: 'POST',
      body: JSON.stringify({ integrationId }),
    }),

  // Update the access level for an existing integration
  updateAccessLevel: (integrationId: string, accessLevel: IntegrationAccessLevel) =>
    request<{ id: string; provider: string; accessLevel: string; message: string }>(
      `/integrations/${integrationId}/access-level`,
      {
        method: 'PATCH',
        body: JSON.stringify({ accessLevel }),
      }
    ),

  getToken: (integrationId: string) =>
    request<{ accessToken: string; tokenType: string; expiresAt?: string }>(
      `/integrations/${integrationId}/token`
    ),

  checkStatus: (provider: string) =>
    request<{ connected: boolean; status: string; lastSyncAt?: Date; accessLevel?: string; message?: string }>(
      `/integrations/status/${provider}`
    ),
};

// Users (admin)
export const users = {
  list: () => request<UserPublic[]>('/users'),

  get: (id: string) => request<UserPublic>(`/users/${id}`),

  create: (body: { email: string; password: string; name: string; isAdmin?: boolean }) =>
    request<UserPublic>('/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics
export interface UsageStats {
  summary: {
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    successRate: string;
    avgDurationMs: number;
    uniqueUsers?: number;
  };
  bySkill: Array<{
    skillSlug: string;
    skillName: string;
    category?: string;
    count: number;
    uniqueUsers?: number;
  }>;
  daily: Array<{
    date: string;
    count: number;
    uniqueUsers?: number;
  }>;
  recentLogs?: Array<{
    id: string;
    skillSlug: string;
    skillName: string;
    status: string;
    durationMs?: number;
    createdAt: string;
  }>;
  topUsers?: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
  recentErrors?: Array<{
    skillSlug: string;
    skillName: string;
    errorMessage: string;
    count: number;
  }>;
}

export const analytics = {
  getUsage: (days = 30) => request<UsageStats>(`/analytics/usage?days=${days}`),

  getAdminStats: (days = 30) => request<UsageStats>(`/analytics/admin?days=${days}`),
};

// Skill Proposals
export const proposals = {
  list: (status?: string) =>
    request<SkillProposalPublic[]>(`/proposals${status ? `?status=${status}` : ''}`),

  get: (id: string) => request<SkillProposalPublic>(`/proposals/${id}`),

  create: (body: SkillProposalCreateRequest) =>
    request<SkillProposalPublic>('/proposals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: SkillProposalCreateRequest) =>
    request<SkillProposalPublic>(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/proposals/${id}`, {
      method: 'DELETE',
    }),

  review: (id: string, body: SkillProposalReviewRequest) =>
    request<SkillProposalPublic>(`/proposals/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// Chat
export const chat = {
  /**
   * Stream chat responses using SSE
   * @param messages - Chat history
   * @param onEvent - Callback for each event
   * @param onError - Callback for errors
   * @returns AbortController to cancel the stream
   */
  stream: (
    messages: ChatRequest['messages'],
    onEvent: (event: ChatEvent) => void,
    onError: (error: Error) => void
  ): AbortController => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (isDemoModeEnabled()) {
      headers['X-Demo-Mode'] = 'true';
    }

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
          throw new Error(data.error?.message || `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            try {
              const event = JSON.parse(trimmed.slice(6)) as ChatEvent;
              onEvent(event);
            } catch {
              // Skip malformed lines
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err);
        }
      });

    return controller;
  },

  executeSkill: (skillSlug: string, params?: Record<string, unknown>) =>
    request<{
      type: 'instructions' | 'api_ready';
      skill: SkillPublic;
      message: string;
      instructions?: string;
      params?: Record<string, unknown>;
    }>('/chat/execute-skill', {
      method: 'POST',
      body: JSON.stringify({ skillSlug, params }),
    }),
};

// Scrape Tasks (API key auth - used by extension and skills)
// Note: These use the v1 API which requires API key authentication
// For web UI, we use a wrapper that includes the user's API key
export const scrape = {
  createTask: (url: string) =>
    request<CreateScrapeTaskResponse>('/v1/scrape/tasks', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getTask: (id: string) => request<ScrapeTaskPublic>(`/v1/scrape/tasks/${id}`),

  listTasks: () => request<{ tasks: ScrapeTaskPublic[]; total: number }>('/v1/scrape/tasks'),
};

// LLM Settings (admin only)
export interface LLMProviderConfig {
  id: string;
  name: string;
  configured: boolean;
  models: string[];
  defaultModel: string;
  apiKeyPreview: string | null;
}

export interface LLMSettings {
  providers: LLMProviderConfig[];
  defaultProvider: string;
  defaultModel: string;
}

export const settings = {
  getLLM: () => request<LLMSettings>('/settings/llm'),

  setProviderKey: (provider: string, apiKey: string) =>
    request<{ provider: string; configured: boolean; apiKeyPreview: string }>(
      `/settings/llm/${provider}`,
      {
        method: 'PUT',
        body: JSON.stringify({ apiKey }),
      }
    ),

  deleteProviderKey: (provider: string) =>
    request<{ success: boolean }>(`/settings/llm/${provider}`, {
      method: 'DELETE',
    }),

  setDefault: (provider: string, model: string) =>
    request<{ defaultProvider: string; defaultModel: string }>('/settings/llm/default', {
      method: 'PUT',
      body: JSON.stringify({ provider, model }),
    }),
};

// Deployment settings
export interface DeploymentSettings {
  webUiEnabled: boolean;
  desktopEnabled: boolean;
  hasLlmConfigured: boolean;
}

// Organizations (super admin)
export const organizations = {
  list: () => request<OrganizationPublic[]>('/organizations'),

  get: (id: string) => request<OrganizationPublic>(`/organizations/${id}`),

  getCurrent: () => request<OrganizationPublic>('/organizations/current'),

  create: (body: { name: string; slug?: string; logoUrl?: string }) =>
    request<OrganizationPublic>('/organizations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: { name?: string; slug?: string; logoUrl?: string }) =>
    request<OrganizationPublic>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/organizations/${id}`, {
      method: 'DELETE',
    }),

  getDeployment: () => request<DeploymentSettings>('/organizations/current/deployment'),

  updateDeployment: (body: { webUiEnabled?: boolean; desktopEnabled?: boolean }) =>
    request<DeploymentSettings>('/organizations/current/deployment', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// Organization Invites
export const invites = {
  list: () => request<OrganizationInvitePublic[]>('/invites'),

  create: (body: { email: string; role?: 'admin' | 'member'; organizationId?: string }) =>
    request<OrganizationInvitePublic & { token: string }>('/invites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  validate: (token: string) =>
    request<{ valid: boolean; email: string; organizationName: string; role: string }>(
      `/invites/validate/${token}`
    ),

  accept: (token: string, password: string, name: string) =>
    request<{ token: string; user: UserPublic }>('/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ token, password, name }),
    }),

  cancel: (id: string) =>
    request<{ message: string }>(`/invites/${id}`, {
      method: 'DELETE',
    }),
};

// Onboarding
export const onboarding = {
  getStatus: () => request<OnboardingStatus>('/onboarding/status'),

  advance: (step: number) =>
    request<OnboardingStatus>('/onboarding/advance', {
      method: 'POST',
      body: JSON.stringify({ step }),
    }),

  completeStep: (stepName: keyof typeof ONBOARDING_STEPS) =>
    request<OnboardingStatus>('/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ stepName }),
    }),

  reset: () =>
    request<OnboardingStatus>('/onboarding/reset', {
      method: 'POST',
    }),
};
