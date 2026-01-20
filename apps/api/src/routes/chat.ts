import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { db } from '@skilldex/db';
import { skills } from '@skilldex/db/schema';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/auth.js';
import { streamChat, chat, type ChatMessage } from '../lib/groq.js';
import type { SkillPublic } from '@skilldex/shared';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
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
  | { action: 'update_application_stage'; id: string; stage: string };

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

// Execute ATS action
async function executeAction(action: ATSAction, isDemo: boolean): Promise<unknown> {
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

    default:
      return { error: 'Unknown action' };
  }
}

// POST /api/chat - Stream chat response with action execution
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages } = body;
  const isDemo = isDemoMode(c.req.raw);

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
        const result = await executeAction(action, isDemo);

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
