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
import type { TabConfig, TabsResponse } from '../types.js';

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

View your data: ${response.spreadsheetUrl}`;
  }

  const tableList = response.tabs
    .map((tab) => {
      const slug = toSlug(tab.title);
      return [
        `## ${tab.title}`,
        `**Purpose:** ${tab.purpose}`,
        `**Columns:** ${tab.columns.join(', ')}`,
        `**Tools:** ${slug}_add, ${slug}_list, ${slug}_search, ${slug}_update, ${slug}_delete`,
      ].join('\n');
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
- "Contacts" for CRM contacts
- "Jobs" for job applications
- "Inventory" for product tracking

After creating a table, new tools will be available: {tablename}_add, {tablename}_list, etc.`,
    {
      title: z.string().describe('Table name (e.g., "Contacts", "Jobs")'),
      purpose: z.string().describe('What this table tracks (for context)'),
      columns: z.array(z.string()).describe('Column headers (all treated as text)'),
    },
    async (args) => {
      try {
        const tab = await client.createTab({
          title: args.title,
          purpose: args.purpose,
          columns: args.columns,
        });

        const slug = toSlug(tab.title);
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Created table "${tab.title}" with ${tab.columns.length} columns.`,
                '',
                `**New tools will be available after restart:**`,
                `- ${slug}_add: Add a new row`,
                `- ${slug}_list: List rows`,
                `- ${slug}_search: Search rows`,
                `- ${slug}_update: Update a row`,
                `- ${slug}_delete: Delete a row`,
                '',
                `Columns: ${tab.columns.join(', ')}`,
                '',
                `⚠️ **Restart required:** Please restart your MCP connection (or Claude Code) to use the new ${slug}_* tools.`,
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

        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Updated schema for "${tab.title}".`,
                `Columns: ${tab.columns.join(', ')}`,
                args.purpose ? `Purpose: ${tab.purpose}` : '',
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
 * Each table gets 5 tools: {slug}_add, {slug}_list, {slug}_search, {slug}_update, {slug}_delete
 *
 * Note: "tab" in code = "table" in user-facing descriptions
 */
export function registerToolsForTab(
  server: McpServer,
  client: SkillomaticClient,
  tab: TabConfig
): string[] {
  const slug = toSlug(tab.title);
  const registeredTools: string[] = [];

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
    `Add a new row to your ${tab.title} table.

Purpose: ${tab.purpose}
Columns: ${tab.columns.join(', ')}`,
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

  // {slug}_list - List rows
  server.tool(
    `${slug}_list`,
    `List rows from your ${tab.title} table.

Purpose: ${tab.purpose}`,
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
    `Search rows in your ${tab.title} table.

Purpose: ${tab.purpose}
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
    `Update a row in your ${tab.title} table.

Purpose: ${tab.purpose}
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
    `Delete a row from your ${tab.title} table.

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
    for (const tab of response.tabs) {
      const tabTools = registerToolsForTab(server, client, tab);
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
