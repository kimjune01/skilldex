/**
 * Web Search API Routes (v1)
 *
 * API key authenticated routes for web search operations.
 * Uses Tavily API for web search.
 */
import { Hono } from 'hono';
import { combinedAuth } from '../../middleware/combinedAuth.js';
import { tavily } from '@tavily/core';
import { createLogger } from '../../lib/logger.js';

const log = createLogger('Search');

export const v1SearchRoutes = new Hono();

// Support both JWT (web chat) and API key (MCP/Claude Desktop) auth
v1SearchRoutes.use('*', combinedAuth);

// POST /v1/search - Web search
v1SearchRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: { message: 'Authentication required' } }, 401);
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    return c.json(
      { error: { message: 'Web search is not configured. Missing TAVILY_API_KEY.' } },
      503
    );
  }

  try {
    const body = await c.req.json<{
      query: string;
      maxResults?: number;
      topic?: 'general' | 'news';
      includeAnswer?: boolean;
    }>();

    if (!body.query) {
      return c.json({ error: { message: 'Query is required' } }, 400);
    }

    const client = tavily({ apiKey: tavilyApiKey });
    const response = await client.search(body.query, {
      maxResults: Math.min(body.maxResults || 5, 10),
      topic: body.topic || 'general',
      includeAnswer: body.includeAnswer !== false,
    });

    log.info('web_search_success', { userId: user.id, query: body.query });

    return c.json({
      data: {
        query: body.query,
        answer: response.answer,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
        })),
        total: response.results.length,
      },
    });
  } catch (error) {
    log.error('web_search_error', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return c.json(
      { error: { message: error instanceof Error ? error.message : 'Web search failed' } },
      500
    );
  }
});
