/**
 * Google Forms API Manifest
 *
 * Google Forms for creating forms and viewing responses.
 * Read-only for responses, write for form creation.
 *
 * @see https://developers.google.com/forms/api/reference/rest
 */

import type { ProviderManifest } from '../types.js';

export const googleFormsManifest: ProviderManifest = {
  provider: 'google-forms',
  displayName: 'Google Forms',
  category: 'database',
  baseUrl: 'https://forms.googleapis.com/v1',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  blocklist: [
    '/forms/.*/watches', // Webhooks - not needed for basic usage
  ],

  operations: [
    // ==================== FORMS ====================
    {
      id: 'create_form',
      method: 'POST',
      path: '/forms',
      access: 'write',
      description: 'Create a new form with the given title. Returns the form ID and edit URL.',
      body: {
        info: {
          type: 'object',
          description: 'Form info containing title and optional description',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the form',
              required: true,
            },
            documentTitle: {
              type: 'string',
              description: 'The document title (shown in Drive)',
            },
          },
          required: true,
        },
      },
      responseHints: ['formId', 'info', 'title', 'responderUri', 'linkedSheetId'],
    },

    {
      id: 'get_form',
      method: 'GET',
      path: '/forms/{formId}',
      access: 'read',
      description: 'Get form metadata, questions, and settings. Does not include responses.',
      params: {
        formId: {
          type: 'string',
          description: 'The ID of the form',
          required: true,
        },
      },
      responseHints: ['formId', 'info', 'title', 'items', 'questionItem', 'question', 'responderUri'],
    },

    {
      id: 'batch_update_form',
      method: 'POST',
      path: '/forms/{formId}:batchUpdate',
      access: 'write',
      description: 'Update form settings, add/modify/delete questions, or change form structure.',
      params: {
        formId: {
          type: 'string',
          description: 'The ID of the form to update',
          required: true,
        },
      },
      body: {
        includeFormInResponse: {
          type: 'boolean',
          description: 'Whether to return the updated form in the response',
          default: true,
        },
        requests: {
          type: 'array',
          description: 'Array of update requests (createItem, updateItem, deleteItem, updateFormInfo, etc.)',
          items: {
            type: 'object',
            description: 'An update request',
          },
          required: true,
        },
      },
      responseHints: ['form', 'formId', 'replies', 'createItem', 'itemId'],
    },

    // ==================== RESPONSES ====================
    {
      id: 'list_responses',
      method: 'GET',
      path: '/forms/{formId}/responses',
      access: 'read',
      description: 'List all responses to a form. Returns respondent answers with timestamps.',
      params: {
        formId: {
          type: 'string',
          description: 'The ID of the form',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Maximum number of responses to return (max 5000)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
        filter: {
          type: 'string',
          description: 'Filter responses by timestamp (e.g., "timestamp > 2023-01-01T00:00:00Z")',
        },
      },
      responseHints: ['responses', 'responseId', 'createTime', 'lastSubmittedTime', 'answers', 'questionId', 'textAnswers', 'value'],
    },

    {
      id: 'get_response',
      method: 'GET',
      path: '/forms/{formId}/responses/{responseId}',
      access: 'read',
      description: 'Get a specific form response by ID.',
      params: {
        formId: {
          type: 'string',
          description: 'The ID of the form',
          required: true,
        },
        responseId: {
          type: 'string',
          description: 'The ID of the response',
          required: true,
        },
      },
      responseHints: ['responseId', 'createTime', 'lastSubmittedTime', 'respondentEmail', 'answers'],
    },

    // ==================== CONVENIENCE OPERATIONS ====================
    {
      id: 'add_question',
      method: 'POST',
      path: '/forms/{formId}:batchUpdate',
      access: 'write',
      description: 'Add a new question to the form.',
      params: {
        formId: {
          type: 'string',
          description: 'The ID of the form',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'The question title/text',
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
        index: {
          type: 'number',
          description: 'Position to insert the question (0-based)',
        },
      },
      meta: {
        requestType: 'addQuestion',
      },
      responseHints: ['form', 'formId', 'replies', 'createItem'],
    },
  ],
};
