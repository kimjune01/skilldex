import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MessageList, ChatInput } from '@/components/chat';
import { chat, skills } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap, Server, Loader2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage, ChatEvent, SkillPublic } from '@skillomatic/shared';
import { useClientChat } from '@/hooks/useClientChat';
import { executeAction, formatActionResult, type ActionType } from '@/lib/action-executor';
import { useAuth } from '@/hooks/useAuth';

type ChatMode = 'server' | 'ephemeral';

export default function Chat() {
  const [chatMode, setChatMode] = useState<ChatMode>('server');
  const [ephemeralAvailable, setEphemeralAvailable] = useState(false);
  const [checkingEphemeral, setCheckingEphemeral] = useState(true);

  // Check if ephemeral mode is available (org has LLM config)
  useEffect(() => {
    async function checkEphemeralMode() {
      setCheckingEphemeral(true);
      try {
        const config = await skills.getConfig();
        setEphemeralAvailable(config.profile.hasLLM);
      } catch {
        setEphemeralAvailable(false);
      } finally {
        setCheckingEphemeral(false);
      }
    }
    checkEphemeralMode();
  }, []);

  // Render based on mode
  if (chatMode === 'ephemeral' && ephemeralAvailable) {
    return (
      <EphemeralChat
        onSwitchMode={() => setChatMode('server')}
        checkingEphemeral={checkingEphemeral}
      />
    );
  }

  return (
    <ServerChat
      ephemeralAvailable={ephemeralAvailable}
      checkingEphemeral={checkingEphemeral}
      onSwitchMode={() => setChatMode('ephemeral')}
    />
  );
}

/**
 * Server-side chat (original implementation)
 */
