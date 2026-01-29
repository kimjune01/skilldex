/**
 * Google Sheets Tab Management Routes
 *
 * The Google Sheet is the single source of truth - no PII stored in our database.
 * All tab/column info is derived from the sheet on each request.
 *
 * Sheet Identification:
 * - Sheet is found by searching for file named exactly "Skillomatic Data"
 * - If not found, a new sheet is created with that name
 *
 * User-Editable Conventions (visible in Google Sheets):
 * - Tab name: "TableName | Purpose description" (purpose after |)
 * - Primary key: column header ends with * (e.g., "Email*")
 *
 * Tab Management:
 * - GET /v1/sheets/tabs - List all tabs (derived from sheet)
 * - POST /v1/sheets/tabs - Create a new tab
 * - PUT /v1/sheets/tabs/:tabName - Update tab (rename, update columns)
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

/** Minimal metadata - only OAuth tokens, no user data */
interface SheetsMetadata {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  accessLevel?: string;
  sheetsEmail?: string;
}

/** Tab derived from Google Sheet (not stored in our DB) */
interface DerivedTab {
  sheetId: number;
  title: string;       // Raw: "CRM | Track consulting leads"
  baseName: string;    // Parsed: "CRM"
  purpose?: string;    // Parsed: "Track consulting leads"
  columns: string[];   // ["Email", "Name", ...] (without *)
  primaryKey?: string; // "Email" (from "Email*")
}

/** Spreadsheet info derived from Google Drive/Sheets API */
interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

const SPREADSHEET_NAME = 'Skillomatic Data';

// ============ Helpers ============

/**
 * Parse tab name to extract base name and optional purpose.
 * "CRM | Track consulting leads" → { baseName: "CRM", purpose: "Track consulting leads" }
 * "Contacts" → { baseName: "Contacts", purpose: undefined }
 */
function parseTabName(title: string): { baseName: string; purpose?: string } {
  const delimiterIndex = title.indexOf('|');
  if (delimiterIndex === -1) {
    return { baseName: title.trim() };
  }
  return {
    baseName: title.slice(0, delimiterIndex).trim(),
    purpose: title.slice(delimiterIndex + 1).trim() || undefined,
  };
}

/**
 * Parse column headers to extract column names and primary key.
 * ["Email*", "Name", "Phone"] → { columns: ["Email", "Name", "Phone"], primaryKey: "Email" }
 */
function parseColumns(headerRow: string[]): { columns: string[]; primaryKey?: string } {
  const columns: string[] = [];
  let primaryKey: string | undefined;

  for (const col of headerRow) {
    const trimmed = col.trim();
    if (trimmed.endsWith('*')) {
      const colName = trimmed.slice(0, -1).trim();
      columns.push(colName);
      primaryKey = colName;
    } else {
      columns.push(trimmed);
    }
  }

  return { columns, primaryKey };
}

/**
 * Convert a 0-indexed column number to a column letter (A, B, ..., Z, AA, AB, ...).
 * Handles columns beyond Z (26+).
 * Examples: 0 -> 'A', 25 -> 'Z', 26 -> 'AA', 27 -> 'AB', 702 -> 'AAA'
 */
