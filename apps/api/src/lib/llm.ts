/**
 * Multi-provider LLM client
 * Supports Groq, Anthropic, and OpenAI with runtime configuration
 */

import { db } from '@skilldex/db';
import { systemSettings } from '@skilldex/db/schema';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  provider?: 'groq' | 'anthropic' | 'openai';
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  provider: 'groq' | 'anthropic' | 'openai';
}

// Provider endpoints
const ENDPOINTS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
};

// Default models per provider
const DEFAULT_MODELS = {
  groq: 'llama-3.1-8b-instant',
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
};

/**
 * Get the best available LLM configuration
 * Priority: explicit provider > default provider > any configured provider
 */
async function getProviderConfig(options: LLMOptions = {}): Promise<ProviderConfig> {
  const settings = await db.select().from(systemSettings);
  const settingsMap = new Map(settings.map(s => [s.key, s.value]));

  const providers = {
    groq: settingsMap.get('llm.groq_api_key'),
    anthropic: settingsMap.get('llm.anthropic_api_key'),
    openai: settingsMap.get('llm.openai_api_key'),
  };

  // If explicit provider requested
  if (options.provider) {
    const apiKey = providers[options.provider];
    if (!apiKey) {
      throw new Error(`Provider ${options.provider} is not configured. Please add an API key in Settings.`);
    }
    return {
      apiKey,
      model: options.model || DEFAULT_MODELS[options.provider],
      provider: options.provider,
    };
  }

  // Check default provider
  const defaultProvider = settingsMap.get('llm.default_provider') as keyof typeof providers | undefined;
  const defaultModel = settingsMap.get('llm.default_model');

  if (defaultProvider && providers[defaultProvider]) {
    return {
      apiKey: providers[defaultProvider]!,
      model: options.model || defaultModel || DEFAULT_MODELS[defaultProvider],
      provider: defaultProvider,
    };
  }

  // Fall back to env var for Groq (backwards compatibility)
  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      model: options.model || 'llama-3.1-8b-instant',
      provider: 'groq',
    };
  }

  // Try any configured provider
  for (const [provider, apiKey] of Object.entries(providers)) {
    if (apiKey) {
      return {
        apiKey,
        model: options.model || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS],
        provider: provider as 'groq' | 'anthropic' | 'openai',
      };
    }
  }

  throw new Error('No LLM provider configured. Please add an API key in Settings > LLM Configuration.');
}

/**
 * Stream chat completions from any provider
 */
export async function* streamChat(
  messages: ChatMessage[],
  options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
  const config = await getProviderConfig(options);

  if (config.provider === 'anthropic') {
    yield* streamAnthropic(messages, config, options);
  } else {
    // OpenAI-compatible (Groq, OpenAI)
    yield* streamOpenAICompatible(messages, config, options);
  }
}

/**
 * Non-streaming chat completion
 */
export async function chat(
  messages: ChatMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const config = await getProviderConfig(options);

  if (config.provider === 'anthropic') {
    return chatAnthropic(messages, config, options);
  } else {
    return chatOpenAICompatible(messages, config, options);
  }
}

/**
 * Get current LLM configuration info (for debugging/display)
 */
export async function getLLMInfo(): Promise<{ provider: string; model: string }> {
  try {
    const config = await getProviderConfig();
    return { provider: config.provider, model: config.model };
  } catch {
    return { provider: 'none', model: 'none' };
  }
}

// ============ OpenAI-Compatible Providers (Groq, OpenAI) ============

async function* streamOpenAICompatible(
  messages: ChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): AsyncGenerator<string, void, unknown> {
  const endpoint = ENDPOINTS[config.provider];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function chatOpenAICompatible(
  messages: ChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): Promise<string> {
  const endpoint = ENDPOINTS[config.provider];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

// ============ Anthropic Provider ============

async function* streamAnthropic(
  messages: ChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): AsyncGenerator<string, void, unknown> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      system: systemMessage,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function chatAnthropic(
  messages: ChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): Promise<string> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 2048,
      system: systemMessage,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.content?.[0]?.text || '';
}
