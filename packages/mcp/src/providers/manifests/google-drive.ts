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

  blocklist: [],

  operations: [
    {
      id: 'list_files',
      method: 'GET',
      path: '/files',
      access: 'read',
      description: 'List or search files. Use q parameter to filter (e.g., "name contains \'report\'" or "\'folderId\' in parents").',
      params: {
        q: {
          type: 'string',
          description: 'Search query (e.g., "name contains \'report\'", "mimeType=\'application/pdf\'", "\'folderId\' in parents")',
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
      },
      responseHints: ['files', 'id', 'name', 'mimeType', 'modifiedTime', 'webViewLink'],
    },

    {
      id: 'get_file',
      method: 'GET',
      path: '/files/{fileId}',
      access: 'read',
      description: 'Get file metadata by ID.',
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
      id: 'export_file',
      method: 'GET',
      path: '/files/{fileId}/export',
      access: 'read',
      description: 'Export a Google Workspace document (Docs, Sheets, Slides) to text, PDF, or other formats.',
      params: {
        fileId: {
          type: 'string',
          description: 'File ID of the Google Workspace document',
          required: true,
        },
        mimeType: {
          type: 'string',
          description: 'Export format',
          required: true,
          enum: [
            'text/plain',
            'text/html',
            'application/pdf',
            'text/csv',
          ],
        },
      },
      responseHints: [],
    },
  ],
};
