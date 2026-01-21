import { useState, useCallback, useRef } from 'react';
import { MessageList, ChatInput } from '@/components/chat';
import { chat } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ChatMessage, ChatEvent, SkillPublic } from '@skillomatic/shared';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    skill: SkillPublic | null;
    instructions: string;
  }>({ open: false, skill: null, instructions: '' });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback((content: string) => {
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
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m
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
  }, [messages]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-lg font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Ask about recruiting tasks and discover skills
        </p>
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
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      {/* Instructions Dialog */}
      <Dialog
        open={instructionsDialog.open}
        onOpenChange={(open) =>
          setInstructionsDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {instructionsDialog.skill?.name} - Instructions
            </DialogTitle>
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
