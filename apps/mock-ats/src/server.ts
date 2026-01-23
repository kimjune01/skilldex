import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { candidates, jobs, applications, interviewNotes } from './data/fixtures.js';
import type { Candidate, Application, InterviewNote } from '@skillomatic/shared';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'mock-ats' }));

// ============ CANDIDATES ============

// GET /api/candidates - List/search candidates
app.get('/api/candidates', (c) => {
  const query = c.req.query('q')?.toLowerCase();
  const tags = c.req.query('tags')?.split(',');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  let results = [...candidates];

  // Search by query
  if (query) {
    results = results.filter(
      (cand) =>
        cand.firstName.toLowerCase().includes(query) ||
        cand.lastName.toLowerCase().includes(query) ||
        cand.email.toLowerCase().includes(query) ||
        cand.headline?.toLowerCase().includes(query) ||
        cand.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    results = results.filter((cand) =>
      tags.some((tag) => cand.tags.includes(tag.trim()))
    );
  }

  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  return c.json({
    data: paginated,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// GET /api/candidates/:id - Get candidate by ID
app.get('/api/candidates/:id', (c) => {
  const id = c.req.param('id');
  const candidate = candidates.find((cand) => cand.id === id);

  if (!candidate) {
    return c.json({ error: { message: 'Candidate not found' } }, 404);
  }

  // Include applications
  const candidateApplications = applications.filter(
    (app) => app.candidateId === id
  );

  return c.json({
    data: {
      ...candidate,
      applications: candidateApplications,
    },
  });
});

// POST /api/candidates - Create candidate
app.post('/api/candidates', async (c) => {
  const body = await c.req.json<Partial<Candidate>>();

  if (!body.firstName || !body.lastName || !body.email) {
    return c.json(
      { error: { message: 'firstName, lastName, and email are required' } },
      400
    );
  }

  const newCandidate: Candidate = {
    id: `cand_${Date.now()}`,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    headline: body.headline,
    summary: body.summary,
    location: body.location,
    source: body.source || 'applied',
    sourceDetail: body.sourceDetail,
    attachments: body.attachments || [],
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  candidates.push(newCandidate);

  return c.json({ data: newCandidate }, 201);
});

// PUT /api/candidates/:id - Update candidate
app.put('/api/candidates/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<Candidate>>();

  const index = candidates.findIndex((cand) => cand.id === id);
  if (index === -1) {
    return c.json({ error: { message: 'Candidate not found' } }, 404);
  }

  candidates[index] = {
    ...candidates[index],
    ...body,
    id: candidates[index].id, // Preserve ID
    createdAt: candidates[index].createdAt, // Preserve creation date
    updatedAt: new Date().toISOString(),
  };

  return c.json({ data: candidates[index] });
});

// DELETE /api/candidates/:id - Delete candidate
app.delete('/api/candidates/:id', (c) => {
  const id = c.req.param('id');

  const index = candidates.findIndex((cand) => cand.id === id);
  if (index === -1) {
    return c.json({ error: { message: 'Candidate not found' } }, 404);
  }

  const deleted = candidates.splice(index, 1)[0];

  return c.json({ data: deleted, deleted: true });
});

// ============ JOBS ============

// GET /api/jobs - List jobs
app.get('/api/jobs', (c) => {
  const status = c.req.query('status');
  const department = c.req.query('department');

  let results = [...jobs];

  if (status) {
    results = results.filter((job) => job.status === status);
  }

  if (department) {
    results = results.filter((job) =>
      job.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  return c.json({ data: results });
});

// GET /api/jobs/:id - Get job by ID
app.get('/api/jobs/:id', (c) => {
  const id = c.req.param('id');
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return c.json({ error: { message: 'Job not found' } }, 404);
  }

  // Include applications count
  const applicationCount = applications.filter(
    (app) => app.jobId === id
  ).length;

  return c.json({
    data: {
      ...job,
      applicationCount,
    },
  });
});

// ============ APPLICATIONS ============

// GET /api/applications - List applications
app.get('/api/applications', (c) => {
  const candidateId = c.req.query('candidateId');
  const jobId = c.req.query('jobId');
  const status = c.req.query('status');

  let results = [...applications];

  if (candidateId) {
    results = results.filter((app) => app.candidateId === candidateId);
  }

  if (jobId) {
    results = results.filter((app) => app.jobId === jobId);
  }

  if (status) {
    results = results.filter((app) => app.status === status);
  }

  // Enrich with candidate and job info
  const enriched = results.map((app) => {
    const candidate = candidates.find((c) => c.id === app.candidateId);
    const job = jobs.find((j) => j.id === app.jobId);
    return {
      ...app,
      candidate: candidate
        ? { id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}`, email: candidate.email }
        : null,
      job: job ? { id: job.id, title: job.title, department: job.department } : null,
    };
  });

  return c.json({ data: enriched });
});

// POST /api/applications/:id/stage - Move to new stage
app.post('/api/applications/:id/stage', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ stage: string; status?: Application['status'] }>();

  const index = applications.findIndex((app) => app.id === id);
  if (index === -1) {
    return c.json({ error: { message: 'Application not found' } }, 404);
  }

  const currentApp = applications[index];

  // Add to stage history
  const transition = {
    fromStage: currentApp.stage,
    toStage: body.stage,
    movedAt: new Date().toISOString(),
    movedBy: 'api_user', // In real app, would be authenticated user
  };

  applications[index] = {
    ...currentApp,
    stage: body.stage,
    status: body.status || currentApp.status,
    stageHistory: [...currentApp.stageHistory, transition],
    updatedAt: new Date().toISOString(),
  };

  return c.json({ data: applications[index] });
});

// ============ INTERVIEW NOTES ============

// GET /api/interview-notes - List interview notes
app.get('/api/interview-notes', (c) => {
  const candidateId = c.req.query('candidateId');
  const applicationId = c.req.query('applicationId');
  const jobId = c.req.query('jobId');
  const type = c.req.query('type');
  const includeTranscript = c.req.query('includeTranscript') === 'true';

  let results = [...interviewNotes];

  if (candidateId) {
    results = results.filter((note) => note.candidateId === candidateId);
  }

  if (applicationId) {
    results = results.filter((note) => note.applicationId === applicationId);
  }

  if (jobId) {
    results = results.filter((note) => note.jobId === jobId);
  }

  if (type) {
    results = results.filter((note) => note.type === type);
  }

  // By default, exclude transcript to reduce payload size
  if (!includeTranscript) {
    results = results.map(({ transcript, ...rest }) => ({
      ...rest,
      hasTranscript: !!transcript,
    }));
  }

  // Enrich with candidate and job info
  const enriched = results.map((note) => {
    const candidate = candidates.find((c) => c.id === note.candidateId);
    const job = note.jobId ? jobs.find((j) => j.id === note.jobId) : null;
    return {
      ...note,
      candidate: candidate
        ? { id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}` }
        : null,
      job: job ? { id: job.id, title: job.title } : null,
    };
  });

  return c.json({ data: enriched });
});

// GET /api/interview-notes/:id - Get interview note by ID
app.get('/api/interview-notes/:id', (c) => {
  const id = c.req.param('id');
  const note = interviewNotes.find((n) => n.id === id);

  if (!note) {
    return c.json({ error: { message: 'Interview note not found' } }, 404);
  }

  // Enrich with candidate and job info
  const candidate = candidates.find((cand) => cand.id === note.candidateId);
  const job = note.jobId ? jobs.find((j) => j.id === note.jobId) : null;

  return c.json({
    data: {
      ...note,
      candidate: candidate
        ? { id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}`, email: candidate.email }
        : null,
      job: job ? { id: job.id, title: job.title, department: job.department } : null,
    },
  });
});

// POST /api/interview-notes - Create interview note
app.post('/api/interview-notes', async (c) => {
  const body = await c.req.json<Partial<InterviewNote>>();

  if (!body.candidateId || !body.title || !body.type) {
    return c.json(
      { error: { message: 'candidateId, title, and type are required' } },
      400
    );
  }

  // Verify candidate exists
  const candidate = candidates.find((cand) => cand.id === body.candidateId);
  if (!candidate) {
    return c.json({ error: { message: 'Candidate not found' } }, 404);
  }

  const newNote: InterviewNote = {
    id: `note_${Date.now()}`,
    candidateId: body.candidateId,
    applicationId: body.applicationId,
    jobId: body.jobId,
    type: body.type,
    title: body.title,
    interviewers: body.interviewers || [],
    interviewDate: body.interviewDate || new Date().toISOString(),
    duration: body.duration,
    summary: body.summary,
    transcript: body.transcript,
    rating: body.rating,
    recommendation: body.recommendation,
    highlights: body.highlights,
    concerns: body.concerns,
    source: body.source || 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  interviewNotes.push(newNote);

  return c.json({ data: newNote }, 201);
});

// PUT /api/interview-notes/:id - Update interview note
app.put('/api/interview-notes/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<InterviewNote>>();

  const index = interviewNotes.findIndex((note) => note.id === id);
  if (index === -1) {
    return c.json({ error: { message: 'Interview note not found' } }, 404);
  }

  interviewNotes[index] = {
    ...interviewNotes[index],
    ...body,
    id: interviewNotes[index].id, // Preserve ID
    createdAt: interviewNotes[index].createdAt, // Preserve creation date
    updatedAt: new Date().toISOString(),
  };

  return c.json({ data: interviewNotes[index] });
});

// GET /api/candidates/:id/interview-notes - Get notes for a candidate
app.get('/api/candidates/:id/interview-notes', (c) => {
  const candidateId = c.req.param('id');
  const includeTranscript = c.req.query('includeTranscript') === 'true';

  // Verify candidate exists
  const candidate = candidates.find((cand) => cand.id === candidateId);
  if (!candidate) {
    return c.json({ error: { message: 'Candidate not found' } }, 404);
  }

  let notes = interviewNotes.filter((note) => note.candidateId === candidateId);

  // By default, exclude transcript to reduce payload size
  if (!includeTranscript) {
    notes = notes.map(({ transcript, ...rest }) => ({
      ...rest,
      hasTranscript: !!transcript,
    })) as InterviewNote[];
  }

  // Enrich with job info
  const enriched = notes.map((note) => {
    const job = note.jobId ? jobs.find((j) => j.id === note.jobId) : null;
    return {
      ...note,
      job: job ? { id: job.id, title: job.title } : null,
    };
  });

  return c.json({ data: enriched });
});

// ============ START SERVER ============

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Starting Mock ATS server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Mock ATS running at http://localhost:${port}`);
console.log(`  - ${candidates.length} candidates`);
console.log(`  - ${jobs.length} jobs`);
console.log(`  - ${applications.length} applications`);
console.log(`  - ${interviewNotes.length} interview notes`);
