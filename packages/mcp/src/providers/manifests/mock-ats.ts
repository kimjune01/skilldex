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

    // ============ INTERVIEW NOTES ============
    {
      id: 'list_interview_notes',
      method: 'GET',
      path: '/api/interview-notes',
      access: 'read',
      description: 'List interview notes with optional filtering. Returns summaries by default (use includeTranscript=true for full transcripts).',
      params: {
        candidateId: {
          type: 'string',
          description: 'Filter by candidate ID',
          required: false,
        },
        applicationId: {
          type: 'string',
          description: 'Filter by application ID',
          required: false,
        },
        jobId: {
          type: 'string',
          description: 'Filter by job ID',
          required: false,
        },
        type: {
          type: 'string',
          description: 'Filter by interview type',
          required: false,
          enum: ['phone_screen', 'technical', 'behavioral', 'hiring_manager', 'culture_fit', 'panel', 'debrief', 'other'],
        },
        includeTranscript: {
          type: 'boolean',
          description: 'Include full transcript in response (default: false)',
          required: false,
          default: false,
        },
      },
      responseHints: ['data', 'candidate', 'job', 'hasTranscript'],
    },
    {
      id: 'get_interview_note',
      method: 'GET',
      path: '/api/interview-notes/{id}',
      access: 'read',
      description: 'Get a specific interview note by ID, including full transcript',
      params: {
        id: {
          type: 'string',
          description: 'Interview note ID',
          required: true,
        },
      },
      responseHints: ['data', 'transcript', 'summary', 'highlights', 'concerns', 'recommendation'],
    },
    {
      id: 'get_candidate_interview_notes',
      method: 'GET',
      path: '/api/candidates/{id}/interview-notes',
      access: 'read',
      description: 'Get all interview notes for a specific candidate',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
        includeTranscript: {
          type: 'boolean',
          description: 'Include full transcripts in response (default: false)',
          required: false,
          default: false,
        },
      },
      responseHints: ['data', 'job', 'hasTranscript'],
    },
    {
      id: 'create_interview_note',
      method: 'POST',
      path: '/api/interview-notes',
      access: 'write',
      description: 'Create a new interview note for a candidate',
      body: {
        candidateId: {
          type: 'string',
          description: 'Candidate ID (required)',
          required: true,
        },
        applicationId: {
          type: 'string',
          description: 'Application ID',
          required: false,
        },
        jobId: {
          type: 'string',
          description: 'Job ID',
          required: false,
        },
        type: {
          type: 'string',
          description: 'Interview type (required)',
          required: true,
          enum: ['phone_screen', 'technical', 'behavioral', 'hiring_manager', 'culture_fit', 'panel', 'debrief', 'other'],
        },
        title: {
          type: 'string',
          description: 'Note title (required)',
          required: true,
        },
        interviewers: {
          type: 'array',
          description: 'List of interviewer names',
          required: false,
          items: { type: 'string', description: 'Interviewer name' },
        },
        interviewDate: {
          type: 'string',
          description: 'Interview date (ISO 8601)',
          required: false,
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes',
          required: false,
        },
        summary: {
          type: 'string',
          description: 'Interview summary',
          required: false,
        },
        transcript: {
          type: 'string',
          description: 'Full interview transcript',
          required: false,
        },
        rating: {
          type: 'number',
          description: 'Rating (1-5)',
          required: false,
        },
        recommendation: {
          type: 'string',
          description: 'Hiring recommendation',
          required: false,
          enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'],
        },
        highlights: {
          type: 'array',
          description: 'Key positive points',
          required: false,
          items: { type: 'string', description: 'Highlight' },
        },
        concerns: {
          type: 'array',
          description: 'Concerns or red flags',
          required: false,
          items: { type: 'string', description: 'Concern' },
        },
        source: {
          type: 'string',
          description: 'Source of the transcript',
          required: false,
          enum: ['manual', 'brighthire', 'metaview', 'otter', 'fireflies', 'zoom', 'google_meet', 'teams'],
        },
      },
      responseHints: ['data'],
    },
    {
      id: 'update_interview_note',
      method: 'PUT',
      path: '/api/interview-notes/{id}',
      access: 'write',
      description: 'Update an existing interview note',
      params: {
        id: {
          type: 'string',
          description: 'Interview note ID',
          required: true,
        },
      },
      body: {
        title: {
          type: 'string',
          description: 'Note title',
          required: false,
        },
        summary: {
          type: 'string',
          description: 'Interview summary',
          required: false,
        },
        transcript: {
          type: 'string',
          description: 'Full interview transcript',
          required: false,
        },
        rating: {
          type: 'number',
          description: 'Rating (1-5)',
          required: false,
        },
        recommendation: {
          type: 'string',
          description: 'Hiring recommendation',
          required: false,
          enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'],
        },
        highlights: {
          type: 'array',
          description: 'Key positive points',
          required: false,
          items: { type: 'string', description: 'Highlight' },
        },
        concerns: {
          type: 'array',
          description: 'Concerns or red flags',
          required: false,
          items: { type: 'string', description: 'Concern' },
        },
      },
      responseHints: ['data'],
    },
  ],

  blocklist: [],

  rateLimit: {
    requests: 1000,
    windowSeconds: 60,
  },
};
