/**
 * Zoho Recruit API v2 Manifest
 *
 * @see https://www.zoho.com/recruit/developer-guide/apiv2/
 */

import type { ProviderManifest } from '../types.js';

export const zohoRecruitManifest: ProviderManifest = {
  provider: 'zoho-recruit',
  displayName: 'Zoho Recruit',
  category: 'ats',
  baseUrl: 'https://recruit.zoho.com/recruit/v2',
  apiVersion: 'v2',

  auth: {
    type: 'bearer', // Zoho-oauthtoken {token}
  },

  rateLimit: {
    requests: 100,
    windowSeconds: 60,
  },

  regions: {
    us: { baseUrl: 'https://recruit.zoho.com/recruit/v2' },
    eu: { baseUrl: 'https://recruit.zoho.eu/recruit/v2' },
    cn: { baseUrl: 'https://recruit.zoho.com.cn/recruit/v2' },
    in: { baseUrl: 'https://recruit.zoho.in/recruit/v2' },
    au: { baseUrl: 'https://recruit.zoho.com.au/recruit/v2' },
  },

  blocklist: [
    '/settings',
    '/org',
    '/users',
    '/__schedule_mass_delete',
  ],

  operations: [
    // ==================== CANDIDATES ====================
    {
      id: 'list_candidates',
      method: 'GET',
      path: '/Candidates',
      access: 'read',
      description: 'List all candidates with pagination. Use search_candidates for filtering.',
      params: {
        fields: {
          type: 'string',
          description: 'Comma-separated field API names to return',
        },
        sort_order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
        },
        sort_by: {
          type: 'string',
          description: 'Field API name to sort by',
        },
        page: {
          type: 'number',
          description: 'Page number (starts at 1)',
          default: 1,
        },
        per_page: {
          type: 'number',
          description: 'Records per page (max 200)',
          default: 200,
        },
      },
      responseHints: [
        'id',
        'First_Name',
        'Last_Name',
        'Email',
        'Phone',
        'Mobile',
        'Current_Job_Title',
        'Current_Employer',
        'Skill_Set',
        'Source',
        'City',
        'Country',
      ],
    },

    {
      id: 'search_candidates',
      method: 'GET',
      path: '/Candidates/search',
      access: 'read',
      description: 'Search candidates using Zoho criteria syntax. Example: (First_Name:contains:John)',
      params: {
        criteria: {
          type: 'string',
          description: 'Search criteria in Zoho format: (field:operator:value). Operators: equals, contains, starts_with, ends_with',
          required: true,
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Search by exact email match (alternative to criteria)',
        },
        phone: {
          type: 'string',
          description: 'Search by phone number',
        },
        word: {
          type: 'string',
          description: 'Full-text search across all fields',
        },
        page: {
          type: 'number',
          default: 1,
          description: 'Page number',
        },
        per_page: {
          type: 'number',
          default: 200,
          description: 'Records per page',
        },
      },
    },

    {
      id: 'get_candidate',
      method: 'GET',
      path: '/Candidates/{id}',
      access: 'read',
      description: 'Get detailed information about a specific candidate.',
      params: {
        id: {
          type: 'string',
          description: 'Candidate record ID',
          required: true,
        },
      },
    },

    {
      id: 'create_candidate',
      method: 'POST',
      path: '/Candidates',
      access: 'write',
      description: 'Create a new candidate record in Zoho Recruit.',
      body: {
        First_Name: {
          type: 'string',
          description: 'First name',
        },
        Last_Name: {
          type: 'string',
          description: 'Last name',
          required: true,
        },
        Email: {
          type: 'string',
          format: 'email',
          description: 'Email address',
        },
        Phone: {
          type: 'string',
          description: 'Phone number',
        },
        Mobile: {
          type: 'string',
          description: 'Mobile number',
        },
        Current_Job_Title: {
          type: 'string',
          description: 'Current job title',
        },
        Current_Employer: {
          type: 'string',
          description: 'Current company/employer',
        },
        City: {
          type: 'string',
          description: 'City',
        },
        State: {
          type: 'string',
          description: 'State/Province',
        },
        Country: {
          type: 'string',
          description: 'Country',
        },
        Skill_Set: {
          type: 'string',
          description: 'Comma-separated skills',
        },
        Source: {
          type: 'string',
          description: 'Candidate source (e.g., LinkedIn, Career Site, Employee Referral)',
        },
        Experience_in_Years: {
          type: 'number',
          description: 'Years of experience',
        },
        Current_Salary: {
          type: 'number',
          description: 'Current salary',
        },
        Expected_Salary: {
          type: 'number',
          description: 'Expected salary',
        },
      },
      meta: {
        wrapInData: true, // Zoho requires { data: [record] }
      },
    },

    {
      id: 'update_candidate',
      method: 'PUT',
      path: '/Candidates',
      access: 'write',
      description: 'Update an existing candidate. Include the record ID in the body.',
      body: {
        id: {
          type: 'string',
          description: 'Candidate record ID to update',
          required: true,
        },
        First_Name: { type: 'string', description: 'First name' },
        Last_Name: { type: 'string', description: 'Last name' },
        Email: { type: 'string', format: 'email', description: 'Email' },
        Phone: { type: 'string', description: 'Phone' },
        Current_Job_Title: { type: 'string', description: 'Job title' },
        Current_Employer: { type: 'string', description: 'Employer' },
        Skill_Set: { type: 'string', description: 'Comma-separated skills' },
      },
      meta: {
        wrapInData: true,
      },
    },

    {
      id: 'delete_candidate',
      method: 'DELETE',
      path: '/Candidates',
      access: 'dangerous',
      description: 'Delete candidate records. This action cannot be undone.',
      params: {
        ids: {
          type: 'string',
          description: 'Comma-separated record IDs to delete',
          required: true,
        },
      },
    },

    {
      id: 'convert_candidate',
      method: 'POST',
      path: '/Candidates/{id}/actions/convert',
      access: 'write',
      description: 'Convert a candidate to a contact (after hiring).',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID to convert',
          required: true,
        },
      },
      body: {
        overwrite: {
          type: 'boolean',
          description: 'Overwrite existing contact if found',
          default: false,
        },
        notify_lead_owner: {
          type: 'boolean',
          description: 'Notify the lead owner',
          default: false,
        },
      },
    },

    // ==================== JOB OPENINGS ====================
    {
      id: 'list_job_openings',
      method: 'GET',
      path: '/Job_Openings',
      access: 'read',
      description: 'List all job openings.',
      params: {
        fields: {
          type: 'string',
          description: 'Comma-separated field names',
        },
        sort_order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
        },
        sort_by: {
          type: 'string',
          description: 'Field to sort by',
        },
        page: {
          type: 'number',
          default: 1,
          description: 'Page number',
        },
        per_page: {
          type: 'number',
          default: 200,
          description: 'Records per page',
        },
      },
      responseHints: [
        'id',
        'Posting_Title',
        'Job_Opening_Name',
        'Department_Name',
        'Job_Opening_Status',
        'Job_Type',
        'City',
        'Country',
        'Number_of_Positions',
      ],
    },

    {
      id: 'search_job_openings',
      method: 'GET',
      path: '/Job_Openings/search',
      access: 'read',
      description: 'Search job openings using criteria.',
      params: {
        criteria: {
          type: 'string',
          description: 'Search criteria (e.g., (Job_Opening_Status:equals:Open))',
          required: true,
        },
        page: {
          type: 'number',
          default: 1,
          description: 'Page number',
        },
        per_page: {
          type: 'number',
          default: 200,
          description: 'Records per page',
        },
      },
    },

    {
      id: 'get_job_opening',
      method: 'GET',
      path: '/Job_Openings/{id}',
      access: 'read',
      description: 'Get detailed information about a specific job opening.',
      params: {
        id: {
          type: 'string',
          description: 'Job Opening ID',
          required: true,
        },
      },
    },

    {
      id: 'create_job_opening',
      method: 'POST',
      path: '/Job_Openings',
      access: 'write',
      description: 'Create a new job opening.',
      body: {
        Posting_Title: {
          type: 'string',
          description: 'Job posting title',
          required: true,
        },
        Job_Opening_Name: {
          type: 'string',
          description: 'Internal job name',
        },
        Job_Opening_Status: {
          type: 'string',
          description: 'Status (Open, Closed, On-hold, Filled, Cancelled)',
          default: 'Open',
        },
        Department_Name: {
          type: 'string',
          description: 'Department',
        },
        Job_Type: {
          type: 'string',
          description: 'Employment type (Full-time, Part-time, Contract, etc.)',
        },
        Job_Description: {
          type: 'string',
          description: 'Full job description (HTML supported)',
        },
        Required_Skills: {
          type: 'string',
          description: 'Required skills (comma-separated)',
        },
        City: {
          type: 'string',
          description: 'City',
        },
        State: {
          type: 'string',
          description: 'State',
        },
        Country: {
          type: 'string',
          description: 'Country',
        },
        Number_of_Positions: {
          type: 'number',
          description: 'Number of openings',
          default: 1,
        },
        Min_Salary: {
          type: 'number',
          description: 'Minimum salary',
        },
        Max_Salary: {
          type: 'number',
          description: 'Maximum salary',
        },
      },
      meta: {
        wrapInData: true,
      },
    },

    {
      id: 'update_job_opening',
      method: 'PUT',
      path: '/Job_Openings',
      access: 'write',
      description: 'Update an existing job opening.',
      body: {
        id: {
          type: 'string',
          description: 'Job Opening ID',
          required: true,
        },
        Posting_Title: { type: 'string', description: 'Title' },
        Job_Opening_Status: { type: 'string', description: 'Status' },
        Job_Description: { type: 'string', description: 'Description' },
        Number_of_Positions: { type: 'number', description: 'Openings' },
      },
      meta: {
        wrapInData: true,
      },
    },

    // ==================== ASSOCIATED RECORDS (Applications) ====================
    {
      id: 'get_candidate_job_openings',
      method: 'GET',
      path: '/Candidates/{id}/Job_Openings',
      access: 'read',
      description: 'Get job openings associated with a candidate (their applications).',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
    },

    {
      id: 'get_job_opening_candidates',
      method: 'GET',
      path: '/Job_Openings/{id}/Candidates',
      access: 'read',
      description: 'Get candidates who applied to a specific job opening.',
      params: {
        id: {
          type: 'string',
          description: 'Job Opening ID',
          required: true,
        },
      },
    },

    {
      id: 'associate_candidate_to_job',
      method: 'PUT',
      path: '/Candidates/{candidate_id}/Job_Openings/{job_id}',
      access: 'write',
      description: 'Associate a candidate with a job opening (create application).',
      params: {
        candidate_id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
        job_id: {
          type: 'string',
          description: 'Job Opening ID',
          required: true,
        },
      },
    },

    // ==================== CANDIDATE STATUS / STAGES ====================
    {
      id: 'update_candidate_status',
      method: 'PUT',
      path: '/Candidates',
      access: 'write',
      description: 'Update candidate status/stage in the hiring pipeline.',
      body: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
        Candidate_Status: {
          type: 'string',
          description: 'New status (e.g., New, Qualified, Interview, Offered, Hired, Rejected)',
          required: true,
        },
      },
      meta: {
        wrapInData: true,
      },
    },

    // ==================== INTERVIEWS ====================
    {
      id: 'list_interviews',
      method: 'GET',
      path: '/Interviews',
      access: 'read',
      description: 'List all interviews.',
      params: {
        page: { type: 'number', default: 1, description: 'Page number' },
        per_page: { type: 'number', default: 200, description: 'Records per page' },
      },
    },

    {
      id: 'search_interviews',
      method: 'GET',
      path: '/Interviews/search',
      access: 'read',
      description: 'Search interviews by criteria.',
      params: {
        criteria: {
          type: 'string',
          description: 'Search criteria',
          required: true,
        },
      },
    },

    {
      id: 'get_interview',
      method: 'GET',
      path: '/Interviews/{id}',
      access: 'read',
      description: 'Get interview details.',
      params: {
        id: {
          type: 'string',
          description: 'Interview ID',
          required: true,
        },
      },
    },

    {
      id: 'create_interview',
      method: 'POST',
      path: '/Interviews',
      access: 'write',
      description: 'Schedule a new interview.',
      body: {
        Interview_Name: {
          type: 'string',
          description: 'Interview name/title',
          required: true,
        },
        Candidate_Name: {
          type: 'object',
          description: 'Candidate lookup (id field)',
          properties: {
            id: { type: 'string', description: 'Candidate ID', required: true },
          },
        },
        From: {
          type: 'string',
          format: 'date-time',
          description: 'Start datetime',
          required: true,
        },
        To: {
          type: 'string',
          format: 'date-time',
          description: 'End datetime',
          required: true,
        },
        Interview_Type: {
          type: 'string',
          description: 'Type (Phone, Video, In-person)',
        },
        Location: {
          type: 'string',
          description: 'Interview location or meeting link',
        },
        Interviewer: {
          type: 'object',
          description: 'Interviewer lookup (id field)',
          properties: {
            id: { type: 'string', description: 'User ID' },
          },
        },
      },
      meta: {
        wrapInData: true,
      },
    },

    {
      id: 'update_interview',
      method: 'PUT',
      path: '/Interviews',
      access: 'write',
      description: 'Update interview details.',
      body: {
        id: {
          type: 'string',
          description: 'Interview ID',
          required: true,
        },
        From: { type: 'string', format: 'date-time', description: 'Start time' },
        To: { type: 'string', format: 'date-time', description: 'End time' },
        Location: { type: 'string', description: 'Location' },
        Interview_Feedback: { type: 'string', description: 'Feedback notes' },
      },
      meta: {
        wrapInData: true,
      },
    },

    // ==================== NOTES ====================
    {
      id: 'get_candidate_notes',
      method: 'GET',
      path: '/Candidates/{id}/Notes',
      access: 'read',
      description: 'Get notes attached to a candidate.',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
    },

    {
      id: 'add_candidate_note',
      method: 'POST',
      path: '/Candidates/{id}/Notes',
      access: 'write',
      description: 'Add a note to a candidate record.',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
      body: {
        Note_Title: {
          type: 'string',
          description: 'Note title',
        },
        Note_Content: {
          type: 'string',
          description: 'Note content',
          required: true,
        },
      },
      meta: {
        wrapInData: true,
      },
    },

    // ==================== ATTACHMENTS ====================
    {
      id: 'get_candidate_attachments',
      method: 'GET',
      path: '/Candidates/{id}/Attachments',
      access: 'read',
      description: 'List attachments (resumes, etc.) for a candidate.',
      params: {
        id: {
          type: 'string',
          description: 'Candidate ID',
          required: true,
        },
      },
    },

    // ==================== COQL (Zoho Query Language) ====================
    {
      id: 'coql_query',
      method: 'POST',
      path: '/coql',
      access: 'read',
      description: 'Execute a COQL query for advanced data retrieval. Example: select First_Name, Last_Name from Candidates where City = \'San Francisco\'',
      body: {
        select_query: {
          type: 'string',
          description: 'COQL select query',
          required: true,
        },
      },
    },

    // ==================== BULK OPERATIONS ====================
    {
      id: 'bulk_read',
      method: 'POST',
      path: '/Candidates/actions/bulk_read',
      access: 'read',
      description: 'Start a bulk read job for large data exports. Returns job ID.',
      body: {
        query: {
          type: 'object',
          description: 'Query criteria for bulk read',
          properties: {
            module: { type: 'string', description: 'Module API name', required: true },
            page: { type: 'number', description: 'Page number' },
          },
        },
      },
    },

    {
      id: 'get_bulk_read_result',
      method: 'GET',
      path: '/Candidates/actions/bulk_read/{job_id}',
      access: 'read',
      description: 'Check status and get results of a bulk read job.',
      params: {
        job_id: {
          type: 'string',
          description: 'Bulk read job ID',
          required: true,
        },
      },
    },
  ],
};
