/**
 * Google Sheets Tab Management Routes
 *
 * Provides CRUD operations for tabs (sheets) within the user's Skillomatic spreadsheet.
 * Each tab represents a different data type (Contacts, Jobs, etc.) and generates
 * its own set of MCP tools for typed data access.
 *
 * Tab Management:
 * - GET /v1/sheets/tabs - List all tabs with columns and version
 * - POST /v1/sheets/tabs - Create a new tab
 * - PUT /v1/sheets/tabs/:tabName - Update tab schema
 * - DELETE /v1/sheets/tabs/:tabName - Delete a tab
 *
 * Tab Data:
 * - GET /v1/sheets/tabs/:tabName/rows - Read rows
 * - POST /v1/sheets/tabs/:tabName/rows - Append row
 * - PUT /v1/sheets/tabs/:tabName/rows/:rowNum - Update row
 * - DELETE /v1/sheets/tabs/:tabName/rows/:rowNum - Delete row
 * - GET /v1/sheets/tabs/:tabName/search - Search rows
 */

import { Hono } from 'hono';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { db } from '@skillomatic/db';
import { integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { refreshGoogleToken, isGoogleTokenExpired } from '../../lib/google-oauth.js';
import { createLogger } from '../../lib/logger.js';

const log = createLogger('Sheets');

export const v1SheetsRoutes = new Hono();

// All routes require API key or JWT auth
v1SheetsRoutes.use('*', combinedAuth);

// ============ Types ============

interface TabConfig {
  sheetId: number;
  title: string;
  purpose: string;
  columns: string[];
  primaryKey?: string;
  createdAt: string;
}

interface SheetsMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  tabsVersion: number;
  tabs: TabConfig[];
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  accessLevel?: string;
  sheetsEmail?: string;
}

// ============ Helpers ============

/**
 * Get user's Google Sheets integration with valid token.
 * Returns metadata with refreshed token if needed.
 */
async function getGoogleSheetsIntegration(
  userId: string
): Promise<{ integration: typeof integrations.$inferSelect; metadata: SheetsMetadata } | null> {
  const [int] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'google-sheets'),
        eq(integrations.status, 'connected')
      )
    )
    .limit(1);

  if (!int) {
    return null;
  }

  let metadata: SheetsMetadata;
  try {
    metadata = JSON.parse(int.metadata || '{}');
  } catch {
    log.warn('sheets_invalid_metadata', { userId });
    return null;
  }

  // Ensure tabs array exists
  if (!metadata.tabs) {
    metadata.tabs = [];
  }
  if (metadata.tabsVersion === undefined) {
    metadata.tabsVersion = 0;
  }

  // Refresh token if needed
  if (isGoogleTokenExpired(metadata.expiresAt) && metadata.refreshToken) {
    const refreshResult = await refreshGoogleToken(metadata.refreshToken, metadata as unknown as Record<string, unknown>);
    if (refreshResult) {
      metadata = refreshResult.metadata as unknown as SheetsMetadata;
      await db
        .update(integrations)
        .set({
          metadata: JSON.stringify(metadata),
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, int.id));
      log.info('sheets_token_refreshed', { userId });
    } else {
      await db
        .update(integrations)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(integrations.id, int.id));
      log.warn('sheets_token_refresh_failed', { userId });
      return null;
    }
  }

  return { integration: int, metadata };
}

/**
 * Save updated metadata back to database.
 */
async function saveMetadata(integrationId: string, metadata: SheetsMetadata): Promise<void> {
  metadata.tabsVersion = (metadata.tabsVersion || 0) + 1;
  await db
    .update(integrations)
    .set({
      metadata: JSON.stringify(metadata),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integrationId));
}

/**
 * Make authenticated request to Google Sheets API.
 */
async function sheetsRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = `https://sheets.googleapis.com/v4${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error?.message || `HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============ Tab Management Routes ============

// GET /v1/sheets/tabs - List all tabs
v1SheetsRoutes.get('/tabs', async (c) => {
  const user = c.get('user');

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  return c.json({
    data: {
      tabs: metadata.tabs,
      version: metadata.tabsVersion,
      spreadsheetId: metadata.spreadsheetId,
      spreadsheetUrl: metadata.spreadsheetUrl,
    },
  });
});

