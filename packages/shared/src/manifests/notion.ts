/**
 * Notion API Manifest
 *
 * Notion is a workspace for notes, docs, wikis, and databases.
 * Users must explicitly share pages/databases with the integration.
 *
 * @see https://developers.notion.com/reference
 */

import type { ProviderManifest } from './types.js';

export const notionManifest: ProviderManifest = {
  provider: 'notion',
  displayName: 'Notion',
  category: 'database',
  baseUrl: 'https://api.notion.com/v1',
  apiVersion: '2022-06-28',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 3, // Notion has strict rate limits: 3 requests/second average
    windowSeconds: 1,
  },

  blocklist: [],

  operations: [
    // ==================== SEARCH ====================
    {
      id: 'search',
      method: 'POST',
      path: '/search',
      access: 'read',
      description:
        'Search across all pages and databases the user has shared with this integration. Use this to find content by title or text.',
      body: {
        query: {
          type: 'string',
          description: 'Text to search for in page titles and content',
        },
        filter: {
          type: 'object',
          description: 'Filter by object type',
          properties: {
            value: {
              type: 'string',
              description: 'Object type to filter by',
              enum: ['page', 'database'],
            },
            property: {
              type: 'string',
              description: 'Must be "object"',
              default: 'object',
            },
          },
        },
        sort: {
          type: 'object',
          description: 'Sort order',
          properties: {
            direction: {
              type: 'string',
              description: 'Sort direction',
              enum: ['ascending', 'descending'],
            },
            timestamp: {
              type: 'string',
              description: 'Timestamp field to sort by',
              enum: ['last_edited_time'],
            },
          },
        },
        page_size: {
          type: 'number',
          description: 'Number of results (max 100)',
          default: 100,
        },
        start_cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response',
        },
      },
      responseHints: ['results', 'id', 'object', 'title', 'url'],
    },

    // ==================== DATABASES ====================
    {
      id: 'query_database',
      method: 'POST',
      path: '/databases/{database_id}/query',
      access: 'read',
      description:
        'Query a Notion database with optional filters and sorts. Returns pages (rows) from the database.',
      params: {
        database_id: {
          type: 'string',
          description: 'The ID of the database to query',
          required: true,
        },
      },
      body: {
        filter: {
          type: 'object',
          description: 'Filter conditions (see Notion filter docs)',
        },
        sorts: {
          type: 'array',
          description: 'Sort conditions',
          items: {
            type: 'object',
            description: 'Sort condition',
          },
        },
        page_size: {
          type: 'number',
          description: 'Number of results per page (max 100)',
          default: 100,
        },
        start_cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response',
        },
      },
      responseHints: ['results', 'id', 'properties', 'created_time', 'last_edited_time'],
    },

    {
      id: 'get_database',
      method: 'GET',
      path: '/databases/{database_id}',
      access: 'read',
      description: 'Get database schema including all property definitions. Use this to understand the structure.',
      params: {
        database_id: {
          type: 'string',
          description: 'The ID of the database',
          required: true,
        },
      },
      responseHints: ['id', 'title', 'properties', 'parent'],
    },

    // ==================== PAGES ====================
    {
      id: 'get_page',
      method: 'GET',
      path: '/pages/{page_id}',
      access: 'read',
      description: 'Get a page and its properties. Does not include page content (use get_block_children for content).',
      params: {
        page_id: {
          type: 'string',
          description: 'The ID of the page',
          required: true,
        },
      },
      responseHints: ['id', 'properties', 'parent', 'url', 'created_time'],
    },

    {
      id: 'create_page',
      method: 'POST',
      path: '/pages',
      access: 'write',
      description: 'Create a new page in a database or as a child of another page.',
      body: {
        parent: {
          type: 'object',
          description: 'Parent database or page. Use {database_id: "..."} or {page_id: "..."}',
          required: true,
        },
        properties: {
          type: 'object',
          description: 'Page properties matching the database schema',
          required: true,
        },
        children: {
          type: 'array',
          description: 'Initial page content as block objects',
          items: {
            type: 'object',
            description: 'Block object',
          },
        },
      },
      responseHints: ['id', 'url', 'created_time'],
    },

    {
      id: 'update_page',
      method: 'PATCH',
      path: '/pages/{page_id}',
      access: 'write',
      description: 'Update page properties. Cannot update page content (use block operations for content).',
      params: {
        page_id: {
          type: 'string',
          description: 'The ID of the page to update',
          required: true,
        },
      },
      body: {
        properties: {
          type: 'object',
          description: 'Properties to update',
          required: true,
        },
        archived: {
          type: 'boolean',
          description: 'Set to true to archive (soft-delete) the page',
        },
      },
      responseHints: ['id', 'properties', 'last_edited_time'],
    },

    // ==================== BLOCKS (Page Content) ====================
    {
      id: 'get_block_children',
      method: 'GET',
      path: '/blocks/{block_id}/children',
      access: 'read',
      description: 'Get the content blocks of a page or block. Use page_id to get page content.',
      params: {
        block_id: {
          type: 'string',
          description: 'The ID of the page or block',
          required: true,
        },
        page_size: {
          type: 'number',
          description: 'Number of blocks to return (max 100)',
          default: 100,
        },
        start_cursor: {
          type: 'string',
          description: 'Pagination cursor from previous response',
        },
      },
      responseHints: ['results', 'type', 'paragraph', 'heading_1', 'bulleted_list_item'],
    },

    {
      id: 'append_block_children',
      method: 'PATCH',
      path: '/blocks/{block_id}/children',
      access: 'write',
      description: 'Append new content blocks to a page or block.',
      params: {
        block_id: {
          type: 'string',
          description: 'The ID of the page or block to append to',
          required: true,
        },
      },
      body: {
        children: {
          type: 'array',
          description: 'Block objects to append',
          required: true,
          items: {
            type: 'object',
            description: 'Block object (paragraph, heading_1, bulleted_list_item, etc.)',
          },
        },
      },
      responseHints: ['results', 'id', 'type'],
    },

    // ==================== USERS ====================
    {
      id: 'list_users',
      method: 'GET',
      path: '/users',
      access: 'read',
      description: 'List all users in the workspace. Useful for finding user IDs for assignments.',
      params: {
        page_size: {
          type: 'number',
          description: 'Number of users to return (max 100)',
          default: 100,
        },
        start_cursor: {
          type: 'string',
          description: 'Pagination cursor',
        },
      },
      responseHints: ['results', 'id', 'name', 'type', 'person'],
    },

    {
      id: 'get_user',
      method: 'GET',
      path: '/users/{user_id}',
      access: 'read',
      description: 'Get details about a specific user.',
      params: {
        user_id: {
          type: 'string',
          description: 'The ID of the user',
          required: true,
        },
      },
      responseHints: ['id', 'name', 'type', 'person', 'avatar_url'],
    },
  ],
};
