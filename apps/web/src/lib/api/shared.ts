/**
 * Public shared skills API module (no auth required)
 */

import type { SharedSkillPublic } from '@skillomatic/shared';
import { API_BASE } from './request';

/**
 * Fetch a shared skill by its share code (public, no auth)
 */
export async function getSharedSkill(code: string): Promise<SharedSkillPublic> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/s/${code}`, {
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

/**
 * Get the download URL for a shared skill (public, no auth)
 */
export function getSharedSkillDownloadUrl(code: string): string {
  return `${API_BASE}/s/${code}/download`;
}

export const shared = {
  get: getSharedSkill,
  getDownloadUrl: getSharedSkillDownloadUrl,
};
