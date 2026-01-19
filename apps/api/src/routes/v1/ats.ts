import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKey.js';

export const v1AtsRoutes = new Hono();

// All routes require API key auth
v1AtsRoutes.use('*', apiKeyAuth);

const MOCK_ATS_URL = process.env.MOCK_ATS_URL || 'http://localhost:3001';

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

  try {
    const data = await proxyToMockAts(`/api/candidates?${params}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to fetch candidates from ATS' } }, 502);
  }
});

// GET /api/v1/ats/candidates/:id - Get candidate by ID
v1AtsRoutes.get('/candidates/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`);
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to fetch candidate from ATS' } }, 502);
  }
});

// POST /api/v1/ats/candidates - Create candidate
v1AtsRoutes.post('/candidates', async (c) => {
  const body = await c.req.json();

  try {
    const data = await proxyToMockAts('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return c.json(data, 201);
  } catch (error) {
    return c.json({ error: { message: 'Failed to create candidate in ATS' } }, 502);
  }
});

// PUT /api/v1/ats/candidates/:id - Update candidate
v1AtsRoutes.put('/candidates/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const data = await proxyToMockAts(`/api/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return c.json(data);
  } catch (error) {
    return c.json({ error: { message: 'Failed to update candidate in ATS' } }, 502);
  }
});

// GET /api/v1/ats/jobs - List jobs
v1AtsRoutes.get('/jobs', async (c) => {
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
