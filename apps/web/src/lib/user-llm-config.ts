/**
 * User LLM Configuration Storage
 *
 * Stores user-provided LLM API keys in localStorage for users without
 * organization-level LLM configuration. This allows non-org users to
 * use web chat with their own API keys.
 *
 * Keys are stored locally and never sent to the server (ephemeral architecture).
 */

import type { LLMConfig, LLMProvider } from './llm-client';
import { LLM_DEFAULT_MODELS, LLM_AVAILABLE_MODELS } from '@skillomatic/shared';

const STORAGE_KEY = 'skillomatic_user_llm_config';

export interface UserLLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

/**
 * Save user's LLM configuration to localStorage
 */
export function saveUserLLMConfig(config: UserLLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save LLM config:', error);
  }
}

/**
 * Load user's LLM configuration from localStorage
 */
export function loadUserLLMConfig(): UserLLMConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const config = JSON.parse(stored) as UserLLMConfig;

    // Validate the config
    if (!config.provider || !config.apiKey) {
      return null;
    }

    // Validate provider is supported
    if (!['anthropic', 'openai', 'google', 'groq'].includes(config.provider)) {
      return null;
    }

    return config;
  } catch (error) {
    console.error('Failed to load LLM config:', error);
    return null;
  }
}

/**
 * Clear user's LLM configuration from localStorage
 */
export function clearUserLLMConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear LLM config:', error);
  }
}

/**
 * Check if user has a stored LLM configuration
 */
export function hasUserLLMConfig(): boolean {
  return loadUserLLMConfig() !== null;
}

/**
 * Convert UserLLMConfig to the full LLMConfig format
 */
export function toFullLLMConfig(userConfig: UserLLMConfig): LLMConfig {
  const defaultModel = userConfig.provider === 'google'
    ? 'gemini-1.5-flash'
    : LLM_DEFAULT_MODELS[userConfig.provider as keyof typeof LLM_DEFAULT_MODELS];

  return {
    provider: userConfig.provider,
    apiKey: userConfig.apiKey,
    model: userConfig.model || defaultModel,
  };
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: LLMProvider): readonly string[] {
  if (provider === 'google') {
    return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'] as const;
  }
  return LLM_AVAILABLE_MODELS[provider as keyof typeof LLM_AVAILABLE_MODELS] || [];
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  if (provider === 'google') {
    return 'gemini-1.5-flash';
  }
  return LLM_DEFAULT_MODELS[provider as keyof typeof LLM_DEFAULT_MODELS] || LLM_DEFAULT_MODELS.anthropic;
}

/**
 * Provider display names
 */
export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  gemini: 'Google (Gemini)', // Alias for google
  groq: 'Groq (Llama)',
};

/**
 * Provider API key URL hints
 */
export const PROVIDER_API_KEY_URLS: Record<LLMProvider, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
  gemini: 'https://aistudio.google.com/app/apikey', // Alias for google
  groq: 'https://console.groq.com/keys',
};
