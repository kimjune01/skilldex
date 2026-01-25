import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  sidebarOpen?: boolean;
  isMobile?: boolean;
}

export function ChatInput({ onSend, disabled, placeholder = 'Ask about skills or recruiting tasks...', sidebarOpen, isMobile }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "flex items-end gap-2 p-4 border-t bg-background transition-[margin] duration-200",
      !isMobile && sidebarOpen && "mr-72",
      isMobile && [
        "fixed bottom-0 left-0 right-0 z-20",
        "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "border-t-0 bg-gradient-to-t from-background via-background to-background/95",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      ]
    )}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden",
          isMobile && "text-base px-4 py-3 rounded-xl"
        )}
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className={cn("shrink-0", isMobile && "h-12 w-12 rounded-xl")}
      >
        <Send className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
      </Button>
    </div>
  );
}
