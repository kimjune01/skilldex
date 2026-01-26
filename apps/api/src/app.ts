/**
 * Skillomatic API Server
 *
 * This is the main entry point for the Skillomatic backend API.
 * Built with Hono framework for lightweight, fast HTTP handling.
 *
 * Route groups (served from api.skillomatic.technology):
 * - /auth/* - Authentication (login, logout, me)
 * - /docs/* - API documentation (public, for chatbots/AI)
 * - /* - Protected routes requiring JWT auth (skills, api-keys, etc.)
 * - /v1/* - API key authenticated routes for skills to call
 * - /ws/* - WebSocket routes for real-time updates
 *
 * @see docs/IT_DEPLOYMENT.md for deployment information
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// CORS is handled by Lambda Function URL in production (see sst.config.ts)
// Only enable Hono CORS middleware in local development
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
import { createNodeWebSocket } from '@hono/node-ws';
import { createLogger } from './lib/logger.js';

// Security middleware
import { apiSecurityHeaders } from './middleware/security-headers.js';
import { apiKeyRateLimit, generalRateLimit } from './middleware/rate-limit.js';

// Web UI routes (JWT auth)
import { authRoutes } from './routes/auth.js';
import { skillsRoutes } from './routes/skills.js';
import { apiKeysRoutes } from './routes/api-keys.js';
import { integrationsRoutes } from './routes/integrations.js';
import { usersRoutes } from './routes/users.js';
import { analyticsRoutes } from './routes/analytics.js';
// proposals routes removed - replaced by direct skill creation in /skills
import { settingsRoutes } from './routes/settings.js';
import { docsRoutes } from './routes/docs.js';
import { extensionRoutes } from './routes/extension.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { organizationsRoutes } from './routes/organizations.js';
import { invitesRoutes } from './routes/invites.js';
import { webhooksRoutes } from './routes/webhooks.js';
import { accountTypeRoutes } from './routes/account-type.js';
import { capabilityProfilesRoutes } from './routes/capability-profiles.js';
import { scrapeRoutes } from './routes/scrape.js';
import { payIntentionsRoutes } from './routes/pay-intentions.js';
import { statusRoutes } from './routes/status.js';

// Skill API routes (API key auth) - called by Claude Code skills
import { v1AtsRoutes } from './routes/v1/ats.js';
import { v1MeRoutes } from './routes/v1/me.js';
import { v1ScrapeRoutes } from './routes/v1/scrape.js';
import { v1ErrorsRoutes } from './routes/v1/errors.js';
import { v1EmailRoutes } from './routes/v1/email.js';
import { v1DatabaseRoutes } from './routes/v1/database.js';
import { v1CalendarRoutes } from './routes/v1/calendar.js';
import { v1DataRoutes } from './routes/v1/data.js';

// MCP routes (hosted MCP server for ChatGPT web/mobile)
import { mcpRoutes } from './routes/mcp.js';

// WebSocket route handlers
import { createWsScrapeHandler } from './routes/ws/scrape.js';

const app = new Hono();

// Create WebSocket helper - MUST use main app instance
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Middleware

// Security headers middleware - adds OWASP recommended headers
app.use('*', apiSecurityHeaders);

// Request ID middleware - assigns unique ID to each request for tracing
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);
  await next();
});

app.use('*', logger());

// CORS - only apply in local development
// In production, CORS is handled by Lambda Function URL (see sst.config.ts)
if (!isLambda) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  // Add production origin if set (for testing prod config locally)
  if (process.env.WEB_URL) {
    allowedOrigins.push(process.env.WEB_URL);
  }

  app.use('*', cors({
    origin: allowedOrigins,
    credentials: true,
  }));
}

// Health check
const GIT_HASH = process.env.GIT_HASH || 'dev';
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString(), gitHash: GIT_HASH }));

// ============ PUBLIC ROUTES ============
// No authentication required
// Note: Auth routes have their own rate limiting applied within the route handlers
app.route('/auth', authRoutes);
app.route('/docs', docsRoutes);            // API documentation (OpenAPI spec, markdown)
app.route('/extension', extensionRoutes);  // Browser extension installation guide
app.route('/onboarding', onboardingRoutes); // New user getting started guide
app.route('/webhooks', webhooksRoutes);    // External service webhooks (Nango, etc.)
app.route('/account-type', accountTypeRoutes); // Account type selection (individual vs org)
app.route('/status', statusRoutes);        // Public system status (no auth)

// ============ PROTECTED ROUTES (JWT Auth) ============
// Used by the web UI - requires Authorization: Bearer <jwt-token>
// Apply general rate limiting to all protected routes
app.use('/skills/*', generalRateLimit);
app.use('/api-keys/*', generalRateLimit);
app.use('/integrations/*', generalRateLimit);
app.use('/users/*', generalRateLimit);
app.use('/analytics/*', generalRateLimit);
app.use('/settings/*', generalRateLimit);
app.use('/organizations/*', generalRateLimit);
app.use('/invites/*', generalRateLimit);
app.use('/capability-profiles/*', generalRateLimit);
app.use('/scrape/*', generalRateLimit);
app.use('/pay-intentions/*', generalRateLimit);

app.route('/skills', skillsRoutes);       // Browse/download skills
app.route('/api-keys', apiKeysRoutes);    // Manage API keys
app.route('/integrations', integrationsRoutes);  // OAuth connections
app.route('/users', usersRoutes);         // User management (admin)
app.route('/analytics', analyticsRoutes); // Usage analytics (admin)
// proposals routes removed - replaced by direct skill creation in /skills
app.route('/settings', settingsRoutes);   // System settings (admin)
app.route('/organizations', organizationsRoutes); // Organization management
app.route('/invites', invitesRoutes);     // Organization invites
app.route('/capability-profiles', capabilityProfilesRoutes); // Capability profile management
app.route('/scrape', scrapeRoutes);   // Web scraping (for web chat)
app.route('/pay-intentions', payIntentionsRoutes); // Pay intention tracking (billing signals)

// ============ SKILL API ROUTES (API Key Auth) ============
// Called by Claude Code skills - requires Authorization: Bearer sk_live_xxx
// Apply API key rate limiting to all v1 routes
app.use('/v1/*', apiKeyRateLimit);

app.route('/v1/ats', v1AtsRoutes);        // ATS operations (search, CRUD)
app.route('/v1/me', v1MeRoutes);          // Get current user info
app.route('/v1/scrape', v1ScrapeRoutes);  // Web scraping task management
app.route('/v1/errors', v1ErrorsRoutes);  // Client error reporting (ephemeral architecture)
app.route('/v1/email', v1EmailRoutes);    // Email operations (Gmail/Outlook)
app.route('/v1/calendar', v1CalendarRoutes);  // Calendar operations (Calendly, Google Calendar)
app.route('/v1/data', v1DataRoutes);          // Data provider operations (Airtable, etc.)
app.route('/v1/database', v1DatabaseRoutes);  // Database queries (super admin only)

// ============ MCP ROUTES (API Key Auth) ============
// Hosted MCP server for ChatGPT web/mobile connections
app.use('/mcp/*', apiKeyRateLimit);
app.route('/mcp', mcpRoutes);

// ============ WEBSOCKET ROUTES ============
// Real-time updates for long-running operations
app.get('/ws/scrape', upgradeWebSocket(createWsScrapeHandler()));  // Scrape task status updates

// 404 handler
app.notFound((c) => c.json({ error: { message: 'Not Found' } }, 404));

// Error handler
const appLog = createLogger('App');
app.onError((err, c) => {
  const requestId = c.get('requestId') as string | undefined;
  appLog.error('unhandled_error', {
    requestId,
    path: c.req.path,
    method: c.req.method,
    errorName: err.name,
    errorMessage: err.message,
  });
  return c.json({ error: { message: err.message || 'Internal Server Error' } }, 500);
});

export { app, injectWebSocket };
