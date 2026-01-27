/**
 * Google Sheets API Manifest
 *
 * Google Sheets is a cloud-based spreadsheet used for data storage, tracking, and collaboration.
 * The API provides access to spreadsheets, sheets, and cell values.
 *
 * @see https://developers.google.com/workspace/sheets/api/reference/rest
 */

import type { ProviderManifest } from './types.js';

export const googleSheetsManifest: ProviderManifest = {
  provider: 'google-sheets',
  displayName: 'Google Sheets',
  category: 'database',
  baseUrl: 'https://sheets.googleapis.com/v4',
  apiVersion: 'v4',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 60,
    windowSeconds: 60,
  },

  blocklist: [],

  operations: [
    {
      id: 'create_spreadsheet',
      method: 'POST',
      path: '/spreadsheets',
      access: 'write',
      description:
        'Create a new spreadsheet. Returns the newly created spreadsheet with its ID and URL.',
      body: {
        title: {
          type: 'string',
          description: 'The title of the new spreadsheet',
          required: true,
        },
        sheets: {
          type: 'array',
          description: 'Optional array of sheet names to create',
          items: {
            type: 'string',
            description: 'Sheet name',
          },
        },
      },
      responseHints: ['spreadsheetId', 'spreadsheetUrl', 'properties', 'sheets'],
    },

    {
      id: 'get_spreadsheet',
      method: 'GET',
      path: '/spreadsheets/{spreadsheetId}',
      access: 'read',
      description:
        'Get spreadsheet metadata including all sheet names and properties. Use this to discover available sheets before reading data.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet (from the URL)',
          required: true,
        },
        includeGridData: {
          type: 'boolean',
          description: 'Whether to include cell data (default false for performance)',
          default: false,
        },
      },
      responseHints: ['spreadsheetId', 'properties', 'sheets', 'title'],
    },

    {
      id: 'read_range',
      method: 'GET',
      path: '/spreadsheets/{spreadsheetId}/values/{range}',
      access: 'read',
      description:
        'Read values from a range of cells. Use A1 notation like "Sheet1!A1:D10" or "A1:D10" for first sheet.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
        range: {
          type: 'string',
          description: 'The A1 notation range to read (e.g., "Sheet1!A1:D10", "A:D", "1:100")',
          required: true,
        },
        majorDimension: {
          type: 'string',
          description: 'How to interpret the data: ROWS (default) or COLUMNS',
          enum: ['ROWS', 'COLUMNS'],
          default: 'ROWS',
        },
        valueRenderOption: {
          type: 'string',
          description: 'How values should be rendered: FORMATTED_VALUE (default), UNFORMATTED_VALUE, or FORMULA',
          enum: ['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'],
          default: 'FORMATTED_VALUE',
        },
      },
      responseHints: ['range', 'majorDimension', 'values'],
    },

    {
      id: 'batch_read_ranges',
      method: 'GET',
      path: '/spreadsheets/{spreadsheetId}/values:batchGet',
      access: 'read',
      description:
        'Read multiple ranges of values in a single request. More efficient than multiple read_range calls.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
        ranges: {
          type: 'array',
          description: 'Array of A1 notation ranges to read',
          items: {
            type: 'string',
            description: 'A1 notation range',
          },
          required: true,
        },
        majorDimension: {
          type: 'string',
          description: 'How to interpret the data: ROWS (default) or COLUMNS',
          enum: ['ROWS', 'COLUMNS'],
          default: 'ROWS',
        },
      },
      responseHints: ['spreadsheetId', 'valueRanges', 'range', 'values'],
    },

    {
      id: 'write_range',
      method: 'PUT',
      path: '/spreadsheets/{spreadsheetId}/values/{range}',
      access: 'write',
      description:
        'Write values to a range of cells. Overwrites existing data in the range.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
        range: {
          type: 'string',
          description: 'The A1 notation range to write (e.g., "Sheet1!A1:D10")',
          required: true,
        },
        valueInputOption: {
          type: 'string',
          description: 'How input should be interpreted: RAW or USER_ENTERED (parses formulas)',
          enum: ['RAW', 'USER_ENTERED'],
          default: 'USER_ENTERED',
          required: true,
        },
      },
      body: {
        values: {
          type: 'array',
          description: 'Array of rows, where each row is an array of cell values',
          items: {
            type: 'array',
            description: 'Row of cell values',
            items: {
              type: 'string',
              description: 'Cell value (string, number, or formula)',
            },
          },
          required: true,
        },
      },
      responseHints: ['spreadsheetId', 'updatedRange', 'updatedRows', 'updatedColumns', 'updatedCells'],
    },

    {
      id: 'append_rows',
      method: 'POST',
      path: '/spreadsheets/{spreadsheetId}/values/{range}:append',
      access: 'write',
      description:
        'Append rows to a sheet after the last row with data. Use for adding new records without overwriting.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
        range: {
          type: 'string',
          description: 'The A1 notation of the table to append to (e.g., "Sheet1!A:D" or "Sheet1")',
          required: true,
        },
        valueInputOption: {
          type: 'string',
          description: 'How input should be interpreted: RAW or USER_ENTERED',
          enum: ['RAW', 'USER_ENTERED'],
          default: 'USER_ENTERED',
          required: true,
        },
        insertDataOption: {
          type: 'string',
          description: 'How to insert: OVERWRITE or INSERT_ROWS',
          enum: ['OVERWRITE', 'INSERT_ROWS'],
          default: 'INSERT_ROWS',
        },
      },
      body: {
        values: {
          type: 'array',
          description: 'Array of rows to append',
          items: {
            type: 'array',
            description: 'Row of cell values',
            items: {
              type: 'string',
              description: 'Cell value',
            },
          },
          required: true,
        },
      },
      responseHints: ['spreadsheetId', 'tableRange', 'updates', 'updatedRows'],
    },

    {
      id: 'batch_write_ranges',
      method: 'POST',
      path: '/spreadsheets/{spreadsheetId}/values:batchUpdate',
      access: 'write',
      description:
        'Write values to multiple ranges in a single request. More efficient than multiple write_range calls.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
      },
      body: {
        valueInputOption: {
          type: 'string',
          description: 'How input should be interpreted: RAW or USER_ENTERED',
          enum: ['RAW', 'USER_ENTERED'],
          default: 'USER_ENTERED',
          required: true,
        },
        data: {
          type: 'array',
          description: 'Array of range-value pairs to write',
          items: {
            type: 'object',
            description: 'Range and values to write',
            properties: {
              range: {
                type: 'string',
                description: 'A1 notation range',
                required: true,
              },
              values: {
                type: 'array',
                description: 'Array of rows',
                items: {
                  type: 'array',
                  description: 'Row of cell values',
                  items: {
                    type: 'string',
                    description: 'Cell value',
                  },
                },
                required: true,
              },
            },
          },
          required: true,
        },
      },
      responseHints: ['spreadsheetId', 'totalUpdatedRows', 'totalUpdatedColumns', 'totalUpdatedCells', 'responses'],
    },

    {
      id: 'clear_range',
      method: 'POST',
      path: '/spreadsheets/{spreadsheetId}/values/{range}:clear',
      access: 'write',
      description:
        'Clear values from a range of cells. Removes data but keeps formatting.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
        range: {
          type: 'string',
          description: 'The A1 notation range to clear (e.g., "Sheet1!A2:D100")',
          required: true,
        },
      },
      responseHints: ['spreadsheetId', 'clearedRange'],
    },

    {
      id: 'add_sheet',
      method: 'POST',
      path: '/spreadsheets/{spreadsheetId}:batchUpdate',
      access: 'write',
      description: 'Add a new sheet (tab) to the spreadsheet.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
      },
      body: {
        sheetTitle: {
          type: 'string',
          description: 'The title for the new sheet',
          required: true,
        },
      },
      meta: {
        requestType: 'addSheet',
      },
      responseHints: ['spreadsheetId', 'replies', 'addSheet', 'properties', 'sheetId', 'title'],
    },

    {
      id: 'delete_sheet',
      method: 'POST',
      path: '/spreadsheets/{spreadsheetId}:batchUpdate',
      access: 'delete',
      description:
        'Delete a sheet (tab) from the spreadsheet. Requires the numeric sheetId, not the sheet name.',
      params: {
        spreadsheetId: {
          type: 'string',
          description: 'The ID of the spreadsheet',
          required: true,
        },
      },
      body: {
        sheetId: {
          type: 'number',
          description: 'The numeric ID of the sheet to delete (from get_spreadsheet)',
          required: true,
        },
      },
      meta: {
        requestType: 'deleteSheet',
      },
      responseHints: ['spreadsheetId', 'replies'],
    },
  ],
};
