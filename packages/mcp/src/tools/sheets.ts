/**
 * Data table tools for the MCP server.
 *
 * Provides a simple database-like interface for users to store and query structured data.
 * Currently backed by Google Sheets, but the interface is designed to be provider-agnostic
 * (could be Airtable, Notion, or other backends in the future).
 *
 * Provides two types of tools:
 * 1. Management tools (static): list_tables, create_table, update_table_schema
 * 2. Per-table CRUD tools (dynamic): {tableName}_add, {tableName}_list, {tableName}_search, etc.
 *
 * Tools are generated based on user's table configuration - each table gets its own
 * set of hardcoded tools that can only operate on that specific table.
 *
 * Implementation note: "tabs" in the API/code map to "tables" in user-facing descriptions.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';
import type { DerivedTab, TabsResponse } from '../types.js';

/**
 * Convert a tab title or column name to a slug for tool/field names.
 * "Contacts" → "contacts", "Job Applications" → "job_applications"
 */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Build a deduplicated field name map for columns.
 * Handles collisions like "First Name" and "First-Name" both becoming "first_name".
 */
function buildColumnFieldMap(columns: string[]): Map<string, string> {
  const fieldMap = new Map<string, string>();
  const usedSlugs = new Map<string, number>();

  for (const col of columns) {
    let slug = toSlug(col);
    const count = usedSlugs.get(slug) || 0;

    if (count > 0) {
      // Collision - append index
      slug = `${slug}_${count + 1}`;
    }

    usedSlugs.set(toSlug(col), count + 1);
    fieldMap.set(col, slug);
  }

  return fieldMap;
}

/**
 * Error message when data storage is not connected.
 * Guides user to connect Google Sheets (current backend).
 */
const NOT_CONNECTED_MESSAGE = `Data storage is not connected.

To use database features:
1. Go to Skillomatic web app → Integrations
2. Find "Google Sheets" under Other Integrations
3. Click Connect and authorize access

After connecting, you can create tables to track any data (Contacts, Jobs, Inventory, etc.) with dedicated tools for each table.`;

/**
 * Format tabs response for LLM context.
 * Uses "table" terminology in user-facing output.
 */
function formatTabsForLLM(response: TabsResponse): string {
  if (response.tabs.length === 0) {
    return `No tables found in your database.

To get started, use the create_table tool to create a table for your data.

Example:
- Name: "Contacts"
- Purpose: "Track business contacts and leads"
- Columns: ["Name", "Company", "Email", "Phone", "Stage", "Notes"]

Or create tabs directly in your Google Sheet with:
- Tab name format: "TableName | Purpose description"
- Primary key: add * to column header (e.g., "Email*")

View your data: ${response.spreadsheetUrl}`;
  }

  // Handle slug collisions for duplicate base names
  const slugCounts = new Map<string, number>();
  const tabsWithSlugs = response.tabs.map((tab) => {
    let slug = toSlug(tab.baseName);
    const count = slugCounts.get(slug) || 0;
    if (count > 0) slug = `${slug}_${count}`;
    slugCounts.set(toSlug(tab.baseName), count + 1);
    return { tab, slug };
  });

  const tableList = tabsWithSlugs
    .map(({ tab, slug }) => {
      const purposeLine = tab.purpose ? `**Purpose:** ${tab.purpose}` : '';
      const pkLine = tab.primaryKey ? `**Primary Key:** ${tab.primaryKey}` : '';
      return [
        `## ${tab.baseName}`,
        purposeLine,
        `**Columns:** ${tab.columns.join(', ')}`,
        pkLine,
        `**Tools:** ${slug}_add, ${slug}_list, ${slug}_search, ${slug}_update, ${slug}_delete`,
      ].filter(Boolean).join('\n');
    })
    .join('\n\n---\n\n');

  return `Your Data Tables:\n\n${tableList}\n\nView your data: ${response.spreadsheetUrl}`;
}

