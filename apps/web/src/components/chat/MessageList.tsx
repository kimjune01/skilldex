import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@skilldex/shared';

interface MessageListProps {
  messages: ChatMessageType[];
  onRunSkill?: (skillSlug: string) => void;
  onShowInstructions?: (skillSlug: string) => void;
}

export function MessageList({ messages, onRunSkill, onShowInstructions }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Welcome to Skilldex Chat</p>
          <p className="text-sm">Ask me about recruiting tasks or available skills</p>
          <div className="text-xs space-y-1 mt-4">
            <p>Try asking:</p>
            <p className="text-primary">"Find backend engineers"</p>
            <p className="text-primary">"Add a new candidate to the ATS"</p>
            <p className="text-primary">"What skills are available?"</p>
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
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
