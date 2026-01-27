/**
 * Google Tasks API Manifest
 *
 * Google Tasks for native task management.
 * All operations use the default "My Tasks" list (@default).
 *
 * @see https://developers.google.com/tasks/reference/rest
 */

import type { ProviderManifest } from '../types.js';

export const googleTasksManifest: ProviderManifest = {
  provider: 'google-tasks',
  displayName: 'Google Tasks',
  category: 'database',
  baseUrl: 'https://tasks.googleapis.com/tasks/v1',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  blocklist: [],

  operations: [
    {
      id: 'list_tasks',
      method: 'GET',
      path: '/lists/@default/tasks',
      access: 'read',
      description: 'List all tasks.',
      params: {
        maxResults: {
          type: 'number',
          description: 'Maximum number of tasks to return (max 100)',
          default: 100,
        },
        showCompleted: {
          type: 'boolean',
          description: 'Include completed tasks',
          default: true,
        },
        dueMin: {
          type: 'string',
          format: 'date-time',
          description: 'Filter tasks due after this time (RFC 3339)',
        },
        dueMax: {
          type: 'string',
          format: 'date-time',
          description: 'Filter tasks due before this time (RFC 3339)',
        },
      },
      responseHints: ['items', 'id', 'title', 'status', 'due', 'notes', 'completed'],
    },

    {
      id: 'get_task',
      method: 'GET',
      path: '/lists/@default/tasks/{task}',
      access: 'read',
      description: 'Get a specific task by ID.',
      params: {
        task: {
          type: 'string',
          description: 'Task ID',
          required: true,
        },
      },
      responseHints: ['id', 'title', 'status', 'due', 'notes', 'completed', 'parent'],
    },

    {
      id: 'create_task',
      method: 'POST',
      path: '/lists/@default/tasks',
      access: 'write',
      description: 'Create a new task.',
      params: {
        parent: {
          type: 'string',
          description: 'Parent task ID (for subtasks)',
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'Task title',
          required: true,
        },
        notes: {
          type: 'string',
          description: 'Task notes/description',
        },
        due: {
          type: 'string',
          format: 'date-time',
          description: 'Due date (RFC 3339 timestamp)',
        },
      },
      responseHints: ['id', 'title', 'status', 'due'],
    },

    {
      id: 'update_task',
      method: 'PATCH',
      path: '/lists/@default/tasks/{task}',
      access: 'write',
      description: 'Update a task (title, notes, due date, or status).',
      params: {
        task: {
          type: 'string',
          description: 'Task ID',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'New title',
        },
        notes: {
          type: 'string',
          description: 'New notes',
        },
        due: {
          type: 'string',
          format: 'date-time',
          description: 'New due date',
        },
        status: {
          type: 'string',
          description: 'New status',
          enum: ['needsAction', 'completed'],
        },
      },
      responseHints: ['id', 'title', 'status', 'due'],
    },

    {
      id: 'complete_task',
      method: 'PATCH',
      path: '/lists/@default/tasks/{task}',
      access: 'write',
      description: 'Mark a task as completed.',
      params: {
        task: {
          type: 'string',
          description: 'Task ID',
          required: true,
        },
      },
      body: {
        status: {
          type: 'string',
          description: 'Set to "completed"',
          default: 'completed',
        },
      },
      responseHints: ['id', 'title', 'status', 'completed'],
    },

    {
      id: 'delete_task',
      method: 'DELETE',
      path: '/lists/@default/tasks/{task}',
      access: 'delete',
      description: 'Delete a task.',
      params: {
        task: {
          type: 'string',
          description: 'Task ID',
          required: true,
        },
      },
      responseHints: [],
    },

    {
      id: 'clear_completed',
      method: 'POST',
      path: '/lists/@default/clear',
      access: 'write',
      description: 'Clear all completed tasks.',
      params: {},
      responseHints: [],
    },
  ],
};
