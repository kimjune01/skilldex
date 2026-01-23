import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@skillomatic/shared';

interface MessageListProps {
  messages: ChatMessageType[];
  onRunSkill?: (skillSlug: string) => void;
  onShowInstructions?: (skillSlug: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onRefreshAction?: (action: string, params: Record<string, unknown>) => void;
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
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">Welcome to Skillomatic Chat</p>
            <p className="text-sm">Ask me about recruiting tasks or available skills</p>
          </div>
          <div className="flex flex-col gap-3 mt-6 max-w-md mx-auto">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion.text)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
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
    <div className="flex-1 overflow-y-auto px-4">
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
