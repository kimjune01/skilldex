/**
 * Web scraping tools for the MCP server.
 * Used for LinkedIn lookups and other web page scraping via the browser extension.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';

// Schemas for tool inputs
const createScrapeTaskSchema = {
  url: z.string().url().describe('URL to scrape (e.g., LinkedIn profile URL)'),
};

const getScrapeTaskSchema = {
  id: z.string().describe('Scrape task ID'),
};

const scrapeAndWaitSchema = {
  url: z.string().url().describe('URL to scrape (e.g., LinkedIn profile URL)'),
  timeout: z.number().optional().default(60000).describe('Timeout in milliseconds (default: 60000)'),
};

/**
 * Register scrape tools with the MCP server.
 * These are always available but require the browser extension to actually work.
 * Note: Errors are automatically caught and converted to MCP error responses by TracedMcpServer.
 */
export function registerScrapeTools(server: McpServer, client: SkillomaticClient): void {
  server.tool(
    'create_scrape_task',
    'Create a web scrape task. The browser extension will process it. Use get_scrape_task to check status.',
    createScrapeTaskSchema,
    async (args) => {
      const task = await client.createScrapeTask(args.url);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: 'Scrape task created. Use get_scrape_task to check status.',
                task: {
                  id: task.id,
                  url: task.url,
                  status: task.status,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    'get_scrape_task',
    'Get the status and result of a scrape task',
    getScrapeTaskSchema,
    async (args) => {
      const task = await client.getScrapeTask(args.id);

      const response: Record<string, unknown> = {
        id: task.id,
        url: task.url,
        status: task.status,
        createdAt: task.createdAt,
      };

      if (task.status === 'completed') {
        response.result = task.result;
        response.completedAt = task.completedAt;
      } else if (task.status === 'failed') {
        response.error = task.errorMessage;
        response.suggestion = task.suggestion;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'scrape_url',
    'Scrape a URL and wait for the result. Useful for LinkedIn profile lookups.',
    scrapeAndWaitSchema,
    async (args) => {
      // Create the task
      const task = await client.createScrapeTask(args.url);

      // Wait for completion
      const result = await client.waitForScrapeResult(task.id, {
        timeout: args.timeout,
      });

      if (result.status === 'completed') {
        return {
          content: [
            {
              type: 'text' as const,
              text: result.result || 'Scrape completed but no content returned.',
            },
          ],
        };
      } else if (result.status === 'failed') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Scrape failed: ${result.errorMessage || 'Unknown error'}${result.suggestion ? `\n\nSuggestion: ${result.suggestion}` : ''}`,
            },
          ],
          isError: true,
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Scrape task status: ${result.status}. The browser extension may not be running or connected.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
