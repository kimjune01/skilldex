import { useState, useCallback, useMemo, useEffect } from 'react';
import { MessageList, ChatInput, ChatSidebar } from '@/components/chat';
import { skills } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Download, Menu, KeyRound, MessageSquare } from 'lucide-react';
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
import { loadUserLLMConfig, toFullLLMConfig } from '@/lib/user-llm-config';
import type { LLMConfig } from '@/lib/llm-client';
import { getLLMConfig } from '@/lib/skills-client';

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

  // Track whether org has LLM configured (separate from user config)
  const [hasOrgLLM, setHasOrgLLM] = useState<boolean | null>(null);

  // User-provided LLM config (loaded from localStorage on mount)
  const [userLLMConfig, setUserLLMConfig] = useState<LLMConfig | null>(() => {
    const stored = loadUserLLMConfig();
    return stored ? toFullLLMConfig(stored) : null;
  });

  // Check if org has LLM configured on mount
  useEffect(() => {
    getLLMConfig().then((orgConfig) => {
      setHasOrgLLM(!!orgConfig);
      // If org has LLM and user doesn't have their own, we're good
      // If org doesn't have LLM and user doesn't have their own, open sidebar
      if (!orgConfig && !userLLMConfig) {
        setSidebarOpen(true);
      }
    });
  }, []);

  // Handle user LLM config change from sidebar
  const handleUserLLMConfigChange = useCallback((config: LLMConfig | null) => {
    setUserLLMConfig(config);
    // Close sidebar after saving config
    if (config) {
      setSidebarOpen(false);
    }
  }, []);

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
    userLLMConfig,
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

  // Show loading while checking org LLM status
  if (isLoading || hasOrgLLM === null) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }

  // Determine if chat is usable (has org or user LLM config)
  const canChat = !!llmConfig;

  return (
    <div className={cn(
      "flex flex-col",
      isMobile ? "fixed inset-0 z-30 bg-background" : "h-[calc(100vh-2rem)]"
    )}>
      {/* Header - minimal floating on mobile, full on desktop */}
      {isMobile ? (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 pt-safe bg-gradient-to-b from-background via-background/90 to-transparent">
          <button
            className="p-2 rounded-lg bg-background border shadow-md"
            onClick={openLayoutMenu}
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium truncate flex-1 text-center px-2">
            {currentConversation?.title || 'New Chat'}
          </span>
          <button
            className="p-2 rounded-lg bg-background border shadow-md"
            onClick={() => setSidebarOpen(true)}
            title="Chat history"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">
              {currentConversation?.title || 'New Chat'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userLLMConfig ? (
                <>Using your {llmConfig?.provider} API key.</>
              ) : (
                <>For a better experience, try <a href="/desktop-chat" className="text-primary hover:underline">Desktop Chat</a>.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {userLLMConfig && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                title="API key settings"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
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
              <MessageSquare className="h-4 w-4" />
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
      {canChat ? (
        <ChatInput onSend={send} disabled={isStreaming || isLoadingMessages} sidebarOpen={sidebarOpen} isMobile={isMobile} />
      ) : (
        <div className="px-4 py-3 border-t">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setSidebarOpen(true)}
          >
            <KeyRound className="h-4 w-4" />
            Configure API Key to Start Chatting
          </Button>
        </div>
      )}

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

      {/* Chat Sidebar (conversations + tools/skills + API key settings) */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hasOrgLLM={hasOrgLLM ?? true}
        userLLMConfig={userLLMConfig}
        onUserLLMConfigChange={handleUserLLMConfigChange}
      />
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
