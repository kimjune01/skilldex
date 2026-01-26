/**
 * Public Status API
 *
 * Provides a public endpoint for system status information.
 * No authentication required - designed for status pages and uptime monitoring.
 *
 * Currently returns basic health check information.
 *
 * To extend this endpoint with more detailed health checks:
 * 1. Add a `systemMetrics` table to track metrics over time
 * 2. Instrument API middleware, Nango calls, LLM calls to record metrics
 * 3. Query recent metrics to determine service status
 * 4. Add thresholds to flip status from 'operational' to 'degraded'/'outage'
 *
 * See docs/ADMIN_HEALTH_DASHBOARD.md for the full planned implementation.
 *
 * @see docs/ADMIN_HEALTH_DASHBOARD.md
 */
import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { systemSettings } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';

const GIT_HASH = process.env.GIT_HASH || 'dev';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface StatusResponse {
  status: ServiceStatus;
  updatedAt: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    integrations: ServiceStatus;
  };
  deploy: {
    gitHash: string;
    timestamp: string | null;
  };
}

export const statusRoutes = new Hono();

/**
 * GET /status
 *
 * Public system status endpoint. No auth required.
 *
 * Returns overall system status and per-service health.
 * Safe for public consumption - no sensitive data exposed.
 */
statusRoutes.get('/', async (c) => {
  const now = new Date().toISOString();

  // Check database connectivity
  let dbStatus: ServiceStatus = 'operational';
  let deployTimestamp: string | null = null;

  try {
    // Simple query to verify DB is accessible
    // Also fetch deploy timestamp if available
    const deploySetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'deploy.last_timestamp'))
      .limit(1);

    if (deploySetting.length > 0) {
      deployTimestamp = deploySetting[0].value;
    }
  } catch {
    dbStatus = 'outage';
  }

  // For now, API and integrations status are derived from basic checks
  // TODO: Extend with actual health metrics once systemMetrics table is added
  const apiStatus: ServiceStatus = 'operational'; // If we're responding, API is up
  const integrationsStatus: ServiceStatus = dbStatus; // Integrations depend on DB

  // Overall status is the worst of all services
  const statuses: ServiceStatus[] = [dbStatus, apiStatus, integrationsStatus];
  const overallStatus: ServiceStatus = statuses.includes('outage')
    ? 'outage'
    : statuses.includes('degraded')
      ? 'degraded'
      : 'operational';

  const response: StatusResponse = {
    status: overallStatus,
    updatedAt: now,
    services: {
      api: apiStatus,
      database: dbStatus,
      integrations: integrationsStatus,
    },
    deploy: {
      gitHash: GIT_HASH,
      timestamp: deployTimestamp,
    },
  };

  return c.json(response);
});
