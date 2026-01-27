/**
 * Trello API Manifest
 *
 * Trello is a kanban-style project management tool.
 * Hierarchy: Members > Boards > Lists > Cards
 *
 * @see https://developer.atlassian.com/cloud/trello/rest/
 */

import type { ProviderManifest } from '../types.js';

export const trelloManifest: ProviderManifest = {
  provider: 'trello',
  displayName: 'Trello',
  category: 'database',
  baseUrl: 'https://api.trello.com/1',
  apiVersion: '1',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 300, // 300 requests per 10 seconds per API key
    windowSeconds: 10,
  },

  blocklist: [
    '/tokens', // Token management
    '/webhooks', // Webhook management
  ],

  operations: [
    // ==================== MEMBERS (Current User) ====================
    {
      id: 'get_me',
      method: 'GET',
      path: '/members/me',
      access: 'read',
      description: 'Get the current authenticated user and their boards.',
      params: {
        boards: {
          type: 'string',
          description: 'Include boards (all, open, closed, none)',
          default: 'open',
        },
        organizations: {
          type: 'string',
          description: 'Include organizations (all, none)',
          default: 'all',
        },
      },
      responseHints: ['id', 'username', 'fullName', 'email', 'idBoards'],
    },

    // ==================== BOARDS ====================
    {
      id: 'list_boards',
      method: 'GET',
      path: '/members/me/boards',
      access: 'read',
      description: 'List all boards the user has access to.',
      params: {
        filter: {
          type: 'string',
          description: 'Filter boards (all, open, closed, members, organization, public, starred)',
          default: 'open',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to return',
          default: 'id,name,desc,url,closed,starred',
        },
        lists: {
          type: 'string',
          description: 'Include lists (all, open, closed, none)',
          default: 'none',
        },
      },
      responseHints: ['id', 'name', 'desc', 'url', 'closed', 'starred'],
    },

    {
      id: 'get_board',
      method: 'GET',
      path: '/boards/{id}',
      access: 'read',
      description: 'Get a specific board with its lists and members.',
      params: {
        id: {
          type: 'string',
          description: 'Board ID',
          required: true,
        },
        lists: {
          type: 'string',
          description: 'Include lists (all, open, closed, none)',
          default: 'open',
        },
        members: {
          type: 'string',
          description: 'Include members (all, none)',
          default: 'all',
        },
        labels: {
          type: 'string',
          description: 'Include labels (all, none)',
          default: 'all',
        },
      },
      responseHints: ['id', 'name', 'desc', 'lists', 'members', 'labels'],
    },

    // ==================== LISTS ====================
    {
      id: 'list_lists',
      method: 'GET',
      path: '/boards/{boardId}/lists',
      access: 'read',
      description: 'Get all lists on a board.',
      params: {
        boardId: {
          type: 'string',
          description: 'Board ID',
          required: true,
        },
        filter: {
          type: 'string',
          description: 'Filter lists (all, open, closed)',
          default: 'open',
        },
        cards: {
          type: 'string',
          description: 'Include cards (all, open, closed, none)',
          default: 'none',
        },
      },
      responseHints: ['id', 'name', 'closed', 'pos', 'idBoard'],
    },

    {
      id: 'create_list',
      method: 'POST',
      path: '/lists',
      access: 'write',
      description: 'Create a new list on a board.',
      body: {
        name: {
          type: 'string',
          description: 'Name of the list',
          required: true,
        },
        idBoard: {
          type: 'string',
          description: 'Board ID to create the list on',
          required: true,
        },
        pos: {
          type: 'string',
          description: 'Position (top, bottom, or a positive number)',
          default: 'bottom',
        },
      },
      responseHints: ['id', 'name', 'idBoard'],
    },

    // ==================== CARDS ====================
    {
      id: 'list_cards',
      method: 'GET',
      path: '/boards/{boardId}/cards',
      access: 'read',
      description: 'Get all cards on a board.',
      params: {
        boardId: {
          type: 'string',
          description: 'Board ID',
          required: true,
        },
        filter: {
          type: 'string',
          description: 'Filter cards (all, open, closed, visible)',
          default: 'open',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to return',
          default: 'id,name,desc,idList,due,dueComplete,labels,url',
        },
      },
      responseHints: ['id', 'name', 'desc', 'idList', 'due', 'labels', 'url'],
    },

    {
      id: 'list_cards_in_list',
      method: 'GET',
      path: '/lists/{listId}/cards',
      access: 'read',
      description: 'Get all cards in a specific list.',
      params: {
        listId: {
          type: 'string',
          description: 'List ID',
          required: true,
        },
        filter: {
          type: 'string',
          description: 'Filter cards (all, open, closed)',
          default: 'open',
        },
      },
      responseHints: ['id', 'name', 'desc', 'due', 'labels', 'pos'],
    },

    {
      id: 'get_card',
      method: 'GET',
      path: '/cards/{id}',
      access: 'read',
      description: 'Get a specific card with all details.',
      params: {
        id: {
          type: 'string',
          description: 'Card ID',
          required: true,
        },
        checklists: {
          type: 'string',
          description: 'Include checklists (all, none)',
          default: 'all',
        },
        attachments: {
          type: 'string',
          description: 'Include attachments (true, false, cover)',
          default: 'true',
        },
      },
      responseHints: ['id', 'name', 'desc', 'idList', 'due', 'checklists', 'attachments'],
    },

    {
      id: 'create_card',
      method: 'POST',
      path: '/cards',
      access: 'write',
      description: 'Create a new card in a list.',
      body: {
        name: {
          type: 'string',
          description: 'Card name/title',
          required: true,
        },
        idList: {
          type: 'string',
          description: 'ID of the list to add the card to',
          required: true,
        },
        desc: {
          type: 'string',
          description: 'Card description (supports Markdown)',
        },
        due: {
          type: 'string',
          format: 'date-time',
          description: 'Due date (ISO 8601 format)',
        },
        idLabels: {
          type: 'array',
          description: 'Label IDs to apply',
          items: { type: 'string', description: 'Label ID' },
        },
        idMembers: {
          type: 'array',
          description: 'Member IDs to assign',
          items: { type: 'string', description: 'Member ID' },
        },
        pos: {
          type: 'string',
          description: 'Position (top, bottom, or a positive number)',
          default: 'bottom',
        },
      },
      responseHints: ['id', 'name', 'url', 'shortUrl'],
    },

    {
      id: 'update_card',
      method: 'PUT',
      path: '/cards/{id}',
      access: 'write',
      description: 'Update a card (name, description, due date, list, etc.).',
      params: {
        id: {
          type: 'string',
          description: 'Card ID',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'New card name',
        },
        desc: {
          type: 'string',
          description: 'New description',
        },
        due: {
          type: 'string',
          format: 'date-time',
          description: 'New due date (ISO 8601) or null to remove',
        },
        dueComplete: {
          type: 'boolean',
          description: 'Mark due date as complete',
        },
        idList: {
          type: 'string',
          description: 'Move card to different list',
        },
        closed: {
          type: 'boolean',
          description: 'Archive the card',
        },
        pos: {
          type: 'string',
          description: 'New position (top, bottom, or number)',
        },
      },
      responseHints: ['id', 'name', 'idList', 'due'],
    },

    {
      id: 'delete_card',
      method: 'DELETE',
      path: '/cards/{id}',
      access: 'delete',
      description: 'Permanently delete a card. This cannot be undone.',
      params: {
        id: {
          type: 'string',
          description: 'Card ID to delete',
          required: true,
        },
      },
      responseHints: [],
    },

    // ==================== LABELS ====================
    {
      id: 'list_labels',
      method: 'GET',
      path: '/boards/{boardId}/labels',
      access: 'read',
      description: 'Get all labels on a board.',
      params: {
        boardId: {
          type: 'string',
          description: 'Board ID',
          required: true,
        },
      },
      responseHints: ['id', 'name', 'color', 'idBoard'],
    },

    // ==================== CHECKLISTS ====================
    {
      id: 'create_checklist',
      method: 'POST',
      path: '/checklists',
      access: 'write',
      description: 'Create a checklist on a card.',
      body: {
        idCard: {
          type: 'string',
          description: 'Card ID to add checklist to',
          required: true,
        },
        name: {
          type: 'string',
          description: 'Checklist name',
          required: true,
        },
      },
      responseHints: ['id', 'name', 'idCard', 'checkItems'],
    },

    {
      id: 'create_checklist_item',
      method: 'POST',
      path: '/checklists/{checklistId}/checkItems',
      access: 'write',
      description: 'Add an item to a checklist.',
      params: {
        checklistId: {
          type: 'string',
          description: 'Checklist ID',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'Item name',
          required: true,
        },
        checked: {
          type: 'boolean',
          description: 'Initial checked state',
          default: false,
        },
      },
      responseHints: ['id', 'name', 'state'],
    },
  ],
};
