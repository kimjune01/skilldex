/**
 * Client-Side Chat Hook
 *
 * Provides a hook for ephemeral architecture client-side chat.
 * Uses the LLM client directly from the browser instead of proxying through the server.
 * Now with IndexedDB persistence for conversation history.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from '@skillomatic/shared';
import {
  streamChat,
  type LLMConfig,
  type LLMChatMessage,
  type LLMUserContext,
} from '@/lib/llm-client';
import {
  getLLMConfig,
  buildSystemPrompt,
} from '@/lib/skills-client';
import {
  getMessages,
  addMessage,
  updateMessage,
  createConversation,
  updateConversationTitle,
  clearConversationMessages,
  generateTitleFromMessage,
} from '@/lib/chat-storage';

export interface UseClientChatOptions {
  onActionRequest?: (action: string, params: Record<string, unknown>) => Promise<string>;
  /**
   * User context passed to LLM providers as metadata for attribution/abuse prevention.
   * Anthropic uses metadata.user_id, OpenAI/Groq use the user parameter.
   */
  userContext?: LLMUserContext;
  /**
   * Current conversation ID for persistence. If null, messages won't be persisted
   * until a conversation is created (on first message).
   */
  conversationId?: string | null;
  /**
   * Callback when a new conversation is created (on first message when conversationId is null).
   */
  onConversationCreated?: (conversationId: string) => void;
  /**
   * Callback when conversations should be refreshed (after message added).
   */
  onConversationsChanged?: () => void;
  /**
   * Optional user-provided LLM config. When provided, this overrides the org-level config.
   * Used for "bring your own API key" functionality.
   */
  userLLMConfig?: LLMConfig | null;
}

export interface UseClientChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  llmConfig: LLMConfig | null;
  send: (content: string) => void;
  abort: () => void;
  clearError: () => void;
  clearMessages: () => void;
  updateMessageActionResult: (messageId: string, action: string, result: string) => void;
}

/**
 * Hook for client-side chat using ephemeral architecture
 */
