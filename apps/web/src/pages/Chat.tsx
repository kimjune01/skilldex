import { useState, useCallback, useMemo, useEffect } from 'react';
import { MessageList, ChatInput, ChatSidebar } from '@/components/chat';
import { skills } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Download, Menu, KeyRound, MessageSquare, ExternalLink, ChevronRight, Sparkles, CreditCard } from 'lucide-react';
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
import { PayIntentionDialog } from '@/components/PayIntentionDialog';
import { useClientChat } from '@/hooks/useClientChat';
import { ConversationProvider, useConversations } from '@/hooks/useConversations';
import { executeAction, formatActionResult, type ActionType } from '@/lib/action-executor';
import { useAuth } from '@/hooks/useAuth';
import { loadUserLLMConfig, toFullLLMConfig } from '@/lib/user-llm-config';
import type { LLMConfig } from '@/lib/llm-client';
import { getLLMConfig } from '@/lib/skills-client';

/**
 * Shared LLM config for free_beta users during beta period.
 * This allows beta users to use chat without providing their own API key.
 * Using Gemini 3 Flash (preview) - see https://ai.google.dev/gemini-api/docs/gemini-3
 */
const SHARED_BETA_LLM_CONFIG: LLMConfig = {
  provider: 'google',
  apiKey: 'AIzaSyCvZhvqH5FKdSFpx3NyLbZVy7PbmLksYCA',
  model: 'gemini-3-flash-preview',
};

function ChatContent() {
  const { user, organizationId, refreshUser } = useAuth();
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
  const [payIntentionOpen, setPayIntentionOpen] = useState(false);

  // Track whether org has LLM configured (separate from user config)
  const [hasOrgLLM, setHasOrgLLM] = useState<boolean | null>(null);

  // Check if user is on free_beta tier (gets shared LLM access)
  const isFreeBeta = user?.tier === 'free_beta';

  // User-provided LLM config (loaded from localStorage on mount)
  // For free_beta users, we use the shared config instead
  const [userLLMConfig, setUserLLMConfig] = useState<LLMConfig | null>(() => {
    const stored = loadUserLLMConfig();
    return stored ? toFullLLMConfig(stored) : null;
  });

  // Effective LLM config: free_beta users get shared config, others use their own
  const effectiveLLMConfig = isFreeBeta ? SHARED_BETA_LLM_CONFIG : userLLMConfig;

  // Check if org has LLM configured on mount
  useEffect(() => {
    getLLMConfig().then((orgConfig) => {
      setHasOrgLLM(!!orgConfig);
      // If org has LLM, user is free_beta, or user has their own config - we're good
      // Otherwise open sidebar to configure
      if (!orgConfig && !isFreeBeta && !userLLMConfig) {
        setSidebarOpen(true);
      }
    });
  }, [isFreeBeta, userLLMConfig]);

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
    userLLMConfig: effectiveLLMConfig,
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

  // Show setup UI for users without LLM access (no org LLM, not free_beta, no user config)
  if (!hasOrgLLM && !isFreeBeta && !userLLMConfig) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <h2 className="text-2xl font-bold text-center mb-2">Choose how to power your AI</h2>
          <p className="text-muted-foreground text-center mb-6">
            Web Chat needs an LLM to work. Pick an option below.
          </p>

          <div className="grid gap-4">
            {/* Option 1: Subscribe (recommended) */}
            <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary rounded-2xl p-6">
              <div className="absolute -top-3 left-4">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  Recommended
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Subscribe to Skillomatic</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    We handle everything. No API keys, no usage tracking, no surprise bills.
                    Just chat.
                  </p>
                  <Button
                    onClick={() => setPayIntentionOpen(true)}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 2: BYOK */}
            <div className="bg-muted/30 border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-xl">
                  <KeyRound className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Bring Your Own Key</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Use your own Anthropic, OpenAI, or Groq API key. You pay them directly.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSidebarOpen(true)}
                    className="w-full"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Configure API Key
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 3: Desktop Chat */}
            <div className="p-4 bg-muted/20 rounded-xl border border-dashed">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Or use Desktop Chat</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Claude Desktop and other apps work without web configuration.
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

        {/* Sidebar for API key configuration */}
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          hasOrgLLM={false}
          userLLMConfig={userLLMConfig}
          onUserLLMConfigChange={handleUserLLMConfigChange}
        />

        {/* Pay Intention Dialog for subscription */}
        <PayIntentionDialog
          open={payIntentionOpen}
          onClose={() => {
            setPayIntentionOpen(false);
            // Refresh user to get updated tier after pay intention confirmation
            refreshUser();
          }}
          triggerType="subscription"
          providerName="Skillomatic subscription"
        />
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
              {isFreeBeta ? (
                <>Beta access - powered by Gemini</>
              ) : userLLMConfig ? (
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
