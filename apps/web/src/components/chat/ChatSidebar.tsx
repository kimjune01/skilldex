/**
 * ChatSidebar - Unified right sidebar for conversations and tools/skills
 *
 * Features:
 * - "New Chat" button at top
 * - Conversations section (collapsible, expanded by default)
 * - Tools & Skills section (collapsible, collapsed by default)
 * - Delete confirmation dialog
 * - Rename functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  MessageSquare,
  Wrench,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  X,
  Lock,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConversations } from '@/hooks/useConversations';
import { skills } from '@/lib/api';
import { isSkillExecutable } from '@/lib/skills-client';
import type { SkillPublic } from '@skillomatic/shared';
import { type Conversation, downloadConversationAsMarkdown } from '@/lib/chat-storage';
import {
  loadUserLLMConfig,
  saveUserLLMConfig,
  clearUserLLMConfig,
  getAvailableModels,
  getDefaultModel,
  PROVIDER_LABELS,
  PROVIDER_API_KEY_URLS,
  DEFAULT_PROVIDER,
  type UserLLMConfig,
} from '@/lib/user-llm-config';
import type { LLMProvider, LLMConfig } from '@/lib/llm-client';
import { streamChat } from '@/lib/llm-client';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Whether org has LLM configured (if false, show API key setup) */
  hasOrgLLM?: boolean;
  /** Current user LLM config (if using BYOAK) */
  userLLMConfig?: LLMConfig | null;
  /** Callback when user configures their API key */
  onUserLLMConfigChange?: (config: LLMConfig | null) => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  hasOrgLLM = true,
  userLLMConfig,
  onUserLLMConfigChange,
}: ChatSidebarProps) {
  const {
    conversations,
    currentConversationId,
    currentConversation,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [skillsList, setSkillsList] = useState<SkillPublic[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'tools'>('skills');
  const [availableTools, setAvailableTools] = useState<Array<{ name: string; description: string }>>([]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // API Key settings state (for non-org users)
  const [apiKeyOpen, setApiKeyOpen] = useState(!hasOrgLLM && !userLLMConfig);
  const [apiKeyProvider, setApiKeyProvider] = useState<LLMProvider>(
    userLLMConfig?.provider || loadUserLLMConfig()?.provider || DEFAULT_PROVIDER
  );
  const [apiKeyValue, setApiKeyValue] = useState(
    userLLMConfig?.apiKey || loadUserLLMConfig()?.apiKey || ''
  );
  const [apiKeyModel, setApiKeyModel] = useState(
    userLLMConfig?.model || loadUserLLMConfig()?.model || getDefaultModel(DEFAULT_PROVIDER)
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValidating, setApiKeyValidating] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Load skills and tools on mount (for count display) and when section is opened
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (hasFetched) return;
    if (!isOpen && !toolsOpen) return; // Wait until sidebar is open

    setHasFetched(true);
    setSkillsLoading(true);

    // Fetch both skills list and config (for available tools) in parallel
    Promise.all([
      skills.list({ includeAccess: true }),
      skills.getConfig().catch(() => null),
    ])
        .then(([skillsData, config]) => {
          setSkillsList(skillsData);

          // Build available tools based on user's connected integrations
          const tools: Array<{ name: string; description: string }> = [
            // Always available
            { name: 'load_skill', description: 'Load and execute a skill' },
            { name: 'scrape_url', description: 'Extract content from a URL' },
            { name: 'web_search', description: 'Search the web for information' },
          ];

          if (config?.profile) {
            const p = config.profile;

            // Email tools
            if (p.hasEmail) {
              tools.push(
                { name: 'search_emails', description: 'Search your emails' },
                { name: 'draft_email', description: 'Draft an email' },
                { name: 'send_email', description: 'Send an email' }
              );
            }

            // ATS tools (only if connected to real ATS)
            if (p.hasATS && p.atsProvider) {
              tools.push(
                { name: 'search_candidates', description: `Search candidates in ${p.atsProvider}` },
                { name: 'get_candidate', description: 'Get candidate details' },
                { name: 'list_jobs', description: 'List open jobs' }
              );
            }

            // Google Workspace tools - show each connected service
            if (p.hasGoogleSheets) {
              tools.push({ name: 'google-sheets', description: 'Create, read, update spreadsheets' });
            }
            if (p.hasGoogleDrive) {
              tools.push({ name: 'google-drive', description: 'List, search, manage files' });
            }
            if (p.hasGoogleDocs) {
              tools.push({ name: 'google-docs', description: 'Create, read, update documents' });
            }
            if (p.hasGoogleForms) {
              tools.push({ name: 'google-forms', description: 'Create forms, get responses' });
            }
            if (p.hasGoogleContacts) {
              tools.push({ name: 'google-contacts', description: 'Search, manage contacts' });
            }
            if (p.hasGoogleTasks) {
              tools.push({ name: 'google-tasks', description: 'Manage task lists and tasks' });
            }
            if (p.hasCalendar) {
              tools.push({ name: 'calendar', description: 'View and manage calendar events' });
            }
          }

          setAvailableTools(tools);
        })
        .catch(() => {
          setSkillsList([]);
          setAvailableTools([
            { name: 'load_skill', description: 'Load and execute a skill' },
            { name: 'scrape_url', description: 'Extract content from a URL' },
            { name: 'web_search', description: 'Search the web for information' },
          ]);
        })
        .finally(() => setSkillsLoading(false));
  }, [isOpen, toolsOpen, hasFetched]);

  // Handle provider change
  const handleApiKeyProviderChange = useCallback((newProvider: LLMProvider) => {
    setApiKeyProvider(newProvider);
    setApiKeyModel(getDefaultModel(newProvider));
    setApiKeyError(null);
  }, []);

  // Validate and save API key
  const handleApiKeySave = useCallback(async () => {
    if (!apiKeyValue.trim()) {
      setApiKeyError('Please enter an API key');
      return;
    }

    setApiKeyValidating(true);
    setApiKeyError(null);

    const config: LLMConfig = {
      provider: apiKeyProvider,
      apiKey: apiKeyValue.trim(),
      model: apiKeyModel,
    };

    // Validate by making a test request
    try {
      const testMessages = [
        { role: 'user' as const, content: 'Say "OK" in exactly one word.' },
      ];

      let validated = false;
      let errorMessage: string | null = null;

      await new Promise<void>((resolve) => {
        streamChat(config, testMessages, {
          onToken: () => {
            validated = true;
          },
          onComplete: () => {
            validated = true;
            resolve();
          },
          onError: (err) => {
            errorMessage = err.message;
            resolve();
          },
        });
      });

      if (!validated || errorMessage) {
        setApiKeyError(errorMessage || 'Failed to validate API key');
        setApiKeyValidating(false);
        return;
      }

      // Save configuration
      const userConfig: UserLLMConfig = {
        provider: apiKeyProvider,
        apiKey: apiKeyValue.trim(),
        model: apiKeyModel,
      };
      saveUserLLMConfig(userConfig);
      onUserLLMConfigChange?.(config);
      setApiKeyOpen(false);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setApiKeyValidating(false);
    }
  }, [apiKeyProvider, apiKeyValue, apiKeyModel, onUserLLMConfigChange]);

  // Clear API key
  const handleApiKeyClear = useCallback(() => {
    clearUserLLMConfig();
    setApiKeyValue('');
    setApiKeyProvider(DEFAULT_PROVIDER);
    setApiKeyModel(getDefaultModel(DEFAULT_PROVIDER));
    onUserLLMConfigChange?.(null);
    setApiKeyOpen(true);
  }, [onUserLLMConfigChange]);

  const handleNewChat = async () => {
    // If current chat is empty, just close the sidebar
    if (currentConversation?.messageCount === 0) {
      onClose();
      return;
    }
    await createConversation();
  };

  const handleConversationClick = (id: string) => {
    if (renamingId === id) return; // Don't switch while renaming
    switchConversation(id);
  };

  const handleDeleteClick = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    // Skip confirmation for empty chats
    if (conv.messageCount === 0) {
      await deleteConversation(conv.id);
      return;
    }
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (conversationToDelete) {
      await deleteConversation(conversationToDelete.id);
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleRenameClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const handleRenameSubmit = async (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      await renameConversation(id, trimmed);
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleExportClick = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadConversationAsMarkdown(conv.id);
    } catch (err) {
      console.error('Failed to export conversation:', err);
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-72 bg-background border-l shadow-lg z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Your Chats</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-2">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Conversations Section */}
          <Collapsible open={conversationsOpen} onOpenChange={setConversationsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                {conversationsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <MessageSquare className="h-4 w-4" />
                Conversations
                <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  {conversations.length}
                </span>
              </button>
            </CollapsibleTrigger>
            {!conversationsOpen && (
              <p className="px-4 pb-2 text-xs text-muted-foreground">
                Stored locally in this browser only
              </p>
            )}
            <CollapsibleContent>
              <div className="px-2 pb-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                    No conversations yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleConversationClick(conv.id)}
                        className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                          currentConversationId === conv.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {renamingId === conv.id ? (
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                            onBlur={() => handleRenameSubmit(conv.id)}
                            autoFocus
                            className="h-6 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{conv.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(conv.updatedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleExportClick(conv, e)}
                                title="Export as Markdown"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleRenameClick(conv, e)}
                                title="Rename"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => handleDeleteClick(conv, e)}
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tools & Skills Section */}
          <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t">
                {toolsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Wrench className="h-4 w-4" />
                Tools & Skills
                <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  {availableTools.length + skillsList.length}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 pb-2">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-md mb-2">
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      activeTab === 'skills'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Skills ({skillsList.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      activeTab === 'tools'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tools ({availableTools.length})
                  </button>
                </div>

                {/* Content */}
                {activeTab === 'skills' ? (
                  skillsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : skillsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No skills available
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {skillsList.map((skill) => {
                        const executable = isSkillExecutable(skill);
                        const isLimited = skill.accessInfo?.status === 'limited';

                        return (
                          <a
                            key={skill.slug}
                            href={`/skills/${skill.slug}`}
                            className={`block p-2 rounded-md transition-colors ${
                              executable ? 'hover:bg-muted' : 'opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-medium truncate">{skill.name}</p>
                              {isLimited && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  <Lock className="h-2.5 w-2.5 mr-0.5" />
                                  Limited
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {skill.description}
                            </p>
                          </a>
                        );
                      })}
                    </div>
                  )
                ) : skillsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : availableTools.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tools available. Connect integrations to unlock more.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableTools.map((tool, idx) => (
                      <div key={`${tool.name}-${idx}`} className="p-2 rounded-md">
                        <p className="text-xs font-medium font-mono">{tool.name}</p>
                        <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* API Key Settings Section (only for non-org users) */}
          {!hasOrgLLM && (
            <Collapsible open={apiKeyOpen} onOpenChange={setApiKeyOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t">
                  {apiKeyOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <KeyRound className="h-4 w-4" />
                  API Key
                  {userLLMConfig && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {userLLMConfig.provider}
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3">
                  {/* Provider Selection */}
                  <div className="space-y-1">
                    <Label className="text-xs">Provider</Label>
                    <Select
                      value={apiKeyProvider}
                      onValueChange={(v) => handleApiKeyProviderChange(v as LLMProvider)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(PROVIDER_LABELS) as [LLMProvider, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">API Key</Label>
                      <a
                        href={PROVIDER_API_KEY_URLS[apiKeyProvider]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Get key
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyValue}
                        onChange={(e) => {
                          setApiKeyValue(e.target.value);
                          setApiKeyError(null);
                        }}
                        placeholder="Enter API key..."
                        className="h-8 text-xs pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Select value={apiKeyModel} onValueChange={setApiKeyModel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableModels(apiKeyProvider).map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Error Message */}
                  {apiKeyError && (
                    <p className="text-[10px] text-destructive bg-destructive/10 rounded p-2">
                      {apiKeyError}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={handleApiKeySave}
                      disabled={apiKeyValidating || !apiKeyValue.trim()}
                    >
                      {apiKeyValidating ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Validating
                        </>
                      ) : userLLMConfig ? (
                        'Update'
                      ) : (
                        'Save'
                      )}
                    </Button>
                    {userLLMConfig && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleApiKeyClear}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Info text */}
                  <p className="text-[10px] text-muted-foreground">
                    Your key is stored locally and never sent to our servers.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{conversationToDelete?.title}" and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
