/**
 * Multi-provider LLM client
 * Supports Groq, Anthropic, OpenAI, and Gemini with runtime configuration
 */

import { db } from '@skillomatic/db';
import { systemSettings } from '@skillomatic/db/schema';
import { LLM_DEFAULT_MODELS, type LLMProvider } from '@skillomatic/shared';

/** Simple message format for LLM API calls (distinct from ChatMessage in shared types) */
export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  provider?: LLMProvider;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  provider: LLMProvider;
}

// Provider endpoints
const ENDPOINTS: Record<LLMProvider, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
};

/**
 * Get the best available LLM configuration
 * Priority: explicit provider > default provider > any configured provider
 */
async function getProviderConfig(options: LLMOptions = {}): Promise<ProviderConfig> {
  const settings = await db.select().from(systemSettings);
  const settingsMap = new Map(settings.map(s => [s.key, s.value]));

  const providers: Record<LLMProvider, string | undefined> = {
    groq: settingsMap.get('llm.groq_api_key'),
    anthropic: settingsMap.get('llm.anthropic_api_key'),
    openai: settingsMap.get('llm.openai_api_key'),
    gemini: settingsMap.get('llm.gemini_api_key'),
  };

  // If explicit provider requested
  if (options.provider) {
    // Check env var first for the requested provider
    const envKey = `${options.provider.toUpperCase()}_API_KEY`;
    const apiKey = providers[options.provider] || process.env[envKey];
    if (!apiKey) {
      throw new Error(`Provider ${options.provider} is not configured. Please add an API key in Settings or as ${envKey} env var.`);
    }
    return {
      apiKey,
      model: options.model || LLM_DEFAULT_MODELS[options.provider],
      provider: options.provider,
    };
  }

  // Check default provider
  const defaultProvider = settingsMap.get('llm.default_provider') as keyof typeof providers | undefined;
  const defaultModel = settingsMap.get('llm.default_model');

  if (defaultProvider && providers[defaultProvider]) {
    return {
      apiKey: providers[defaultProvider]!,
      model: options.model || defaultModel || LLM_DEFAULT_MODELS[defaultProvider as LLMProvider],
      provider: defaultProvider,
    };
  }

  // Fall back to env vars, prioritized by model capability (most powerful first)
  // Priority: Anthropic (Claude) > OpenAI (GPT-4) > Gemini > Groq (Llama)
  const envFallbacks: Array<{ provider: LLMProvider; envKey: string }> = [
    { provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY' },
    { provider: 'openai', envKey: 'OPENAI_API_KEY' },
    { provider: 'gemini', envKey: 'GEMINI_API_KEY' },
    { provider: 'groq', envKey: 'GROQ_API_KEY' },
  ];

  for (const { provider, envKey } of envFallbacks) {
    const apiKey = process.env[envKey];
    if (apiKey) {
      return {
        apiKey,
        model: options.model || LLM_DEFAULT_MODELS[provider],
        provider,
      };
    }
  }

  // Try any configured provider from settings (prioritized by capability)
  const providerPriority: LLMProvider[] = ['anthropic', 'openai', 'gemini', 'groq'];
  for (const provider of providerPriority) {
    const apiKey = providers[provider];
    if (apiKey) {
      return {
        apiKey,
        model: options.model || LLM_DEFAULT_MODELS[provider],
        provider,
      };
    }
  }

  throw new Error('No LLM provider configured. Please add an API key in Settings > LLM Configuration.');
}

/**
 * Stream chat completions from any provider
 */
export async function* streamChat(
  messages: LLMChatMessage[],
  options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
  const config = await getProviderConfig(options);

  if (config.provider === 'anthropic') {
    yield* streamAnthropic(messages, config, options);
  } else if (config.provider === 'gemini') {
    yield* streamGemini(messages, config, options);
  } else {
    // OpenAI-compatible (Groq, OpenAI)
    yield* streamOpenAICompatible(messages, config, options);
  }
}

/**
 * Non-streaming chat completion
 */
export async function chat(
  messages: LLMChatMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const config = await getProviderConfig(options);

  if (config.provider === 'anthropic') {
    return chatAnthropic(messages, config, options);
  } else if (config.provider === 'gemini') {
    return chatGemini(messages, config, options);
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
  messages: LLMChatMessage[],
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
  messages: LLMChatMessage[],
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
  messages: LLMChatMessage[],
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
  messages: LLMChatMessage[],
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

// ============ Gemini Provider ============

/**
 * Stream chat completions from Gemini
 * Uses Server-Sent Events format with ?alt=sse
 */
async function* streamGemini(
  messages: LLMChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): AsyncGenerator<string, void, unknown> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  // Convert to Gemini format (user/model roles, parts array)
  const contents = nonSystemMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${ENDPOINTS.gemini}/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
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
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming chat completion from Gemini
 */
async function chatGemini(
  messages: LLMChatMessage[],
  config: ProviderConfig,
  options: LLMOptions
): Promise<string> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  // Convert to Gemini format
  const contents = nonSystemMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${ENDPOINTS.gemini}/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
