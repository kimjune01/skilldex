import { useEffect, useRef, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType, SkillPublic } from '@skillomatic/shared';
import { cn } from '@/lib/utils';

interface AvailableTool {
  name: string;
  description: string;
}

interface MessageListProps {
  messages: ChatMessageType[];
  onRunSkill?: (skillSlug: string) => void;
  onShowInstructions?: (skillSlug: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onRefreshAction?: (action: string, params: Record<string, unknown>) => void;
  llmLabel?: string;
  isMobile?: boolean;
  skills?: SkillPublic[];
  tools?: AvailableTool[];
}

interface Suggestion {
  label: string;
  text: string;
  description: string;
}

/**
 * Generate dynamic suggestions based on available skills and tools
 */
function generateSuggestions(skills: SkillPublic[], tools: AvailableTool[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const toolNames = new Set(tools.map(t => t.name));

  // Always show "discover skills" as first suggestion
  suggestions.push({
    label: 'Getting Started',
    text: 'What can you help me with?',
    description: 'Discover available skills and tools',
  });

  // Add skill-based suggestions
  for (const skill of skills.slice(0, 3)) {
    if (skill.intent) {
      suggestions.push({
        label: skill.name,
        text: skill.intent,
        description: skill.description || '',
      });
    }
  }

  // Add tool-based suggestions if no skills
  if (suggestions.length < 3) {
    if (toolNames.has('google-sheets')) {
      suggestions.push({
        label: 'Google Sheets',
        text: 'List my recent spreadsheets',
        description: 'View your Google Sheets files',
      });
    }
    if (toolNames.has('search_emails') || toolNames.has('draft_email')) {
      suggestions.push({
        label: 'Email',
        text: 'Show my unread emails from today',
        description: 'Search through your inbox',
      });
    }
    if (toolNames.has('web_search')) {
      suggestions.push({
        label: 'Research',
        text: 'Search the web for the latest news on AI',
        description: 'Search the web for information',
      });
    }
  }

  // Limit to 3 suggestions
  return suggestions.slice(0, 3);
}

export function MessageList({
  messages,
  onRunSkill,
  onShowInstructions,
  onSuggestionClick,
  onRefreshAction,
  llmLabel,
  isMobile,
  skills = [],
  tools = [],
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on available skills and tools
  const suggestions = useMemo(
    () => generateSuggestions(skills, tools),
    [skills, tools]
  );

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
            {suggestions.map((suggestion, i) => (
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