function getColumnLetter(index: number): string {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Read just the primary key column values for a tab.
 * Returns array of {value, rowNumber} and whether the data is sorted.
 * Much more efficient than reading all columns for binary search.
 */
async function readPrimaryKeyColumn(
  accessToken: string,
  spreadsheetId: string,
  tab: DerivedTab
): Promise<{ values: Array<{ value: string; rowNumber: number }>; isSorted: boolean }> {
  if (!tab.primaryKey) {
    return { values: [], isSorted: true };
  }

  // Find column letter for primary key
  const pkIndex = tab.columns.indexOf(tab.primaryKey);
  if (pkIndex === -1) {
    return { values: [], isSorted: true };
  }
  const colLetter = getColumnLetter(pkIndex);

  // Read just that column (e.g., "Contacts!A:A")
  const response = await sheetsRequest(
    accessToken,
    'GET',
    `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab.title)}!${colLetter}:${colLetter}?majorDimension=ROWS`
  );

  if (!response.ok) {
    log.error('sheets_read_pk_column_failed', { error: response.error });
    return { values: [], isSorted: true };
  }

  const data = response.data as { values?: string[][] };
  const allValues = data.values || [];

  // Skip header row, map to {value, rowNumber}, filter empty values
  const values = allValues.slice(1).map((row, index) => ({
    value: row[0] || '',
    rowNumber: index + 2, // +2 for 1-indexed + header
  })).filter(v => v.value !== '');

  // Check if already sorted (case-insensitive string comparison)
  const isSorted = values.every((v, i) =>
    i === 0 || v.value.localeCompare(values[i - 1].value, undefined, { sensitivity: 'base' }) >= 0
  );

  return { values, isSorted };
}

/**
 * Binary search to find a primary key value's position.
 * Returns { found: boolean, index: number, rowNumber?: number }
 * - If found: index is the position in the values array, rowNumber is the sheet row
 * - If not found: index is where it should be inserted to maintain sorted order
 */
function binarySearchPrimaryKey(
  values: Array<{ value: string; rowNumber: number }>,
  target: string
): { found: boolean; index: number; rowNumber?: number } {
  let left = 0;
  let right = values.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cmp = values[mid].value.localeCompare(target, undefined, { sensitivity: 'base' });

    if (cmp === 0) {
      return { found: true, index: mid, rowNumber: values[mid].rowNumber };
    } else if (cmp < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { found: false, index: left };
}

/**
 * Sort the sheet by primary key column using Google Sheets sortRange API.
 * Skips header row (row 1).
 */
async function sortSheetByPrimaryKey(
  accessToken: string,
  spreadsheetId: string,
  tab: DerivedTab,
  totalRows: number
): Promise<{ ok: boolean; error?: string }> {
  if (!tab.primaryKey) {
    return { ok: false, error: 'No primary key defined' };
  }

  const pkIndex = tab.columns.indexOf(tab.primaryKey);
  if (pkIndex === -1) {
    return { ok: false, error: 'Primary key column not found' };
  }

  // sortRange request via batchUpdate
  const response = await sheetsRequest(
    accessToken,
    'POST',
    `/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      requests: [
        {
          sortRange: {
            range: {
              sheetId: tab.sheetId,
              startRowIndex: 1, // Skip header
              endRowIndex: totalRows + 1, // Include all data rows
              startColumnIndex: 0,
              endColumnIndex: tab.columns.length,
            },
            sortSpecs: [
              {
                dimensionIndex: pkIndex,
                sortOrder: 'ASCENDING',
              },
            ],
          },
        },
      ],
    }
  );

  if (!response.ok) {
    log.error('sheets_sort_failed', { error: response.error });
    return { ok: false, error: response.error };
  }

  log.info('sheets_sorted_by_pk', { tab: tab.title, primaryKey: tab.primaryKey });
  return { ok: true };
}

/**
 * Insert a row at a specific position in the sheet atomically.
 * Uses single batchUpdate with insertDimension + updateCells.
 */
async function insertRowAtPositionAtomic(
  accessToken: string,
  spreadsheetId: string,
  tab: DerivedTab,
  position: number, // 1-indexed row number where row will be inserted
  data: Record<string, string>
): Promise<{ ok: boolean; rowNumber: number; error?: string }> {
  // Build cell values in column order
  const rowValues = tab.columns.map(col => ({
    userEnteredValue: { stringValue: data[col] || '' }
  }));

  const response = await sheetsRequest(
    accessToken,
    'POST',
    `/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      requests: [
        // First: insert empty row at position
        {
          insertDimension: {
            range: {
              sheetId: tab.sheetId,
              dimension: 'ROWS',
              startIndex: position - 1, // 0-indexed
              endIndex: position,       // Insert 1 row
            },
            inheritFromBefore: position > 2, // Inherit formatting if not first data row
          },
        },
        // Second: write values to the new row
        {
          updateCells: {
            rows: [{ values: rowValues }],
            fields: 'userEnteredValue',
            start: {
              sheetId: tab.sheetId,
              rowIndex: position - 1, // 0-indexed
              columnIndex: 0,
            },
          },
        },
      ],
    }
  );

  if (!response.ok) {
    log.error('sheets_insert_at_position_failed', { error: response.error });
    return { ok: false, rowNumber: 0, error: response.error };
  }

  return { ok: true, rowNumber: position };
}

/**
 * Merge row data with enrichment semantics.
 * - Empty values in incoming data: keep existing
 * - Non-empty values in incoming data:
 *   - If existing is empty: use incoming (enrichment)
 *   - If existing equals incoming: no conflict
 *   - If existing differs from incoming: conflict
 */
function mergeRowData(
  existing: Record<string, string>,
  incoming: Record<string, string>
): { merged: Record<string, string>; conflicts: string[] } {
  const merged: Record<string, string> = { ...existing };
  const conflicts: string[] = [];

  for (const [key, newValue] of Object.entries(incoming)) {
    if (!newValue) continue; // Skip empty incoming values

    const existingValue = existing[key] || '';

    if (!existingValue) {
      // Enrichment: fill in empty field
      merged[key] = newValue;
    } else if (existingValue !== newValue) {
      // Conflict: different non-empty values
      conflicts.push(key);
    }
    // If equal, no change needed
  }

  return { merged, conflicts };
}

/**
 * Verify a row still has the expected primary key value.
 * Returns false if the row was moved/deleted externally.
 *
 * Exported for future use - can be integrated into update/delete operations
 * to add resilience against external sheet modifications.
 */
export async function verifyRowPrimaryKey(
  accessToken: string,
  spreadsheetId: string,
  tab: DerivedTab,
  rowNumber: number,
  expectedPkValue: string
): Promise<{ valid: boolean; actualValue?: string }> {
  if (!tab.primaryKey) {
    return { valid: true };
  }

  const pkIndex = tab.columns.indexOf(tab.primaryKey);
  if (pkIndex === -1) {
    return { valid: true };
  }

  const colLetter = getColumnLetter(pkIndex);

  const response = await sheetsRequest(
    accessToken,
    'GET',
    `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab.title)}!${colLetter}${rowNumber}`
  );

  if (!response.ok) {
    return { valid: false, actualValue: undefined };
  }

  const data = response.data as { values?: string[][] };
  const actualValue = data.values?.[0]?.[0] || '';

  return {
    valid: actualValue.toLowerCase() === expectedPkValue.toLowerCase(),
    actualValue,
  };
}

/**
 * Get user's Google Sheets integration with valid token.
 * Returns only OAuth tokens - no user data stored.
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

/**
 * Make authenticated request to Google Drive API.
 */
async function driveRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = `https://www.googleapis.com/drive/v3${path}`;

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

/**
 * Find or create the Skillomatic Data spreadsheet.
 * Searches Drive for a file named exactly "Skillomatic Data", creates if not found.
 */
async function findOrCreateSheet(accessToken: string): Promise<SpreadsheetInfo | null> {
  // Search for existing spreadsheet
  const searchResponse = await driveRequest(
    accessToken,
    'GET',
    `/files?q=name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`
  );

  if (!searchResponse.ok) {
    log.error('sheets_drive_search_failed', { error: searchResponse.error });
    return null;
  }

  const searchData = searchResponse.data as { files: Array<{ id: string; name: string }> };

  if (searchData.files.length > 0) {
    // Use first match
    const spreadsheetId = searchData.files[0].id;
    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  }

  // Create new spreadsheet
  const createResponse = await sheetsRequest(accessToken, 'POST', '/spreadsheets', {
    properties: { title: SPREADSHEET_NAME },
  });

  if (!createResponse.ok) {
    log.error('sheets_create_spreadsheet_failed', { error: createResponse.error });
    return null;
  }

  const createData = createResponse.data as { spreadsheetId: string; spreadsheetUrl: string };
  log.info('sheets_spreadsheet_created', { spreadsheetId: createData.spreadsheetId });

  return {
    spreadsheetId: createData.spreadsheetId,
    spreadsheetUrl: createData.spreadsheetUrl,
  };
}

/**
 * Derive all tabs from the Google Sheet.
 * Reads tab names and header rows, parses conventions (| for purpose, * for primary key).
 */
async function deriveTabs(accessToken: string, spreadsheetId: string): Promise<DerivedTab[]> {
  // Get sheet metadata (tab names and sheetIds)
  const metaResponse = await sheetsRequest(
    accessToken,
    'GET',
    `/spreadsheets/${spreadsheetId}?fields=sheets.properties`
  );

  if (!metaResponse.ok) {
    log.error('sheets_get_metadata_failed', { error: metaResponse.error });
    return [];
  }

  const metaData = metaResponse.data as {
    sheets: Array<{ properties: { sheetId: number; title: string } }>;
  };

  const tabs: DerivedTab[] = [];

  for (const sheet of metaData.sheets) {
    const { sheetId, title } = sheet.properties;

    // Skip the default "Sheet1" - user should rename it
    if (title === 'Sheet1') continue;

    // Read header row
    const headerResponse = await sheetsRequest(
      accessToken,
      'GET',
      `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!1:1`
    );

    if (!headerResponse.ok) {
      log.warn('sheets_read_header_failed', { title, error: headerResponse.error });
      continue;
    }

    const headerData = headerResponse.data as { values?: string[][] };
    const headerRow = headerData.values?.[0] || [];

    // Skip empty tabs (no header row)
    if (headerRow.length === 0) continue;

    // Parse tab name and columns
    const { baseName, purpose } = parseTabName(title);
    const { columns, primaryKey } = parseColumns(headerRow);

    tabs.push({ sheetId, title, baseName, purpose, columns, primaryKey });
  }

  return tabs;
}

// ============ Tab Management Routes ============

// GET /v1/sheets/tabs - List all tabs (derived from sheet)
v1SheetsRoutes.get('/tabs', async (c) => {
  const user = c.get('user');

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Find or create the Skillomatic spreadsheet
  const sheetInfo = await findOrCreateSheet(metadata.accessToken);
  if (!sheetInfo) {
    return c.json({ error: { message: 'Failed to access Google Sheets' } }, 500);
  }

  // Derive tabs from sheet
  const tabs = await deriveTabs(metadata.accessToken, sheetInfo.spreadsheetId);

  return c.json({
    data: {
      tabs,
      spreadsheetId: sheetInfo.spreadsheetId,
      spreadsheetUrl: sheetInfo.spreadsheetUrl,
    },
  });
});

// POST /v1/sheets/tabs - Create a new tab
v1SheetsRoutes.post('/tabs', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ title: string; purpose?: string; columns: string[]; primaryKey?: string }>();

  if (!body.title || !body.columns?.length) {
    return c.json({ error: { message: 'title and columns are required' } }, 400);
  }

  // Validate primaryKey is in columns
  if (body.primaryKey && !body.columns.includes(body.primaryKey)) {
    return c.json({ error: { message: `primaryKey "${body.primaryKey}" must be one of the columns` } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Find or create the Skillomatic spreadsheet
  const sheetInfo = await findOrCreateSheet(metadata.accessToken);
  if (!sheetInfo) {
    return c.json({ error: { message: 'Failed to access Google Sheets' } }, 500);
  }

  // Build tab title with purpose convention: "TableName | Purpose"
  const tabTitle = body.purpose ? `${body.title} | ${body.purpose}` : body.title;

  // Build header row with primary key convention: "Column*" marks primary key
  const headerRow = body.columns.map((col) =>
    body.primaryKey && col === body.primaryKey ? `${col}*` : col
  );

  // Create tab in Google Sheets
  const addSheetResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${sheetInfo.spreadsheetId}:batchUpdate`,
    {
      requests: [
        {
          addSheet: {
            properties: {
              title: tabTitle,
            },
          },
        },
      ],
    }
  );

  if (!addSheetResponse.ok) {
    log.error('sheets_create_tab_failed', { userId: user.sub, error: addSheetResponse.error });
    // Check for "already exists" error and return 409 Conflict
    const errorMessage = addSheetResponse.error || '';
    if (errorMessage.includes('already exists')) {
      return c.json({ error: { message: `Tab "${tabTitle}" already exists`, code: 'TAB_ALREADY_EXISTS' } }, 409);
    }
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
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tabTitle)}!A1?valueInputOption=RAW`,
    {
      values: [headerRow],
    }
  );

  if (!writeHeaderResponse.ok) {
    log.warn('sheets_write_header_failed', { userId: user.sub, error: writeHeaderResponse.error });
    // Continue anyway - tab was created
  }

  log.info('sheets_tab_created', { userId: user.sub, title: tabTitle });

  // Return derived tab info
  const tab: DerivedTab = {
    sheetId: newSheetId,
    title: tabTitle,
    baseName: body.title,
    purpose: body.purpose,
    columns: body.columns,
    primaryKey: body.primaryKey,
  };

  return c.json({
    data: { tab },
  });
});

// PUT /v1/sheets/tabs/:tabName - Update tab (rename, update columns/purpose/primaryKey)
v1SheetsRoutes.put('/tabs/:tabName', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const body = await c.req.json<{ columns?: string[]; purpose?: string; primaryKey?: string | null; baseName?: string }>();

  if (!body.columns && body.purpose === undefined && body.primaryKey === undefined && !body.baseName) {
    return c.json({ error: { message: 'columns, purpose, primaryKey, or baseName is required' } }, 400);
  }

  const result = await getGoogleSheetsIntegration(user.sub);
  if (!result) {
    return c.json({ error: { message: 'Google Sheets not connected' } }, 400);
  }

  const { metadata } = result;

  // Find or create the Skillomatic spreadsheet
  const sheetInfo = await findOrCreateSheet(metadata.accessToken);
  if (!sheetInfo) {
    return c.json({ error: { message: 'Failed to access Google Sheets' } }, 500);
  }

  // Derive current tabs to find the one we're updating
  const currentTabs = await deriveTabs(metadata.accessToken, sheetInfo.spreadsheetId);
  const tab = currentTabs.find(
    (t) => t.title.toLowerCase() === tabName.toLowerCase() || t.baseName.toLowerCase() === tabName.toLowerCase()
  );

  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Determine new values
  const newBaseName = body.baseName ?? tab.baseName;
  const newPurpose = body.purpose !== undefined ? (body.purpose || undefined) : tab.purpose;
  const newColumns = body.columns ?? tab.columns;
  const newPrimaryKey = body.primaryKey !== undefined
    ? (body.primaryKey === null ? undefined : body.primaryKey)
    : tab.primaryKey;

  // Validate primaryKey is in columns
  if (newPrimaryKey && !newColumns.includes(newPrimaryKey)) {
    return c.json({ error: { message: `primaryKey "${newPrimaryKey}" must be one of the columns` } }, 400);
  }

  // Build new tab title: "BaseName | Purpose"
  const newTitle = newPurpose ? `${newBaseName} | ${newPurpose}` : newBaseName;

  // Build header row with primary key marker
  const headerRow = newColumns.map((col) =>
    newPrimaryKey && col === newPrimaryKey ? `${col}*` : col
  );

  // If title changed, rename the sheet
  if (newTitle !== tab.title) {
    const renameResponse = await sheetsRequest(
      metadata.accessToken,
      'POST',
      `/spreadsheets/${sheetInfo.spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: tab.sheetId,
                title: newTitle,
              },
              fields: 'title',
            },
          },
        ],
      }
    );

    if (!renameResponse.ok) {
      log.error('sheets_rename_tab_failed', { userId: user.sub, error: renameResponse.error });
      return c.json({ error: { message: `Failed to rename tab: ${renameResponse.error}` } }, 500);
    }
  }

  // Update header row if columns or primaryKey changed
  if (body.columns || body.primaryKey !== undefined) {
    const writeHeaderResponse = await sheetsRequest(
      metadata.accessToken,
      'PUT',
      `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(newTitle)}!A1?valueInputOption=RAW`,
      {
        values: [headerRow],
      }
    );

    if (!writeHeaderResponse.ok) {
      log.error('sheets_update_columns_failed', { userId: user.sub, error: writeHeaderResponse.error });
      return c.json({ error: { message: `Failed to update columns: ${writeHeaderResponse.error}` } }, 500);
    }
  }

  log.info('sheets_tab_updated', { userId: user.sub, title: newTitle });

  // Return updated tab info
  const updatedTab: DerivedTab = {
    sheetId: tab.sheetId,
    title: newTitle,
    baseName: newBaseName,
    purpose: newPurpose,
    columns: newColumns,
    primaryKey: newPrimaryKey,
  };

  return c.json({
    data: { tab: updatedTab },
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

  const { metadata } = result;

  // Find or create the Skillomatic spreadsheet
  const sheetInfo = await findOrCreateSheet(metadata.accessToken);
  if (!sheetInfo) {
    return c.json({ error: { message: 'Failed to access Google Sheets' } }, 500);
  }

  // Derive current tabs to find the one we're deleting
  const currentTabs = await deriveTabs(metadata.accessToken, sheetInfo.spreadsheetId);
  const tab = currentTabs.find(
    (t) => t.title.toLowerCase() === tabName.toLowerCase() || t.baseName.toLowerCase() === tabName.toLowerCase()
  );

  if (!tab) {
    return c.json({ error: { message: `Tab "${tabName}" not found` } }, 404);
  }

  // Delete tab from Google Sheets
  const deleteSheetResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${sheetInfo.spreadsheetId}:batchUpdate`,
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

  log.info('sheets_tab_deleted', { userId: user.sub, title: tab.title });

  return c.json({
    data: {
      deleted: tab.title,
    },
  });
});

// ============ Tab Data Routes ============

/**
 * Helper to get spreadsheet and find a specific tab by name.
 */
async function getTabByName(
  accessToken: string,
  tabName: string
): Promise<{ sheetInfo: SpreadsheetInfo; tab: DerivedTab } | { error: string; status: number }> {
  const sheetInfo = await findOrCreateSheet(accessToken);
  if (!sheetInfo) {
    return { error: 'Failed to access Google Sheets', status: 500 };
  }

  const tabs = await deriveTabs(accessToken, sheetInfo.spreadsheetId);
  const tab = tabs.find(
    (t) => t.title.toLowerCase() === tabName.toLowerCase() || t.baseName.toLowerCase() === tabName.toLowerCase()
  );

  if (!tab) {
    return { error: `Tab "${tabName}" not found`, status: 404 };
  }

  return { sheetInfo, tab };
}

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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Read all data from the tab
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}?majorDimension=ROWS`
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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Build row values in column order
  const rowValues = tab.columns.map((col) => body.data[col] || '');

  // Append row
  const appendResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Build row values - use existing value if not provided in update
  // First, read current row
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${rowNum}:${String.fromCharCode(64 + tab.columns.length)}${rowNum}`
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
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${rowNum}?valueInputOption=USER_ENTERED`,
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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Delete row using batchUpdate
  const deleteResponse = await sheetsRequest(
    metadata.accessToken,
    'POST',
    `/spreadsheets/${sheetInfo.spreadsheetId}:batchUpdate`,
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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Read all data
  const readResponse = await sheetsRequest(
    metadata.accessToken,
    'GET',
    `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}?majorDimension=ROWS`
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

// POST /v1/sheets/tabs/:tabName/upsert - Smart upsert with binary search and enrichment
v1SheetsRoutes.post('/tabs/:tabName/upsert', async (c) => {
  const user = c.get('user');
  const tabName = c.req.param('tabName');
  const body = await c.req.json<{ data: Record<string, string>; force?: boolean }>();

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
  const tabResult = await getTabByName(metadata.accessToken, tabName);
  if ('error' in tabResult) {
    return c.json({ error: { message: tabResult.error } }, tabResult.status as 404 | 500);
  }
  const { sheetInfo, tab } = tabResult;

  // Require primary key for upsert
  if (!tab.primaryKey) {
    return c.json({ error: { message: 'Tab has no primary key defined. Cannot upsert without a primary key.' } }, 400);
  }

  const pkValue = body.data[tab.primaryKey];
  if (!pkValue) {
    return c.json({ error: { message: `Primary key "${tab.primaryKey}" is required in data` } }, 400);
  }

  // Read primary key column for binary search
  let { values, isSorted } = await readPrimaryKeyColumn(
    metadata.accessToken,
    sheetInfo.spreadsheetId,
    tab
  );

  // Auto-sort if needed and there's data
  if (!isSorted && values.length > 0) {
    log.info('sheets_auto_sorting', { userId: user.sub, tab: tab.title, rowCount: values.length });
    const sortResult = await sortSheetByPrimaryKey(
      metadata.accessToken,
      sheetInfo.spreadsheetId,
      tab,
      values.length
    );
    if (sortResult.ok) {
      // Re-read after sorting
      const sorted = await readPrimaryKeyColumn(
        metadata.accessToken,
        sheetInfo.spreadsheetId,
        tab
      );
      values = sorted.values;
    } else {
      log.warn('sheets_auto_sort_failed', { userId: user.sub, error: sortResult.error });
      // Continue with unsorted - will fall back to linear behavior
    }
  }

  // Binary search for existing row
  const searchResult = binarySearchPrimaryKey(values, pkValue);

  if (searchResult.found && searchResult.rowNumber) {
    // Existing row found - read full row data for merge
    const existingRowNum = searchResult.rowNumber;
    const lastCol = getColumnLetter(tab.columns.length - 1);

    const readResponse = await sheetsRequest(
      metadata.accessToken,
      'GET',
      `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${existingRowNum}:${lastCol}${existingRowNum}`
    );

    if (!readResponse.ok) {
      log.error('sheets_upsert_read_failed', { userId: user.sub, error: readResponse.error });
      return c.json({ error: { message: `Failed to read existing row: ${readResponse.error}` } }, 500);
    }

    const existingData = readResponse.data as { values?: string[][] };
    const existingRow = existingData.values?.[0] || [];

    // Convert to object
    const existingObj: Record<string, string> = {};
    tab.columns.forEach((col, index) => {
      existingObj[col] = existingRow[index] || '';
    });

    let finalData: Record<string, string>;

    if (body.force) {
      // Force overwrite - use incoming data entirely, keeping existing for unspecified fields
      finalData = { ...existingObj };
      for (const [key, value] of Object.entries(body.data)) {
        if (value !== undefined) {
          finalData[key] = value;
        }
      }
    } else {
      // Enrichment merge - check for conflicts
      const { merged, conflicts } = mergeRowData(existingObj, body.data);

      if (conflicts.length > 0) {
        return c.json({
          error: {
            message: 'Conflict detected during upsert. Use force=true to overwrite.',
            conflicts,
            existing: Object.fromEntries(conflicts.map(c => [c, existingObj[c]])),
            incoming: Object.fromEntries(conflicts.map(c => [c, body.data[c]])),
          }
        }, 409);
      }

      finalData = merged;
    }

    // Write merged/updated row
    const rowValues = tab.columns.map(col => finalData[col] || '');
    const writeResponse = await sheetsRequest(
      metadata.accessToken,
      'PUT',
      `/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(tab.title)}!A${existingRowNum}?valueInputOption=USER_ENTERED`,
      {
        values: [rowValues],
      }
    );

    if (!writeResponse.ok) {
      log.error('sheets_upsert_write_failed', { userId: user.sub, error: writeResponse.error });
      return c.json({ error: { message: `Failed to update row: ${writeResponse.error}` } }, 500);
    }

    log.info('sheets_upsert_updated', { userId: user.sub, tab: tab.title, row: existingRowNum, force: body.force });

    return c.json({
      data: {
        action: 'updated',
        rowNumber: existingRowNum,
        merged: finalData,
      },
    });
  } else {
    // No existing row - insert at sorted position
    let insertPosition: number;

    if (values.length === 0) {
      // First data row after header
      insertPosition = 2;
    } else if (searchResult.index >= values.length) {
      // Insert after last row
      insertPosition = values[values.length - 1].rowNumber + 1;
    } else {
      // Insert at the position of the first greater element
      insertPosition = values[searchResult.index].rowNumber;
    }

    const insertResult = await insertRowAtPositionAtomic(
      metadata.accessToken,
      sheetInfo.spreadsheetId,
      tab,
      insertPosition,
      body.data
    );

    if (!insertResult.ok) {
      log.error('sheets_upsert_insert_failed', { userId: user.sub, error: insertResult.error });
      return c.json({ error: { message: `Failed to insert row: ${insertResult.error}` } }, 500);
    }

    log.info('sheets_upsert_created', { userId: user.sub, tab: tab.title, row: insertResult.rowNumber });

    return c.json({
      data: {
        action: 'created',
        rowNumber: insertResult.rowNumber,
        merged: body.data,
      },
    });
  }
});
