import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';
import { db } from '@skillomatic/db';
import { skillUsageLogs, skills, integrations } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  isDemoMode,
  generateDemoCandidates,
  generateDemoJobs,
  generateDemoApplications,
} from '../../lib/demo-data.js';
import type { ErrorCode } from '@skillomatic/shared';
import { ZohoRecruitClient } from '../../lib/zoho-recruit.js';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from '../../lib/nango.js';

export const v1AtsRoutes = new Hono();

// All routes require API key auth
v1AtsRoutes.use('*', apiKeyAuth);

const MOCK_ATS_URL = process.env.MOCK_ATS_URL || 'http://localhost:3001';
const USE_ZOHO = process.env.USE_ZOHO_ATS === 'true';

/**
 * Get a Zoho Recruit client for the user's organization.
 * Returns null if no ATS integration is connected.
 */
async function getZohoClient(userId: string, organizationId?: string | null): Promise<ZohoRecruitClient | null> {
  // Find the user's ATS integration
  const conditions = organizationId
    ? and(eq(integrations.organizationId, organizationId), eq(integrations.provider, 'ats'))
    : and(eq(integrations.userId, userId), eq(integrations.provider, 'ats'));

  const integration = await db
    .select()
    .from(integrations)
    .where(conditions)
    .limit(1);

  if (integration.length === 0 || integration[0].status !== 'connected') {
    return null;
  }

  const int = integration[0];
  if (!int.nangoConnectionId) {
    return null;
  }

  try {
    const nango = getNangoClient();
    // Get the provider config key - check metadata for subProvider (e.g., zoho-recruit)
    const metadata = int.metadata ? JSON.parse(int.metadata) : {};
    const providerKey = metadata.subProvider || 'zoho-recruit';
    const providerConfigKey = PROVIDER_CONFIG_KEYS[providerKey] || 'zoho-recruit';

    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);

    // Determine region from organization settings or metadata
    const region = metadata.zohoRegion || 'us';

    return new ZohoRecruitClient(token.access_token, region);
  } catch (error) {
    console.error('Failed to get Zoho token:', error);
    return null;
  }
}

/**
 * Classify a raw error into a standardized ATS error code.
 * This strips PII from error messages before logging.
 */
function classifyAtsError(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Connection/network errors
  if (lowerMessage.includes('fetch') || lowerMessage.includes('network') ||
      lowerMessage.includes('econnrefused') || lowerMessage.includes('connection')) {
    return 'NETWORK_ERROR';
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'ATS_TIMEOUT';
  }

  // Auth errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401') ||
      lowerMessage.includes('authentication') || lowerMessage.includes('forbidden')) {
    return 'ATS_AUTH_FAILED';
  }

  // Rate limiting
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('429') ||
      lowerMessage.includes('too many requests')) {
    return 'ATS_RATE_LIMITED';
  }

  // Not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'ATS_NOT_FOUND';
  }

  // Invalid request
  if (lowerMessage.includes('invalid') || lowerMessage.includes('400') ||
      lowerMessage.includes('bad request')) {
    return 'ATS_INVALID_REQUEST';
  }

  return 'UNKNOWN_ERROR';
}

// Helper to log skill usage (uses error codes instead of raw messages for ephemerality)
async function logUsage(
  userId: string,
  apiKeyId: string,
  skillSlug: string,
  status: 'success' | 'error' | 'partial',
  durationMs?: number,
  errorCode?: ErrorCode
) {
  try {
    const skill = await db.select().from(skills).where(eq(skills.slug, skillSlug)).limit(1);
    if (skill.length > 0) {
      await db.insert(skillUsageLogs).values({
        id: randomUUID(),
        skillId: skill[0].id,
        userId,
        apiKeyId,
        status,
        durationMs,
        errorMessage: errorCode, // Store error code (no PII)
      });
    }
  } catch (err) {
    console.error('Failed to log usage:', err);
  }
}

// Helper to proxy requests to mock ATS
async function proxyToMockAts(path: string, options?: RequestInit) {
  const url = `${MOCK_ATS_URL}${path}`;
  const response = await fetch(url, options);
  return response.json();
}

// GET /api/v1/ats/candidates - Search candidates
v1AtsRoutes.get('/candidates', async (c) => {
  const query = c.req.query();
  const params = new URLSearchParams(query);
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    // Apply basic filtering
    let filtered = candidates;
    const search = query.q || query.search;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (query.status) {
      filtered = filtered.filter((c) => c.status === query.status);
    }
    if (query.stage) {
      filtered = filtered.filter((c) => c.stage === query.stage);
    }
    logUsage(user.id, user.apiKeyId, 'ats-candidate-search', 'success', Date.now() - startTime);
    return c.json({ candidates: filtered, total: filtered.length, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const search = query.q || query.search;
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;

        const result = await zoho.getCandidates({ search, page, perPage });
        logUsage(user.id, user.apiKeyId, 'ats-candidate-search', 'success', Date.now() - startTime);
        return c.json({ candidates: result.candidates, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, 'ats-candidate-search', 'error', Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: 'Failed to fetch candidates from Zoho Recruit' } }, 502);
      }
    }
  }

  // Fallback to mock ATS
  try {
    const data = await proxyToMockAts(`/api/candidates?${params}`);
    logUsage(user.id, user.apiKeyId, 'ats-candidate-search', 'success', Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'ats-candidate-search', 'error', Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: 'Failed to fetch candidates from ATS' } }, 502);
  }
});

// GET /api/v1/ats/candidates/:id - Get candidate by ID
v1AtsRoutes.get('/candidates/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) {
      return c.json({ error: { message: 'Candidate not found' } }, 404);
    }
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json({ candidate, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.getCandidate(id);
        if (!candidate) {
          return c.json({ error: { message: 'Candidate not found' } }, 404);
        }
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
        return c.json({ candidate });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: 'Failed to fetch candidate from Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`);
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: 'Failed to fetch candidate from ATS' } }, 502);
  }
});

