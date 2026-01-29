/**
 * Calendly API v2 Manifest
 *
 * @see https://developer.calendly.com/api-docs
 */

import type { ProviderManifest } from './types.js';

export const calendlyManifest: ProviderManifest = {
  provider: 'calendly',
  displayName: 'Calendly',
  category: 'calendar',
  baseUrl: 'https://api.calendly.com',
  apiVersion: 'v2',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 100,
    windowSeconds: 60,
  },

  // Security blocklist - sensitive endpoints that should not be exposed
  blocklist: [
    '/webhook_subscriptions',
    '/data_compliance',
  ],

  operations: [
    // ==================== USERS ====================
    {
      id: 'get_current_user',
      method: 'GET',
      path: '/users/me',
      access: 'read',
      description: 'Get the current authenticated user\'s information including organization URI.',
      responseHints: ['uri', 'name', 'email', 'scheduling_url', 'timezone', 'current_organization'],
    },

    // ==================== EVENT TYPES ====================
    {
      id: 'list_event_types',
      method: 'GET',
      path: '/event_types',
      access: 'read',
      description: 'List all event types (meeting templates) for a user or organization. Returns scheduling links and configurations.',
      params: {
        user: {
          type: 'string',
          format: 'uri',
          description: 'Filter by user URI (e.g., https://api.calendly.com/users/{uuid})',
        },
        organization: {
          type: 'string',
          format: 'uri',
          description: 'Filter by organization URI',
        },
        active: {
          type: 'boolean',
          description: 'Filter by active/inactive status',
        },
        sort: {
          type: 'string',
          description: 'Sort order (e.g., name:asc, name:desc)',
        },
        count: {
          type: 'number',
          description: 'Number of results per page (max 100)',
          default: 20,
        },
        page_token: {
          type: 'string',
          description: 'Token for pagination',
        },
      },
      responseHints: ['uri', 'name', 'slug', 'scheduling_url', 'duration', 'kind', 'active'],
    },

    // ==================== SCHEDULED EVENTS ====================
    {
      id: 'list_scheduled_events',
      method: 'GET',
      path: '/scheduled_events',
      access: 'read',
      description: 'List all scheduled events (meetings) for a user or organization. Returns past and upcoming meetings.',
      params: {
        user: {
          type: 'string',
          format: 'uri',
          description: 'Filter by user URI',
        },
        organization: {
          type: 'string',
          format: 'uri',
          description: 'Filter by organization URI',
        },
        invitee_email: {
          type: 'string',
          format: 'email',
          description: 'Filter by invitee email address',
        },
        status: {
          type: 'string',
          description: 'Filter by event status',
          enum: ['active', 'canceled'],
        },
        min_start_time: {
          type: 'string',
          format: 'date-time',
          description: 'Filter events starting after this time (ISO-8601)',
        },
        max_start_time: {
          type: 'string',
          format: 'date-time',
          description: 'Filter events starting before this time (ISO-8601)',
        },
        sort: {
          type: 'string',
          description: 'Sort order (e.g., start_time:asc, start_time:desc)',
        },
        count: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 20,
        },
        page_token: {
          type: 'string',
          description: 'Pagination token',
        },
      },
      responseHints: ['uri', 'name', 'status', 'start_time', 'end_time', 'event_type', 'location', 'invitees_counter'],
    },

    {
      id: 'cancel_scheduled_event',
      method: 'POST',
      path: '/scheduled_events/{uuid}/cancellation',
      access: 'write',
      description: 'Cancel a scheduled event. Optionally provide a reason for the cancellation.',
      params: {
        uuid: {
          type: 'string',
          description: 'Scheduled event UUID',
          required: true,
        },
      },
      body: {
        reason: {
          type: 'string',
          description: 'Reason for cancellation (sent to invitees)',
        },
      },
    },

    // ==================== SCHEDULING LINKS ====================
    {
      id: 'create_single_use_scheduling_link',
      method: 'POST',
      path: '/scheduling_links',
      access: 'write',
      description: 'Create a single-use scheduling link for a specific event type. The link expires after one booking.',
      body: {
        max_event_count: {
          type: 'number',
          description: 'Maximum number of events that can be scheduled (1 for single-use)',
          required: true,
          default: 1,
        },
        owner: {
          type: 'string',
          format: 'uri',
          description: 'Event type URI that this link schedules',
          required: true,
        },
        owner_type: {
          type: 'string',
          description: 'Type of owner (EventType)',
          enum: ['EventType'],
          required: true,
        },
      },
      responseHints: ['booking_url', 'owner', 'owner_type'],
    },
  ],
};
