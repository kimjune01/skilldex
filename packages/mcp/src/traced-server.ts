/**
 * Traced MCP Server wrapper.
 * Automatically adds logging/tracing and error handling to all tool invocations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { log } from './logger.js';

/**
 * Wraps an McpServer to automatically trace all tool calls and handle errors.
 *
 * This is a drop-in replacement for McpServer in tool registration code.
 * Simply wrap your McpServer and pass the wrapper to tool registration functions.
 *
 * Usage:
 *   const mcpServer = new McpServer(...);
 *   const server = wrapWithTracing(mcpServer);
 *
 *   // Now use 'server' everywhere - tools get automatic tracing
 *   server.tool('my_tool', 'description', schema, async (args) => {
 *     const result = await client.doSomething(args);
 *     return { content: [{ type: 'text', text: result }] };
 *   });
 *
 * All tool calls will automatically log:
 *   [skillomatic:tool] my_tool called args={...}
 *   [skillomatic:tool] my_tool completed (123ms)
 *   or
 *   [skillomatic:tool] my_tool failed (123ms): error message
 *
 * Errors thrown by tools are caught and returned as MCP error responses.
 */
export type TracedMcpServer = McpServer;

/**
 * Wrap an McpServer to add automatic tracing to all tool registrations.
 * Returns a proxy that intercepts tool() calls.
 */
export function wrapWithTracing(mcpServer: McpServer): TracedMcpServer {
  return new Proxy(mcpServer, {
    get(target, prop, receiver) {
      if (prop === 'tool') {
        return createTracedToolMethod(target);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Create a traced version of the tool() method.
 */
function createTracedToolMethod(mcpServer: McpServer) {
  return function tracedTool(name: string, ...rest: unknown[]): ReturnType<McpServer['tool']> {
    // Find and wrap the callback (always the last argument)
    const callbackIndex = rest.length - 1;
    const originalCallback = rest[callbackIndex] as (
      args: Record<string, unknown>,
      extra: unknown
    ) => CallToolResult | Promise<CallToolResult>;

    // Create traced wrapper with error handling
    const tracedCallback = async (args: Record<string, unknown>, extra: unknown): Promise<CallToolResult> => {
      const trace = log.tool(name, args);
      try {
        const result = await originalCallback(args, extra);

        // Check if result indicates error (tool returned error explicitly)
        if (result.isError) {
          const errorText = result.content?.[0]?.type === 'text'
            ? (result.content[0] as { text: string }).text
            : 'Unknown error';
          trace.error(errorText);
        } else {
          trace.success();
        }

        return result;
      } catch (error) {
        // Tool threw an error - convert to MCP error response
        const message = error instanceof Error ? error.message : String(error);
        trace.error(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    };

    // Replace callback with traced version
    rest[callbackIndex] = tracedCallback;

    // Call original server.tool with modified arguments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mcpServer.tool as any)(name, ...rest);
  };
}
