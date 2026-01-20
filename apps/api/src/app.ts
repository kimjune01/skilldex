import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from './routes/auth.js';
import { skillsRoutes } from './routes/skills.js';
import { apiKeysRoutes } from './routes/api-keys.js';
import { integrationsRoutes } from './routes/integrations.js';
import { usersRoutes } from './routes/users.js';
import { analyticsRoutes } from './routes/analytics.js';
import { proposalsRoutes } from './routes/proposals.js';
import { chatRoutes } from './routes/chat.js';
import { v1AtsRoutes } from './routes/v1/ats.js';
import { v1MeRoutes } from './routes/v1/me.js';
import { v1ScrapeRoutes } from './routes/v1/scrape.js';

const app = new Hono();

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

// Auth routes (public)
app.route('/api/auth', authRoutes);

// Protected routes (JWT auth)
app.route('/api/skills', skillsRoutes);
app.route('/api/api-keys', apiKeysRoutes);
app.route('/api/integrations', integrationsRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/proposals', proposalsRoutes);
app.route('/api/chat', chatRoutes);

// Skill API routes (API key auth)
app.route('/api/v1/ats', v1AtsRoutes);
app.route('/api/v1/me', v1MeRoutes);
app.route('/api/v1/scrape', v1ScrapeRoutes);

// 404 handler
app.notFound((c) => c.json({ error: { message: 'Not Found' } }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: { message: err.message || 'Internal Server Error' } }, 500);
});

export { app };
