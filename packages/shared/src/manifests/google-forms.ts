/**
 * Google Forms API Manifest
 *
 * Google Forms for creating forms and viewing responses.
 *
 * @see https://developers.google.com/forms/api/reference/rest
 */

import type { ProviderManifest } from './types.js';

export const googleFormsManifest: ProviderManifest = {
  provider: 'google-forms',
  displayName: 'Google Forms',
  category: 'database',
  baseUrl: 'https://forms.googleapis.com/v1',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  blocklist: [],

  operations: [
    {
      id: 'create_form',
      method: 'POST',
      path: '/forms',
      access: 'write',
      description: 'Create a new form.',
      body: {
        info: {
          type: 'object',
          description: 'Form info containing title',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the form',
              required: true,
            },
          },
          required: true,
        },
      },
      responseHints: ['formId', 'info', 'title', 'responderUri'],
    },

    {
      id: 'get_form',
      method: 'GET',
      path: '/forms/{formId}',
      access: 'read',
      description: 'Get form metadata and questions.',
      params: {
        formId: {
          type: 'string',
          description: 'The form ID',
          required: true,
        },
      },
      responseHints: ['formId', 'info', 'title', 'items', 'questionItem', 'question', 'responderUri'],
    },

    {
      id: 'add_question',
      method: 'POST',
      path: '/forms/{formId}:batchUpdate',
      access: 'write',
      description: 'Add a question to the form.',
      params: {
        formId: {
          type: 'string',
          description: 'The form ID',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'The question text',
          required: true,
        },
        questionType: {
          type: 'string',
          description: 'Type of question',
          enum: ['TEXT', 'PARAGRAPH_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'SCALE', 'DATE', 'TIME'],
          default: 'TEXT',
        },
        required: {
          type: 'boolean',
          description: 'Whether the question is required',
          default: false,
        },
        options: {
          type: 'array',
          description: 'Options for MULTIPLE_CHOICE, CHECKBOX, or DROPDOWN questions',
          items: {
            type: 'string',
            description: 'Option text',
          },
        },
      },
      meta: {
        requestType: 'addQuestion',
      },
      responseHints: ['form', 'formId', 'replies'],
    },

    {
      id: 'list_responses',
      method: 'GET',
      path: '/forms/{formId}/responses',
      access: 'read',
      description: 'List all responses to a form.',
      params: {
        formId: {
          type: 'string',
          description: 'The form ID',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Maximum number of responses (max 5000)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
      },
      responseHints: ['responses', 'responseId', 'createTime', 'answers', 'questionId', 'textAnswers', 'value'],
    },
  ],
};
