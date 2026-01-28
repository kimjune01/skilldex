/**
 * Clockify API Manifest
 *
 * Time tracking operations for freelancers.
 * Focused on essential workflows: viewing/logging time, managing projects.
 *
 * Note: Most endpoints require workspaceId. Call get_user first to get
 * the user's default workspace, then use that ID for other operations.
 *
 * @see https://docs.clockify.me/
 */

import type { ProviderManifest } from './types.js';

export const clockifyManifest: ProviderManifest = {
  provider: 'clockify',
  displayName: 'Clockify',
  category: 'time-tracking',
  baseUrl: 'https://api.clockify.me/api/v1',
  apiVersion: 'v1',

  auth: {
    type: 'api-key',
    headerName: 'X-Api-Key',
  },

  rateLimit: {
    requests: 10,
    windowSeconds: 1,
  },

  blocklist: [],

  operations: [
    // ============ User & Workspace ============
    {
      id: 'get_user',
      method: 'GET',
      path: '/user',
      access: 'read',
      description: 'Get current user info including default workspace ID. Call this first to get workspaceId for other operations.',
      params: {},
      responseHints: ['id', 'email', 'name', 'defaultWorkspace', 'activeWorkspace'],
    },

    {
      id: 'list_workspaces',
      method: 'GET',
      path: '/workspaces',
      access: 'read',
      description: 'List all workspaces the user has access to.',
      params: {},
      responseHints: ['id', 'name', 'memberships'],
    },

    // ============ Projects ============
    {
      id: 'list_projects',
      method: 'GET',
      path: '/workspaces/{workspaceId}/projects',
      access: 'read',
      description: 'List all projects in a workspace.',
      params: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID (get from get_user or list_workspaces)',
          required: true,
        },
        archived: {
          type: 'boolean',
          description: 'Include archived projects',
          default: false,
        },
        'page-size': {
          type: 'number',
          description: 'Number of projects per page (max 5000)',
          default: 50,
        },
      },
      responseHints: ['id', 'name', 'clientId', 'clientName', 'color', 'archived', 'billable'],
    },

    // ============ Time Entries ============
    {
      id: 'list_time_entries',
      method: 'GET',
      path: '/workspaces/{workspaceId}/user/{userId}/time-entries',
      access: 'read',
      description: 'List time entries for a user. Use start/end params to filter by date range.',
      params: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID',
          required: true,
        },
        userId: {
          type: 'string',
          description: 'User ID (get from get_user)',
          required: true,
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Start date filter (ISO 8601, e.g., 2024-01-01T00:00:00Z)',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'End date filter (ISO 8601)',
        },
        project: {
          type: 'string',
          description: 'Filter by project ID',
        },
        'page-size': {
          type: 'number',
          description: 'Number of entries per page (max 5000)',
          default: 50,
        },
      },
      responseHints: ['id', 'description', 'timeInterval', 'projectId', 'taskId', 'billable', 'duration'],
    },

    {
      id: 'create_time_entry',
      method: 'POST',
      path: '/workspaces/{workspaceId}/time-entries',
      access: 'write',
      description: 'Create a new time entry. Either provide start+end for a completed entry, or just start to begin a timer.',
      params: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID',
          required: true,
        },
      },
      body: {
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Start time (ISO 8601, e.g., 2024-01-15T09:00:00Z)',
          required: true,
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'End time (ISO 8601). Omit to start a running timer.',
        },
        description: {
          type: 'string',
          description: 'What you worked on',
        },
        projectId: {
          type: 'string',
          description: 'Project to log time to',
        },
        billable: {
          type: 'boolean',
          description: 'Mark as billable',
          default: true,
        },
      },
      responseHints: ['id', 'description', 'timeInterval', 'projectId'],
    },

    {
      id: 'stop_timer',
      method: 'PATCH',
      path: '/workspaces/{workspaceId}/user/{userId}/time-entries',
      access: 'write',
      description: 'Stop the currently running timer.',
      params: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID',
          required: true,
        },
        userId: {
          type: 'string',
          description: 'User ID',
          required: true,
        },
      },
      body: {
        end: {
          type: 'string',
          format: 'date-time',
          description: 'End time (ISO 8601). Defaults to now if not provided.',
          required: true,
        },
      },
      responseHints: ['id', 'description', 'timeInterval', 'duration'],
    },

    {
      id: 'get_running_timer',
      method: 'GET',
      path: '/workspaces/{workspaceId}/user/{userId}/time-entries',
      access: 'read',
      description: 'Check if there is a running timer (time entry without end time).',
      params: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID',
          required: true,
        },
        userId: {
          type: 'string',
          description: 'User ID',
          required: true,
        },
        'in-progress': {
          type: 'boolean',
          description: 'Only return in-progress entries',
          default: true,
        },
      },
      responseHints: ['id', 'description', 'timeInterval', 'projectId'],
    },
  ],
};
