/**
 * MCP SSE Endpoint for ChatGPT Web/Mobile
 *
 * Provides a hosted MCP server endpoint that ChatGPT can connect to.
 * Uses Server-Sent Events (SSE) for server→client messages and
 * HTTP POST for client→server messages.
 *
 * Authentication: API key via Authorization: Bearer sk_live_xxx
 *
 * Flow:
 * 1. Client connects via GET /mcp (establishes SSE stream)
 * 2. Server sends endpoint event with sessionId
 * 3. Client sends messages via POST /mcp?sessionId=xxx
 * 4. Server responds via SSE stream
 *
 * @see https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta
 */

import { Hono } from 'hono';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { apiKeyAuth, type ApiKeyUser } from '../middleware/apiKey.js';
import { createMcpServer } from '../lib/mcp-server.js';
import { createLogger } from '../lib/logger.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

const log = createLogger('McpRoutes');

// Store active sessions
// Map of sessionId → { transport, server, userId }
const sessions = new Map<
  string,
  {
    transport: SSEServerTransport;
    userId: string;
    createdAt: Date;
  }
>();

// Cleanup stale sessions periodically (1 hour max lifetime)
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.createdAt.getTime() > SESSION_MAX_AGE_MS) {
      log.info('mcp_session_expired', { sessionId, userId: session.userId });
      session.transport.close().catch(() => {});
      sessions.delete(sessionId);
    }
  }
}, 60 * 1000); // Check every minute

export const mcpRoutes = new Hono();

// Apply API key auth to all MCP routes
mcpRoutes.use('*', apiKeyAuth);

/**
 * GET /mcp - Establish SSE connection
 *
 * This creates a new MCP server instance for the authenticated user
 * and establishes an SSE stream for server→client communication.
 */
mcpRoutes.get('/', async (c) => {
  const user = c.get('apiKeyUser') as ApiKeyUser;

  log.info('mcp_connection_request', { userId: user.id, email: user.email });

  // Get the raw Node.js response object
  // Hono wraps it, but we need direct access for SSE
  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;

  if (!nodeRes) {
    log.error('mcp_no_node_response', { userId: user.id });
    return c.json({ error: { message: 'SSE not supported in this environment' } }, 500);
  }

  try {
    // Create MCP server for this user
    const server = await createMcpServer(user.id, c.req.header('Authorization')?.slice(7) || '');

    // Create SSE transport
    // The endpoint tells the client where to POST messages
    const transport = new SSEServerTransport('/mcp', nodeRes);

    // Connect server to transport
    await server.connect(transport);

    const sessionId = transport.sessionId;

    // Store session for POST message routing
    sessions.set(sessionId, {
      transport,
      userId: user.id,
      createdAt: new Date(),
    });

    log.info('mcp_session_created', { sessionId, userId: user.id });

    // Handle connection close
    transport.onclose = () => {
      log.info('mcp_session_closed', { sessionId, userId: user.id });
      sessions.delete(sessionId);
    };

    // The SSE transport has taken over the response - don't return anything
    // This keeps the connection open for streaming
    // We return a never-resolving promise to prevent Hono from sending a response
    return new Promise(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('mcp_connection_failed', { userId: user.id, error: message });
    return c.json({ error: { message: `Failed to establish MCP connection: ${message}` } }, 500);
  }
});

/**
 * POST /mcp - Receive messages from client
 *
 * Client sends JSON-RPC messages here, identified by sessionId query param.
 * The message is routed to the appropriate SSE session.
 */
mcpRoutes.post('/', async (c) => {
  const user = c.get('apiKeyUser') as ApiKeyUser;
  const sessionId = c.req.query('sessionId');

  if (!sessionId) {
    return c.json({ error: { message: 'Missing sessionId query parameter' } }, 400);
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return c.json({ error: { message: 'Session not found or expired' } }, 404);
  }

  // Verify the session belongs to this user
  if (session.userId !== user.id) {
    log.warn('mcp_session_mismatch', { sessionId, requestUserId: user.id, sessionUserId: session.userId });
    return c.json({ error: { message: 'Session not found or expired' } }, 404);
  }

  // Get the raw request and response for the transport
  const nodeReq = (c.env as { incoming?: IncomingMessage })?.incoming;
  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;

  if (!nodeReq || !nodeRes) {
    return c.json({ error: { message: 'POST handling not supported in this environment' } }, 500);
  }

  try {
    // Parse the body ourselves since Hono may have already consumed it
    const body = await c.req.json();

    // Handle the message via the transport
    await session.transport.handlePostMessage(nodeReq, nodeRes, body);

    // Response is handled by the transport (returns 202 Accepted)
    return new Response(null, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('mcp_message_failed', { sessionId, userId: user.id, error: message });
    return c.json({ error: { message: `Failed to process message: ${message}` } }, 500);
  }
});

/**
 * GET /mcp/sessions - List active sessions (for debugging)
 * Only available to super admins
 */
mcpRoutes.get('/sessions', async (c) => {
  const user = c.get('apiKeyUser') as ApiKeyUser;

  if (!user.isSuperAdmin) {
    return c.json({ error: { message: 'Forbidden' } }, 403);
  }

  const sessionList = Array.from(sessions.entries()).map(([id, session]) => ({
    sessionId: id,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    ageMinutes: Math.round((Date.now() - session.createdAt.getTime()) / 60000),
  }));

  return c.json({
    data: {
      count: sessionList.length,
      sessions: sessionList,
    },
  });
});
