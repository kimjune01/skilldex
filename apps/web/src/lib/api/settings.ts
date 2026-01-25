/**
 * Settings API module (admin only)
 */

import { request } from './request';

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

export interface DeploymentSettings {
  webUiEnabled: boolean;
  desktopEnabled: boolean;
  hasLlmConfigured: boolean;
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
