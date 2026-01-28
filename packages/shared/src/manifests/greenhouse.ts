/**
 * Greenhouse Harvest API Manifest
 *
 * @see https://developers.greenhouse.io/harvest.html
 */

import type { ProviderManifest } from './types.js';

export const greenhouseManifest: ProviderManifest = {
  provider: 'greenhouse',
  displayName: 'Greenhouse',
  category: 'ats',
  baseUrl: 'https://harvest.greenhouse.io/v1',
  apiVersion: 'v1',

  auth: {
    type: 'basic', // API token as username, blank password
  },

  rateLimit: {
    requests: 50,
    windowSeconds: 10,
  },

  blocklist: [
    '/users',
    '/user_roles',
    '/custom_fields',
    '/webhooks',
    '/tracking_links',
    '/eeoc',
    '/demographics',
  ],

  operations: [
    // ==================== CANDIDATES ====================
    {
      id: 'list_candidates',
      method: 'GET',
      path: '/candidates',
      access: 'read',
      description: 'List all candidates with optional filtering. Returns paginated results.',
      params: {
        job_id: {
          type: 'number',
          description: 'Filter by job ID',
        },
        created_before: {
          type: 'string',
          format: 'date-time',
          description: 'Filter candidates created before this timestamp (ISO-8601)',
        },
        created_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter candidates created after this timestamp (ISO-8601)',
        },
        updated_before: {
          type: 'string',
          format: 'date-time',
          description: 'Filter candidates updated before this timestamp',
        },
        updated_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter candidates updated after this timestamp',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Filter by exact email match',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 500)',
          default: 100,
        },
        page: {
          type: 'number',
          description: 'Page number',
        },
      },
      responseHints: [
        'id',
        'first_name',
        'last_name',
        'company',
        'title',
        'emails',
        'phone_numbers',
        'addresses',
        'applications',
        'tags',
      ],
    },

    {
      id: 'get_candidate',
      method: 'GET',
      path: '/candidates/{id}',
      access: 'read',
      description: 'Get detailed information about a specific candidate including applications and attachments.',
      params: {
        id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
    },

    {
      id: 'create_candidate',
      method: 'POST',
      path: '/candidates',
      access: 'write',
      description: 'Add a new candidate to Greenhouse. Requires On-Behalf-Of header.',
      body: {
        first_name: {
          type: 'string',
          description: 'First name',
          required: true,
        },
        last_name: {
          type: 'string',
          description: 'Last name',
          required: true,
        },
        company: {
          type: 'string',
          description: 'Current company',
        },
        title: {
          type: 'string',
          description: 'Current job title',
        },
        phone_numbers: {
          type: 'array',
          description: 'Phone numbers with type (home, work, mobile)',
          items: {
            type: 'object',
            description: 'Phone number object',
            properties: {
              value: { type: 'string', description: 'Phone number' },
              type: { type: 'string', description: 'Type: home, work, mobile' },
            },
          },
        },
        email_addresses: {
          type: 'array',
          description: 'Email addresses with type',
          items: {
            type: 'object',
            description: 'Email object',
            properties: {
              value: { type: 'string', description: 'Email address' },
              type: { type: 'string', description: 'Type: personal, work' },
            },
          },
        },
        tags: {
          type: 'array',
          description: 'Tags to assign',
          items: { type: 'string', description: 'Tag name' },
        },
        applications: {
          type: 'array',
          description: 'Job applications to create',
          items: {
            type: 'object',
            description: 'Application object',
            properties: {
              job_id: { type: 'number', description: 'Job ID to apply for', required: true },
            },
          },
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'update_candidate',
      method: 'PATCH',
      path: '/candidates/{id}',
      access: 'write',
      description: 'Update an existing candidate. Requires On-Behalf-Of header.',
      params: {
        id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        company: { type: 'string', description: 'Current company' },
        title: { type: 'string', description: 'Current job title' },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'delete_candidate',
      method: 'DELETE',
      path: '/candidates/{id}',
      access: 'dangerous',
      description: 'Permanently delete a candidate and all associated data. This cannot be undone.',
      params: {
        id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'anonymize_candidate',
      method: 'PUT',
      path: '/candidates/{id}/anonymize',
      access: 'dangerous',
      description: 'Anonymize candidate data for GDPR compliance. This cannot be undone.',
      params: {
        id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        fields: {
          type: 'array',
          description: 'Fields to anonymize',
          items: { type: 'string', description: 'Field name' },
        },
      },
    },

    {
      id: 'add_candidate_note',
      method: 'POST',
      path: '/candidates/{id}/activity_feed/notes',
      access: 'write',
      description: 'Add a note to a candidate profile.',
      params: {
        id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        user_id: {
          type: 'number',
          description: 'User ID creating the note',
          required: true,
        },
        body: {
          type: 'string',
          description: 'Note content (plain text or HTML)',
          required: true,
        },
        visibility: {
          type: 'string',
          description: 'Visibility: admin_only, private, public',
          enum: ['admin_only', 'private', 'public'],
          default: 'public',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    // ==================== APPLICATIONS ====================
    {
      id: 'list_applications',
      method: 'GET',
      path: '/applications',
      access: 'read',
      description: 'List all applications with optional filtering.',
      params: {
        job_id: {
          type: 'number',
          description: 'Filter by job ID',
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['active', 'converted', 'hired', 'rejected'],
        },
        created_before: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by creation date',
        },
        created_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by creation date',
        },
        per_page: {
          type: 'number',
          default: 100,
          description: 'Results per page',
        },
      },
    },

    {
      id: 'get_application',
      method: 'GET',
      path: '/applications/{id}',
      access: 'read',
      description: 'Get detailed application information including current stage and history.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
    },

    {
      id: 'create_application',
      method: 'POST',
      path: '/candidates/{candidate_id}/applications',
      access: 'write',
      description: 'Create a new application for an existing candidate.',
      params: {
        candidate_id: {
          type: 'number',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        job_id: {
          type: 'number',
          description: 'Job ID to apply for',
          required: true,
        },
        source_id: {
          type: 'number',
          description: 'Source ID for attribution',
        },
        referrer: {
          type: 'object',
          description: 'Referrer information',
          properties: {
            type: { type: 'string', description: 'Type: id or email' },
            value: { type: 'string', description: 'User ID or email' },
          },
        },
        initial_stage_id: {
          type: 'number',
          description: 'Starting stage (defaults to first stage)',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'advance_application',
      method: 'POST',
      path: '/applications/{id}/advance',
      access: 'write',
      description: 'Move application to the next stage in the pipeline.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        from_stage_id: {
          type: 'number',
          description: 'Current stage ID (for validation)',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'move_application',
      method: 'POST',
      path: '/applications/{id}/move',
      access: 'write',
      description: 'Move application to a specific stage within the same job.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        from_stage_id: {
          type: 'number',
          description: 'Current stage ID',
        },
        to_stage_id: {
          type: 'number',
          description: 'Target stage ID',
          required: true,
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'transfer_application',
      method: 'POST',
      path: '/applications/{id}/transfer_to_job',
      access: 'write',
      description: 'Transfer application to a different job.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        new_job_id: {
          type: 'number',
          description: 'Target job ID',
          required: true,
        },
        new_stage_id: {
          type: 'number',
          description: 'Target stage ID in new job',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'reject_application',
      method: 'POST',
      path: '/applications/{id}/reject',
      access: 'write',
      description: 'Reject an application with optional reason.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        rejection_reason_id: {
          type: 'number',
          description: 'Rejection reason ID',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about rejection',
        },
        rejection_email: {
          type: 'object',
          description: 'Optional rejection email configuration',
          properties: {
            send_email_at: { type: 'string', format: 'date-time', description: 'When to send' },
            email_template_id: { type: 'number', description: 'Template ID' },
          },
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'unreject_application',
      method: 'POST',
      path: '/applications/{id}/unreject',
      access: 'write',
      description: 'Revert a rejected application back to active status.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'hire_application',
      method: 'POST',
      path: '/applications/{id}/hire',
      access: 'write',
      description: 'Mark application as hired.',
      params: {
        id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        start_date: {
          type: 'string',
          format: 'date',
          description: 'Start date (YYYY-MM-DD)',
        },
        opening_id: {
          type: 'number',
          description: 'Job opening ID to fill',
        },
        close_reason_id: {
          type: 'number',
          description: 'Close reason ID',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    // ==================== JOBS ====================
    {
      id: 'list_jobs',
      method: 'GET',
      path: '/jobs',
      access: 'read',
      description: 'List all jobs with optional filtering.',
      params: {
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['open', 'closed', 'draft'],
        },
        department_id: {
          type: 'number',
          description: 'Filter by department',
        },
        office_id: {
          type: 'number',
          description: 'Filter by office/location',
        },
        per_page: {
          type: 'number',
          default: 100,
          description: 'Results per page',
        },
      },
    },

    {
      id: 'get_job',
      method: 'GET',
      path: '/jobs/{id}',
      access: 'read',
      description: 'Get detailed job information including hiring team and openings.',
      params: {
        id: {
          type: 'number',
          description: 'Job ID',
          required: true,
        },
      },
    },

    {
      id: 'get_job_stages',
      method: 'GET',
      path: '/jobs/{id}/stages',
      access: 'read',
      description: 'Get the interview stages/pipeline for a job.',
      params: {
        id: {
          type: 'number',
          description: 'Job ID',
          required: true,
        },
      },
    },

    {
      id: 'get_hiring_team',
      method: 'GET',
      path: '/jobs/{id}/hiring_team',
      access: 'read',
      description: 'Get the hiring team members for a job.',
      params: {
        id: {
          type: 'number',
          description: 'Job ID',
          required: true,
        },
      },
    },

    // ==================== SCORECARDS ====================
    {
      id: 'list_scorecards',
      method: 'GET',
      path: '/scorecards',
      access: 'read',
      description: 'List interview scorecards with optional filtering.',
      params: {
        application_id: {
          type: 'number',
          description: 'Filter by application',
        },
        interview_id: {
          type: 'number',
          description: 'Filter by interview',
        },
        created_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by creation date',
        },
        updated_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by update date',
        },
        per_page: {
          type: 'number',
          default: 100,
          description: 'Results per page',
        },
      },
    },

    {
      id: 'get_scorecard',
      method: 'GET',
      path: '/scorecards/{id}',
      access: 'read',
      description: 'Get detailed scorecard information including ratings and notes.',
      params: {
        id: {
          type: 'number',
          description: 'Scorecard ID',
          required: true,
        },
      },
    },

    // ==================== SCHEDULED INTERVIEWS ====================
    {
      id: 'list_scheduled_interviews',
      method: 'GET',
      path: '/scheduled_interviews',
      access: 'read',
      description: 'List scheduled interviews with optional filtering.',
      params: {
        application_id: {
          type: 'number',
          description: 'Filter by application',
        },
        job_id: {
          type: 'number',
          description: 'Filter by job',
        },
        starts_before: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by start time',
        },
        starts_after: {
          type: 'string',
          format: 'date-time',
          description: 'Filter by start time',
        },
        per_page: {
          type: 'number',
          default: 100,
          description: 'Results per page',
        },
      },
    },

    {
      id: 'get_scheduled_interview',
      method: 'GET',
      path: '/scheduled_interviews/{id}',
      access: 'read',
      description: 'Get details of a scheduled interview.',
      params: {
        id: {
          type: 'number',
          description: 'Interview ID',
          required: true,
        },
      },
    },

    {
      id: 'create_scheduled_interview',
      method: 'POST',
      path: '/applications/{application_id}/scheduled_interviews',
      access: 'write',
      description: 'Schedule a new interview for an application.',
      params: {
        application_id: {
          type: 'number',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        user_id: {
          type: 'number',
          description: 'Interviewer user ID',
          required: true,
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Interview start time (ISO-8601)',
          required: true,
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'Interview end time (ISO-8601)',
          required: true,
        },
        interview_id: {
          type: 'number',
          description: 'Interview type/template ID',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'update_scheduled_interview',
      method: 'PATCH',
      path: '/scheduled_interviews/{id}',
      access: 'write',
      description: 'Update a scheduled interview.',
      params: {
        id: {
          type: 'number',
          description: 'Interview ID',
          required: true,
        },
      },
      body: {
        start: {
          type: 'string',
          format: 'date-time',
          description: 'New start time',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'New end time',
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    {
      id: 'delete_scheduled_interview',
      method: 'DELETE',
      path: '/scheduled_interviews/{id}',
      access: 'write',
      description: 'Cancel/delete a scheduled interview.',
      params: {
        id: {
          type: 'number',
          description: 'Interview ID',
          required: true,
        },
      },
      meta: {
        requiresOnBehalfOf: true,
      },
    },

    // ==================== SOURCES & REFERRALS ====================
    {
      id: 'list_sources',
      method: 'GET',
      path: '/sources',
      access: 'read',
      description: 'List all candidate sources for attribution.',
    },

    {
      id: 'list_rejection_reasons',
      method: 'GET',
      path: '/rejection_reasons',
      access: 'read',
      description: 'List all rejection reasons.',
    },

    // ==================== DEPARTMENTS & OFFICES ====================
    {
      id: 'list_departments',
      method: 'GET',
      path: '/departments',
      access: 'read',
      description: 'List all departments.',
    },

    {
      id: 'list_offices',
      method: 'GET',
      path: '/offices',
      access: 'read',
      description: 'List all office locations.',
    },
  ],
};
