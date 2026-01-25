/**
 * Skills API module
 */

import type {
  SkillPublic,
  SkillAccessInfo,
  SkillCreateRequest,
  SkillUpdateRequest,
  SkillVisibility,
} from '@skillomatic/shared';
import type { RenderedSkill, ConfigSkill } from '../skills-client';
import { request, API_BASE } from './request';

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
