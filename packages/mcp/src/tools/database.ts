/**
 * Database query tools for the MCP server.
 * Only registered for super admin users.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';

// Schemas for tool inputs
const queryDatabaseSchema = {
  query: z.string().describe('SQL SELECT query to execute (read-only)'),
  limit: z.number().optional().default(100).describe('Maximum rows to return (default: 100)'),
};

const getTableSchemaSchema = {
  table: z.string().describe('Table name to get schema for'),
};

/**
 * Register database tools with the MCP server.
 * Only available for super admin users.
 *
 * Note: Tools can simply throw errors - TracedMcpServer handles conversion to MCP error responses.
 */
export function registerDatabaseTools(server: McpServer, client: SkillomaticClient): void {
  server.tool(
    'list_database_tables',
    'List all tables available for querying in the production database',
    {},
    async () => {
      const result = await client.listDatabaseTables();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'get_table_schema',
    'Get the schema (columns and types) for a specific database table',
    getTableSchemaSchema,
    async (args) => {
      const result = await client.getTableSchema(args.table);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'query_database',
    'Execute a read-only SQL SELECT query against the production database. Only SELECT queries are allowed.',
    queryDatabaseSchema,
    async (args) => {
      const result = await client.queryDatabase(args.query, args.limit);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'get_database_stats',
    'Get row counts for all tables in the database',
    {},
    async () => {
      const result = await client.getDatabaseStats();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
