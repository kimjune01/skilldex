/**
 * Client-Side Chat Hook
 *
 * Provides a hook for ephemeral architecture client-side chat.
 * Uses the LLM client directly from the browser instead of proxying through the server.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from '@skillomatic/shared';
import {
  streamChat,
  type LLMConfig,
  type ChatMessage as LLMChatMessage,
} from '@/lib/llm-client';
import {
  getLLMConfig,
  buildSystemPrompt,
} from '@/lib/skills-client';

export interface UseClientChatOptions {
  onActionRequest?: (action: string, params: Record<string, unknown>) => Promise<string>;
}

export interface UseClientChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  llmConfig: LLMConfig | null;
  send: (content: string) => void;
  abort: () => void;
  clearError: () => void;
  clearMessages: () => void;
}

/**
 * Hook for client-side chat using ephemeral architecture
 */
export function useClientChat(options: UseClientChatOptions = {}): UseClientChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [llmConfig, setLLMConfig] = useState<LLMConfig | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);

  // Initialize LLM config and system prompt on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const [config, prompt] = await Promise.all([
          getLLMConfig(),
          buildSystemPrompt(),
        ]);
        setLLMConfig(config);
        setSystemPrompt(prompt);

        if (!config) {
          setError('LLM not configured. Please set up your organization\'s LLM API key.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Parse action blocks from LLM response
  const parseActions = useCallback((content: string): Array<{ action: string; params: Record<string, unknown> }> => {
    const actions: Array<{ action: string; params: Record<string, unknown> }> = [];
    const actionRegex = /```action\n([\s\S]*?)```/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.action) {
          const { action, ...params } = parsed;
          actions.push({ action, params });
        }
      } catch {
        // Skip malformed action blocks
      }
    }

    return actions;
  }, []);

  // Execute actions and get results
  const executeActions = useCallback(async (
    actions: Array<{ action: string; params: Record<string, unknown> }>
  ): Promise<string> => {
    if (!options.onActionRequest || actions.length === 0) {
      return '';
    }

    const results: string[] = [];
    for (const { action, params } of actions) {
      try {
        const result = await options.onActionRequest(action, params);
        results.push(`Action ${action} result:\n${result}`);
      } catch (err) {
        results.push(`Action ${action} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return results.join('\n\n');
  }, [options]);

  const send = useCallback(async (content: string) => {
    if (!llmConfig) {
      setError('LLM not configured');
      return;
    }

    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for assistant message
    const assistantId = `assistant-${Date.now()}`;
    currentAssistantIdRef.current = assistantId;

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Build LLM messages array
    const llmMessages: LLMChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // Create abort controller
    abortControllerRef.current = new AbortController();

    let fullResponse = '';

    try {
      await streamChat(
        llmConfig,
        llmMessages,
        {
          onToken: (token) => {
            fullResponse += token;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
          },
          onComplete: async (response) => {
            fullResponse = response;

            // Check for actions in the response
            const actions = parseActions(response);
            if (actions.length > 0 && options.onActionRequest) {
              // Execute actions
              const actionResults = await executeActions(actions);

              if (actionResults) {
                // Update message with action results
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          actionResult: {
                            action: actions[0].action,
                            result: actionResults,
                          },
                        }
                      : m
                  )
                );
              }
            }

            setIsStreaming(false);
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
          },
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
      setIsStreaming(false);
    }
  }, [llmConfig, messages, systemPrompt, parseActions, executeActions, options]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    llmConfig,
    send,
    abort,
    clearError,
    clearMessages,
  };
}
