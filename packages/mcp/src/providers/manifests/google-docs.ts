/**
 * Google Docs API Manifest
 *
 * Google Docs for document creation and reading.
 * Supports creating, reading, and updating documents.
 *
 * @see https://developers.google.com/docs/api/reference/rest
 */

import type { ProviderManifest } from '../types.js';

export const googleDocsManifest: ProviderManifest = {
  provider: 'google-docs',
  displayName: 'Google Docs',
  category: 'database',
  baseUrl: 'https://docs.googleapis.com/v1',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  blocklist: [],

  operations: [
    // ==================== DOCUMENTS ====================
    {
      id: 'create_document',
      method: 'POST',
      path: '/documents',
      access: 'write',
      description: 'Create a new blank document with the given title.',
      body: {
        title: {
          type: 'string',
          description: 'The title of the new document',
          required: true,
        },
      },
      responseHints: ['documentId', 'title', 'revisionId'],
    },

    {
      id: 'get_document',
      method: 'GET',
      path: '/documents/{documentId}',
      access: 'read',
      description: 'Get the content and metadata of a document. Returns the full document structure including body, headers, footers, and footnotes.',
      params: {
        documentId: {
          type: 'string',
          description: 'The ID of the document to retrieve',
          required: true,
        },
        suggestionsViewMode: {
          type: 'string',
          description: 'How to render suggestions: SUGGESTIONS_INLINE, PREVIEW_SUGGESTIONS_ACCEPTED, PREVIEW_WITHOUT_SUGGESTIONS',
          enum: ['SUGGESTIONS_INLINE', 'PREVIEW_SUGGESTIONS_ACCEPTED', 'PREVIEW_WITHOUT_SUGGESTIONS'],
          default: 'SUGGESTIONS_INLINE',
        },
      },
      responseHints: ['documentId', 'title', 'body', 'content', 'paragraph', 'textRun', 'text'],
    },

    {
      id: 'batch_update_document',
      method: 'POST',
      path: '/documents/{documentId}:batchUpdate',
      access: 'write',
      description: 'Apply one or more updates to a document. Use for inserting text, deleting content, formatting, etc.',
      params: {
        documentId: {
          type: 'string',
          description: 'The ID of the document to update',
          required: true,
        },
      },
      body: {
        requests: {
          type: 'array',
          description: 'Array of update requests to apply',
          items: {
            type: 'object',
            description: 'An update request (insertText, deleteContentRange, updateTextStyle, etc.)',
          },
          required: true,
        },
        writeControl: {
          type: 'object',
          description: 'Optional write control for revision management',
        },
      },
      responseHints: ['documentId', 'replies', 'writeControl'],
    },

    // ==================== CONVENIENCE OPERATIONS ====================
    {
      id: 'insert_text',
      method: 'POST',
      path: '/documents/{documentId}:batchUpdate',
      access: 'write',
      description: 'Insert text at a specific location in the document. Use index 1 to insert at the beginning.',
      params: {
        documentId: {
          type: 'string',
          description: 'The ID of the document',
          required: true,
        },
      },
      body: {
        text: {
          type: 'string',
          description: 'The text to insert',
          required: true,
        },
        index: {
          type: 'number',
          description: 'The index where to insert text (1-based, 1 = start of document)',
          default: 1,
        },
      },
      meta: {
        requestType: 'insertText',
      },
      responseHints: ['documentId', 'replies'],
    },

    {
      id: 'append_text',
      method: 'POST',
      path: '/documents/{documentId}:batchUpdate',
      access: 'write',
      description: 'Append text to the end of the document.',
      params: {
        documentId: {
          type: 'string',
          description: 'The ID of the document',
          required: true,
        },
      },
      body: {
        text: {
          type: 'string',
          description: 'The text to append',
          required: true,
        },
      },
      meta: {
        requestType: 'appendText',
      },
      responseHints: ['documentId', 'replies'],
    },
  ],
};
