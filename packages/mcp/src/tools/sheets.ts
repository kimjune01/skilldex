/**
 * Google Sheets tab tools for the MCP server.
 *
 * Provides two types of tools:
 * 1. Management tools (static): list_tabs, create_tab, update_tab_schema
 * 2. Per-tab CRUD tools (dynamic): {tabName}_add, {tabName}_list, {tabName}_search, etc.
 *
 * Tools are generated based on user's tab configuration - each tab gets its own
 * set of hardcoded tools that can only operate on that specific tab.
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
 * Error message when Google Sheets is not connected.
 */
const NOT_CONNECTED_MESSAGE = `Google Sheets is not connected.

To use spreadsheet features:
1. Go to Skillomatic web app → Integrations
2. Find "Google Sheets" under Other Integrations
3. Click Connect and authorize access

After connecting, you can create tabs to track any data (Contacts, Jobs, etc.) with dedicated tools for each.`;

/**
 * Format tabs response for LLM context.
 */
function formatTabsForLLM(response: TabsResponse): string {
  if (response.tabs.length === 0) {
    return `No tabs found in your spreadsheet.

To get started, use the create_tab tool to create a tab for your data.

Example:
- Title: "Contacts"
- Purpose: "Track business contacts and leads"
- Columns: ["Name", "Company", "Email", "Phone", "Stage", "Notes"]

Spreadsheet URL: ${response.spreadsheetUrl}`;
  }

  const tabList = response.tabs
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

  return `Your Spreadsheet Tabs:\n\n${tabList}\n\nSpreadsheet URL: ${response.spreadsheetUrl}`;
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

  // List all tabs
  server.tool(
    'list_tabs',
    `List all tabs in your Skillomatic spreadsheet.

Each tab represents a different data type (Contacts, Jobs, etc.) with its own CRUD tools.
Call this to see what tabs are available and their columns.`,
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
          content: [{ type: 'text' as const, text: `Error listing tabs: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('list_tabs');

  // Create a new tab
  server.tool(
    'create_tab',
    `Create a new tab in your spreadsheet for tracking a new data type.

Examples:
- "Contacts" for CRM contacts
- "Jobs" for job applications
- "Inventory" for product tracking

After creating a tab, new tools will be available: {tabname}_add, {tabname}_list, etc.`,
    {
      title: z.string().describe('Tab name (e.g., "Contacts", "Jobs")'),
      purpose: z.string().describe('What this tab tracks (for context)'),
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
                `Created tab "${tab.title}" with ${tab.columns.length} columns.`,
                '',
                `**New tools will be available after restart:**`,
                `- ${slug}_add: Add a new entry`,
                `- ${slug}_list: List entries`,
                `- ${slug}_search: Search entries`,
                `- ${slug}_update: Update an entry`,
                `- ${slug}_delete: Delete an entry`,
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
          content: [{ type: 'text' as const, text: `Error creating tab: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('create_tab');

  // Update tab schema
  server.tool(
    'update_tab_schema',
    `Update a tab's columns.

Pass the complete list of columns in the desired order.
- To add a column: include it in the list
- To remove a column: omit it from the list
- To rename a column: change the name in the list
- To reorder: change the order in the list

Note: Column changes only affect the header row. Existing data rows are NOT modified.`,
    {
      tabName: z.string().describe('Tab name to modify'),
      columns: z.array(z.string()).describe('New column list (complete, in order)'),
      purpose: z.string().optional().describe('Optionally update the purpose'),
    },
    async (args) => {
      try {
        const tab = await client.updateTabSchema(args.tabName, {
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
          content: [{ type: 'text' as const, text: `Error updating tab schema: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('update_tab_schema');

  // Delete tab
  server.tool(
    'delete_tab',
    `Delete a tab from your spreadsheet.

WARNING: This permanently deletes the tab and all its data.`,
    {
      tabName: z.string().describe('Tab name to delete'),
    },
    async (args) => {
      try {
        const slug = toSlug(args.tabName);
        await client.deleteTab(args.tabName);
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `Deleted tab "${args.tabName}" and all its data.`,
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
          content: [{ type: 'text' as const, text: `Error deleting tab: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('delete_tab');

  return registeredTools;
}

/**
 * Register CRUD tools for a specific tab.
 * Each tab gets 5 tools: {slug}_add, {slug}_list, {slug}_search, {slug}_update, {slug}_delete
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

  // {slug}_add - Add a new entry
  server.tool(
    `${slug}_add`,
    `Add a new entry to your ${tab.title} sheet.

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
              text: `Added entry to ${tab.title} at row ${rowNum}.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error adding entry: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_add`);

  // {slug}_list - List entries
  server.tool(
    `${slug}_list`,
    `List entries from your ${tab.title} sheet.

Purpose: ${tab.purpose}`,
    {
      limit: z.number().optional().default(50).describe('Maximum entries to return (default: 50)'),
      offset: z.number().optional().default(0).describe('Number of entries to skip'),
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
                text: `No entries found in ${tab.title}.`,
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
              text: `${tab.title} (${result.total} total entries):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error listing entries: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_list`);

  // {slug}_search - Search entries
  server.tool(
    `${slug}_search`,
    `Search entries in your ${tab.title} sheet.

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

  // {slug}_update - Update an entry
  const updateSchema: Record<string, z.ZodTypeAny> = {
    row_number: z.number().describe('Row number to update (from list or search results)'),
  };
  for (const col of tab.columns) {
    const fieldName = fieldMap.get(col)!;
    updateSchema[fieldName] = z.string().optional().describe(`Update ${col}`);
  }

  server.tool(
    `${slug}_update`,
    `Update an entry in your ${tab.title} sheet.

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
          content: [{ type: 'text' as const, text: `Error updating entry: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push(`${slug}_update`);

  // {slug}_delete - Delete an entry
  server.tool(
    `${slug}_delete`,
    `Delete an entry from your ${tab.title} sheet.

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
          content: [{ type: 'text' as const, text: `Error deleting entry: ${message}` }],
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
