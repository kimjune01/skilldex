/**
 * Skillomatic MCP Server - Standalone Service
 *
 * Provides hosted MCP endpoint for ChatGPT web/mobile connections.
 * Runs as a persistent ECS Fargate service to support SSE streaming.
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '@skillomatic/db';
import { apiKeys, users, skills } from '@skillomatic/db/schema';
import { eq, isNull } from 'drizzle-orm';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PORT = parseInt(process.env.PORT || '3001', 10);
const MCP_VERSION = '0.1.0';
const GIT_HASH = process.env.GIT_HASH || 'dev';

console.log('[MCP Server] Starting...');

// ============ API Key Auth ============

interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  organizationId: string | null;
}

async function validateApiKey(key: string): Promise<ApiKeyUser | null> {
  if (!key || !key.startsWith('sk_')) {
    return null;
  }

  // Fetch all non-revoked keys with user data
  const results = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(isNull(apiKeys.revokedAt));

  // Find matching key
  for (const row of results) {
    const storedKey = row.api_keys.key;
    if (storedKey === key) {
      // Update last used (fire and forget)
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, row.api_keys.id))
        .execute()
        .catch(() => {});

      return {
        id: row.users.id,
        email: row.users.email,
        name: row.users.name,
        isAdmin: row.users.isAdmin,
        organizationId: row.users.organizationId,
      };
    }
  }

  return null;
}

// ============ MCP Server Factory ============

interface SkillPublic {
  slug: string;
  name: string;
  description: string;
  intent?: string;
  capabilities?: string[];
  isEnabled: boolean;
}

async function createMcpServer(userId: string): Promise<McpServer> {
  const server = new McpServer(
    { name: 'skillomatic', version: MCP_VERSION },
    { capabilities: { tools: {} } }
  );

  // Register skill catalog tool
  server.tool(
    'get_skill_catalog',
    'Get available recruiting workflows. Call this FIRST when user asks about recruiting tasks.',
    {},
    async () => {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const allSkills = await db.select().from(skills);

        const enabledSkills = allSkills
          .filter((s) => s.isEnabled || user?.isAdmin)
          .map((s): SkillPublic => ({
            slug: s.slug,
            name: s.name,
            description: s.description || '',
            intent: s.intent || undefined,
            capabilities: s.capabilities ? JSON.parse(s.capabilities) : undefined,
            isEnabled: s.isEnabled,
          }));

        const catalog = enabledSkills
          .map((s) => {
            const parts = [`## ${s.name} (${s.slug})`, s.description];
            if (s.intent) parts.push(`**When to use:** ${s.intent}`);
            if (s.capabilities?.length) parts.push(`**Capabilities:** ${s.capabilities.join(', ')}`);
            return parts.join('\n');
          })
          .join('\n\n---\n\n');

        return { content: [{ type: 'text' as const, text: catalog || 'No skills available.' }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    }
  );

  // Register get_skill tool
  server.tool(
    'get_skill',
    'Get detailed instructions for a specific recruiting workflow.',
    { slug: z.string().describe('Skill slug from the catalog') },
    async (args: { slug: string }) => {
      try {
        const [skill] = await db.select().from(skills).where(eq(skills.slug, args.slug)).limit(1);
        if (!skill) {
          return { content: [{ type: 'text' as const, text: `Skill not found: ${args.slug}` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: skill.instructions || 'No instructions.' }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    }
  );

  console.log(`[MCP Server] Created server for user ${userId}`);
  return server;
}

// ============ Session Management ============

interface Session {
  transport: SSEServerTransport;
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

// ============ Hono App ============

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  credentials: false,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));

// Root handler (for ALB health checks that may hit /)
app.get('/', (c) => c.json({ status: 'ok', service: 'mcp-server', version: MCP_VERSION, gitHash: GIT_HASH }));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'mcp-server', version: MCP_VERSION, gitHash: GIT_HASH }));

// GET /mcp - Establish SSE connection
app.get('/mcp', async (c) => {
  const authHeader = c.req.header('Authorization');
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!key) {
    return c.json({ error: { message: 'Missing Authorization header' } }, 401);
  }

  const user = await validateApiKey(key);
  if (!user) {
    return c.json({ error: { message: 'Invalid or revoked API key' } }, 401);
  }

  console.log(`[MCP Server] Connection from ${user.email}`);

  // Get raw Node.js response
  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;
  if (!nodeRes) {
    return c.json({ error: { message: 'SSE not available' } }, 500);
  }

  try {
    const server = await createMcpServer(user.id);
    const transport = new SSEServerTransport('/mcp', nodeRes);

    await server.connect(transport);

    const sessionId = transport.sessionId;
    sessions.set(sessionId, { transport, userId: user.id, createdAt: new Date() });

    console.log(`[MCP Server] Session created: ${sessionId}`);

    transport.onclose = () => {
      console.log(`[MCP Server] Session closed: ${sessionId}`);
      sessions.delete(sessionId);
    };

    // Keep connection open
    return new Promise(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MCP Server] Connection failed: ${message}`);
    return c.json({ error: { message: `Failed: ${message}` } }, 500);
  }
});

// POST /mcp - Receive messages
app.post('/mcp', async (c) => {
  const authHeader = c.req.header('Authorization');
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!key) {
    return c.json({ error: { message: 'Missing Authorization header' } }, 401);
  }

  const user = await validateApiKey(key);
  if (!user) {
    return c.json({ error: { message: 'Invalid or revoked API key' } }, 401);
  }

  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: { message: 'Missing sessionId' } }, 400);
  }

  const session = sessions.get(sessionId);
  if (!session || session.userId !== user.id) {
    return c.json({ error: { message: 'Session not found' } }, 404);
  }

  const nodeReq = (c.env as { incoming?: IncomingMessage })?.incoming;
  const nodeRes = (c.env as { outgoing?: ServerResponse })?.outgoing;

  if (!nodeReq || !nodeRes) {
    return c.json({ error: { message: 'POST not available' } }, 500);
  }

  try {
    const body = await c.req.json();
    await session.transport.handlePostMessage(nodeReq, nodeRes, body);
    return new Response(null, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: { message } }, 500);
  }
});

// ============ Start Server ============

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[MCP Server] Listening on http://localhost:${info.port}`);
});
