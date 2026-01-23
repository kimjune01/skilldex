import { User, Bot, Mail, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { SkillCard, ActionResultCard } from './SkillCard';
import type { ChatMessage as ChatMessageType } from '@skillomatic/shared';

interface ChatMessageProps {
  message: ChatMessageType;
  onRunSkill?: (skillSlug: string) => void;
  onShowInstructions?: (skillSlug: string) => void;
  onRefreshAction?: (action: string, params: Record<string, unknown>) => void;
}

export function ChatMessage({ message, onRunSkill, onShowInstructions, onRefreshAction }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Clean up skill suggestion markers and action blocks from content
  const cleanContent = message.content
    .replace(/\[SKILL_SUGGEST:[a-z0-9-]+\]/g, '')
    .replace(/```action\n[\s\S]*?\n```/g, '')
    .trim();

  return (
    <div
      className={cn(
        'flex gap-3 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 space-y-2', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {isUser ? (
            // User messages: plain text with line breaks
            cleanContent.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))
          ) : (
            // Assistant messages: render markdown
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <pre className="bg-background/50 rounded p-2 my-2 overflow-x-auto">
                      <code className="text-xs">{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-background/50 rounded px-1 py-0.5 text-xs">{children}</code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                a: ({ href, children }) => {
                  const isMailto = href?.startsWith('mailto:');
                  return isMailto ? (
                    <a
                      href={href}
                      className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
                    >
                      <Mail className="h-3 w-3 shrink-0" />
                      {children}
                    </a>
                  ) : (
                    <a
                      href={href}
                      className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  );
                },
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-2 italic my-2">{children}</blockquote>
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          )}
        </div>

        {/* Skill suggestion card */}
        {message.skillSuggestion && (
          <div className="w-full pr-2">
            <div>
              <SkillCard
                skill={message.skillSuggestion.skill}
                executionType={message.skillSuggestion.executionType}
                status={message.skillSuggestion.status}
                result={message.skillSuggestion.result}
                onRun={
                  message.skillSuggestion.executionType === 'api' && onRunSkill
                    ? () => onRunSkill(message.skillSuggestion!.skill.slug)
                    : undefined
                }
                onShowInstructions={
                  message.skillSuggestion.executionType === 'claude-desktop' && onShowInstructions
                    ? () => onShowInstructions(message.skillSuggestion!.skill.slug)
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {/* Action result card */}
        {message.actionResult && (
          <div className="w-full pr-2">
            <div>
              <ActionResultCard
                action={message.actionResult.action}
                result={message.actionResult.result}
                onRefresh={onRefreshAction}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