// POST /v1/sheets/tabs - Create a new tab
v1SheetsRoutes.post('/tabs', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ title: string; purpose: string; columns: string[]; primaryKey?: string }>();

  if (!body.title || !body.purpose || !body.columns?.length) {
    return c.json({ error: { message: 'title, purpose, and columns are required' } }, 400);
  }

  // Validate primaryKey is in columns
  if (body.primaryKey && !body.columns.includes(body.primaryKey)) {
    return c.json({ error: { message: `primaryKey "${body.primaryKey}" must be one of the columns` } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { integration, metadata } = result;

  // Check if tab already exists
  if (metadata.tabs.some((t) => t.title.toLowerCase() === body.title.toLowerCase())) {
    return c.json({ error: { message: `Tab "${body.title}" already exists` } }, 400);
  }

  // Create tab in Google Sheets
  const addSheetResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${metadata.spreadsheetId}:batchUpdate`,
    {
      requests: [
        {
          addSheet: {
            properties: {
              title: body.title,
            },
          },
        },
      ],
    }
  );

  if (!addSheetResponse.ok) {
    log.error('sheets_create_tab_failed', { userId: user.sub, error: addSheetResponse.error });
    return c.json({ error: { message: `Failed to create tab: ${addSheetResponse.error}` } }, 500);
  }

  // Get the new sheet ID from response
  const addSheetResult = addSheetResponse.data as {
    replies: Array<{ addSheet: { properties: { sheetId: number; title: string } } }>;
  };
  const newSheetId = addSheetResult.replies[0].addSheet.properties.sheetId;

  // Write header row
  const writeHeaderResponse = await sheetsRequest(
    metadata.accessToken,
    'PUT',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(body.title)}!A1?valueInputOption=RAW`,
    {
      values: [body.columns],
    }
  );

  if (!writeHeaderResponse.ok) {
    log.warn('sheets_write_header_failed', { userId: user.sub, error: writeHeaderResponse.error });
    // Continue anyway - tab was created
  }

  // Add tab to metadata
  const newTab: TabConfig = {
    sheetId: newSheetId,
    title: body.title,
    purpose: body.purpose,
    columns: body.columns,
    primaryKey: body.primaryKey,
    createdAt: new Date().toISOString(),
  };

  metadata.tabs.push(newTab);
  await saveMetadata(integration.id, metadata);

  log.info('sheets_tab_created', { userId: user.sub, title: body.title });

  return c.json({
    data: {
      tab: newTab,
      version: metadata.tabsVersion,
    },
  });
});

