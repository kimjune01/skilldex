/**
 * Google Drive API Manifest
 *
 * Google Drive for file storage and document access.
 * Read-only access for security - users can read files but not delete/modify.
 *
 * @see https://developers.google.com/drive/api/reference/rest/v3
 */

import type { ProviderManifest } from '../types.js';

export const googleDriveManifest: ProviderManifest = {
  provider: 'google-drive',
  displayName: 'Google Drive',
  category: 'database',
  baseUrl: 'https://www.googleapis.com/drive/v3',
  apiVersion: 'v3',

  auth: {
    type: 'bearer',
  },

  blocklist: [
    '/changes/watch', // Webhooks
    '/files/trash', // Trash operations
  ],

  operations: [
    // ==================== FILES ====================
    {
      id: 'list_files',
      method: 'GET',
      path: '/files',
      access: 'read',
      description: 'List files in Google Drive. Use query parameter to filter.',
      params: {
        q: {
          type: 'string',
          description: 'Search query (e.g., "name contains \'report\'" or "mimeType=\'application/pdf\'")',
        },
        pageSize: {
          type: 'number',
          description: 'Number of files to return (max 1000)',
          default: 100,
        },
        pageToken: {
          type: 'string',
          description: 'Page token for pagination',
        },
        orderBy: {
          type: 'string',
          description: 'Sort order (e.g., "modifiedTime desc", "name")',
          default: 'modifiedTime desc',
        },
        fields: {
          type: 'string',
          description: 'Fields to return',
          default: 'files(id,name,mimeType,modifiedTime,size,webViewLink,parents)',
        },
        spaces: {
          type: 'string',
          description: 'Spaces to search (drive, appDataFolder)',
          default: 'drive',
        },
      },
      responseHints: ['files', 'id', 'name', 'mimeType', 'modifiedTime', 'webViewLink'],
    },

    {
      id: 'get_file',
      method: 'GET',
      path: '/files/{fileId}',
      access: 'read',
      description: 'Get file metadata.',
      params: {
        fileId: {
          type: 'string',
          description: 'File ID',
          required: true,
        },
        fields: {
          type: 'string',
          description: 'Fields to return',
          default: 'id,name,mimeType,modifiedTime,size,webViewLink,parents,description',
        },
      },
      responseHints: ['id', 'name', 'mimeType', 'modifiedTime', 'webViewLink', 'description'],
    },

    {
      id: 'search_files',
      method: 'GET',
      path: '/files',
      access: 'read',
      description: 'Search for files by name or content.',
      params: {
        q: {
          type: 'string',
          description: 'Search query. Use fullText contains for content search.',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Number of results',
          default: 50,
        },
        fields: {
          type: 'string',
          description: 'Fields to return',
          default: 'files(id,name,mimeType,modifiedTime,webViewLink)',
        },
      },
      responseHints: ['files', 'id', 'name', 'mimeType', 'webViewLink'],
    },

    // ==================== FOLDERS ====================
    {
      id: 'list_folder_contents',
      method: 'GET',
      path: '/files',
      access: 'read',
      description: 'List contents of a specific folder.',
      params: {
        folderId: {
          type: 'string',
          description: 'Folder ID (use "root" for root folder)',
          required: true,
        },
        pageSize: {
          type: 'number',
          description: 'Number of files to return',
          default: 100,
        },
        orderBy: {
          type: 'string',
          description: 'Sort order',
          default: 'folder,name',
        },
        fields: {
          type: 'string',
          description: 'Fields to return',
          default: 'files(id,name,mimeType,modifiedTime,size,webViewLink)',
        },
      },
      responseHints: ['files', 'id', 'name', 'mimeType'],
      meta: {
        queryBuilder: (params: Record<string, unknown>) =>
          `'${params.folderId}' in parents and trashed = false`,
      },
    },

    // ==================== EXPORT ====================
    {
      id: 'export_file',
      method: 'GET',
      path: '/files/{fileId}/export',
      access: 'read',
      description: 'Export a Google Workspace document (Docs, Sheets, Slides) to another format.',
      params: {
        fileId: {
          type: 'string',
          description: 'File ID of the Google Workspace document',
          required: true,
        },
        mimeType: {
          type: 'string',
          description: 'Export format (e.g., "text/plain", "application/pdf", "text/csv")',
          required: true,
          enum: [
            'text/plain',
            'text/html',
            'application/pdf',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        },
      },
      responseHints: [],
    },

    // ==================== ABOUT ====================
    {
      id: 'get_about',
      method: 'GET',
      path: '/about',
      access: 'read',
      description: 'Get information about the user and their Drive (storage quota, etc.).',
      params: {
        fields: {
          type: 'string',
          description: 'Fields to return',
          default: 'user,storageQuota',
        },
      },
      responseHints: ['user', 'storageQuota', 'limit', 'usage'],
    },
  ],
};
