/**
 * Conversation Context - Manages chat conversation state
 *
 * Provides:
 * - List of all conversations
 * - Current active conversation
 * - CRUD operations for conversations
 * - Persistence via IndexedDB
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type Conversation,
  listConversations,
  createConversation as createConv,
  deleteConversation as deleteConv,
  updateConversationTitle,
  initChatStorage,
} from '@/lib/chat-storage';

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isLoading: boolean;

  // Actions
  createConversation: () => Promise<string>;
  switchConversation: (id: string | null) => void;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        await initChatStorage();
        const convs = await listConversations();
        setConversations(convs);

        // If there are conversations, select the most recent one
        if (convs.length > 0) {
          setCurrentConversationId(convs[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, []);

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;

  const refreshConversations = useCallback(async () => {
    try {
      const convs = await listConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
    }
  }, []);

  const createConversation = useCallback(async (): Promise<string> => {
    const conv = await createConv();
    setConversations((prev) => [conv, ...prev]);
    setCurrentConversationId(conv.id);
    return conv.id;
  }, []);

  const switchConversation = useCallback((id: string | null) => {
    setCurrentConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await deleteConv(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));

    // If we deleted the current conversation, switch to another
    if (currentConversationId === id) {
      setCurrentConversationId(() => {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      });
    }
  }, [currentConversationId, conversations]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    await updateConversationTitle(id, title);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        isLoading,
        createConversation,
        switchConversation,
        deleteConversation,
        renameConversation,
        refreshConversations,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations(): ConversationContextType {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
}
