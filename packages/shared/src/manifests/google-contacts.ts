/**
 * Google Contacts (People API) Manifest
 *
 * Google Contacts for CRM-lite functionality.
 * Read-only access - users can list, search, and get contacts.
 *
 * @see https://developers.google.com/people/api/rest
 */

import type { ProviderManifest } from './types.js';

export const googleContactsManifest: ProviderManifest = {
  provider: 'google-contacts',
  displayName: 'Google Contacts',
  category: 'database',
  baseUrl: 'https://people.googleapis.com/v1',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  blocklist: [],

  operations: [
    {
      id: 'list_contacts',
      method: 'GET',
      path: '/people/me/connections',
      access: 'read',
      description: 'List all contacts.',
      params: {
        pageSize: {
          type: 'number',
          description: 'Number of contacts to return (max 1000)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
        personFields: {
          type: 'string',
          description: 'Fields to return (comma-separated)',
          default: 'names,emailAddresses,phoneNumbers,organizations',
          required: true,
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order',
          enum: ['LAST_MODIFIED_ASCENDING', 'LAST_MODIFIED_DESCENDING', 'FIRST_NAME_ASCENDING', 'LAST_NAME_ASCENDING'],
          default: 'FIRST_NAME_ASCENDING',
        },
      },
      responseHints: ['connections', 'resourceName', 'names', 'emailAddresses', 'phoneNumbers', 'organizations'],
    },

    {
      id: 'search_contacts',
      method: 'GET',
      path: '/people:searchContacts',
      access: 'read',
      description: 'Search contacts by name, email, or phone.',
      params: {
        query: {
          type: 'string',
          description: 'Search query',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Number of results (max 30)',
          default: 10,
        },
        readMask: {
          type: 'string',
          description: 'Fields to return',
          default: 'names,emailAddresses,phoneNumbers,organizations',
          required: true,
        },
      },
      responseHints: ['results', 'person', 'names', 'emailAddresses'],
    },

    {
      id: 'get_contact',
      method: 'GET',
      path: '/{resourceName}',
      access: 'read',
      description: 'Get a specific contact by resource name.',
      params: {
        resourceName: {
          type: 'string',
          description: 'Contact resource name (e.g., "people/c1234567890")',
          required: true,
        },
        personFields: {
          type: 'string',
          description: 'Fields to return',
          default: 'names,emailAddresses,phoneNumbers,organizations,addresses,birthdays,biographies,photos',
          required: true,
        },
      },
      responseHints: ['resourceName', 'names', 'emailAddresses', 'phoneNumbers', 'organizations', 'photos'],
    },
  ],
};
