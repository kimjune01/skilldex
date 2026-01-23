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
  ScrapeTaskPublic,
  CreateScrapeTaskResponse,
  OrganizationPublic,
  OrganizationInvitePublic,
  OnboardingStatus,
  SkillCreateRequest,
  SkillUpdateRequest,
  SkillVisibility,
} from '@skillomatic/shared';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import type { RenderedSkill, ConfigSkill } from './skills-client';

// API base URL - set via environment variable
// Dev: http://localhost:3000, Prod: https://api.skillomatic.technology
const API_BASE = import.meta.env.VITE_API_URL;

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
export interface SkillListOptions {
  includeAccess?: boolean;
  filter?: 'all' | 'my' | 'pending';
}

export const skills = {
  list: (options?: SkillListOptions) => {
    const params = new URLSearchParams();
    if (options?.includeAccess) params.set('includeAccess', 'true');
    if (options?.filter) params.set('filter', options.filter);
    const query = params.toString();
    return request<SkillPublic[]>(`/skills${query ? `?${query}` : ''}`);
  },

  get: (slug: string) => request<SkillPublic>(`/skills/${slug}`),

  // Create a new user-generated skill
  create: (data: SkillCreateRequest) =>
    request<SkillPublic>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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

  update: (slug: string, data: SkillUpdateRequest) =>
    request<SkillPublic>(`/skills/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete a skill (owner or admin only)
  delete: (slug: string) =>
    request<{ message: string }>(`/skills/${slug}`, {
      method: 'DELETE',
    }),

  // Request org-wide visibility for a private skill
  requestVisibility: (slug: string, visibility: SkillVisibility, reason?: string) =>
    request<SkillPublic>(`/skills/${slug}/request-visibility`, {
      method: 'POST',
      body: JSON.stringify({ visibility, reason }),
    }),

  // Approve visibility request (admin only)
  approveVisibility: (slug: string) =>
    request<SkillPublic>(`/skills/${slug}/approve-visibility`, {
      method: 'POST',
    }),

  // Deny visibility request (admin only)
  denyVisibility: (slug: string, feedback?: string) =>
    request<SkillPublic>(`/skills/${slug}/deny-visibility`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
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

// Skill Proposals - DEPRECATED
// Use skills.create() instead for direct skill creation
// Keeping for backward compatibility with any legacy code
/** @deprecated Use skills.create() for direct skill creation */
export const proposals = {
  /** @deprecated Proposals are no longer used */
  list: (_status?: string) => Promise.resolve([] as SkillProposalPublic[]),

  /** @deprecated Proposals are no longer used */
  get: (_id: string) => Promise.reject(new Error('Proposals are deprecated. Use skills.create() instead.')),

  /** @deprecated Use skills.create() instead */
  create: (_body: SkillProposalCreateRequest) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.create() instead.')),

  /** @deprecated Proposals are no longer used */
  update: (_id: string, _body: SkillProposalCreateRequest) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.update() instead.')),

  /** @deprecated Proposals are no longer used */
  delete: (_id: string) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.delete() instead.')),

  /** @deprecated Visibility requests are handled through skills.requestVisibility() */
  review: (_id: string, _body: SkillProposalReviewRequest) =>
    Promise.reject(new Error('Proposals are deprecated. Use skills.approveVisibility() or skills.denyVisibility() instead.')),
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
