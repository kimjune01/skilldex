import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@skillomatic/shared';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessageType[];
  onRunSkill?: (skillSlug: string) => void;
  onShowInstructions?: (skillSlug: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onRefreshAction?: (action: string, params: Record<string, unknown>) => void;
  llmLabel?: string;
  isMobile?: boolean;
}

const SUGGESTIONS = [
  {
    label: 'Simple',
    text: 'What skills do I have access to?',
    description: 'Discover available skills',
  },
  {
    label: 'Intermediate',
    text: 'Find senior engineers with Python experience and add them to my ATS',
    description: 'Chain multiple skills together',
  },
  {
    label: 'Advanced',
    text: 'Source 5 ML engineers, enrich their profiles with GitHub data, and create a shortlist ranked by relevance',
    description: 'Multi-step workflow with analysis',
  },
];

export function MessageList({
  messages,
  onRunSkill,
  onShowInstructions,
  onSuggestionClick,
  onRefreshAction,
  llmLabel,
  isMobile,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center text-muted-foreground",
        isMobile && "pt-14 pb-24"
      )}>
        <div className={cn("text-center space-y-4", isMobile && "px-4")}>
          <div className="space-y-2">
            <p className={cn("text-lg font-medium", isMobile && "text-base")}>
              Welcome to Skillomatic Chat
            </p>
            {llmLabel && <p className="text-xs">{llmLabel}</p>}
          </div>
          <div className={cn("flex flex-col gap-3 mt-6 max-w-md mx-auto", isMobile && "gap-2")}>
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion.text)}
                className={cn(
                  "text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors",
                  isMobile && "p-4 rounded-xl active:scale-[0.98] transition-transform"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {suggestion.label}
                  </span>
                </div>
                <p className="text-sm text-foreground">{suggestion.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 overflow-y-auto",
      isMobile ? "px-3 pt-14 pb-24" : "px-4"
    )}>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onRunSkill={onRunSkill}
          onShowInstructions={onShowInstructions}
          onRefreshAction={onRefreshAction}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