function ServerChat({
  ephemeralAvailable,
  checkingEphemeral,
  onSwitchMode,
}: {
  ephemeralAvailable: boolean;
  checkingEphemeral: boolean;
  onSwitchMode: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    skill: SkillPublic | null;
    instructions: string;
  }>({ open: false, skill: null, instructions: '' });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(
    (content: string) => {
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
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Build message history for API
      const messageHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Stream response
      abortControllerRef.current = chat.stream(
        messageHistory,
        (event: ChatEvent) => {
          switch (event.type) {
            case 'text':
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content } : m
                )
              );
              break;

            case 'skill_suggestion':
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        skillSuggestion: {
                          skill: event.skill,
                          executionType: event.executionType,
                          status: 'pending',
                        },
                      }
                    : m
                )
              );
              break;

            case 'action_result':
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        actionResult: {
                          action: event.action,
                          result: event.result,
                        },
                      }
                    : m
                )
              );
              break;

            case 'error':
              setError(event.message);
              setIsStreaming(false);
              break;

            case 'done':
              setIsStreaming(false);
              break;
          }
        },
        (err) => {
          setError(err.message);
          setIsStreaming(false);
        }
      );
    },
    [messages]
  );

  const handleRunSkill = useCallback(async (skillSlug: string) => {
    // Find the message with this skill suggestion
    setMessages((prev) =>
      prev.map((m) =>
        m.skillSuggestion?.skill.slug === skillSlug
          ? {
              ...m,
              skillSuggestion: { ...m.skillSuggestion, status: 'executing' },
            }
          : m
      )
    );

    try {
      const result = await chat.executeSkill(skillSlug);

      if (result.type === 'instructions') {
        // Show instructions dialog for Claude Desktop skills
        setInstructionsDialog({
          open: true,
          skill: result.skill,
          instructions: result.instructions || '',
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.skillSuggestion?.skill.slug === skillSlug
              ? {
                  ...m,
                  skillSuggestion: { ...m.skillSuggestion, status: 'completed' },
                }
              : m
          )
        );
      } else {
        // API skill executed
        setMessages((prev) =>
          prev.map((m) =>
            m.skillSuggestion?.skill.slug === skillSlug
              ? {
                  ...m,
                  skillSuggestion: {
                    ...m.skillSuggestion,
                    status: 'completed',
                    result: result,
                  },
                }
              : m
          )
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute skill';
      setMessages((prev) =>
        prev.map((m) =>
          m.skillSuggestion?.skill.slug === skillSlug
            ? {
                ...m,
                skillSuggestion: {
                  ...m.skillSuggestion,
                  status: 'error',
                  result: message,
                },
              }
            : m
        )
      );
    }
  }, []);

  const handleShowInstructions = useCallback(async (skillSlug: string) => {
    try {
      const result = await chat.executeSkill(skillSlug);
      if (result.type === 'instructions') {
        setInstructionsDialog({
          open: true,
          skill: result.skill,
          instructions: result.instructions || '',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load instructions';
      setError(message);
    }
  }, []);

  const handleDownloadChat = useCallback(() => {
    if (messages.length === 0) return;

    const lines = messages.map((m) => {
      const timestamp = new Date(m.timestamp).toLocaleString();
      const role = m.role === 'user' ? 'You' : 'Assistant';
      return `[${timestamp}] ${role}:\n${m.content}\n`;
    });

    const content = lines.join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Ask about recruiting tasks and discover skills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadChat}
            disabled={messages.length === 0}
            title="Download chat"
          >
            <Download className="h-4 w-4" />
          </Button>
          <ChatModeToggle
            mode="server"
            ephemeralAvailable={ephemeralAvailable}
            checkingEphemeral={checkingEphemeral}
            onToggle={onSwitchMode}
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        onRunSkill={handleRunSkill}
        onShowInstructions={handleShowInstructions}
        onSuggestionClick={handleSend}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      {/* Instructions Dialog */}
      <Dialog
        open={instructionsDialog.open}
        onOpenChange={(open) => setInstructionsDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{instructionsDialog.skill?.name} - Instructions</DialogTitle>
            <DialogDescription>
              This skill requires Claude Desktop. Follow these instructions:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {instructionsDialog.instructions}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Client-side ephemeral chat (no PII through server)
 */
function EphemeralChat({
  onSwitchMode,
  checkingEphemeral,
}: {
  onSwitchMode: () => void;
  checkingEphemeral: boolean;
}) {
  const { user, organizationId } = useAuth();

  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    skill: SkillPublic | null;
    instructions: string;
  }>({ open: false, skill: null, instructions: '' });

  // Action handler for client-side execution
  const handleActionRequest = useCallback(
    async (action: string, params: Record<string, unknown>): Promise<string> => {
      const result = await executeAction(action as ActionType, params);
      return formatActionResult(result);
    },
    []
  );

  // Build user context for LLM API calls (used for attribution/abuse prevention)
  const userContext = useMemo(() => {
    if (!user?.id) return undefined;
    return {
      userId: user.id,
      organizationId,
    };
  }, [user?.id, organizationId]);

  const { messages, isStreaming, isLoading, error, llmConfig, send, clearError } = useClientChat({
    onActionRequest: handleActionRequest,
    userContext,
  });

  const handleRunSkill = useCallback(async (skillSlug: string) => {
    try {
      const rendered = await skills.getRendered(skillSlug);
      setInstructionsDialog({
        open: true,
        skill: rendered,
        instructions: rendered.instructions,
      });
    } catch (err) {
      console.error('Failed to load skill:', err);
    }
  }, []);

  const handleShowInstructions = handleRunSkill;

  const handleDownloadChat = useCallback(() => {
    if (messages.length === 0) return;

    const lines = messages.map((m) => {
      const timestamp = new Date(m.timestamp).toLocaleString();
      const role = m.role === 'user' ? 'You' : 'Assistant';
      return `[${timestamp}] ${role}:\n${m.content}\n`;
    });

    const content = lines.join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing ephemeral chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Chat</h1>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Ephemeral
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Direct LLM connection - no PII through server
            {llmConfig && (
              <span className="ml-2 text-xs">
                ({llmConfig.provider}/{llmConfig.model.split('-').slice(0, 2).join('-')})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadChat}
            disabled={messages.length === 0}
            title="Download chat"
          >
            <Download className="h-4 w-4" />
          </Button>
          <ChatModeToggle
            mode="ephemeral"
            ephemeralAvailable={true}
            checkingEphemeral={checkingEphemeral}
            onToggle={onSwitchMode}
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        onRunSkill={handleRunSkill}
        onShowInstructions={handleShowInstructions}
        onSuggestionClick={send}
      />

      {/* Input */}
      <ChatInput onSend={send} disabled={isStreaming} />

      {/* Instructions Dialog */}
      <Dialog
        open={instructionsDialog.open}
        onOpenChange={(open) => setInstructionsDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{instructionsDialog.skill?.name} - Rendered Instructions</DialogTitle>
            <DialogDescription>
              Skill instructions with your credentials embedded (ephemeral mode)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {instructionsDialog.instructions}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Toggle between server and ephemeral chat modes
 */
function ChatModeToggle({
  mode,
  ephemeralAvailable,
  checkingEphemeral,
  onToggle,
}: {
  mode: ChatMode;
  ephemeralAvailable: boolean;
  checkingEphemeral: boolean;
  onToggle: () => void;
}) {
  if (checkingEphemeral) {
    return (
      <Badge variant="outline" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      disabled={!ephemeralAvailable && mode === 'server'}
      className="gap-2"
      title={
        mode === 'server'
          ? ephemeralAvailable
            ? 'Switch to ephemeral mode (direct LLM, no PII through server)'
            : 'Ephemeral mode requires LLM API key configuration'
          : 'Switch to server mode (chat proxied through Skillomatic)'
      }
    >
      {mode === 'server' ? (
        <>
          <Server className="h-4 w-4" />
          Server
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Ephemeral
        </>
      )}
    </Button>
  );
}
