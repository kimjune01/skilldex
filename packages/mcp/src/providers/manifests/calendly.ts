/**
 * Calendly API v2 Manifest
 *
 * @see https://developer.calendly.com/api-docs
 */

import type { ProviderManifest } from '../types.js';

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

    {
      id: 'get_user',
      method: 'GET',
      path: '/users/{uuid}',
      access: 'read',
      description: 'Get a specific user by their UUID.',
      params: {
        uuid: {
          type: 'string',
          description: 'User UUID',
          required: true,
        },
      },
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

    {
      id: 'get_event_type',
      method: 'GET',
      path: '/event_types/{uuid}',
      access: 'read',
      description: 'Get detailed information about a specific event type.',
      params: {
        uuid: {
          type: 'string',
          description: 'Event type UUID',
          required: true,
        },
      },
    },

    // ==================== EVENT TYPE AVAILABILITY ====================
    {
      id: 'get_event_type_available_times',
      method: 'GET',
      path: '/event_type_available_times',
      access: 'read',
      description: 'Get available time slots for scheduling an event type. Use this to find open slots for booking.',
      params: {
        event_type: {
          type: 'string',
          format: 'uri',
          description: 'Event type URI (required)',
          required: true,
        },
        start_time: {
          type: 'string',
          format: 'date-time',
          description: 'Start of time range (ISO-8601)',
          required: true,
        },
        end_time: {
          type: 'string',
          format: 'date-time',
          description: 'End of time range (ISO-8601)',
          required: true,
        },
      },
      responseHints: ['status', 'start_time', 'invitees_remaining', 'scheduling_url'],
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
      id: 'get_scheduled_event',
      method: 'GET',
      path: '/scheduled_events/{uuid}',
      access: 'read',
      description: 'Get detailed information about a specific scheduled event including location and meeting link.',
      params: {
        uuid: {
          type: 'string',
          description: 'Scheduled event UUID',
          required: true,
        },
      },
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

    // ==================== INVITEES ====================
    {
      id: 'list_event_invitees',
      method: 'GET',
      path: '/scheduled_events/{uuid}/invitees',
      access: 'read',
      description: 'List all invitees (attendees) for a scheduled event.',
      params: {
        uuid: {
          type: 'string',
          description: 'Scheduled event UUID',
          required: true,
        },
        status: {
          type: 'string',
          description: 'Filter by invitee status',
          enum: ['active', 'canceled'],
        },
        sort: {
          type: 'string',
          description: 'Sort order (e.g., created_at:asc)',
        },
        count: {
          type: 'number',
          description: 'Results per page',
          default: 20,
        },
        page_token: {
          type: 'string',
          description: 'Pagination token',
        },
      },
      responseHints: ['uri', 'email', 'name', 'status', 'timezone', 'questions_and_answers', 'tracking', 'created_at'],
    },

    {
      id: 'get_invitee',
      method: 'GET',
      path: '/scheduled_events/{event_uuid}/invitees/{invitee_uuid}',
      access: 'read',
      description: 'Get detailed information about a specific invitee.',
      params: {
        event_uuid: {
          type: 'string',
          description: 'Scheduled event UUID',
          required: true,
        },
        invitee_uuid: {
          type: 'string',
          description: 'Invitee UUID',
          required: true,
        },
      },
    },

    // ==================== USER AVAILABILITY ====================
    {
      id: 'get_user_availability_schedules',
      method: 'GET',
      path: '/user_availability_schedules',
      access: 'read',
      description: 'List availability schedules for a user showing their working hours.',
      params: {
        user: {
          type: 'string',
          format: 'uri',
          description: 'User URI (required)',
          required: true,
        },
      },
      responseHints: ['uri', 'name', 'default', 'timezone', 'rules'],
    },

    {
      id: 'get_user_busy_times',
      method: 'GET',
      path: '/user_busy_times',
      access: 'read',
      description: 'Get a user\'s busy time periods from their connected calendars.',
      params: {
        user: {
          type: 'string',
          format: 'uri',
          description: 'User URI (required)',
          required: true,
        },
        start_time: {
          type: 'string',
          format: 'date-time',
          description: 'Start of time range (ISO-8601)',
          required: true,
        },
        end_time: {
          type: 'string',
          format: 'date-time',
          description: 'End of time range (ISO-8601)',
          required: true,
        },
      },
      responseHints: ['type', 'start_time', 'end_time', 'buffered'],
    },

    // ==================== ORGANIZATION ====================
    {
      id: 'list_organization_memberships',
      method: 'GET',
      path: '/organization_memberships',
      access: 'read',
      description: 'List all members of an organization.',
      params: {
        organization: {
          type: 'string',
          format: 'uri',
          description: 'Organization URI',
        },
        user: {
          type: 'string',
          format: 'uri',
          description: 'User URI to filter by',
        },
        count: {
          type: 'number',
          description: 'Results per page',
          default: 20,
        },
        page_token: {
          type: 'string',
          description: 'Pagination token',
        },
      },
      responseHints: ['uri', 'role', 'user', 'organization', 'created_at', 'updated_at'],
    },

    {
      id: 'get_organization_membership',
      method: 'GET',
      path: '/organization_memberships/{uuid}',
      access: 'read',
      description: 'Get a specific organization membership.',
      params: {
        uuid: {
          type: 'string',
          description: 'Membership UUID',
          required: true,
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

    // ==================== INVITEE NO SHOWS ====================
    {
      id: 'mark_invitee_no_show',
      method: 'POST',
      path: '/invitee_no_shows',
      access: 'write',
      description: 'Mark an invitee as a no-show for a scheduled event.',
      body: {
        invitee: {
          type: 'string',
          format: 'uri',
          description: 'URI of the invitee to mark as no-show',
          required: true,
        },
      },
    },

    {
      id: 'unmark_invitee_no_show',
      method: 'DELETE',
      path: '/invitee_no_shows/{uuid}',
      access: 'write',
      description: 'Remove no-show status from an invitee.',
      params: {
        uuid: {
          type: 'string',
          description: 'No-show record UUID',
          required: true,
        },
      },
    },

    {
      id: 'get_invitee_no_show',
      method: 'GET',
      path: '/invitee_no_shows/{uuid}',
      access: 'read',
      description: 'Get details of a no-show record.',
      params: {
        uuid: {
          type: 'string',
          description: 'No-show record UUID',
          required: true,
        },
      },
    },
  ],
};
