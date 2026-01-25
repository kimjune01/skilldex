/**
 * Tests for chat-storage.ts
 *
 * Tests IndexedDB-based conversation and message persistence,
 * including round-trip storage and markdown export.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import type { ChatMessage } from '@skillomatic/shared';
import {
  initChatStorage,
  createConversation,
  getConversation,
  listConversations,
  updateConversationTitle,
  deleteConversation,
  getMessages,
  addMessage,
  clearConversationMessages,
  clearAllChatData,
  exportConversationAsMarkdown,
  generateTitleFromMessage,
} from '../lib/chat-storage';

// Reset IndexedDB between tests
beforeEach(async () => {
  // Delete all databases
  const databases = await indexedDB.databases();
  for (const db of databases) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name);
    }
  }
});

afterEach(async () => {
  await clearAllChatData().catch(() => {});
});

describe('chat-storage', () => {
  describe('conversation CRUD', () => {
    it('should create a conversation with default title', async () => {
      const conv = await createConversation();

      expect(conv.id).toMatch(/^conv-\d+-[a-z0-9]+$/);
      expect(conv.title).toBe('New Chat');
      expect(conv.messageCount).toBe(0);
      expect(conv.createdAt).toBeGreaterThan(0);
      expect(conv.updatedAt).toBeGreaterThan(0);
    });

    it('should create a conversation with custom title', async () => {
      const conv = await createConversation('My Custom Chat');

      expect(conv.title).toBe('My Custom Chat');
    });

    it('should get a conversation by id', async () => {
      const created = await createConversation('Test Conv');
      const retrieved = await getConversation(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Conv');
    });

    it('should return null for non-existent conversation', async () => {
      await initChatStorage();
      const result = await getConversation('non-existent-id');

      expect(result).toBeNull();
    });

    it('should list conversations sorted by updatedAt descending', async () => {
      const conv1 = await createConversation('First');
      await new Promise((r) => setTimeout(r, 10)); // Small delay
      const conv2 = await createConversation('Second');
      await new Promise((r) => setTimeout(r, 10));
      const conv3 = await createConversation('Third');

      const list = await listConversations();

      expect(list).toHaveLength(3);
      expect(list[0].id).toBe(conv3.id); // Most recent first
      expect(list[1].id).toBe(conv2.id);
      expect(list[2].id).toBe(conv1.id);
    });

    it('should update conversation title', async () => {
      const conv = await createConversation('Original');
      await updateConversationTitle(conv.id, 'Updated Title');

      const updated = await getConversation(conv.id);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should delete conversation and its messages', async () => {
      const conv = await createConversation('To Delete');
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };
      await addMessage(conv.id, message);

      await deleteConversation(conv.id);

      const deleted = await getConversation(conv.id);
      expect(deleted).toBeNull();

      // Messages should also be deleted
      const messages = await getMessages(conv.id);
      expect(messages).toHaveLength(0);
    });
  });

  describe('message CRUD', () => {
    it('should add and retrieve messages', async () => {
      const conv = await createConversation();
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, world!',
        timestamp: Date.now(),
      };

      await addMessage(conv.id, message);
      const messages = await getMessages(conv.id);

      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('msg-1');
      expect(messages[0].content).toBe('Hello, world!');
      expect(messages[0].role).toBe('user');
    });

    it('should preserve message order by timestamp', async () => {
      const conv = await createConversation();
      const now = Date.now();

      const msg1: ChatMessage = { id: 'msg-1', role: 'user', content: 'First', timestamp: now };
      const msg2: ChatMessage = { id: 'msg-2', role: 'assistant', content: 'Second', timestamp: now + 100 };
      const msg3: ChatMessage = { id: 'msg-3', role: 'user', content: 'Third', timestamp: now + 200 };

      // Add in different order
      await addMessage(conv.id, msg2);
      await addMessage(conv.id, msg1);
      await addMessage(conv.id, msg3);

      const messages = await getMessages(conv.id);

      expect(messages).toHaveLength(3);
      expect(messages[0].id).toBe('msg-1');
      expect(messages[1].id).toBe('msg-2');
      expect(messages[2].id).toBe('msg-3');
    });

    it('should round-trip complex message data', async () => {
      const conv = await createConversation();
      const message: ChatMessage = {
        id: 'msg-complex',
        role: 'assistant',
        content: 'Here are the search results',
        timestamp: Date.now(),
        actionResult: {
          action: 'search_candidates',
          result: JSON.stringify([{ id: 1, name: 'John Doe' }]),
        },
        skillSuggestion: {
          skill: { slug: 'candidate-sourcing', name: 'Candidate Sourcing' } as any,
          executionType: 'api',
          status: 'completed',
        },
        isToolResult: false,
      };

      await addMessage(conv.id, message);
      const messages = await getMessages(conv.id);

      expect(messages).toHaveLength(1);
      expect(messages[0].actionResult).toEqual(message.actionResult);
      expect(messages[0].skillSuggestion).toEqual(message.skillSuggestion);
      expect(messages[0].isToolResult).toBe(false);
    });

    it('should clear conversation messages', async () => {
      const conv = await createConversation();
      await addMessage(conv.id, { id: 'm1', role: 'user', content: 'Hi', timestamp: Date.now() });
      await addMessage(conv.id, { id: 'm2', role: 'assistant', content: 'Hello', timestamp: Date.now() });

      await clearConversationMessages(conv.id);

      const messages = await getMessages(conv.id);
      expect(messages).toHaveLength(0);

      // Conversation should still exist
      const convAfter = await getConversation(conv.id);
      expect(convAfter).not.toBeNull();
    });
  });

  describe('generateTitleFromMessage', () => {
    it('should return short messages as-is', () => {
      expect(generateTitleFromMessage('Hello')).toBe('Hello');
      expect(generateTitleFromMessage('Short question')).toBe('Short question');
    });

    it('should truncate long messages at word boundary', () => {
      const longMessage = 'This is a very long message that should be truncated at a reasonable word boundary';
      const title = generateTitleFromMessage(longMessage);

      expect(title.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(title).toMatch(/\.\.\.$/);
      expect(title).not.toMatch(/\s\.\.\.$/); // Should not end with space before ...
    });

    it('should strip markdown formatting', () => {
      expect(generateTitleFromMessage('**Bold** and *italic*')).toBe('Bold and italic');
      expect(generateTitleFromMessage('# Heading')).toBe('Heading');
      expect(generateTitleFromMessage('`code`')).toBe('code');
    });

    it('should return "New Chat" for empty content', () => {
      expect(generateTitleFromMessage('')).toBe('New Chat');
      expect(generateTitleFromMessage('   ')).toBe('New Chat');
    });
  });

  describe('exportConversationAsMarkdown', () => {
    it('should export conversation with YAML frontmatter', async () => {
      const conv = await createConversation('Test Export');
      await addMessage(conv.id, {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: 1704067200000, // 2024-01-01 00:00:00 UTC
      });
      await addMessage(conv.id, {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: 1704067260000, // 2024-01-01 00:01:00 UTC
      });

      const markdown = await exportConversationAsMarkdown(conv.id);

      // Check frontmatter
      expect(markdown).toMatch(/^---\n/);
      expect(markdown).toContain('title: "Test Export"');
      expect(markdown).toContain(`id: ${conv.id}`);
      expect(markdown).toContain('message_count: 2');
      expect(markdown).toMatch(/---\n\n/);

      // Check messages
      expect(markdown).toContain('## User');
      expect(markdown).toContain('Hello');
      expect(markdown).toContain('## Assistant');
      expect(markdown).toContain('Hi there!');
    });

    it('should include action results in export', async () => {
      const conv = await createConversation('Action Test');
      await addMessage(conv.id, {
        id: 'msg-1',
        role: 'assistant',
        content: 'Searching for candidates...',
        timestamp: Date.now(),
        actionResult: {
          action: 'search_candidates',
          result: 'Found 3 candidates',
        },
      });

      const markdown = await exportConversationAsMarkdown(conv.id);

      expect(markdown).toContain('### Action Result');
      expect(markdown).toContain('**Action:** `search_candidates`');
      expect(markdown).toContain('Found 3 candidates');
    });

    it('should skip tool result messages', async () => {
      const conv = await createConversation('Tool Result Test');
      await addMessage(conv.id, {
        id: 'msg-1',
        role: 'user',
        content: 'Regular message',
        timestamp: Date.now(),
        isToolResult: false,
      });
      await addMessage(conv.id, {
        id: 'msg-2',
        role: 'user',
        content: '[Tool Result] Should be hidden',
        timestamp: Date.now(),
        isToolResult: true,
      });

      const markdown = await exportConversationAsMarkdown(conv.id);

      expect(markdown).toContain('Regular message');
      expect(markdown).not.toContain('Should be hidden');
    });

    it('should escape special YAML characters in title', async () => {
      const conv = await createConversation('Title with "quotes" and\nnewlines');

      const markdown = await exportConversationAsMarkdown(conv.id);

      expect(markdown).toContain('title: "Title with \\"quotes\\" and\\nnewlines"');
    });

    it('should produce deterministic output', async () => {
      const conv = await createConversation('Deterministic Test');
      const fixedTime = 1704067200000;
      await addMessage(conv.id, {
        id: 'msg-fixed',
        role: 'user',
        content: 'Fixed content',
        timestamp: fixedTime,
      });

      const export1 = await exportConversationAsMarkdown(conv.id);
      const export2 = await exportConversationAsMarkdown(conv.id);

      expect(export1).toBe(export2);
    });

    it('should throw for non-existent conversation', async () => {
      await initChatStorage();

      await expect(exportConversationAsMarkdown('non-existent')).rejects.toThrow(
        'Conversation not found'
      );
    });
  });

  describe('clearAllChatData', () => {
    it('should clear all conversations and messages', async () => {
      const conv1 = await createConversation('Conv 1');
      const conv2 = await createConversation('Conv 2');
      await addMessage(conv1.id, { id: 'm1', role: 'user', content: 'Hi', timestamp: Date.now() });
      await addMessage(conv2.id, { id: 'm2', role: 'user', content: 'Hello', timestamp: Date.now() });

      await clearAllChatData();

      const conversations = await listConversations();
      expect(conversations).toHaveLength(0);
    });
  });
});
