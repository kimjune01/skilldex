import type {
  LoginRequest,
  LoginResponse,
  UserPublic,
  SkillPublic,
  ApiKeyPublic,
  ApiKeyCreateResponse,
  IntegrationPublic,
} from '@skilldex/shared';

// In production, VITE_API_URL points to the Lambda function URL
// In development, we use '/api' which Vite proxies to localhost:3000
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
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
  list: () => request<SkillPublic[]>('/skills'),

  get: (slug: string) => request<SkillPublic>(`/skills/${slug}`),

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
export const integrations = {
  list: () => request<IntegrationPublic[]>('/integrations'),

  connect: (provider: string) =>
    request<{ url: string; message: string }>('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),

  disconnect: (integrationId: string) =>
    request<{ message: string }>('/integrations/disconnect', {
      method: 'POST',
      body: JSON.stringify({ integrationId }),
    }),
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
