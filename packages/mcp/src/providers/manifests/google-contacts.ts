/**
 * Google Contacts (People API) Manifest
 *
 * Google Contacts for CRM-lite functionality.
 * Read-only access - users can query their contacts.
 *
 * @see https://developers.google.com/people/api/rest
 */

import type { ProviderManifest } from '../types.js';

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
    // ==================== CONNECTIONS (Contacts) ====================
    {
      id: 'list_contacts',
      method: 'GET',
      path: '/people/me/connections',
      access: 'read',
      description: 'List all contacts in the authenticated user\'s Google Contacts.',
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
          default: 'names,emailAddresses,phoneNumbers,organizations,addresses,birthdays,biographies',
          required: true,
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order',
          enum: ['LAST_MODIFIED_ASCENDING', 'LAST_MODIFIED_DESCENDING', 'FIRST_NAME_ASCENDING', 'LAST_NAME_ASCENDING'],
          default: 'LAST_MODIFIED_DESCENDING',
        },
      },
      responseHints: ['connections', 'resourceName', 'names', 'emailAddresses', 'phoneNumbers', 'organizations'],
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

    // ==================== SEARCH ====================
    {
      id: 'search_contacts',
      method: 'GET',
      path: '/people:searchContacts',
      access: 'read',
      description: 'Search for contacts by name, email, phone, or other fields.',
      params: {
        query: {
          type: 'string',
          description: 'Search query string',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Number of results (max 30)',
          default: 10,
        },
        readMask: {
          type: 'string',
          description: 'Fields to return (comma-separated)',
          default: 'names,emailAddresses,phoneNumbers,organizations',
          required: true,
        },
      },
      responseHints: ['results', 'person', 'names', 'emailAddresses'],
    },

    // ==================== CONTACT GROUPS ====================
    {
      id: 'list_contact_groups',
      method: 'GET',
      path: '/contactGroups',
      access: 'read',
      description: 'List all contact groups (labels) like "Family", "Work", etc.',
      params: {
        pageSize: {
          type: 'number',
          description: 'Number of groups to return (max 1000)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
        groupFields: {
          type: 'string',
          description: 'Fields to return',
          default: 'name,memberCount',
        },
      },
      responseHints: ['contactGroups', 'resourceName', 'name', 'memberCount', 'groupType'],
    },

    {
      id: 'get_contact_group',
      method: 'GET',
      path: '/contactGroups/{resourceName}',
      access: 'read',
      description: 'Get a contact group with its members.',
      params: {
        resourceName: {
          type: 'string',
          description: 'Group resource name (e.g., "contactGroups/family")',
          required: true,
        },
        maxMembers: {
          type: 'number',
          description: 'Maximum number of members to return',
          default: 100,
        },
        groupFields: {
          type: 'string',
          description: 'Fields to return',
          default: 'name,memberCount',
        },
      },
      responseHints: ['resourceName', 'name', 'memberCount', 'memberResourceNames'],
    },

    // ==================== OTHER CONTACTS ====================
    {
      id: 'list_other_contacts',
      method: 'GET',
      path: '/otherContacts',
      access: 'read',
      description: 'List "Other contacts" - people the user has interacted with but not explicitly added.',
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
        readMask: {
          type: 'string',
          description: 'Fields to return',
          default: 'names,emailAddresses,phoneNumbers',
          required: true,
        },
      },
      responseHints: ['otherContacts', 'resourceName', 'names', 'emailAddresses'],
    },
  ],
};
