import type { ProviderManifest } from '../types.js';

export const mockAtsManifest: ProviderManifest = {
  provider: 'mock-ats',
  displayName: 'Mock ATS',
  category: 'ats',
  baseUrl: process.env.MOCK_ATS_URL || 'http://localhost:3001',
  apiVersion: 'v1',

  auth: {
    type: 'bearer', // Mock ATS doesn't require auth, but we keep the structure
  },

  operations: [
    // ============ CANDIDATES ============
    {
      id: 'list_candidates',
      method: 'GET',
      path: '/api/candidates',
      access: 'read',
      description: 'List all candidates with optional search and filtering',
      params: {
        q: {
          type: 'string',
          description: 'Search query (searches name, email, headline, tags)',
          required: false,
        },
        tags: {
          type: 'string',
          description: 'Comma-separated list of tags to filter by',
          required: false,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
          required: false,
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
          required: false,
          default: 0,
        },
      },
      responseHints: ['data', 'pagination'],
    },
    {
      id: 'get_candidate',
      method: 'GET',
      path: '/api/candidates/{id}',
      access: 'read',
      description: 'Get a specific candidate by ID, including their applications',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
      responseHints: ['data', 'applications'],
    },
    {
      id: 'create_candidate',
      method: 'POST',
      path: '/api/candidates',
      access: 'write',
      description: 'Create a new candidate',
      body: {
        firstName: {
          type: 'string',
          description: 'First name (required)',
          required: true,
        },
        lastName: {
          type: 'string',
          description: 'Last name (required)',
          required: true,
        },
        email: {
          type: 'string',
          description: 'Email address (required)',
          required: true,
        },
        phone: {
          type: 'string',
          description: 'Phone number',
          required: false,
        },
        headline: {
          type: 'string',
          description: 'Professional headline (e.g., "Senior Software Engineer")',
          required: false,
        },
        summary: {
          type: 'string',
          description: 'Professional summary',
          required: false,
        },
        tags: {
          type: 'array',
          description: 'Tags for categorization (e.g., ["javascript", "senior"])',
          required: false,
          items: { type: 'string', description: 'Tag' },
        },
        source: {
          type: 'string',
          description: 'Source of candidate',
          required: false,
          enum: ['applied', 'sourced', 'referral', 'agency'],
        },
        sourceDetail: {
          type: 'string',
          description: 'Additional source details (e.g., "LinkedIn" or referrer name)',
          required: false,
        },
      },
      responseHints: ['data'],
    },
    {
      id: 'update_candidate',
      method: 'PUT',
      path: '/api/candidates/{id}',
      access: 'write',
      description: 'Update an existing candidate',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        firstName: {
          type: 'string',
          description: 'First name',
          required: false,
        },
        lastName: {
          type: 'string',
          description: 'Last name',
          required: false,
        },
        email: {
          type: 'string',
          description: 'Email address',
          required: false,
        },
        phone: {
          type: 'string',
          description: 'Phone number',
          required: false,
        },
        headline: {
          type: 'string',
          description: 'Professional headline',
          required: false,
        },
        summary: {
          type: 'string',
          description: 'Professional summary',
          required: false,
        },
        tags: {
          type: 'array',
          description: 'Tags for categorization',
          required: false,
          items: { type: 'string', description: 'Tag' },
        },
      },
      responseHints: ['data'],
    },

    // ============ JOBS ============
    {
      id: 'list_jobs',
      method: 'GET',
      path: '/api/jobs',
      access: 'read',
      description: 'List all job openings with optional filtering',
      params: {
        status: {
          type: 'string',
          description: 'Filter by status',
          required: false,
          enum: ['open', 'closed', 'draft', 'paused'],
        },
        department: {
          type: 'string',
          description: 'Filter by department name',
          required: false,
        },
      },
      responseHints: ['data'],
    },
    {
      id: 'get_job',
      method: 'GET',
      path: '/api/jobs/{id}',
      access: 'read',
      description: 'Get a specific job by ID, including application count',
      params: {
        id: {
          type: 'string',
          description: 'Job ID',
          required: true,
        },
      },
      responseHints: ['data', 'applicationCount'],
    },

    // ============ APPLICATIONS ============
    {
      id: 'list_applications',
      method: 'GET',
      path: '/api/applications',
      access: 'read',
      description: 'List applications with optional filtering by candidate, job, or status',
      params: {
        candidateId: {
          type: 'string',
          description: 'Filter by candidate ID',
          required: false,
        },
        jobId: {
          type: 'string',
          description: 'Filter by job ID',
          required: false,
        },
        status: {
          type: 'string',
          description: 'Filter by application status',
          required: false,
          enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
        },
      },
      responseHints: ['data', 'candidate', 'job'],
    },
    {
      id: 'advance_application',
      method: 'POST',
      path: '/api/applications/{id}/stage',
      access: 'write',
      description: 'Move an application to a new stage in the hiring pipeline',
      params: {
        id: {
          type: 'string',
          description: 'Application ID',
          required: true,
        },
      },
      body: {
        stage: {
          type: 'string',
          description: 'New stage name (e.g., "Phone Screen", "Technical Interview", "Onsite", "Offer")',
          required: true,
        },
        status: {
          type: 'string',
          description: 'Optional new status',
          required: false,
          enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
        },
      },
      responseHints: ['data', 'stageHistory'],
    },
  ],

  blocklist: [],

  rateLimit: {
    requests: 1000,
    windowSeconds: 60,
  },
};