// PUT /v1/sheets/tabs/:tabName - Update tab schema
v1SheetsRoutes.put('/tabs/:tabName', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const body = await c.req.json<{ columns?: string[]; purpose?: string; primaryKey?: string | null }>();

  if (!body.columns && !body.purpose && body.primaryKey === undefined) {
    return c.json({ error: { message: 'columns, purpose, or primaryKey is required' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { integration, metadata } = result;

  // Find the tab
  const tabIndex = metadata.tabs.findIndex(
    (t) => t.title.toLowerCase() === tabName.toLowerCase()
  );
  if (tabIndex === -1) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  const tab = metadata.tabs[tabIndex];

  // Update columns in Google Sheets if provided
  if (body.columns) {
    const writeHeaderResponse = await sheetsRequest(
      metadata.accessToken,
      'PUT',
      `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A1?valueInputOption=RAW`,
      {
        values: [body.columns],
      }
    );

    if (!writeHeaderResponse.ok) {
      log.error('sheets_update_columns_failed', {
        userId: user.sub,
        error: writeHeaderResponse.error,
      });
      return c.json({ error: { message: `Failed to update columns: ${writeHeaderResponse.error}` } }, 500);
    }

    tab.columns = body.columns;
  }

  if (body.purpose) {
    tab.purpose = body.purpose;
  }

  // Handle primaryKey update (can be set, changed, or removed with null)
  if (body.primaryKey !== undefined) {
    if (body.primaryKey === null) {
      // Remove primary key
      delete tab.primaryKey;
    } else {
      // Validate primaryKey is in columns
      const columnsToCheck = body.columns || tab.columns;
      if (!columnsToCheck.includes(body.primaryKey)) {
        return c.json({ error: { message: `primaryKey "${body.primaryKey}" must be one of the columns` } }, 400);
      }
      tab.primaryKey = body.primaryKey;
    }
  }

  metadata.tabs[tabIndex] = tab;
  await saveMetadata(integration.id, metadata);

  log.info('sheets_tab_updated', { userId: user.sub, title: tab.title });

  return c.json({
    data: {
      tab,
      version: metadata.tabsVersion,
    },
  });
});

// DELETE /v1/sheets/tabs/:tabName - Delete a tab
v1SheetsRoutes.delete('/tabs/:tabName', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { integration, metadata } = result;

  // Find the tab
  const tabIndex = metadata.tabs.findIndex(
    (t) => t.title.toLowerCase() === tabName.toLowerCase()
  );
  if (tabIndex === -1) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  const tab = metadata.tabs[tabIndex];

  // Delete tab from Google Sheets
  const deleteSheetResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${metadata.spreadsheetId}:batchUpdate`,
    {
      requests: [
        {
          deleteSheet: {
            sheetId: tab.sheetId,
          },
        },
      ],
    }
  );

  if (!deleteSheetResponse.ok) {
    log.error('sheets_delete_tab_failed', { userId: user.sub, error: deleteSheetResponse.error });
    return c.json({ error: { message: `Failed to delete tab: ${deleteSheetResponse.error}` } }, 500);
  }

  // Remove from metadata
  metadata.tabs.splice(tabIndex, 1);
  await saveMetadata(integration.id, metadata);

  log.info('sheets_tab_deleted', { userId: user.sub, title: tab.title });

  return c.json({
    data: {
      deleted: tab.title,
      version: metadata.tabsVersion,
    },
  });
});

// ============ Tab Data Routes ============

// GET /v1/sheets/tabs/:tabName/rows - Read rows
v1SheetsRoutes.get('/tabs/:tabName/rows', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Find the tab
  const tab = metadata.tabs.find((t) => t.title.toLowerCase() === tabName.toLowerCase());
  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Read all data from the tab
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}?majorDimension=ROWS`
  );

  if (!readResponse.ok) {
    log.error('sheets_read_rows_failed', { userId: user.sub, error: readResponse.error });
    return c.json({ error: { message: `Failed to read rows: ${readResponse.error}` } }, 500);
  }

  const sheetData = readResponse.data as { values?: string[][] };
  const allValues = sheetData.values || [];

  // Skip header row, apply offset and limit
  const dataRows = allValues.slice(1); // Remove header
  const paginatedRows = dataRows.slice(offset, offset + limit);

  // Convert to objects using column headers
  const rows = paginatedRows.map((row, index) => {
    const data: Record<string, string> = {};
    tab.columns.forEach((col, colIndex) => {
      data[col] = row[colIndex] || '';
    });
    return {
      rowNumber: offset + index + 2, // +2 because: +1 for 1-indexed, +1 for header
      data,
    };
  });

  return c.json({
    data: {
      rows,
      total: dataRows.length,
      limit,
      offset,
      columns: tab.columns,
    },
  });
});

// POST /v1/sheets/tabs/:tabName/rows - Append row
v1SheetsRoutes.post('/tabs/:tabName/rows', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const body = await c.req.json<{ data: Record<string, string> }>();

  if (!body.data || typeof body.data !== 'object') {
    return c.json({ error: { message: 'data object is required' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Check write access
  if (metadata.accessLevel === 'read-only') {
    return c.json({ error: { message: 'Read-only access to Google Sheets' } }, 403);
  }

  // Find the tab
  const tab = metadata.tabs.find((t) => t.title.toLowerCase() === tabName.toLowerCase());
  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Build row values in column order
  const rowValues = tab.columns.map((col) => body.data[col] || '');

  // Append row
  const appendResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      values: [rowValues],
    }
  );

  if (!appendResponse.ok) {
    log.error('sheets_append_row_failed', { userId: user.sub, error: appendResponse.error });
    return c.json({ error: { message: `Failed to append row: ${appendResponse.error}` } }, 500);
  }

  const appendResult = appendResponse.data as {
    updates: { updatedRange: string; updatedRows: number };
  };

  log.info('sheets_row_appended', { userId: user.sub, tab: tab.title });

  return c.json({
    data: {
      success: true,
      updatedRange: appendResult.updates.updatedRange,
    },
  });
});

// PUT /v1/sheets/tabs/:tabName/rows/:rowNum - Update row
v1SheetsRoutes.put('/tabs/:tabName/rows/:rowNum', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const rowNum = parseInt(c.req.param('rowNum'), 10);
  const body = await c.req.json<{ data: Record<string, string> }>();

  if (!body.data || typeof body.data !== 'object') {
    return c.json({ error: { message: 'data object is required' } }, 400);
  }

  if (isNaN(rowNum) || rowNum < 2) {
    return c.json({ error: { message: 'Invalid row number (must be >= 2)' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Check write access
  if (metadata.accessLevel === 'read-only') {
    return c.json({ error: { message: 'Read-only access to Google Sheets' } }, 403);
  }

  // Find the tab
  const tab = metadata.tabs.find((t) => t.title.toLowerCase() === tabName.toLowerCase());
  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Build row values - use existing value if not provided in update
  // First, read current row
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${rowNum}:${String.fromCharCode(64 + tab.columns.length)}${rowNum}`
  );

  if (!readResponse.ok) {
    log.error('sheets_read_row_failed', { userId: user.sub, error: readResponse.error });
    return c.json({ error: { message: `Failed to read row: ${readResponse.error}` } }, 500);
  }

  const currentData = readResponse.data as { values?: string[][] };
  const currentRow = currentData.values?.[0] || [];

  // Merge updates with current values
  const rowValues = tab.columns.map((col, index) => {
    if (col in body.data) {
      return body.data[col];
    }
    return currentRow[index] || '';
  });

  // Write updated row
  const writeResponse = await sheetsRequest(
    metadata.accessToken,
    'PUT',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${rowNum}?valueInputOption=USER_ENTERED`,
    {
      values: [rowValues],
    }
  );

  if (!writeResponse.ok) {
    log.error('sheets_update_row_failed', { userId: user.sub, error: writeResponse.error });
    return c.json({ error: { message: `Failed to update row: ${writeResponse.error}` } }, 500);
  }

  log.info('sheets_row_updated', { userId: user.sub, tab: tab.title, row: rowNum });

  return c.json({
    data: {
      success: true,
      rowNumber: rowNum,
    },
  });
});

// DELETE /v1/sheets/tabs/:tabName/rows/:rowNum - Delete row
v1SheetsRoutes.delete('/tabs/:tabName/rows/:rowNum', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const rowNum = parseInt(c.req.param('rowNum'), 10);

  if (isNaN(rowNum) || rowNum < 2) {
    return c.json({ error: { message: 'Invalid row number (must be >= 2)' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Check write access
  if (metadata.accessLevel === 'read-only') {
    return c.json({ error: { message: 'Read-only access to Google Sheets' } }, 403);
  }

  // Find the tab
  const tab = metadata.tabs.find((t) => t.title.toLowerCase() === tabName.toLowerCase());
  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Delete row using batchUpdate
  const deleteResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${metadata.spreadsheetId}:batchUpdate`,
    {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: tab.sheetId,
              dimension: 'ROWS',
              startIndex: rowNum - 1, // 0-indexed
              endIndex: rowNum, // Exclusive
            },
          },
        },
      ],
    }
  );

  if (!deleteResponse.ok) {
    log.error('sheets_delete_row_failed', { userId: user.sub, error: deleteResponse.error });
    return c.json({ error: { message: `Failed to delete row: ${deleteResponse.error}` } }, 500);
  }

  log.info('sheets_row_deleted', { userId: user.sub, tab: tab.title, row: rowNum });

  return c.json({
    data: {
      success: true,
      deletedRow: rowNum,
    },
  });
});

// GET /v1/sheets/tabs/:tabName/search - Search rows
v1SheetsRoutes.get('/tabs/:tabName/search', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const query = c.req.query('q') || '';
  const limit = parseInt(c.req.query('limit') || '50', 10);

  if (!query) {
    return c.json({ error: { message: 'q (search query) is required' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Find the tab
  const tab = metadata.tabs.find((t) => t.title.toLowerCase() === tabName.toLowerCase());
  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Read all data
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${metadata.spreadsheetId}/values/${encodeURIComponent(tab.title)}?majorDimension=ROWS`
  );

  if (!readResponse.ok) {
    log.error('sheets_search_read_failed', { userId: user.sub, error: readResponse.error });
    return c.json({ error: { message: `Failed to search: ${readResponse.error}` } }, 500);
  }

  const sheetData = readResponse.data as { values?: string[][] };
  const allValues = sheetData.values || [];
  const dataRows = allValues.slice(1); // Skip header

  // Filter rows by query (case-insensitive search across all columns)
  const lowerQuery = query.toLowerCase();
  const matchingRows = dataRows
    .map((row, index) => ({ row, rowNumber: index + 2 })) // +2 for 1-indexed + header
    .filter(({ row }) => row.some((cell) => cell?.toLowerCase().includes(lowerQuery)))
    .slice(0, limit);

  // Convert to objects
  const rows = matchingRows.map(({ row, rowNumber }) => {
    const data: Record<string, string> = {};
    tab.columns.forEach((col, colIndex) => {
      data[col] = row[colIndex] || '';
    });
    return { rowNumber, data };
  });

  return c.json({
    data: {
      rows,
      total: matchingRows.length,
      query,
      columns: tab.columns,
    },
  });
});
