/**
 * Google Tasks API Manifest
 *
 * Google Tasks for native task management.
 * Hierarchy: Task Lists > Tasks
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
    // ==================== TASK LISTS ====================
    {
      id: 'list_task_lists',
      method: 'GET',
      path: '/users/@me/lists',
      access: 'read',
      description: 'List all task lists for the user.',
      params: {
        maxResults: {
          type: 'number',
          description: 'Maximum number of task lists to return (max 100)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
      },
      responseHints: ['items', 'id', 'title', 'updated'],
    },

    {
      id: 'get_task_list',
      method: 'GET',
      path: '/users/@me/lists/{tasklist}',
      access: 'read',
      description: 'Get a specific task list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID',
          required: true,
        },
      },
      responseHints: ['id', 'title', 'updated'],
    },

    {
      id: 'create_task_list',
      method: 'POST',
      path: '/users/@me/lists',
      access: 'write',
      description: 'Create a new task list.',
      body: {
        title: {
          type: 'string',
          description: 'Title of the task list',
          required: true,
        },
      },
      responseHints: ['id', 'title'],
    },

    {
      id: 'update_task_list',
      method: 'PATCH',
      path: '/users/@me/lists/{tasklist}',
      access: 'write',
      description: 'Update a task list title.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'New title',
          required: true,
        },
      },
      responseHints: ['id', 'title'],
    },

    {
      id: 'delete_task_list',
      method: 'DELETE',
      path: '/users/@me/lists/{tasklist}',
      access: 'delete',
      description: 'Delete a task list and all its tasks.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID',
          required: true,
        },
      },
      responseHints: [],
    },

    // ==================== TASKS ====================
    {
      id: 'list_tasks',
      method: 'GET',
      path: '/lists/{tasklist}/tasks',
      access: 'read',
      description: 'List all tasks in a task list. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of tasks to return (max 100)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
        showCompleted: {
          type: 'boolean',
          description: 'Include completed tasks',
          default: true,
        },
        showHidden: {
          type: 'boolean',
          description: 'Include hidden/deleted tasks',
          default: false,
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
      path: '/lists/{tasklist}/tasks/{task}',
      access: 'read',
      description: 'Get a specific task. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
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
      path: '/lists/{tasklist}/tasks',
      access: 'write',
      description: 'Create a new task in a task list. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
        parent: {
          type: 'string',
          description: 'Parent task ID (for subtasks)',
        },
        previous: {
          type: 'string',
          description: 'Previous sibling task ID (for ordering)',
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
        status: {
          type: 'string',
          description: 'Task status',
          enum: ['needsAction', 'completed'],
          default: 'needsAction',
        },
      },
      responseHints: ['id', 'title', 'status', 'due'],
    },

    {
      id: 'update_task',
      method: 'PATCH',
      path: '/lists/{tasklist}/tasks/{task}',
      access: 'write',
      description: 'Update a task (title, notes, due date, status). Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
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
      path: '/lists/{tasklist}/tasks/{task}',
      access: 'write',
      description: 'Mark a task as completed. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
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
      path: '/lists/{tasklist}/tasks/{task}',
      access: 'delete',
      description: 'Delete a task. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
        task: {
          type: 'string',
          description: 'Task ID',
          required: true,
        },
      },
      responseHints: [],
    },

    {
      id: 'move_task',
      method: 'POST',
      path: '/lists/{tasklist}/tasks/{task}/move',
      access: 'write',
      description: 'Move a task to a different position or make it a subtask. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
        task: {
          type: 'string',
          description: 'Task ID to move',
          required: true,
        },
        parent: {
          type: 'string',
          description: 'New parent task ID (to make subtask)',
        },
        previous: {
          type: 'string',
          description: 'Previous sibling task ID (for ordering)',
        },
      },
      responseHints: ['id', 'title', 'parent', 'position'],
    },

    {
      id: 'clear_completed',
      method: 'POST',
      path: '/lists/{tasklist}/clear',
      access: 'write',
      description: 'Clear all completed tasks from a task list. Use "@default" for the default "My Tasks" list.',
      params: {
        tasklist: {
          type: 'string',
          description: 'Task list ID. Use "@default" for the default "My Tasks" list.',
          required: true,
          default: '@default',
        },
      },
      responseHints: [],
    },
  ],
};
