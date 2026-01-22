import { Hono } from 'hono';
import { openApiSpec } from '../openapi.js';

export const docsRoutes = new Hono();

/**
 * GET /docs/openapi.json - Raw OpenAPI spec (for chatbots/AI)
 *
 * Chatbots and AI tools can fetch this to understand the API structure.
 */
docsRoutes.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

/**
 * GET /docs - Simplified markdown for LLM/chatbot consumption
 *
 * Concise API reference optimized for LLM context windows.
 */
docsRoutes.get('/', (c) => {
  const markdown = `# Skillomatic API Reference

Base URL: \`https://api.skillomatic.technology\`

## Authentication
All protected endpoints require: \`Authorization: Bearer <jwt-token>\`
Admin endpoints additionally require \`isAdmin: true\` on the user.

## Endpoints

### Auth
- \`POST /auth/login\` - Login with email/password, returns JWT token
- \`GET /auth/me\` - Get current user info (requires auth)

### Users (Admin Only)
- \`GET /users\` - List all users
- \`POST /users\` - Create user (body: email, password, name, isAdmin?)
- \`GET /users/:id\` - Get user by ID
- \`DELETE /users/:id\` - Delete user

### Skills
- \`GET /skills\` - List all skills (requires auth)
- \`GET /skills/:slug\` - Get skill details (requires auth)
- \`GET /skills/:slug/download\` - Download skill markdown (public)
- \`GET /skills/install.sh\` - Download install script (public)

### Analytics
- \`GET /analytics/usage?days=30\` - User's own usage stats
- \`GET /analytics/admin?days=30\` - Platform-wide stats (admin only)

### Settings (Admin Only)
- \`GET /settings/llm\` - Get LLM provider configuration
- \`PUT /settings/llm/:provider\` - Set API key (body: apiKey)
- \`DELETE /settings/llm/:provider\` - Remove API key
- \`PUT /settings/llm/default\` - Set default provider/model (body: provider, model)

Providers: groq, anthropic, openai

### Proposals
- \`GET /proposals?status=pending\` - List proposals (user sees own, admin sees all)
- \`POST /proposals\` - Create proposal (body: title, description, useCases[])
- \`GET /proposals/:id\` - Get proposal details
- \`PUT /proposals/:id\` - Update proposal (owner only, pending status)
- \`DELETE /proposals/:id\` - Delete proposal
- \`POST /proposals/:id/review\` - Review proposal (admin only, body: status, feedback?)

## Response Format
Success: \`{ "data": { ... } }\`
Error: \`{ "error": { "message": "..." } }\`

## Full OpenAPI Spec
Available at: \`/docs/openapi.json\`

## Getting Started
- New user onboarding: \`/onboarding\`
- Browser extension guide: \`/extension\`
`;

  return c.text(markdown, 200, {
    'Content-Type': 'text/markdown',
  });
});