export function useClientChat(options: UseClientChatOptions = {}): UseClientChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmConfig, setLLMConfig] = useState<LLMConfig | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(options.conversationId ?? null);
  const isFirstMessageRef = useRef(true);

  // Keep ref in sync with prop
  useEffect(() => {
    currentConversationIdRef.current = options.conversationId ?? null;
  }, [options.conversationId]);

  // Initialize LLM config and system prompt on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      try {
        // If user provided their own LLM config, use that instead of org config
        const [orgConfig, prompt] = await Promise.all([
          options.userLLMConfig ? Promise.resolve(null) : getLLMConfig(),
          buildSystemPrompt(),
        ]);

        const finalConfig = options.userLLMConfig || orgConfig;
        setLLMConfig(finalConfig);
        setSystemPrompt(prompt);

        if (!finalConfig) {
          setError('LLM not configured. Please set up your LLM API key.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [options.userLLMConfig]);

  // Load messages when conversationId changes
  useEffect(() => {
    async function loadMessages() {
      if (!options.conversationId) {
        setMessages([]);
        isFirstMessageRef.current = true;
        return;
      }

      setIsLoadingMessages(true);
      try {
        const storedMessages = await getMessages(options.conversationId);
        setMessages(storedMessages);
        isFirstMessageRef.current = storedMessages.length === 0;
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessages([]);
        isFirstMessageRef.current = true;
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadMessages();
  }, [options.conversationId]);

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

  // Helper to persist a message to IndexedDB
  const persistMessage = useCallback(async (message: ChatMessage) => {
    const convId = currentConversationIdRef.current;
    if (!convId) return;

    try {
      await addMessage(convId, message);
      options.onConversationsChanged?.();
    } catch (err) {
      console.error('Failed to persist message:', err);
    }
  }, [options]);

  // Helper to update a persisted message
  const persistMessageUpdate = useCallback(async (message: ChatMessage) => {
    const convId = currentConversationIdRef.current;
    if (!convId) return;

    try {
      await updateMessage(convId, message);
      options.onConversationsChanged?.();
    } catch (err) {
      console.error('Failed to update persisted message:', err);
    }
  }, [options]);

  // Internal send function that handles streaming and action execution
  const sendInternal = useCallback(async (
    content: string,
    isToolResult: boolean = false
  ): Promise<{ response: string; actions: Array<{ action: string; params: Record<string, unknown> }> }> => {
    if (!llmConfig) {
      throw new Error('LLM not configured');
    }

    // Create conversation if this is the first message and we don't have one
    if (!currentConversationIdRef.current && !isToolResult) {
      try {
        const conv = await createConversation();
        currentConversationIdRef.current = conv.id;
        options.onConversationCreated?.(conv.id);
      } catch (err) {
        console.error('Failed to create conversation:', err);
      }
    }

    // Add user message (or tool result as user message)
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      isToolResult,
    };

    // For tool results, we don't show them as separate messages in UI
    // They're included in conversation history but displayed with the action
    if (!isToolResult) {
      setMessages((prev) => [...prev, userMessage]);
      // Persist user message and auto-title on first message
      if (currentConversationIdRef.current) {
        persistMessage(userMessage);
        if (isFirstMessageRef.current) {
          isFirstMessageRef.current = false;
          const title = generateTitleFromMessage(content);
          updateConversationTitle(currentConversationIdRef.current, title).catch(console.error);
          options.onConversationsChanged?.();
        }
      }
    }

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

    // Build LLM messages array - include action results in history
    const llmMessages: LLMChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add previous messages, including action results
    for (const m of messages) {
      llmMessages.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      });
      // If this message had an action result, add it as a user message
      if (m.actionResult?.result) {
        llmMessages.push({
          role: 'user',
          content: `[Tool Result]\n${m.actionResult.result}`,
        });
      }
    }

    // Add the current message
    llmMessages.push({ role: 'user', content });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    let fullResponse = '';

    return new Promise((resolve, reject) => {
      streamChat(
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
          onComplete: (response) => {
            fullResponse = response;
            const actions = parseActions(response);
            // Persist the completed assistant message
            const completedMessage: ChatMessage = {
              id: assistantId,
              role: 'assistant',
              content: response,
              timestamp: assistantMessage.timestamp,
            };
            persistMessage(completedMessage);
            resolve({ response, actions });
          },
          onError: (err) => {
            reject(err);
          },
        },
        {
          userContext: options.userContext,
          abortSignal: abortControllerRef.current!.signal,
        }
      ).catch(reject);
    });
  }, [llmConfig, messages, systemPrompt, parseActions, options.userContext, options, persistMessage]);

  const send = useCallback(async (content: string) => {
    if (!llmConfig) {
      setError('LLM not configured');
      return;
    }

    setError(null);
    setIsStreaming(true);

    try {
      // First turn: send user message
      let result = await sendInternal(content);

      // Check for actions and execute them
      while (result.actions.length > 0 && options.onActionRequest) {
        const actions = result.actions;

        // Execute actions
        const actionResults = await executeActions(actions);

        if (actionResults) {
          // Update the last assistant message with action results
          // Use a promise to ensure we get the updated message after state update
          const updatedMessage = await new Promise<ChatMessage | null>((resolve) => {
            setMessages((prev) => {
              // Find last assistant message index
              let lastAssistantIdx = -1;
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].role === 'assistant') {
                  lastAssistantIdx = i;
                  break;
                }
              }
              if (lastAssistantIdx >= 0) {
                const updated = [...prev];
                updated[lastAssistantIdx] = {
                  ...updated[lastAssistantIdx],
                  actionResult: {
                    action: actions[0].action,
                    result: actionResults,
                  },
                };
                // Resolve with the updated message
                setTimeout(() => resolve(updated[lastAssistantIdx]), 0);
                return updated;
              }
              setTimeout(() => resolve(null), 0);
              return prev;
            });
          });

          // Persist the updated message with action results
          if (updatedMessage) {
            await persistMessageUpdate(updatedMessage);
          }

          // Send tool results back to LLM for continuation
          result = await sendInternal(`[Tool Result]\n${actionResults}`, true);
        } else {
          break;
        }
      }

      setIsStreaming(false);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
      setIsStreaming(false);
    }
  }, [llmConfig, sendInternal, executeActions, options.onActionRequest, persistMessageUpdate]);

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

  const clearMessages = useCallback(async () => {
    setMessages([]);
    isFirstMessageRef.current = true;
    // Also clear from IndexedDB if we have a conversation
    const convId = currentConversationIdRef.current;
    if (convId) {
      try {
        await clearConversationMessages(convId);
        options.onConversationsChanged?.();
      } catch (err) {
        console.error('Failed to clear messages from storage:', err);
      }
    }
  }, [options]);

  const updateMessageActionResult = useCallback((messageId: string, action: string, result: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, actionResult: { action, result } }
          : m
      )
    );
  }, []);

  return {
    messages,
    isStreaming,
    isLoading,
    isLoadingMessages,
    error,
    llmConfig,
    send,
    abort,
    clearError,
    clearMessages,
    updateMessageActionResult,
  };
}
