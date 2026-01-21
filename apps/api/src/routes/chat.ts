import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { db } from '@skilldex/db';
import { skills, scrapeTasks } from '@skilldex/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import { jwtAuth } from '../middleware/auth.js';
import { streamChat, chat, type ChatMessage } from '../lib/llm.js';
import type { SkillPublic } from '@skilldex/shared';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import {
  subscribeToTask,
  unsubscribeFromTask,
  type ScrapeTaskEvent,
} from '../lib/scrape-events.js';
import {
  isDemoMode,
  generateDemoCandidates,
  generateDemoJobs,
  generateDemoApplications,
} from '../lib/demo-data.js';

export const chatRoutes = new Hono();

// All routes require JWT auth
chatRoutes.use('*', jwtAuth);

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ATS Action types
type ATSAction =
  | { action: 'search_candidates'; query?: string; status?: string; stage?: string }
  | { action: 'get_candidate'; id: string }
  | { action: 'create_candidate'; data: Record<string, unknown> }
  | { action: 'update_candidate'; id: string; data: Record<string, unknown> }
  | { action: 'list_jobs' }
  | { action: 'get_job'; id: string }
  | { action: 'list_applications'; candidateId?: string; jobId?: string; stage?: string }
  | { action: 'update_application_stage'; id: string; stage: string }
  | { action: 'scrape_url'; url: string };

// Parse frontmatter from SKILL.md content
function parseFrontmatter(content: string): { intent: string; capabilities: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { intent: '', capabilities: [] };
  }
  try {
    const yaml = parseYaml(match[1]);
    return {
      intent: yaml.intent || '',
      capabilities: Array.isArray(yaml.capabilities) ? yaml.capabilities : [],
    };
  } catch {
    return { intent: '', capabilities: [] };
  }
}

// Convert DB skill to public format with intent/capabilities
function toSkillPublic(skill: typeof skills.$inferSelect): SkillPublic {
  const skillPath = join(process.cwd(), '..', '..', skill.skillMdPath);
  let intent = '';
  let capabilities: string[] = [];

  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8');
    const parsed = parseFrontmatter(content);
    intent = parsed.intent;
    capabilities = parsed.capabilities;
  }

  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category as SkillPublic['category'],
    version: skill.version,
    requiredIntegrations: skill.requiredIntegrations ? JSON.parse(skill.requiredIntegrations) : [],
    requiredScopes: skill.requiredScopes ? JSON.parse(skill.requiredScopes) : [],
    intent,
    capabilities,
    isEnabled: skill.isEnabled,
  };
}

// Determine if a skill can be executed via API or needs Claude Desktop
function getSkillExecutionType(skill: SkillPublic): 'api' | 'claude-desktop' {
  const integrations = skill.requiredIntegrations || [];
  if (integrations.includes('linkedin') || integrations.includes('browser')) {
    return 'claude-desktop';
  }
  return 'api';
}

// Build system prompt with ATS actions
function buildSystemPrompt(skillsList: SkillPublic[]): string {
  const claudeDesktopSkills = skillsList
    .filter(s => s.isEnabled && getSkillExecutionType(s) === 'claude-desktop')
    .map(s => `- **${s.name}**: ${s.description}`)
    .join('\n');

  return `You are a recruiting assistant with direct access to the ATS (Applicant Tracking System). You can execute actions to help users manage candidates, jobs, and applications.

## CRITICAL: How to Execute Actions

To execute an action, you MUST wrap the JSON in a code block with the language "action" (not "json"). Example:

\`\`\`action
{"action": "search_candidates", "query": "engineer"}
\`\`\`

The system ONLY executes code blocks marked as \`\`\`action. Any other format will NOT work.

## Available Actions

### Candidate Actions
1. **search_candidates** - Search for candidates
   \`\`\`action
   {"action": "search_candidates", "query": "python engineer", "status": "active", "stage": "Interview"}
   \`\`\`
   - query: Search term (searches name, title, company, skills)
   - status: Filter by status (active, rejected, hired)
   - stage: Filter by stage (New, Screening, Interview, Offer, Hired, Rejected)

2. **get_candidate** - Get a specific candidate by ID
   \`\`\`action
   {"action": "get_candidate", "id": "candidate-id"}
   \`\`\`

3. **create_candidate** - Create a new candidate
   \`\`\`action
   {"action": "create_candidate", "data": {"firstName": "John", "lastName": "Doe", "email": "john@example.com", "title": "Software Engineer", "company": "Acme Inc", "skills": ["Python", "React"]}}
   \`\`\`

4. **update_candidate** - Update an existing candidate
   \`\`\`action
   {"action": "update_candidate", "id": "candidate-id", "data": {"stage": "Interview", "notes": "Great technical skills"}}
   \`\`\`

### Job Actions
5. **list_jobs** - List all open jobs/requisitions
   \`\`\`action
   {"action": "list_jobs"}
   \`\`\`

6. **get_job** - Get a specific job by ID
   \`\`\`action
   {"action": "get_job", "id": "job-id"}
   \`\`\`

### Application Actions
7. **list_applications** - List applications (candidate-job associations)
   \`\`\`action
   {"action": "list_applications", "candidateId": "cand-id", "jobId": "job-id", "stage": "Interview"}
   \`\`\`

8. **update_application_stage** - Move a candidate to a new stage
   \`\`\`action
   {"action": "update_application_stage", "id": "application-id", "stage": "Offer"}
   \`\`\`

### Web Scraping Actions
9. **scrape_url** - Scrape a webpage and get its content as markdown
   \`\`\`action
   {"action": "scrape_url", "url": "https://example.com/page"}
   \`\`\`
   - url: The full URL to scrape (must include https://)
   - Returns the page content as markdown text
   - Use this to extract information from LinkedIn profiles, job postings, company pages, etc.
   - Note: Requires the Skilldex Scraper browser extension to be installed and running

## Skills Requiring Claude Desktop
These skills cannot be executed here and require Claude Desktop:
${claudeDesktopSkills || 'None'}

For these skills, explain what they do and tell the user to use them in Claude Desktop.

## Guidelines
- IMPORTANT: Use \`\`\`action blocks, NOT \`\`\`json blocks. The system only executes \`\`\`action blocks.
- For READ operations (search_candidates, get_candidate, list_jobs, get_job, list_applications): Execute immediately without asking for confirmation.
- For WRITE operations (create_candidate, update_candidate, update_application_stage): Ask for confirmation first.
- When users ask to find/search candidates, immediately execute search_candidates with the relevant query.
- When users want to see jobs, immediately execute list_jobs.
- Keep your initial response brief. The action results will be shown to the user automatically.
- Be conversational and helpful.`;
}

