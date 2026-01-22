/**
 * Proxy Handler for Dynamic Tools
 *
 * Executes provider API calls through the Skillomatic API,
 * which handles authentication and provider-specific formatting.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';
import type { GeneratedTool } from './generator.js';
import { interpolatePath, categorizeParams } from './generator.js';
import { getManifest } from './manifests/index.js';

/**
 * Proxy request payload sent to Skillomatic API
 */
export interface ProxyRequest {
  provider: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Register all generated tools with an MCP server
 */
export function registerGeneratedTools(
  server: McpServer,
  tools: GeneratedTool[],
  client: SkillomaticClient
): string[] {
  const registered: string[] = [];

  for (const tool of tools) {
    // MCP server.tool signature: (name, description, schema, handler)
    server.tool(tool.name, tool.description, tool.inputSchema, async (args) => {
      try {
        const manifest = getManifest(tool.meta.provider);
        if (!manifest) {
          return {
            content: [{ type: 'text' as const, text: `Unknown provider: ${tool.meta.provider}` }],
            isError: true,
          };
        }

        // Find the operation definition
        const operationId = tool.name.replace(`${tool.meta.provider.replace(/-/g, '_')}_`, '');
        const operation = manifest.operations.find((op) => op.id === operationId);
        if (!operation) {
          return {
            content: [{ type: 'text' as const, text: `Unknown operation: ${operationId}` }],
            isError: true,
          };
        }

        // Categorize parameters
        const typedArgs = args as Record<string, unknown>;
        const { pathParams, queryParams, bodyParams } = categorizeParams(operation, typedArgs);

        // Interpolate path parameters
        const { path } = interpolatePath(tool.meta.path, pathParams);

        // Build request body
        let body: unknown = undefined;
        if (Object.keys(bodyParams).length > 0) {
          // Some providers (Zoho) require data to be wrapped
          if (tool.meta.wrapInData) {
            body = { data: [bodyParams] };
          } else {
            body = bodyParams;
          }
        }

        // Build headers
        const headers: Record<string, string> = {};
        if (tool.meta.requiresOnBehalfOf) {
          headers['X-Requires-On-Behalf-Of'] = 'true';
        }

        // Make the proxy request through Skillomatic API
        const result = await client.proxyAtsRequest({
          provider: tool.meta.provider,
          method: tool.meta.method,
          path,
          query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          body,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error calling ${tool.name}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    });
    registered.push(tool.name);
  }

  return registered;
}
