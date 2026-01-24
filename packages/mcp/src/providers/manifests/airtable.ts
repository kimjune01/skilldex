/**
 * Airtable API Manifest
 *
 * Airtable is a spreadsheet-database hybrid used for CRM, project management, etc.
 * The API is hierarchical: Bases > Tables > Records
 *
 * @see https://airtable.com/developers/web/api/introduction
 */

import type { ProviderManifest } from '../types.js';

export const airtableManifest: ProviderManifest = {
  provider: 'airtable',
  displayName: 'Airtable',
  category: 'database',
  baseUrl: 'https://api.airtable.com/v0',
  apiVersion: 'v0',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 5, // Airtable has strict rate limits: 5 requests/second
    windowSeconds: 1,
  },

  // Security blocklist - sensitive endpoints
  blocklist: [
    '/enterprise', // Enterprise admin APIs
  ],

  operations: [
    // ==================== BASES ====================
    {
      id: 'list_bases',
      method: 'GET',
      path: '/meta/bases',
      access: 'read',
      description:
        'List all bases (databases) the user has access to. Returns base IDs and names needed for other operations.',
      params: {
        offset: {
          type: 'string',
          description: 'Pagination offset from previous response',
        },
      },
      responseHints: ['bases', 'id', 'name', 'permissionLevel'],
    },

    {
      id: 'get_base_schema',
      method: 'GET',
      path: '/meta/bases/{baseId}/tables',
      access: 'read',
      description:
        'Get the schema of a base including all tables and their fields. Use this to understand the structure before querying.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base (starts with "app")',
          required: true,
        },
      },
      responseHints: ['tables', 'id', 'name', 'fields', 'primaryFieldId'],
    },

    // ==================== RECORDS ====================
    {
      id: 'list_records',
      method: 'GET',
      path: '/{baseId}/{tableIdOrName}',
      access: 'read',
      description:
        'List records from a table. Supports filtering, sorting, and field selection. Returns up to 100 records per page.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base (starts with "app")',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID (starts with "tbl") or URL-encoded table name',
          required: true,
        },
        fields: {
          type: 'array',
          description: 'Only return specific fields (array of field names)',
          items: { type: 'string', description: 'Field name' },
        },
        filterByFormula: {
          type: 'string',
          description:
            'Airtable formula to filter records (e.g., "{Status} = \'Active\'" or "FIND(\'search\', {Name})")',
        },
        maxRecords: {
          type: 'number',
          description: 'Maximum total records to return (default: 100)',
          default: 100,
        },
        pageSize: {
          type: 'number',
          description: 'Records per page (max 100)',
          default: 100,
        },
        sort: {
          type: 'array',
          description: 'Sort order as array of {field, direction} objects',
          items: {
            type: 'object',
            description: 'Sort specification',
            properties: {
              field: { type: 'string', description: 'Field name to sort by', required: true },
              direction: {
                type: 'string',
                description: 'Sort direction',
                enum: ['asc', 'desc'],
              },
            },
          },
        },
        view: {
          type: 'string',
          description: 'Name or ID of a view to use (applies its filters/sorts)',
        },
        offset: {
          type: 'string',
          description: 'Pagination offset from previous response',
        },
      },
      responseHints: ['records', 'id', 'fields', 'createdTime', 'offset'],
    },

    {
      id: 'get_record',
      method: 'GET',
      path: '/{baseId}/{tableIdOrName}/{recordId}',
      access: 'read',
      description: 'Get a single record by its ID.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID or name',
          required: true,
        },
        recordId: {
          type: 'string',
          description: 'Record ID (starts with "rec")',
          required: true,
        },
      },
      responseHints: ['id', 'fields', 'createdTime'],
    },

    {
      id: 'create_records',
      method: 'POST',
      path: '/{baseId}/{tableIdOrName}',
      access: 'write',
      description:
        'Create one or more records in a table. Can create up to 10 records per request.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID or name',
          required: true,
        },
      },
      body: {
        records: {
          type: 'array',
          description: 'Array of records to create (max 10)',
          required: true,
          items: {
            type: 'object',
            description: 'Record object',
            properties: {
              fields: {
                type: 'object',
                description: 'Field name to value mapping',
                required: true,
              },
            },
          },
        },
        typecast: {
          type: 'boolean',
          description:
            'If true, Airtable will try to convert string values to appropriate types',
          default: false,
        },
      },
      responseHints: ['records', 'id', 'fields', 'createdTime'],
    },

    {
      id: 'update_records',
      method: 'PATCH',
      path: '/{baseId}/{tableIdOrName}',
      access: 'write',
      description:
        'Update one or more existing records. Only specified fields are updated (partial update). Max 10 records per request.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID or name',
          required: true,
        },
      },
      body: {
        records: {
          type: 'array',
          description: 'Array of records to update (max 10)',
          required: true,
          items: {
            type: 'object',
            description: 'Record object with ID',
            properties: {
              id: {
                type: 'string',
                description: 'Record ID to update',
                required: true,
              },
              fields: {
                type: 'object',
                description: 'Field name to value mapping (only specified fields are updated)',
                required: true,
              },
            },
          },
        },
        typecast: {
          type: 'boolean',
          description: 'If true, Airtable will try to convert string values',
          default: false,
        },
      },
      responseHints: ['records', 'id', 'fields', 'createdTime'],
    },

    {
      id: 'replace_records',
      method: 'PUT',
      path: '/{baseId}/{tableIdOrName}',
      access: 'write',
      description:
        'Replace one or more records entirely. Unspecified fields will be cleared. Max 10 records per request.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID or name',
          required: true,
        },
      },
      body: {
        records: {
          type: 'array',
          description: 'Array of records to replace (max 10)',
          required: true,
          items: {
            type: 'object',
            description: 'Record object with ID',
            properties: {
              id: {
                type: 'string',
                description: 'Record ID to replace',
                required: true,
              },
              fields: {
                type: 'object',
                description: 'Complete field mapping (unspecified fields are cleared)',
                required: true,
              },
            },
          },
        },
        typecast: {
          type: 'boolean',
          description: 'If true, Airtable will try to convert string values',
          default: false,
        },
      },
      responseHints: ['records', 'id', 'fields', 'createdTime'],
    },

    {
      id: 'delete_records',
      method: 'DELETE',
      path: '/{baseId}/{tableIdOrName}',
      access: 'delete',
      description: 'Delete one or more records by ID. Max 10 records per request.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableIdOrName: {
          type: 'string',
          description: 'Table ID or name',
          required: true,
        },
        records: {
          type: 'array',
          description: 'Array of record IDs to delete (max 10)',
          required: true,
          items: { type: 'string', description: 'Record ID' },
        },
      },
      responseHints: ['records', 'id', 'deleted'],
    },

    // ==================== TABLE MANAGEMENT ====================
    {
      id: 'create_table',
      method: 'POST',
      path: '/meta/bases/{baseId}/tables',
      access: 'write',
      description: 'Create a new table in a base with specified fields.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'Name for the new table',
          required: true,
        },
        description: {
          type: 'string',
          description: 'Optional description for the table',
        },
        fields: {
          type: 'array',
          description: 'Array of field definitions',
          required: true,
          items: {
            type: 'object',
            description: 'Field definition',
            properties: {
              name: { type: 'string', description: 'Field name', required: true },
              type: {
                type: 'string',
                description: 'Field type',
                enum: [
                  'singleLineText',
                  'email',
                  'url',
                  'multilineText',
                  'number',
                  'percent',
                  'currency',
                  'singleSelect',
                  'multipleSelects',
                  'singleCollaborator',
                  'multipleCollaborators',
                  'multipleRecordLinks',
                  'date',
                  'dateTime',
                  'phoneNumber',
                  'multipleAttachments',
                  'checkbox',
                  'formula',
                  'createdTime',
                  'rollup',
                  'count',
                  'lookup',
                  'multipleLookupValues',
                  'autoNumber',
                  'barcode',
                  'rating',
                  'richText',
                  'duration',
                  'lastModifiedTime',
                  'button',
                  'createdBy',
                  'lastModifiedBy',
                  'externalSyncSource',
                ],
                required: true,
              },
              description: { type: 'string', description: 'Field description' },
              options: { type: 'object', description: 'Type-specific options' },
            },
          },
        },
      },
      responseHints: ['id', 'name', 'fields', 'primaryFieldId'],
    },

    {
      id: 'update_table',
      method: 'PATCH',
      path: '/meta/bases/{baseId}/tables/{tableId}',
      access: 'write',
      description: 'Update a table name or description.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableId: {
          type: 'string',
          description: 'The ID of the table to update',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'New name for the table',
        },
        description: {
          type: 'string',
          description: 'New description for the table',
        },
      },
      responseHints: ['id', 'name', 'description'],
    },

    // ==================== FIELD MANAGEMENT ====================
    {
      id: 'create_field',
      method: 'POST',
      path: '/meta/bases/{baseId}/tables/{tableId}/fields',
      access: 'write',
      description: 'Add a new field (column) to a table.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableId: {
          type: 'string',
          description: 'The ID of the table',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'Name for the new field',
          required: true,
        },
        type: {
          type: 'string',
          description: 'Field type (singleLineText, number, singleSelect, etc.)',
          required: true,
        },
        description: {
          type: 'string',
          description: 'Optional field description',
        },
        options: {
          type: 'object',
          description: 'Type-specific options (e.g., choices for singleSelect)',
        },
      },
      responseHints: ['id', 'name', 'type', 'description'],
    },

    {
      id: 'update_field',
      method: 'PATCH',
      path: '/meta/bases/{baseId}/tables/{tableId}/fields/{fieldId}',
      access: 'write',
      description: 'Update a field name, description, or options.',
      params: {
        baseId: {
          type: 'string',
          description: 'The ID of the base',
          required: true,
        },
        tableId: {
          type: 'string',
          description: 'The ID of the table',
          required: true,
        },
        fieldId: {
          type: 'string',
          description: 'The ID of the field to update',
          required: true,
        },
      },
      body: {
        name: {
          type: 'string',
          description: 'New name for the field',
        },
        description: {
          type: 'string',
          description: 'New description for the field',
        },
      },
      responseHints: ['id', 'name', 'type', 'description'],
    },
  ],
};
