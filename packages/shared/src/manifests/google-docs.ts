/**
 * Google Docs API Manifest
 *
 * Google Docs for document creation and editing.
 *
 * @see https://developers.google.com/docs/api/reference/rest
 */

import type { ProviderManifest } from './types.js';

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
    {
      id: 'create_document',
      method: 'POST',
      path: '/documents',
      access: 'write',
      description: 'Create a new blank document.',
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
      description: 'Get the content and metadata of a document.',
      params: {
        documentId: {
          type: 'string',
          description: 'The document ID',
          required: true,
        },
      },
      responseHints: ['documentId', 'title', 'body', 'content', 'paragraph', 'textRun', 'text'],
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
          description: 'The document ID',
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