// Parse action from response text
function parseAction(text: string): ATSAction | null {
  const match = text.match(/```action\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ATSAction;
  } catch {
    return null;
  }
}

// URL normalization for scrape deduplication
function normalizeUrl(urlString: string): string {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
  trackingParams.forEach(param => url.searchParams.delete(param));
  url.searchParams.sort();
  url.hash = '';
  return url.toString();
}

function hashUrl(normalizedUrl: string): string {
  return createHash('sha256').update(normalizedUrl).digest('hex');
}

// Wait for scrape task to complete using event callbacks + polling fallback
async function waitForScrapeTask(
  userId: string,
  taskId: string,
  originalUrl: string,
  timeoutMs: number
): Promise<unknown> {
  const POLL_INTERVAL_MS = 3000; // Slower polling as backup (3 seconds)
  const startTime = Date.now();

  // Create a promise that will be resolved when we get a WebSocket event
  let eventResolver: ((event: ScrapeTaskEvent) => void) | null = null;
  const eventPromise = new Promise<ScrapeTaskEvent>((resolve) => {
    eventResolver = resolve;
  });

  // Register callback for WebSocket events (set in scrape-events.ts taskCallbacks)
  const callbackKey = `${userId}:${taskId}`;
  const { taskCallbacks } = await import('../lib/scrape-events.js');
  taskCallbacks.set(callbackKey, (event: ScrapeTaskEvent) => {
    if (eventResolver) eventResolver(event);
  });

  try {
    // Race between: WebSocket event, polling check, and timeout
    while (Date.now() - startTime < timeoutMs) {
      // Check database (polling fallback in case WebSocket misses something)
      const [task] = await db
        .select()
        .from(scrapeTasks)
        .where(eq(scrapeTasks.id, taskId))
        .limit(1);

      if (!task) {
        return { error: 'Task disappeared unexpectedly' };
      }

      if (task.status === 'completed' && task.result) {
        return {
          success: true,
          url: originalUrl,
          content: task.result,
          cached: false,
        };
      }

      if (task.status === 'failed') {
        return {
          error: task.errorMessage || 'Scrape failed',
          suggestion: 'Check that the Skilldex Scraper extension is installed and running.',
        };
      }

      if (task.status === 'expired') {
        return {
          error: 'Scrape task expired',
          suggestion: 'The Skilldex Scraper extension may not be installed or running.',
        };
      }

      // Wait for either: WebSocket event OR poll interval
      const remainingTime = timeoutMs - (Date.now() - startTime);
      const waitTime = Math.min(POLL_INTERVAL_MS, remainingTime);

      if (waitTime <= 0) break;

      // Race between event and timeout
      const result = await Promise.race([
        eventPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), waitTime)),
      ]);

      // If we got a WebSocket event, process it
      if (result && result.type === 'task_update') {
        if (result.status === 'completed' && result.result) {
          return {
            success: true,
            url: originalUrl,
            content: result.result,
            cached: false,
          };
        }
        if (result.status === 'failed') {
          return {
            error: result.errorMessage || 'Scrape failed',
            suggestion: 'Check that the Skilldex Scraper extension is installed and running.',
          };
        }
        if (result.status === 'expired') {
          return {
            error: 'Scrape task expired',
            suggestion: 'The Skilldex Scraper extension may not be installed or running.',
          };
        }
      }
    }

    // Timeout
    return {
      error: 'Scrape timed out waiting for browser extension',
      suggestion: 'Install the Skilldex Scraper browser extension and ensure it is configured with your API key.',
      taskId,
    };
  } finally {
    // Clean up callback
    taskCallbacks.delete(callbackKey);
  }
}

// Execute ATS action
async function executeAction(action: ATSAction, isDemo: boolean, userId?: string): Promise<unknown> {
  switch (action.action) {
    case 'search_candidates': {
      let candidates = generateDemoCandidates();
      if (action.query) {
        const q = action.query.toLowerCase();
        candidates = candidates.filter(
          c =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.skills.some(s => s.toLowerCase().includes(q))
        );
      }
      if (action.status) {
        candidates = candidates.filter(c => c.status === action.status);
      }
      if (action.stage) {
        candidates = candidates.filter(c => c.stage === action.stage);
      }
      return { candidates, total: candidates.length, demo: isDemo };
    }

    case 'get_candidate': {
      const candidates = generateDemoCandidates();
      const candidate = candidates.find(c => c.id === action.id);
      return candidate ? { candidate, demo: isDemo } : { error: 'Candidate not found' };
    }

    case 'create_candidate': {
      const newCandidate = {
        id: `demo-cand-${Date.now()}`,
        ...action.data,
        status: 'active',
        stage: 'New',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { candidate: newCandidate, created: true, demo: isDemo };
    }

    case 'update_candidate': {
      const candidates = generateDemoCandidates();
      const candidate = candidates.find(c => c.id === action.id);
      if (!candidate) return { error: 'Candidate not found' };
      const updated = { ...candidate, ...action.data, updatedAt: new Date().toISOString() };
      return { candidate: updated, updated: true, demo: isDemo };
    }

    case 'list_jobs': {
      const jobs = generateDemoJobs();
      return { jobs, total: jobs.length, demo: isDemo };
    }

    case 'get_job': {
      const jobs = generateDemoJobs();
      const job = jobs.find(j => j.id === action.id);
      return job ? { job, demo: isDemo } : { error: 'Job not found' };
    }

    case 'list_applications': {
      let applications = generateDemoApplications();
      if (action.candidateId) {
        applications = applications.filter(a => a.candidateId === action.candidateId);
      }
      if (action.jobId) {
        applications = applications.filter(a => a.jobId === action.jobId);
      }
      if (action.stage) {
        applications = applications.filter(a => a.stage === action.stage);
      }
      return { applications, total: applications.length, demo: isDemo };
    }

    case 'update_application_stage': {
      const applications = generateDemoApplications();
      const application = applications.find(a => a.id === action.id);
      if (!application) return { error: 'Application not found' };
      const updated = {
        ...application,
        stage: action.stage,
        stageHistory: [...application.stageHistory, { stage: action.stage, date: new Date().toISOString() }],
        updatedAt: new Date().toISOString(),
      };
      return { application: updated, updated: true, demo: isDemo };
    }

    case 'scrape_url': {
      if (!userId) {
        return { error: 'Authentication required for scraping' };
      }

      // Validate URL
      let normalizedUrl: string;
      let urlHash: string;
      try {
        normalizedUrl = normalizeUrl(action.url);
        urlHash = hashUrl(normalizedUrl);
      } catch {
        return { error: 'Invalid URL format' };
      }

      const now = new Date();
      const TASK_TTL_MS = 60 * 60 * 1000; // 1 hour
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
      const MAX_WAIT_MS = 120000; // 2 minutes max wait
      const cacheThreshold = new Date(now.getTime() - CACHE_TTL_MS);

      // Check for cached result first
      const [cached] = await db
        .select()
        .from(scrapeTasks)
        .where(
          and(
            eq(scrapeTasks.userId, userId),
            eq(scrapeTasks.urlHash, urlHash),
            eq(scrapeTasks.status, 'completed'),
            gt(scrapeTasks.completedAt, cacheThreshold)
          )
        )
        .orderBy(desc(scrapeTasks.completedAt))
        .limit(1);

      if (cached && cached.result) {
        return {
          success: true,
          url: action.url,
          content: cached.result,
          cached: true,
        };
      }

      // Check for existing pending/processing task
      const [existing] = await db
        .select()
        .from(scrapeTasks)
        .where(
          and(
            eq(scrapeTasks.userId, userId),
            eq(scrapeTasks.urlHash, urlHash),
            gt(scrapeTasks.expiresAt, now)
          )
        )
        .orderBy(desc(scrapeTasks.createdAt))
        .limit(1);

      let taskId: string;

      if (existing && ['pending', 'processing'].includes(existing.status)) {
        taskId = existing.id;
      } else {
        // Create new scrape task
        taskId = randomUUID();
        await db.insert(scrapeTasks).values({
          id: taskId,
          userId,
          url: action.url,
          urlHash,
          status: 'pending',
          createdAt: now,
          expiresAt: new Date(now.getTime() + TASK_TTL_MS),
        });
      }

      // Wait for task completion via WebSocket events (with polling fallback)
      // Subscribe to task updates
      subscribeToTask(userId, taskId);

      try {
        const result = await waitForScrapeTask(userId, taskId, action.url, MAX_WAIT_MS);
        return result;
      } finally {
        unsubscribeFromTask(userId, taskId);
      }
    }

    default:
      return { error: 'Unknown action' };
  }
}

// POST /api/chat - Stream chat response with action execution
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages } = body;
  const isDemo = isDemoMode(c.req.raw);
  const user = c.get('user');

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { message: 'Messages array is required' } }, 400);
  }

  // Fetch available skills for context
  const allSkills = await db.select().from(skills).where(eq(skills.isEnabled, true));
  const publicSkills = allSkills.map(toSkillPublic);

  // Build messages for Groq
  const systemPrompt = buildSystemPrompt(publicSkills);
  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  return streamSSE(c, async (stream) => {
    try {
      let fullResponse = '';

      // Stream the initial response
      for await (const chunk of streamChat(chatMessages)) {
        fullResponse += chunk;
        await stream.writeSSE({
          data: JSON.stringify({ type: 'text', content: chunk }),
        });
      }

      // Check for action in the response
      const action = parseAction(fullResponse);
      if (action) {
        // Execute the action
        const result = await executeAction(action, isDemo, user?.id);

        // Send action result
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'action_result',
            action: action.action,
            result,
          }),
        });

        // Get a follow-up response from the LLM with the action result
        const followUpMessages: ChatMessage[] = [
          ...chatMessages,
          { role: 'assistant', content: fullResponse },
          {
            role: 'user',
            content: `[SYSTEM: Action "${action.action}" completed. Result: ${JSON.stringify(result)}]\n\nPlease summarize the results for the user in a helpful way. Do not include another action block.`,
          },
        ];

        // Get follow-up (non-streaming for simplicity)
        const followUp = await chat(followUpMessages, { maxTokens: 500 });
        if (followUp) {
          await stream.writeSSE({
            data: JSON.stringify({ type: 'text', content: '\n\n' + followUp }),
          });
        }
      }

      // Send done event
      await stream.writeSSE({
        data: JSON.stringify({ type: 'done' }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await stream.writeSSE({
        data: JSON.stringify({ type: 'error', message }),
      });
    }
  });
});

// POST /api/chat/execute-skill - Execute a skill via API (legacy, kept for compatibility)
chatRoutes.post('/execute-skill', async (c) => {
  const body = await c.req.json<{ skillSlug: string; params?: Record<string, unknown> }>();
  const { skillSlug, params } = body;
  const isDemo = isDemoMode(c.req.raw);

  // Find the skill
  const skill = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, skillSlug))
    .limit(1);

  if (skill.length === 0) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  const publicSkill = toSkillPublic(skill[0]);
  const execType = getSkillExecutionType(publicSkill);

  if (execType === 'claude-desktop') {
    const skillPath = join(process.cwd(), '..', '..', skill[0].skillMdPath);
    let instructions = '';

    if (existsSync(skillPath)) {
      const content = readFileSync(skillPath, 'utf-8');
      instructions = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    }

    return c.json({
      data: {
        type: 'instructions',
        skill: publicSkill,
        instructions,
        message: `This skill requires Claude Desktop. Here's how to use it:`,
      },
    });
  }

  // Execute based on skill type
  if (skillSlug === 'ats-candidate-search') {
    const result = await executeAction(
      { action: 'search_candidates', query: (params?.query as string) || '' },
      isDemo
    );
    return c.json({
      data: {
        type: 'execution_result',
        skill: publicSkill,
        success: true,
        result,
      },
    });
  }

  if (skillSlug === 'ats-candidate-crud') {
    const result = await executeAction(
      { action: 'create_candidate', data: (params?.candidate as Record<string, unknown>) || {} },
      isDemo
    );
    return c.json({
      data: {
        type: 'execution_result',
        skill: publicSkill,
        success: true,
        result,
      },
    });
  }

  return c.json({
    data: {
      type: 'api_ready',
      skill: publicSkill,
      message: `Skill "${publicSkill.name}" is available but requires additional configuration.`,
      params: params || {},
    },
  });
});
