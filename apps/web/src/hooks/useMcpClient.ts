/**
 * MCP Client Hook
 *
 * Provides a React hook for connecting to the MCP server from the browser.
 * Uses SSE transport for server→client messages and HTTP POST for client→server.
 *
 * This enables dynamic tool discovery and execution without hardcoding
 * action types in the frontend.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UseMcpClientReturn {
  /** Whether the client is connected to the MCP server */
  isConnected: boolean;
  /** Whether the client is currently connecting */
  isConnecting: boolean;
  /** Error message if connection failed */
  error: string | null;
  /** List of available tools from the MCP server */
  tools: Tool[];
  /** Call a tool on the MCP server */
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  /** Reconnect to the MCP server */
  reconnect: () => Promise<void>;
  /** Disconnect from the MCP server */
  disconnect: () => void;
}

/**
 * Hook for connecting to the MCP server
 */
export function useMcpClient(): UseMcpClientReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);

  const clientRef = useRef<Client | null>(null);
  const transportRef = useRef<SSEClientTransport | null>(null);

  const connect = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    // Cleanup existing connection
    if (clientRef.current) {
      try {
        await clientRef.current.close();
      } catch {
        // Ignore close errors
      }
      clientRef.current = null;
      transportRef.current = null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create SSE transport with JWT auth
      const transport = new SSEClientTransport(
        new URL(`${API_BASE}/mcp-web`),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      transportRef.current = transport;

      // Create MCP client
      const client = new Client(
        {
          name: 'skillomatic-web',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      clientRef.current = client;

      // Connect to server
      await client.connect(transport);

      setIsConnected(true);

      // Fetch available tools
      const toolsResult = await client.listTools();
      setTools(toolsResult.tools);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to MCP server';
      setError(message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close().catch(() => {});
      clientRef.current = null;
      transportRef.current = null;
    }
    setIsConnected(false);
    setTools([]);
  }, []);

  const callTool = useCallback(async (name: string, args: Record<string, unknown>): Promise<unknown> => {
    if (!clientRef.current) {
      throw new Error('MCP client not connected');
    }

    const result = await clientRef.current.callTool({ name, arguments: args });

    // Extract content from MCP response
    if (result.content && Array.isArray(result.content) && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text') {
        try {
          return JSON.parse(firstContent.text);
        } catch {
          return firstContent.text;
        }
      }
      return firstContent;
    }

    return result;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    tools,
    callTool,
    reconnect: connect,
    disconnect,
  };
}

/**
 * Convert MCP tools to OpenAI/Anthropic tool format for LLM calls
 */
export function mcpToolsToLLMTools(tools: Tool[]): Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema || { type: 'object', properties: {} },
    },
  }));
}
