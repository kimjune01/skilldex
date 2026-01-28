/**
 * Skillomatic MCP Server - Standalone HTTP Service
 *
 * Provides a hosted MCP endpoint using Streamable HTTP transport.
 * Proxies all tool calls to the main Skillomatic API.
 *
 * This server reuses the tool registration logic from packages/mcp,
 * but exposes it over HTTP instead of stdio.
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Import from packages/mcp to reuse all the tool logic
import { SkillomaticClient } from '@skillomatic/mcp/api-client';
import { registerTools } from '@skillomatic/mcp/tools';
import { wrapWithTracing } from '@skillomatic/mcp/traced-server';

const PORT = parseInt(process.env.PORT || '3001', 10);
const API_URL = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';
const MCP_VERSION = '0.1.0';
const GIT_HASH = process.env.GIT_HASH || 'dev';

console.log('[MCP Server] Starting...');
console.log(`[MCP Server] Will proxy to API at ${API_URL}`);

// ============ Session Management ============

interface Session {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  userId: string;
  createdAt: Date;
}

const sessions = new Map<string, Session>();

// Cleanup stale sessions (1 hour max)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.createdAt.getTime() > 60 * 60 * 1000) {
      console.log(`[MCP Server] Session expired: ${sessionId}`);
      session.transport.close().catch(() => {});
      sessions.delete(sessionId);
    }
  }
}, 60 * 1000);

// ============ MCP Server Factory ============

async function createMcpServerForUser(apiKey: string): Promise<{ server: McpServer; userName: string }> {
  // Create API client that proxies to the main API
  const client = new SkillomaticClient({ baseUrl: API_URL, apiKey });

  // Verify authentication and get user info
  const user = await client.verifyAuth();
  const userName = user.name || user.email;
  console.log(`[MCP Server] Authenticated as: ${userName}`);

  // Get user's capabilities (which integrations are connected)
  const { profile: capabilities } = await client.getCapabilities();
  console.log(`[MCP Server] Capabilities: ATS=${capabilities.hasATS}, Email=${capabilities.hasEmail}, Calendar=${capabilities.hasCalendar}`);

  // Create MCP server with tracing wrapper for tool call logging
  const mcpServer = new McpServer(
    { name: 'skillomatic', version: MCP_VERSION },
    { capabilities: { tools: { listChanged: true } } }
  );
  const server = wrapWithTracing(mcpServer);

  // Register all tools based on user's capabilities
  await registerTools(server, client, capabilities);

  return { server, userName };
}

// ============ Hono App ============

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  credentials: false,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'mcp-session-id'],
  exposeHeaders: ['mcp-session-id'],
}));

// Health checks
app.get('/', (c) => c.json({ status: 'ok', service: 'mcp-server', version: MCP_VERSION, gitHash: GIT_HASH }));
app.get('/health', (c) => c.json({ status: 'ok', service: 'mcp-server', version: MCP_VERSION, gitHash: GIT_HASH }));

// Helper to get Node.js request/response from Hono context
function getNodeReqRes(c: { env: unknown }): { req: IncomingMessage; res: ServerResponse } | null {
  const env = c.env as { incoming?: IncomingMessage; outgoing?: ServerResponse };
  if (!env.incoming || !env.outgoing) return null;
  return { req: env.incoming, res: env.outgoing };
}

// Helper to extract API key from Authorization header
function getApiKey(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

// POST /mcp - Handle JSON-RPC requests (main handler for Streamable HTTP)
app.post('/mcp', async (c) => {
  const apiKey = getApiKey(c);
  if (!apiKey) {
    return c.json({ error: { message: 'Missing or invalid Authorization header' } }, 401);
  }

  const nodeIO = getNodeReqRes(c);
  if (!nodeIO) {
    return c.json({ error: { message: 'Node.js request/response not available' } }, 500);
  }

  const sessionId = c.req.header('mcp-session-id');

  // Parse body to check request type
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  console.log(`[MCP Server] POST /mcp - sessionId: ${sessionId || 'none'}, isInit: ${isInitializeRequest(body)}`);

  // Check if this is an initialization request (no session ID required)
  if (isInitializeRequest(body)) {
    try {
      const { server, userName } = await createMcpServerForUser(apiKey);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) {
          console.log(`[MCP Server] Session closed: ${sid}`);
          sessions.delete(sid);
        }
      };

      // Connect server to transport
      await server.connect(transport);

      // Handle the request - pass parsed body since we already consumed the stream
      await transport.handleRequest(nodeIO.req, nodeIO.res, body);

      // Store session
      const newSessionId = transport.sessionId;
      if (newSessionId) {
        sessions.set(newSessionId, { transport, server, userId: userName, createdAt: new Date() });
        console.log(`[MCP Server] Session created: ${newSessionId} for ${userName}`);
      }

      return new Promise(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MCP Server] Connection failed: ${message}`);
      return c.json({ error: { message } }, 401);
    }
  }

  // Non-init requests require session ID
  if (!sessionId) {
    return c.json({ error: { message: 'Missing sessionId' } }, 400);
  }

  // Existing session - reuse transport
  const session = sessions.get(sessionId);
  if (!session) {
    return c.json({ error: { message: 'Session not found' } }, 404);
  }

  await session.transport.handleRequest(nodeIO.req, nodeIO.res, body);
  return new Promise(() => {});
});

// GET /mcp - SSE stream for server-to-client notifications
app.get('/mcp', async (c) => {
  const apiKey = getApiKey(c);
  if (!apiKey) {
    return c.json({ error: { message: 'Missing or invalid Authorization header' } }, 401);
  }

  const nodeIO = getNodeReqRes(c);
  if (!nodeIO) {
    return c.json({ error: { message: 'Node.js request/response not available' } }, 500);
  }

  const sessionId = c.req.header('mcp-session-id');
  if (!sessionId) {
    return c.json({ error: { message: 'Missing mcp-session-id header' } }, 400);
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return c.json({ error: { message: 'Session not found' } }, 404);
  }

  await session.transport.handleRequest(nodeIO.req, nodeIO.res);
  return new Promise(() => {});
});

// DELETE /mcp - Close session
app.delete('/mcp', async (c) => {
  const apiKey = getApiKey(c);
  if (!apiKey) {
    return c.json({ error: { message: 'Missing or invalid Authorization header' } }, 401);
  }

  const nodeIO = getNodeReqRes(c);
  if (!nodeIO) {
    return c.json({ error: { message: 'Node.js request/response not available' } }, 500);
  }

  const sessionId = c.req.header('mcp-session-id');
  if (!sessionId) {
    return c.json({ error: { message: 'Missing mcp-session-id header' } }, 400);
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return c.json({ error: { message: 'Session not found' } }, 404);
  }

  await session.transport.handleRequest(nodeIO.req, nodeIO.res);
  sessions.delete(sessionId);
  console.log(`[MCP Server] Session deleted: ${sessionId}`);

  return new Promise(() => {});
});

// ============ Start Server ============

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[MCP Server] Listening on http://localhost:${info.port}`);
});
