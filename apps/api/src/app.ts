/**
 * Skillomatic API Server
 *
 * This is the main entry point for the Skillomatic backend API.
 * Built with Hono framework for lightweight, fast HTTP handling.
 *
 * Route groups:
 * - /api/auth/* - Authentication (login, logout, me)
 * - /api/docs/* - API documentation (public, for chatbots/AI)
 * - /api/* - Protected routes requiring JWT auth (skills, api-keys, etc.)
 * - /api/v1/* - API key authenticated routes for skills to call
 * - /ws/* - WebSocket routes for real-time updates
 *
 * @see docs/IT_DEPLOYMENT.md for deployment information
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createNodeWebSocket } from '@hono/node-ws';

// Web UI routes (JWT auth)
import { authRoutes } from './routes/auth.js';
import { skillsRoutes } from './routes/skills.js';
import { apiKeysRoutes } from './routes/api-keys.js';
import { integrationsRoutes } from './routes/integrations.js';
import { usersRoutes } from './routes/users.js';
import { analyticsRoutes } from './routes/analytics.js';
import { proposalsRoutes } from './routes/proposals.js';
import { settingsRoutes } from './routes/settings.js';
import { docsRoutes } from './routes/docs.js';
import { extensionRoutes } from './routes/extension.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { organizationsRoutes } from './routes/organizations.js';
import { invitesRoutes } from './routes/invites.js';
import { webhooksRoutes } from './routes/webhooks.js';
import { capabilityProfilesRoutes } from './routes/capability-profiles.js';

// Skill API routes (API key auth) - called by Claude Code skills
import { v1AtsRoutes } from './routes/v1/ats.js';
import { v1MeRoutes } from './routes/v1/me.js';
import { v1ScrapeRoutes } from './routes/v1/scrape.js';
import { v1ErrorsRoutes } from './routes/v1/errors.js';
import { v1EmailRoutes } from './routes/v1/email.js';
import { v1DatabaseRoutes } from './routes/v1/database.js';

// WebSocket route handlers
import { createWsScrapeHandler } from './routes/ws/scrape.js';

const app = new Hono();

// Create WebSocket helper - MUST use main app instance
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Middleware
app.use('*', logger());

// CORS - allow both local dev and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
];

// Add production origin if set
if (process.env.WEB_URL) {
  allowedOrigins.push(process.env.WEB_URL);
}

app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ============ PUBLIC ROUTES ============
// No authentication required
app.route('/api/auth', authRoutes);
app.route('/api/docs', docsRoutes);            // API documentation (OpenAPI spec, markdown)
app.route('/api/extension', extensionRoutes);  // Browser extension installation guide
app.route('/api/onboarding', onboardingRoutes); // New user getting started guide
app.route('/api/webhooks', webhooksRoutes);    // External service webhooks (Nango, etc.)

// ============ PROTECTED ROUTES (JWT Auth) ============
// Used by the web UI - requires Authorization: Bearer <jwt-token>
app.route('/api/skills', skillsRoutes);       // Browse/download skills
app.route('/api/api-keys', apiKeysRoutes);    // Manage API keys
app.route('/api/integrations', integrationsRoutes);  // OAuth connections
app.route('/api/users', usersRoutes);         // User management (admin)
app.route('/api/analytics', analyticsRoutes); // Usage analytics (admin)
app.route('/api/proposals', proposalsRoutes); // Skill proposals
app.route('/api/settings', settingsRoutes);   // System settings (admin)
app.route('/api/organizations', organizationsRoutes); // Organization management
app.route('/api/invites', invitesRoutes);     // Organization invites
app.route('/api/capability-profiles', capabilityProfilesRoutes); // Capability profile management

// ============ SKILL API ROUTES (API Key Auth) ============
// Called by Claude Code skills - requires Authorization: Bearer sk_live_xxx
app.route('/api/v1/ats', v1AtsRoutes);        // ATS operations (search, CRUD)
app.route('/api/v1/me', v1MeRoutes);          // Get current user info
app.route('/api/v1/scrape', v1ScrapeRoutes);  // Web scraping task management
app.route('/api/v1/errors', v1ErrorsRoutes);  // Client error reporting (ephemeral architecture)
app.route('/api/v1/email', v1EmailRoutes);    // Email operations (Gmail/Outlook)
app.route('/api/v1/database', v1DatabaseRoutes);  // Database queries (super admin only)

// ============ WEBSOCKET ROUTES ============
// Real-time updates for long-running operations
app.get('/ws/scrape', upgradeWebSocket(createWsScrapeHandler()));  // Scrape task status updates

// 404 handler
app.notFound((c) => c.json({ error: { message: 'Not Found' } }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: { message: err.message || 'Internal Server Error' } }, 500);
});

export { app, injectWebSocket };
