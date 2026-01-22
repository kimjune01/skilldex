import { useState, useCallback, useEffect, useMemo } from 'react';
import { MessageList, ChatInput } from '@/components/chat';
import { skills } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Download, Wrench, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SkillPublic } from '@skillomatic/shared';
import { useClientChat } from '@/hooks/useClientChat';
import { executeAction, formatActionResult, type ActionType } from '@/lib/action-executor';
import { useAuth } from '@/hooks/useAuth';

export default function Chat() {
  const { user, organizationId } = useAuth();

  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    skill: SkillPublic | null;
    instructions: string;
  }>({ open: false, skill: null, instructions: '' });
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

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
        <p className="mt-4 text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }

  // Show setup message if no LLM configured
  if (!llmConfig) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">LLM Not Configured</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Chat requires an LLM API key. Please configure your organization's LLM settings in the
          admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Ask about recruiting tasks and discover skills
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
            onClick={() => setToolsPanelOpen(true)}
            title="View tools & skills"
          >
            <Wrench className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadChat}
            disabled={messages.length === 0}
            title="Download chat"
          >
            <Download className="h-4 w-4" />
          </Button>
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
            <DialogTitle>{instructionsDialog.skill?.name} - Instructions</DialogTitle>
            <DialogDescription>Follow these instructions to complete the task</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {instructionsDialog.instructions}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tools & Skills Panel */}
      <ToolsSkillsPanel open={toolsPanelOpen} onOpenChange={setToolsPanelOpen} />
    </div>
  );
}

/**
 * Tools & Skills Panel - shows available capabilities
 */
function ToolsSkillsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [skillsList, setSkillsList] = useState<SkillPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'skills' | 'tools'>('skills');

  useEffect(() => {
    if (open) {
      setLoading(true);
      skills
        .list()
        .then((data) => setSkillsList(data))
        .catch(() => setSkillsList([]))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const actions = [
    { name: 'search_candidates', description: 'Search ATS for candidates' },
    { name: 'get_candidate', description: 'Get candidate details' },
    { name: 'create_candidate', description: 'Create a new candidate' },
    { name: 'update_candidate', description: 'Update candidate info' },
    { name: 'list_jobs', description: 'List open jobs' },
    { name: 'get_job', description: 'Get job details' },
    { name: 'update_application_stage', description: 'Move candidate through pipeline' },
    { name: 'scrape_url', description: 'Scrape content from a URL' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Available Capabilities</DialogTitle>
          <DialogDescription>Tools and skills the assistant can use</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === 'skills' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('skills')}
          >
            Skills ({skillsList.length})
          </Button>
          <Button
            variant={tab === 'tools' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('tools')}
          >
            Tools ({actions.length})
          </Button>
        </div>
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {tab === 'skills' ? (
            loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : skillsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No skills available</p>
            ) : (
              <div className="space-y-1">
                {skillsList.map((skill) => (
                  <a
                    key={skill.slug}
                    href={`/skills/${skill.slug}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{skill.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-1">
              {actions.map((action) => (
                <div key={action.name} className="p-2 rounded-md">
                  <p className="text-sm font-medium font-mono">{action.name}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
