/**
 * MCP SSE Endpoint for Web Chat (JWT Auth)
 *
 * Provides an MCP server endpoint for the web chat interface.
 * Uses Server-Sent Events (SSE) for server→client messages and
 * HTTP POST for client→server messages.
 *
 * Authentication: JWT via Authorization: Bearer <jwt-token>
 *
 * This is similar to /mcp but uses JWT auth instead of API key auth,
 * allowing the web frontend to connect directly without needing an API key.
 */

import { Hono } from 'hono';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { jwtAuth, type AuthPayload } from '../middleware/auth.js';
import { createMcpServer } from '../lib/mcp-server.js';
import { createLogger } from '../lib/logger.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

const log = createLogger('McpWebRoutes');

// Store active sessions
const sessions = new Map<
  string,
  {
    transport: SSEServerTransport;
    userId: string;
    createdAt: Date;
  }
>();

// Cleanup stale sessions periodically (1 hour max lifetime)
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.createdAt.getTime() > SESSION_MAX_AGE_MS) {
      log.info('mcp_web_session_expired', { sessionId, userId: session.userId });
      session.transport.close().catch(() => {});
      sessions.delete(sessionId);
    }
  }
}, 60 * 1000);

export const mcpWebRoutes = new Hono();

/**
 * OPTIONS /mcp-web - Handle CORS preflight requests
 * Must be before JWT auth middleware to avoid auth errors on preflight
 */
mcpWebRoutes.options('/', (c) => {
  const origin = c.req.header('origin');
  if (origin && (origin.includes('localhost:5173') || origin.includes('localhost:4173'))) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return new Response(null, { status: 204 });
});

// Apply JWT auth to all routes (except OPTIONS which is handled above)
mcpWebRoutes.use('*', jwtAuth);

/**
 * GET /mcp-web - Establish SSE connection
 */
mcpWebRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthPayload;

  if (!user?.id) {
    return c.json({ error: { message: 'Authentication required' } }, 401);
  }

  log.info('mcp_web_connection_request', { userId: user.id });

  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;

  if (!nodeRes) {
    log.error('mcp_web_no_node_response', { userId: user.id });
    return c.json({ error: { message: 'SSE not supported in this environment' } }, 500);
  }

  // Set CORS headers manually for SSE (Hono middleware doesn't apply to raw nodeRes)
  const origin = c.req.header('origin');
  if (origin && (origin.includes('localhost:5173') || origin.includes('localhost:4173'))) {
    nodeRes.setHeader('Access-Control-Allow-Origin', origin);
    nodeRes.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  try {
    // Create MCP server for this user (no API key needed for web)
    const server = await createMcpServer(user.id);

    // Create SSE transport
    const transport = new SSEServerTransport('/mcp-web', nodeRes);

    // Connect server to transport
    await server.connect(transport);

    const sessionId = transport.sessionId;

    sessions.set(sessionId, {
      transport,
      userId: user.id,
      createdAt: new Date(),
    });

    log.info('mcp_web_session_created', { sessionId, userId: user.id });

    transport.onclose = () => {
      log.info('mcp_web_session_closed', { sessionId, userId: user.id });
      sessions.delete(sessionId);
    };

    // Keep connection open for SSE streaming - this promise intentionally never resolves
    // The connection is closed when the client disconnects (handled by transport.onclose)
    return new Promise(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('mcp_web_connection_failed', { userId: user.id, error: message });
    return c.json({ error: { message: `Failed to establish MCP connection: ${message}` } }, 500);
  }
});

/**
 * POST /mcp-web - Receive messages from client
 */
mcpWebRoutes.post('/', async (c) => {
  const user = c.get('user') as AuthPayload;

  if (!user?.id) {
    return c.json({ error: { message: 'Authentication required' } }, 401);
  }

  const sessionId = c.req.query('sessionId');

  if (!sessionId) {
    return c.json({ error: { message: 'Missing sessionId query parameter' } }, 400);
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return c.json({ error: { message: 'Session not found or expired' } }, 404);
  }

  if (session.userId !== user.id) {
    log.warn('mcp_web_session_mismatch', { sessionId, requestUserId: user.id, sessionUserId: session.userId });
    return c.json({ error: { message: 'Session not found or expired' } }, 404);
  }

  const nodeReq = (c.env as { incoming?: IncomingMessage })?.incoming;
  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;

  if (!nodeReq || !nodeRes) {
    return c.json({ error: { message: 'POST handling not supported in this environment' } }, 500);
  }

  // Set CORS headers manually for POST (Hono middleware doesn't apply to raw nodeRes)
  const origin = c.req.header('origin');
  if (origin && (origin.includes('localhost:5173') || origin.includes('localhost:4173'))) {
    nodeRes.setHeader('Access-Control-Allow-Origin', origin);
    nodeRes.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  try {
    const body = await c.req.json();
    await session.transport.handlePostMessage(nodeReq, nodeRes, body);
    return new Response(null, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('mcp_web_message_failed', { sessionId, userId: user.id, error: message });
    return c.json({ error: { message: `Failed to process message: ${message}` } }, 500);
  }
});