// POST /api/v1/ats/candidates - Create candidate
v1AtsRoutes.post('/candidates', async (c) => {
  const body = await c.req.json();
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  // Demo mode simulates creation
  if (isDemoMode(c.req.raw)) {
    const newCandidate = {
      id: `demo-cand-new-${Date.now()}`,
      ...body,
      status: body.status || 'active',
      stage: body.stage || 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json({ candidate: newCandidate, demo: true }, 201);
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.createCandidate(body);
        if (!candidate) {
          return c.json({ error: { message: 'Failed to create candidate' } }, 400);
        }
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
        return c.json({ candidate }, 201);
      } catch (error) {
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: 'Failed to create candidate in Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json(data, 201);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: 'Failed to create candidate in ATS' } }, 502);
  }
});

// PUT /api/v1/ats/candidates/:id - Update candidate
v1AtsRoutes.put('/candidates/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('apiKeyUser');
  const startTime = Date.now();

  // Demo mode simulates update
  if (isDemoMode(c.req.raw)) {
    const candidates = generateDemoCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) {
      return c.json({ error: { message: 'Candidate not found' } }, 404);
    }
    const updated = { ...candidate, ...body, updatedAt: new Date().toISOString() };
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json({ candidate: updated, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const candidate = await zoho.updateCandidate(id, body);
        if (!candidate) {
          return c.json({ error: { message: 'Failed to update candidate' } }, 400);
        }
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
        return c.json({ candidate });
      } catch (error) {
        logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
        return c.json({ error: { message: 'Failed to update candidate in Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'success', Date.now() - startTime);
    return c.json(data);
  } catch (error) {
    logUsage(user.id, user.apiKeyId, 'ats-candidate-crud', 'error', Date.now() - startTime, classifyAtsError(error));
    return c.json({ error: { message: 'Failed to update candidate in ATS' } }, 502);
  }
});

// GET /api/v1/ats/jobs - List jobs
v1AtsRoutes.get('/jobs', async (c) => {
  const query = c.req.query();
  const user = c.get('apiKeyUser');

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    const jobs = generateDemoJobs();
    return c.json({ jobs, total: jobs.length, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;
        const result = await zoho.getJobs({ page, perPage, status: query.status });
        return c.json({ jobs: result.jobs, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        return c.json({ error: { message: 'Failed to fetch jobs from Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts('/api/jobs');
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to fetch jobs from ATS' } }, 502);
  }
});

// GET /api/v1/ats/jobs/:id - Get job by ID
v1AtsRoutes.get('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('apiKeyUser');

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    const jobs = generateDemoJobs();
    const job = jobs.find((j) => j.id === id);
    if (!job) {
      return c.json({ error: { message: 'Job not found' } }, 404);
    }
    return c.json({ job, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const job = await zoho.getJob(id);
        if (!job) {
          return c.json({ error: { message: 'Job not found' } }, 404);
        }
        return c.json({ job });
      } catch (error) {
        return c.json({ error: { message: 'Failed to fetch job from Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts(`/api/jobs/${id}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to fetch job from ATS' } }, 502);
  }
});

// GET /api/v1/ats/applications - List applications
v1AtsRoutes.get('/applications', async (c) => {
  const query = c.req.query();
  const params = new URLSearchParams(query);
  const user = c.get('apiKeyUser');

  // Demo mode returns mock data
  if (isDemoMode(c.req.raw)) {
    let applications = generateDemoApplications();
    // Apply filtering
    if (query.candidateId) {
      applications = applications.filter((a) => a.candidateId === query.candidateId);
    }
    if (query.jobId) {
      applications = applications.filter((a) => a.jobId === query.jobId);
    }
    if (query.stage) {
      applications = applications.filter((a) => a.stage === query.stage);
    }
    return c.json({ applications, total: applications.length, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const page = query.page ? parseInt(query.page) : 1;
        const perPage = query.per_page ? parseInt(query.per_page) : 50;
        const result = await zoho.getApplications({
          candidateId: query.candidateId,
          jobId: query.jobId,
          page,
          perPage,
        });
        return c.json({ applications: result.applications, total: result.total, hasMore: result.hasMore });
      } catch (error) {
        return c.json({ error: { message: 'Failed to fetch applications from Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts(`/api/applications?${params}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to fetch applications from ATS' } }, 502);
  }
});

// POST /api/v1/ats/applications/:id/stage - Move application to new stage
v1AtsRoutes.post('/applications/:id/stage', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('apiKeyUser');

  // Demo mode simulates stage change
  if (isDemoMode(c.req.raw)) {
    const applications = generateDemoApplications();
    const application = applications.find((a) => a.id === id);
    if (!application) {
      return c.json({ error: { message: 'Application not found' } }, 404);
    }
    const updated = {
      ...application,
      stage: body.stage,
      stageHistory: [
        ...application.stageHistory,
        { stage: body.stage, date: new Date().toISOString() },
      ],
      updatedAt: new Date().toISOString(),
    };
    return c.json({ application: updated, demo: true });
  }

  // Try Zoho Recruit if enabled and connected
  if (USE_ZOHO) {
    const zoho = await getZohoClient(user.id, user.organizationId);
    if (zoho) {
      try {
        const application = await zoho.updateApplicationStage(id, body.stage);
        return c.json({ application, success: true });
      } catch (error) {
        return c.json({ error: { message: 'Failed to update application stage in Zoho Recruit' } }, 502);
      }
    }
  }

  try {
    const data = await proxyToMockAts(`/api/applications/${id}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to update application stage in ATS' } }, 502);
  }
});
