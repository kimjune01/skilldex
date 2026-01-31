/**
 * Chat API Routes
 *
 * DEPRECATED: The streaming chat and action execution functionality in this file
 * has been superseded by:
 * - Client-side LLM calls via useClientChat hook (ephemeral architecture)
 * - MCP server for tool execution (/mcp-web for web, /mcp for external clients)
 * - Frontend action-executor.ts calling v1 endpoints directly
 *
 * These routes are kept for backwards compatibility but should not be used
 * for new development.
 */
import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth.js';
import {
  loadSkillBySlug,
  userCanAccessSkill,
  type SkillMetadata,
} from '../lib/skills.js';

export const chatRoutes = new Hono();

// All routes require JWT auth
chatRoutes.use('*', jwtAuth);

/**
 * Determine if a skill requires browser extension
 */
function skillRequiresBrowser(skill: SkillMetadata): boolean {
  const reqs = Object.keys(skill.requiredIntegrations || {});
  return reqs.includes('linkedin') || reqs.includes('browser');
}

// POST /chat - DEPRECATED: Use client-side LLM calls instead
// The web app now uses useClientChat hook with direct LLM API calls
chatRoutes.post('/', async (c) => {
  return c.json(
    {
      error: {
        message: 'This endpoint is deprecated. Please use the MCP server or client-side LLM calls.',
        code: 'ENDPOINT_DEPRECATED',
      },
    },
    410 // Gone
  );
});

// POST /chat/execute-skill - Execute a skill via API (uses progressive disclosure)
chatRoutes.post('/execute-skill', async (c) => {
  const body = await c.req.json<{ skillSlug: string; params?: Record<string, unknown> }>();
  const { skillSlug, params } = body;
  const user = c.get('user');

  // Load skill using progressive disclosure
  const skill = await loadSkillBySlug(skillSlug);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Check user access
  if (user?.id) {
    const hasAccess = await userCanAccessSkill(user.id, skillSlug);
    if (!hasAccess) {
      return c.json({ error: { message: 'Access denied to this skill' } }, 403);
    }
  }

  // If skill requires browser, return instructions
  if (skillRequiresBrowser(skill)) {
    return c.json({
      data: {
        type: 'instructions',
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities,
        },
        instructions: skill.instructions,
        message: 'This skill requires the browser extension. Use the chat interface to execute it.',
      },
    });
  }

  // Return skill instructions for execution via chat
  return c.json({
    data: {
      type: 'api_ready',
      skill: { slug: skill.slug, name: skill.name },
      message: `Skill "${skill.name}" is available but requires additional configuration.`,
      params: params || {},
    },
  });
});

// POST /chat/action - DEPRECATED: Use MCP or v1 endpoints directly
// This endpoint is no longer needed. Actions should be:
// - Routed through MCP when connected (primary path)
// - Or handled by frontend action-executor.ts calling v1 endpoints directly
chatRoutes.post('/action', async (c) => {
  return c.json(
    { error: 'This endpoint is deprecated. Please update your client to use MCP or v1 endpoints.' },
    410 // Gone
  );
});
