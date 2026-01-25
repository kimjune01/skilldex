import { useState, useCallback, useMemo } from 'react';
import { MessageList, ChatInput, ChatSidebar } from '@/components/chat';
import { skills } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Download, Menu, ChevronRight, KeyRound, Settings, ExternalLink, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
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
import { ConversationProvider, useConversations } from '@/hooks/useConversations';
import { executeAction, formatActionResult, type ActionType } from '@/lib/action-executor';
import { useAuth } from '@/hooks/useAuth';

function ChatContent() {
  const { user, organizationId } = useAuth();
  const {
    currentConversationId,
    currentConversation,
    switchConversation,
    refreshConversations,
  } = useConversations();
  const isMobile = useIsMobile();

  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    skill: SkillPublic | null;
    instructions: string;
  }>({ open: false, skill: null, instructions: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open the layout's mobile menu via custom event
  const openLayoutMenu = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-mobile-menu'));
  }, []);

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

  // Handle conversation created callback
  const handleConversationCreated = useCallback((newConversationId: string) => {
    switchConversation(newConversationId);
    refreshConversations();
  }, [switchConversation, refreshConversations]);

  const {
    messages,
    isStreaming,
    isLoading,
    isLoadingMessages,
    error,
    llmConfig,
    send,
    clearError,
  } = useClientChat({
    onActionRequest: handleActionRequest,
    userContext,
    conversationId: currentConversationId,
    onConversationCreated: handleConversationCreated,
    onConversationsChanged: refreshConversations,
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

  // Handler for clearing cached scrape results
  const handleRefreshAction = useCallback(async (_action: string, params: Record<string, unknown>) => {
    if (params.action === 'delete' && params.url) {
      const API_BASE = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/scrape/cache?url=${encodeURIComponent(params.url as string)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache: ${response.status}`);
      }
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
    const isAdmin = user?.isAdmin || false;

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Main alert card */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <KeyRound className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">LLM API Key Required</h2>
            <p className="text-amber-700 mb-6">
              Web Chat needs an LLM API key (Anthropic, OpenAI, or Groq) to work.
              {isAdmin
                ? " You can configure this in the admin settings."
                : " Please ask your organization admin to set this up."}
            </p>

            {isAdmin ? (
              <a
                href="/admin/settings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configure LLM Settings
              </a>
            ) : (
              <div className="text-sm text-amber-600 bg-amber-100 rounded-lg p-3">
                Contact your admin to add an LLM API key in Admin Settings
              </div>
            )}
          </div>

          {/* Alternative: Desktop Chat */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ExternalLink className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Alternative: Use Desktop Chat</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Desktop apps like Claude Desktop use your own API keys and don't require org configuration.
                </p>
                <a
                  href="/desktop-chat"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  Set up Desktop Chat
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col",
      isMobile ? "fixed inset-0 z-30 bg-background" : "h-[calc(100vh-2rem)]"
    )}>
      {/* Header - minimal floating on mobile, full on desktop */}
      {isMobile ? (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 pt-safe bg-gradient-to-b from-background via-background/90 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={openLayoutMenu}
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium truncate flex-1 text-center px-2">
            {currentConversation?.title || 'New Chat'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setSidebarOpen(true)}
            title="Chat history"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">
              {currentConversation?.title || 'New Chat'}
            </h1>
            <p className="text-sm text-muted-foreground">
              For a better experience, try <a href="/desktop-chat" className="text-primary hover:underline">Desktop Chat</a>.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadChat}
              disabled={messages.length === 0}
              title="Download chat"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              title="Chat history & tools"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className={cn("px-4 pt-4", isMobile && "pt-16")}>
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
      {isLoadingMessages ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <MessageList
          messages={messages}
          onRunSkill={handleRunSkill}
          onShowInstructions={handleShowInstructions}
          onSuggestionClick={send}
          onRefreshAction={handleRefreshAction}
          llmLabel={llmConfig ? `${llmConfig.provider}/${llmConfig.model}` : undefined}
          isMobile={isMobile}
        />
      )}

      {/* Input */}
      <ChatInput onSend={send} disabled={isStreaming || isLoadingMessages} sidebarOpen={sidebarOpen} isMobile={isMobile} />

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

      {/* Chat Sidebar (conversations + tools/skills) */}
      <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default function Chat() {
  return (
    <ConversationProvider>
      <ChatContent />
    </ConversationProvider>
  );
}
