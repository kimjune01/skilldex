/**
 * Chat Storage - IndexedDB-based persistence for chat conversations
 *
 * Provides:
 * - Multiple conversation support
 * - Message persistence
 * - Conversation CRUD operations
 *
 * No auto-cleanup - messages persist until user manually deletes.
 * Storage is shared across all users in the browser (no per-user isolation).
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import type { ChatMessage } from '@skillomatic/shared';

const DB_NAME = 'skillomatic-chat';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

// Conversation type
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// Message with conversation reference
export interface StoredMessage extends ChatMessage {
  conversationId: string;
}

// Database instance
let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initChatStorage(): Promise<void> {
  if (db) return;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open chat storage database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create conversations store
      if (!database.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const convStore = database.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        convStore.createIndex('by-updated', 'updatedAt', { unique: false });
      }

      // Create messages store
      if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
        const msgStore = database.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        msgStore.createIndex('by-conversation', 'conversationId', { unique: false });
      }
    };
  });
}

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a title from the first message content
 */
export function generateTitleFromMessage(content: string): string {
  const maxLength = 50;
  // Remove any markdown formatting or special characters
  const cleaned = content.replace(/[#*`_~\[\]]/g, '').trim();

  if (cleaned.length <= maxLength) {
    return cleaned || 'New Chat';
  }

  // Trim to last complete word
  let title = cleaned.slice(0, maxLength);
  const lastSpace = title.lastIndexOf(' ');
  if (lastSpace > 20) {
    title = title.slice(0, lastSpace);
  }

  return title + '...';
}

/**
 * Create a new conversation
 */
export async function createConversation(title?: string): Promise<Conversation> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  const now = Date.now();
  const conversation: Conversation = {
    id: generateConversationId(),
    title: title || 'New Chat',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.add(conversation);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(conversation);
  });
}

/**
 * Get a conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  await initChatStorage();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readonly');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * List all conversations, sorted by updatedAt descending
 */
export async function listConversations(): Promise<Conversation[]> {
  await initChatStorage();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readonly');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const index = store.index('by-updated');
    const request = index.openCursor(null, 'prev'); // descending order

    const conversations: Conversation[] = [];

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        conversations.push(cursor.value as Conversation);
        cursor.continue();
      } else {
        resolve(conversations);
      }
    };
  });
}

/**
 * Update a conversation's title
 */
export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  const conversation = await getConversation(id);
  if (!conversation) throw new Error(`Conversation not found: ${id}`);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.put({ ...conversation, title });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Update a conversation's updatedAt timestamp and message count
 */
async function updateConversationMeta(id: string, messageCount: number): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  const conversation = await getConversation(id);
  if (!conversation) throw new Error(`Conversation not found: ${id}`);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.put({
      ...conversation,
      updatedAt: Date.now(),
      messageCount,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(id: string): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  // First delete all messages for this conversation
  await clearConversationMessages(id);

  // Then delete the conversation itself
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(CONVERSATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  await initChatStorage();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(MESSAGES_STORE, 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by-conversation');
    const request = index.getAll(conversationId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const messages = (request.result as StoredMessage[])
        // Sort by timestamp ascending
        .sort((a, b) => a.timestamp - b.timestamp)
        // Remove conversationId from returned messages (not needed by ChatMessage type)
        .map(({ conversationId: _, ...msg }) => msg as ChatMessage);
      resolve(messages);
    };
  });
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId: string, message: ChatMessage): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  const storedMessage: StoredMessage = {
    ...message,
    conversationId,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(MESSAGES_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    const request = store.put(storedMessage);

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      // Update conversation metadata
      try {
        const messages = await getMessages(conversationId);
        await updateConversationMeta(conversationId, messages.length);
        resolve();
      } catch (err) {
        // Message was added, but metadata update failed - not critical
        console.error('Failed to update conversation metadata:', err);
        resolve();
      }
    };
  });
}

/**
 * Update an existing message (e.g., for streaming updates or action results)
 */
export async function updateMessage(conversationId: string, message: ChatMessage): Promise<void> {
  return addMessage(conversationId, message); // put() will update if key exists
}

/**
 * Clear all messages for a conversation (but keep the conversation)
 */
export async function clearConversationMessages(conversationId: string): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(MESSAGES_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by-conversation');
    const request = index.openCursor(IDBKeyRange.only(conversationId));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // All messages deleted, update conversation meta
        updateConversationMeta(conversationId, 0)
          .then(resolve)
          .catch(() => resolve()); // Not critical if meta update fails
      }
    };
  });
}

/**
 * Clear all chat data (conversations and messages)
 */
export async function clearAllChatData(): Promise<void> {
  await initChatStorage();
  if (!db) throw new Error('Chat storage not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([CONVERSATIONS_STORE, MESSAGES_STORE], 'readwrite');

    const convClear = transaction.objectStore(CONVERSATIONS_STORE).clear();
    const msgClear = transaction.objectStore(MESSAGES_STORE).clear();

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    convClear.onerror = () => reject(convClear.error);
    msgClear.onerror = () => reject(msgClear.error);
  });
}

/**
 * Export a conversation as LLM-friendly markdown
 *
 * Format:
 * - YAML frontmatter with metadata
 * - Messages in clear role-based format
 * - Action results and tool outputs preserved
 * - Deterministic output (no LLM calls)
 */
export async function exportConversationAsMarkdown(conversationId: string): Promise<string> {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

  const messages = await getMessages(conversationId);

  const lines: string[] = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`title: "${escapeYamlString(conversation.title)}"`);
  lines.push(`id: ${conversation.id}`);
  lines.push(`created: ${formatISODate(conversation.createdAt)}`);
  lines.push(`updated: ${formatISODate(conversation.updatedAt)}`);
  lines.push(`message_count: ${messages.length}`);
  lines.push('---');
  lines.push('');

  // Messages
  for (const message of messages) {
    // Skip tool result messages (they're shown with the action that triggered them)
    if (message.isToolResult) continue;

    const role = message.role === 'user' ? 'User' : 'Assistant';
    const timestamp = formatISODate(message.timestamp);

    lines.push(`## ${role}`);
    lines.push(`<!-- ${timestamp} -->`);
    lines.push('');
    lines.push(message.content);
    lines.push('');

    // Include action results if present
    if (message.actionResult) {
      lines.push('### Action Result');
      lines.push(`**Action:** \`${message.actionResult.action}\``);
      lines.push('');
      lines.push('```');
      lines.push(typeof message.actionResult.result === 'string'
        ? message.actionResult.result
        : JSON.stringify(message.actionResult.result, null, 2));
      lines.push('```');
      lines.push('');
    }

    // Include skill suggestion if present
    if (message.skillSuggestion) {
      lines.push('### Skill Suggestion');
      lines.push(`**Skill:** ${message.skillSuggestion.skill?.name || 'Unknown'}`);
      lines.push(`**Execution Type:** ${message.skillSuggestion.executionType}`);
      if (message.skillSuggestion.status) {
        lines.push(`**Status:** ${message.skillSuggestion.status}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Escape special characters for YAML string
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Format timestamp as ISO 8601 date string
 */
function formatISODate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Download a conversation as a markdown file
 */
export async function downloadConversationAsMarkdown(conversationId: string): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);

  const markdown = await exportConversationAsMarkdown(conversationId);

  // Create filename from title (sanitized)
  const safeTitle = conversation.title
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
    .toLowerCase();
  const date = new Date(conversation.createdAt).toISOString().slice(0, 10);
  const filename = `chat-${safeTitle}-${date}.md`;

  // Download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
