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

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Load skills when tools section is opened
  useEffect(() => {
    if (toolsOpen && skillsList.length === 0) {
      setSkillsLoading(true);
      skills
        .list({ includeAccess: true })
        .then((data) => setSkillsList(data))
        .catch(() => setSkillsList([]))
        .finally(() => setSkillsLoading(false));
    }
  }, [toolsOpen, skillsList.length]);

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
                  {actions.length + skillsList.length}
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
                    Tools ({actions.length})
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
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {actions.map((action) => (
                      <div key={action.name} className="p-2 rounded-md">
                        <p className="text-xs font-medium font-mono">{action.name}</p>
                        <p className="text-[10px] text-muted-foreground">{action.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
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
