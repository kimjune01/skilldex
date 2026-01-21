/**
 * Client-Side LLM Client
 *
 * Provides direct browser-to-LLM API calls for the ephemeral architecture.
 * The API key is obtained from the rendered _config skill and used directly
 * from the browser, bypassing the server for chat requests.
 *
 * Supports:
 * - Anthropic (Claude)
 * - OpenAI (GPT-4)
 * - Groq (Llama)
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

export type LLMProvider = 'anthropic' | 'openai' | 'groq';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

// Provider-specific API configurations
const PROVIDER_CONFIGS: Record<
  LLMProvider,
  {
    baseUrl: string;
    headers: (apiKey: string) => Record<string, string>;
    buildRequest: (messages: ChatMessage[], model: string) => Record<string, unknown>;
    parseStream: (
      reader: ReadableStreamDefaultReader<Uint8Array>,
      callbacks: StreamCallbacks
    ) => Promise<void>;
  }
> = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    buildRequest: (messages, model) => {
      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages.filter((m) => m.role !== 'system');

      return {
        model,
        max_tokens: 4096,
        stream: true,
        system: systemMessage?.content,
        messages: chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
    },
    parseStream: async (reader, callbacks) => {
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'event: message_start') continue;
            if (trimmed.startsWith('event:')) continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                // Handle content_block_delta events
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  const token = parsed.delta.text;
                  fullResponse += token;
                  callbacks.onToken(token);
                }

                // Handle message_stop
                if (parsed.type === 'message_stop') {
                  callbacks.onComplete(fullResponse);
                  return;
                }

                // Handle errors
                if (parsed.type === 'error') {
                  throw new Error(parsed.error?.message || 'Unknown Anthropic error');
                }
              } catch (parseError) {
                // Skip malformed JSON
                if (
                  parseError instanceof SyntaxError &&
                  !data.includes('"type":"error"')
                ) {
                  continue;
                }
                throw parseError;
              }
            }
          }
        }

        callbacks.onComplete(fullResponse);
      } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
  },

  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }),
    buildRequest: (messages, model) => ({
      model,
      stream: true,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
    parseStream: async (reader, callbacks) => {
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              callbacks.onComplete(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullResponse += token;
                callbacks.onToken(token);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        callbacks.onComplete(fullResponse);
      } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
  },

  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }),
    buildRequest: (messages, model) => ({
      model,
      stream: true,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
    // Groq uses OpenAI-compatible streaming format
    parseStream: async (reader, callbacks) => {
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              callbacks.onComplete(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullResponse += token;
                callbacks.onToken(token);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        callbacks.onComplete(fullResponse);
      } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
  },
};

/**
 * Stream a chat completion directly from the browser
 */
export async function streamChat(
  config: LLMConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const providerConfig = PROVIDER_CONFIGS[config.provider];

  if (!providerConfig) {
    callbacks.onError(new Error(`Unsupported LLM provider: ${config.provider}`));
    return;
  }

  try {
    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: providerConfig.headers(config.apiKey),
      body: JSON.stringify(providerConfig.buildRequest(messages, config.model)),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `LLM API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        // Use default error message
      }
      callbacks.onError(new Error(errorMessage));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error('No response body'));
      return;
    }

    await providerConfig.parseStream(reader, callbacks);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Don't call onError for intentional aborts
      return;
    }
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Parse LLM configuration from the rendered _config skill
 */
export function parseLLMConfigFromSkill(configInstructions: string): LLMConfig | null {
  // Parse the markdown-formatted config
  const providerMatch = configInstructions.match(/- Provider: (\w+)/);
  const apiKeyMatch = configInstructions.match(/- API Key: ([^\n]+)/);
  const modelMatch = configInstructions.match(/- Model: ([^\n]+)/);

  if (!providerMatch || !apiKeyMatch) {
    return null;
  }

  const provider = providerMatch[1].toLowerCase() as LLMProvider;
  const apiKey = apiKeyMatch[1].trim();

  // Check if API key is actually configured
  if (apiKey.startsWith('[') && apiKey.endsWith(']')) {
    return null; // Placeholder like [LLM_NOT_CONFIGURED]
  }

  return {
    provider,
    apiKey,
    model: modelMatch?.[1]?.trim() || getDefaultModel(provider),
  };
}

/**
 * Get default model for a provider
 */
function getDefaultModel(provider: LLMProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    case 'openai':
      return 'gpt-4o';
    case 'groq':
      return 'llama-3.1-8b-instant';
    default:
      return 'claude-sonnet-4-20250514';
  }
}

/**
 * Validate that an LLM config is properly configured
 */
export function isLLMConfigValid(config: LLMConfig | null): config is LLMConfig {
  if (!config) return false;
  if (!config.apiKey || config.apiKey.includes('NOT_CONFIGURED')) return false;
  if (!['anthropic', 'openai', 'groq'].includes(config.provider)) return false;
  return true;
}