/**
 * Register the static tab management tools.
 * These are always available when Google Sheets is connected.
 */
export function registerTabManagementTools(
  server: McpServer,
  client: SkillomaticClient
): string[] {
  const registeredTools: string[] = [];

  // List all tables
  // Note: Tool named "list_tabs" for API compatibility, but described as "tables" to users
  server.tool(
    'list_tables',
    `List all tables in your Skillomatic database.

Each table stores a different data type (Contacts, Jobs, Inventory, etc.) with its own CRUD tools.
Call this to see what tables exist and their columns.`,
    {},
    async () => {
      try {
        const response = await client.listTabs();
        return {
          content: [
            {
              type: 'text' as const,
              text: formatTabsForLLM(response),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Check if it's a "not connected" error
        if (message.includes('not connected') || message.includes('Google Sheets')) {
          return {
            content: [{ type: 'text' as const, text: NOT_CONNECTED_MESSAGE }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: `Error listing tables: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('list_tables');

  // Create a new table
  server.tool(
    'create_table',
    `Create a new table in your database for tracking a data type.

Examples:
- "Contacts" for CRM contacts (primaryKey: "Email")
- "Jobs" for job applications (primaryKey: "Company")
- "Inventory" for product tracking (primaryKey: "SKU")

Set primaryKey to enable automatic deduplication with upsert.
After creating a table, new tools will be available: {tablename}_add, {tablename}_upsert, etc.`,
    {
      title: z.string().describe('Table name (e.g., "Contacts", "Jobs")'),
      purpose: z.string().describe('What this table tracks (for context)'),
      columns: z.array(z.string()).describe('Column headers (all treated as text)'),
      primaryKey: z.string().optional().describe('Column to use as unique key for upsert (e.g., "Email")'),
    },
    async (args) => {
      try {
        // Validate primaryKey is in columns
        if (args.primaryKey && !args.columns.includes(args.primaryKey)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Invalid primaryKey "${args.primaryKey}". Must be one of the columns: ${args.columns.join(', ')}`,
              },
            ],
            isError: true,
          };
        }

        const tab = await client.createTab({
          title: args.title,
          purpose: args.purpose,
          columns: args.columns,
          primaryKey: args.primaryKey,
        });

        const slug = toSlug(tab.baseName);

        // Dynamically register tools for the new table
        const newTools = registerToolsForTab(server, client, tab, slug);
        registeredTools.push(...newTools);

        // Notify client that tool list has changed
        try {
          await server.server.sendToolListChanged();
        } catch {
          // Client may not support notifications, that's ok
        }

        const pkInfo = tab.primaryKey ? `\nPrimary key: ${tab.primaryKey} (used for upsert)` : '';
        const purposeInfo = tab.purpose ? `\nPurpose: ${tab.purpose}` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Created table "${tab.baseName}" with ${tab.columns.length} columns.`,
                '',
                `**New tools are now available:**`,
                `- ${slug}_add: Add a new row`,
                `- ${slug}_upsert: Find and update, or create if not found`,
                `- ${slug}_list: List rows`,
                `- ${slug}_search: Search rows`,
                `- ${slug}_update: Update a row`,
                `- ${slug}_delete: Delete a row`,
                '',
                `Columns: ${tab.columns.join(', ')}${pkInfo}${purposeInfo}`,
              ].join('\n'),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('not connected') || message.includes('Google Sheets')) {
          return {
            content: [{ type: 'text' as const, text: NOT_CONNECTED_MESSAGE }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: `Error creating table: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('create_table');

  // Update table schema
  server.tool(
    'update_table_schema',
    `Update a table's columns.

Pass the complete list of columns in the desired order.
- To add a column: include it in the list
- To remove a column: omit it from the list
- To rename a column: change the name in the list
- To reorder: change the order in the list

Note: Column changes only affect the header row. Existing data rows are NOT modified.`,
    {
      tableName: z.string().describe('Table name to modify'),
      columns: z.array(z.string()).describe('New column list (complete, in order)'),
      purpose: z.string().optional().describe('Optionally update the purpose'),
    },
    async (args) => {
      try {
        const tab = await client.updateTabSchema(args.tableName, {
          columns: args.columns,
          purpose: args.purpose,
        });

        const pkInfo = tab.primaryKey ? `Primary key: ${tab.primaryKey}` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Updated schema for "${tab.baseName}".`,
                `Columns: ${tab.columns.join(', ')}`,
                tab.purpose ? `Purpose: ${tab.purpose}` : '',
                pkInfo,
              ].filter(Boolean).join('\n'),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('not connected') || message.includes('Google Sheets')) {
          return {
            content: [{ type: 'text' as const, text: NOT_CONNECTED_MESSAGE }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: `Error updating table schema: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('update_table_schema');

  // Delete table
  server.tool(
    'delete_table',
    `Delete a table from your database.

WARNING: This permanently deletes the table and all its data.`,
    {
      tableName: z.string().describe('Table name to delete'),
    },
    async (args) => {
      try {
        const slug = toSlug(args.tableName);
        await client.deleteTab(args.tableName);
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Deleted table "${args.tableName}" and all its data.`,
                '',
                `⚠️ **Restart required:** The ${slug}_* tools will be removed after you restart your MCP connection.`,
              ].join('\n'),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('not connected') || message.includes('Google Sheets')) {
          return {
            content: [{ type: 'text' as const, text: NOT_CONNECTED_MESSAGE }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: `Error deleting table: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('delete_table');

  return registeredTools;
}

/**
 * Register CRUD tools for a specific table.
 * Each table gets 6 tools: {slug}_add, {slug}_upsert, {slug}_list, {slug}_search, {slug}_update, {slug}_delete
 *
 * Note: "tab" in code = "table" in user-facing descriptions
 *
 * @param slug - Pre-computed slug (handles collisions for duplicate base names)
 */
export function registerToolsForTab(
  server: McpServer,
  client: SkillomaticClient,
  tab: DerivedTab,
  slug: string
): string[] {
  const registeredTools: string[] = [];
  const purposeLine = tab.purpose ? `\nPurpose: ${tab.purpose}` : '';
  const pkInfo = tab.primaryKey ? ` (primary key: ${tab.primaryKey})` : '';

  // Build collision-safe field map for columns
  const fieldMap = buildColumnFieldMap(tab.columns);

  // Build Zod schema from columns (all strings)
  const addSchema: Record<string, z.ZodTypeAny> = {};
  for (const col of tab.columns) {
    const fieldName = fieldMap.get(col)!;
    addSchema[fieldName] = z.string().optional().describe(col);
  }

  // {slug}_add - Add a new row
  server.tool(
    `${slug}_add`,
    `Add a new row to your ${tab.baseName} table.
${purposeLine}
Columns: ${tab.columns.join(', ')}${pkInfo}`,
    addSchema,
    async (args) => {
      try {
        // Map field names back to column names
        const data: Record<string, string> = {};
        for (const col of tab.columns) {
          const fieldName = fieldMap.get(col)!;
          if (args[fieldName]) {
            data[col] = args[fieldName] as string;
          }
        }

        const result = await client.appendTabRow(tab.title, data);
        // Extract row number from range like "Contacts!A2:F2"
        const match = result.updatedRange.match(/!A(\d+):/);
        const rowNum = match ? match[1] : 'unknown';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Added row to ${tab.title} (row ${rowNum}).`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error adding row: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_add`);

  // {slug}_upsert - Find or create (upsert)
  // If tab has primaryKey, match_field is optional (defaults to primaryKey)
  const upsertSchema: Record<string, z.ZodTypeAny> = {
    match_value: z.string().describe(`Value to search for${tab.primaryKey ? ` in ${tab.primaryKey}` : ''}`),
  };
  // match_field is optional if primaryKey is set, required otherwise
  if (tab.primaryKey) {
    upsertSchema.match_field = z.string().optional().describe(`Column to match on (default: "${tab.primaryKey}")`);
  } else {
    upsertSchema.match_field = z.string().describe('Column to match on (e.g., "Email", "Name")');
  }
  for (const col of tab.columns) {
    const fieldName = fieldMap.get(col)!;
    upsertSchema[fieldName] = z.string().optional().describe(col);
  }

  const upsertDescription = tab.primaryKey
    ? `Find and update an existing row in ${tab.baseName}, or create a new one if not found.

Matches by ${tab.primaryKey} (primary key) by default. Just provide the ${tab.primaryKey} value.

Example: match_value="john@example.com" will:
- If found: update that row with the provided fields
- If not found: create a new row with all provided fields
${purposeLine}
Columns: ${tab.columns.join(', ')}
Primary key: ${tab.primaryKey}`
    : `Find and update an existing row in ${tab.baseName}, or create a new one if not found.

Use this to avoid duplicates. Searches by the match_field, updates if found, creates if not.

Example: match_field="Email", match_value="john@example.com" will:
- If found: update that row with the provided fields
- If not found: create a new row with all provided fields
${purposeLine}
Columns: ${tab.columns.join(', ')}`;

  server.tool(
    `${slug}_upsert`,
    upsertDescription,
    upsertSchema,
    async (args) => {
      try {
        // Use primaryKey as default match_field if available
        const matchField = (args.match_field as string | undefined) || tab.primaryKey;
        const matchValue = args.match_value as string;

        if (!matchField) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'match_field is required (no primary key configured for this table)',
              },
            ],
            isError: true,
          };
        }

        // Validate match_field is a valid column
        if (!tab.columns.includes(matchField)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Invalid match_field "${matchField}". Must be one of: ${tab.columns.join(', ')}`,
              },
            ],
            isError: true,
          };
        }

        // Build data from provided fields
        const data: Record<string, string> = {};
        for (const col of tab.columns) {
          const fieldName = fieldMap.get(col)!;
          if (args[fieldName] !== undefined) {
            data[col] = args[fieldName] as string;
          }
        }

        // Ensure match field value is included in data
        if (!data[matchField]) {
          data[matchField] = matchValue;
        }

        // Search for existing row
        const searchResult = await client.searchTab(tab.title, matchValue, 50);

        // Find exact match on the specified field
        const existingRow = searchResult.rows.find(
          (row) => row.data[matchField]?.toLowerCase() === matchValue.toLowerCase()
        );

        if (existingRow) {
          // Update existing row
          await client.updateTabRow(tab.title, existingRow.rowNumber, data);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Updated existing row ${existingRow.rowNumber} in ${tab.title} (matched ${matchField}="${matchValue}").`,
              },
            ],
          };
        } else {
          // Create new row
          const result = await client.appendTabRow(tab.title, data);
          const match = result.updatedRange.match(/!A(\d+):/);
          const rowNum = match ? match[1] : 'unknown';
          return {
            content: [
              {
                type: 'text' as const,
                text: `Created new row ${rowNum} in ${tab.title} (no match found for ${matchField}="${matchValue}").`,
              },
            ],
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error upserting row: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_upsert`);

  // {slug}_list - List rows
  server.tool(
    `${slug}_list`,
    `List rows from your ${tab.baseName} table.
${purposeLine}`,
    {
      limit: z.number().optional().default(50).describe('Maximum rows to return (default: 50)'),
      offset: z.number().optional().default(0).describe('Number of rows to skip'),
    },
    async (args) => {
      try {
        const result = await client.readTabRows(tab.title, {
          limit: args.limit,
          offset: args.offset,
        });

        if (result.rows.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No rows found in ${tab.title}.`,
              },
            ],
          };
        }

        const formatted = result.rows
          .map((row) => {
            const fields = Object.entries(row.data)
              .filter(([, v]) => v)
              .map(([k, v]) => `  ${k}: ${v}`)
              .join('\n');
            return `Row ${row.rowNumber}:\n${fields}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `${tab.title} (${result.total} total rows):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error listing rows: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_list`);

  // {slug}_search - Search rows
  server.tool(
    `${slug}_search`,
    `Search rows in your ${tab.baseName} table.
${purposeLine}
Searches across all columns.`,
    {
      query: z.string().describe('Search term (searches all columns)'),
      limit: z.number().optional().default(20).describe('Maximum results (default: 20)'),
    },
    async (args) => {
      try {
        const result = await client.searchTab(tab.title, args.query, args.limit);

        if (result.rows.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No matches found for "${args.query}" in ${tab.title}.`,
              },
            ],
          };
        }

        const formatted = result.rows
          .map((row) => {
            const fields = Object.entries(row.data)
              .filter(([, v]) => v)
              .map(([k, v]) => `  ${k}: ${v}`)
              .join('\n');
            return `Row ${row.rowNumber}:\n${fields}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${result.total} matches for "${args.query}" in ${tab.title}:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error searching: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_search`);

  // {slug}_update - Update a row
  const updateSchema: Record<string, z.ZodTypeAny> = {
    row_number: z.number().describe('Row number to update (from list or search results)'),
  };
  for (const col of tab.columns) {
    const fieldName = fieldMap.get(col)!;
    updateSchema[fieldName] = z.string().optional().describe(`Update ${col}`);
  }

  server.tool(
    `${slug}_update`,
    `Update a row in your ${tab.baseName} table.
${purposeLine}
Only fields you provide will be updated.`,
    updateSchema,
    async (args) => {
      try {
        const rowNumber = args.row_number as number;

        // Map field names back to column names
        const data: Record<string, string> = {};
        for (const col of tab.columns) {
          const fieldName = fieldMap.get(col)!;
          if (args[fieldName] !== undefined) {
            data[col] = args[fieldName] as string;
          }
        }

        if (Object.keys(data).length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No fields provided to update.',
              },
            ],
            isError: true,
          };
        }

        const result = await client.updateTabRow(tab.title, rowNumber, data);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Updated row ${result.rowNumber} in ${tab.title}.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error updating row: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_update`);

  // {slug}_delete - Delete a row
  server.tool(
    `${slug}_delete`,
    `Delete a row from your ${tab.baseName} table.

WARNING: This permanently removes the row.`,
    {
      row_number: z.number().describe('Row number to delete (from list or search results)'),
    },
    async (args) => {
      try {
        await client.deleteTabRow(tab.title, args.row_number);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Deleted row ${args.row_number} from ${tab.title}.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error deleting row: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_delete`);

  return registeredTools;
}

/**
 * Register all sheets tools: management tools + per-tab CRUD tools.
 * Fetches current tabs from API and generates tools for each.
 */
export async function registerSheetsTools(
  server: McpServer,
  client: SkillomaticClient
): Promise<string[]> {
  const registeredTools: string[] = [];

  // Register static management tools
  const managementTools = registerTabManagementTools(server, client);
  registeredTools.push(...managementTools);

  // Fetch tabs and register per-tab tools
  try {
    const response = await client.listTabs();

    // Handle slug collisions for duplicate base names
    const slugCounts = new Map<string, number>();

    for (const tab of response.tabs) {
      let slug = toSlug(tab.baseName);
      const count = slugCounts.get(slug) || 0;
      if (count > 0) slug = `${slug}_${count}`;
      slugCounts.set(toSlug(tab.baseName), count + 1);

      const tabTools = registerToolsForTab(server, client, tab, slug);
      registeredTools.push(...tabTools);
    }
  } catch (error) {
    // If we can't fetch tabs, just register management tools
    // User can still create tabs and tools will be available on next connection
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Could not fetch tabs for tool generation: ${message}`);
  }

  return registeredTools;
}
