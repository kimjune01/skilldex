import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { db } from '@skillomatic/db';
import { scrapeTasks, integrations } from '@skillomatic/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import { jwtAuth } from '../middleware/auth.js';
import { streamChat, chat, type LLMChatMessage } from '../lib/llm.js';
import {
  subscribeToTask,
  unsubscribeFromTask,
  assignTaskToExtension,
  type ScrapeTaskEvent,
} from '../lib/scrape-events.js';
import {
  isDemoMode,
  generateDemoCandidates,
  generateDemoJobs,
  generateDemoApplications,
} from '../lib/demo-data.js';
import {
  getSkillMetadataForUser,
  getAllSkillMetadata,
  loadSkillBySlug,
  userCanAccessSkill,
  buildSkillsPromptSection,
  type SkillMetadata,
} from '../lib/skills.js';
import { GmailClient, type EmailMessage, type EmailAddress } from '../lib/gmail.js';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from '../lib/nango.js';
import {
  getEffectiveAccessForUser,
  getOrgDisabledSkills,
  canRead,
  canWrite,
  type EffectiveAccess,
} from '../lib/integration-permissions.js';

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
  | { action: 'scrape_url'; url: string }
  | { action: 'load_skill'; slug: string }
  // Email actions
  | { action: 'draft_email'; to: string; subject: string; body: string; cc?: string; bcc?: string }
  | { action: 'send_email'; to: string; subject: string; body: string; cc?: string; bcc?: string }
  | { action: 'search_emails'; query: string; maxResults?: number };

// Determine if a skill requires browser extension
function skillRequiresBrowser(skill: SkillMetadata): boolean {
  const reqs = skill.requiredIntegrations || [];
  return reqs.includes('linkedin') || reqs.includes('browser');
}

/**
 * Email capability info for the chat system
 */
interface EmailCapability {
  hasEmail: boolean;
  canSendEmail: boolean;
  emailAddress?: string;
}

/**
 * Get a Gmail client for the user if they have email connected
 */
async function getGmailClientForUser(userId: string): Promise<{ client: GmailClient; emailAddress: string } | null> {
  // Find the user's Gmail integration
  const integration = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'gmail')))
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
    const providerConfigKey = PROVIDER_CONFIG_KEYS['gmail'];
    const token = await nango.getToken(providerConfigKey, int.nangoConnectionId);

    // Get user email from Gmail profile
    const tempClient = new GmailClient(token.access_token, '');
    const profile = await tempClient.getProfile();

    return {
      client: new GmailClient(token.access_token, profile.emailAddress),
      emailAddress: profile.emailAddress,
    };
  } catch (error) {
    console.error('Failed to get Gmail client for chat:', error);
    return null;
  }
}

/**
 * Check user's email capabilities based on the three-way intersection model
 */
async function getEmailCapability(userId: string, organizationId: string): Promise<EmailCapability> {
  // Get effective access using the three-way intersection model
  const effectiveAccess = await getEffectiveAccessForUser(userId, organizationId);

  // Check if user has read access to email
  if (!canRead(effectiveAccess.email)) {
    return { hasEmail: false, canSendEmail: false };
  }

  // Check if user has Gmail connected
  const gmail = await getGmailClientForUser(userId);
  if (!gmail) {
    return { hasEmail: false, canSendEmail: false };
  }

  return {
    hasEmail: true,
    canSendEmail: canWrite(effectiveAccess.email),
    emailAddress: gmail.emailAddress,
  };
}

/**
 * Parse recipient input - supports string or array of EmailAddress
 */
function parseRecipients(input: unknown): EmailAddress[] {
  if (!input) return [];

  if (typeof input === 'string') {
    return [{ email: input }];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') {
        return { email: item };
      }
      return item as EmailAddress;
    });
  }

  return [];
}

// Build system prompt with skills metadata (progressive disclosure Level 1)
function buildSystemPrompt(
  skillsMetadata: SkillMetadata[],
  emailCapability?: EmailCapability,
  effectiveAccess?: EffectiveAccess,
  disabledSkills?: string[]
): string {
  const skillsSection = buildSkillsPromptSection(skillsMetadata, effectiveAccess, disabledSkills);

  // Identify skills requiring browser extension
  const browserSkills = skillsMetadata
    .filter(skillRequiresBrowser)
    .map(s => `- **${s.name}**: ${s.description}`)
    .join('\n');

  // Build email actions section if available
  let emailActionsSection = '';
  if (emailCapability?.hasEmail) {
    emailActionsSection = `
### Email Actions
${emailCapability.canSendEmail ? `11. **draft_email** - Create an email draft (saved to Gmail Drafts folder)
   \`\`\`action
   {"action": "draft_email", "to": "candidate@example.com", "subject": "Exciting Opportunity", "body": "Hi [Name],\\n\\nI came across your profile..."}
   \`\`\`
   - to: Recipient email address
   - subject: Email subject line
   - body: Email body text
   - cc: (optional) CC recipient
   - bcc: (optional) BCC recipient

12. **send_email** - Send an email directly
   \`\`\`action
   {"action": "send_email", "to": "candidate@example.com", "subject": "Following up", "body": "Hi [Name],\\n\\nThank you for your time..."}
   \`\`\`
   - Same parameters as draft_email
   - IMPORTANT: Always confirm with user before sending` : ''}

13. **search_emails** - Search user's mailbox
   \`\`\`action
   {"action": "search_emails", "query": "from:candidate@example.com", "maxResults": 5}
   \`\`\`
   - query: Gmail search query (e.g., "from:user@example.com", "subject:interview")
   - maxResults: (optional) Maximum results to return (default: 10)

Your connected email: ${emailCapability.emailAddress || 'unknown'}${emailCapability.canSendEmail ? '' : '\n**Note**: Email sending is disabled by your admin. You can only search emails.'}
`;
  }

  return `You are a recruiting assistant with direct access to the ATS (Applicant Tracking System) and various recruiting skills. You can execute actions to help users manage candidates, jobs, and applications.

${skillsSection}

## CRITICAL: How to Execute Actions

To execute an action, you MUST wrap the JSON in a code block with the language "action" (not "json"). Example:

\`\`\`action
{"action": "search_candidates", "query": "engineer"}
\`\`\`

The system ONLY executes code blocks marked as \`\`\`action. Any other format will NOT work.

## Available Actions

### Candidate Actions
1. **search_candidates** - Search for candidates IN THE ATS DATABASE
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
   Note: Requires the Skillomatic browser extension to be running.

### Skill Actions
10. **load_skill** - Load a skill's full instructions (progressive disclosure)
   \`\`\`action
   {"action": "load_skill", "slug": "linkedin-lookup"}
   \`\`\`
   - Returns the skill's complete instructions
   - Use this when you need to execute a skill
   - After loading, follow the skill's instructions
${emailActionsSection}
## Skills Requiring Browser Extension
These skills require the Skillomatic browser extension:
${browserSkills || 'None'}

## Guidelines
- IMPORTANT: Use \`\`\`action blocks, NOT \`\`\`json blocks. The system only executes \`\`\`action blocks.
- **SKILL MATCHING**: When a user's request matches a skill's intent, use load_skill FIRST to get the full instructions, then follow them.
- **CANDIDATE SOURCING**: When users ask to "find candidates", "search for engineers", "look for developers", etc. - this means sourcing NEW candidates. Use load_skill to get the appropriate skill's instructions.
- **ATS SEARCH**: Only use search_candidates when the user explicitly asks about "existing candidates", "candidates in our system", "our database", or "the ATS".
- For READ operations: Execute immediately without asking for confirmation.
- For WRITE operations: Ask for confirmation first.${emailCapability?.hasEmail && emailCapability?.canSendEmail ? '\n- For EMAIL SEND operations: ALWAYS confirm with the user before sending.' : ''}
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
          suggestion: 'Check that the Skillomatic Scraper extension is installed and running.',
        };
      }

      if (task.status === 'expired') {
        return {
          error: 'Scrape task expired',
          suggestion: 'The Skillomatic Scraper extension may not be installed or running.',
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
            suggestion: 'Check that the Skillomatic Scraper extension is installed and running.',
          };
        }
        if (result.status === 'expired') {
          return {
            error: 'Scrape task expired',
            suggestion: 'The Skillomatic Scraper extension may not be installed or running.',
          };
        }
      }
    }

    // Timeout
    return {
      error: 'Scrape timed out waiting for browser extension',
      suggestion: 'Install the Skillomatic Scraper browser extension and ensure it is configured with your API key.',
      taskId,
    };
  } finally {
    // Clean up callback
    taskCallbacks.delete(callbackKey);
  }
}

// Execute ATS action
async function executeAction(
  action: ATSAction,
  isDemo: boolean,
  userId?: string,
  emailCapability?: EmailCapability
): Promise<unknown> {
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

    case 'load_skill': {
      // Progressive disclosure Level 2: Load full skill instructions
      const skill = await loadSkillBySlug(action.slug);

      if (!skill) {
        return { error: `Skill "${action.slug}" not found or not enabled` };
      }

      // Check user access if userId provided
      if (userId) {
        const hasAccess = await userCanAccessSkill(userId, action.slug);
        if (!hasAccess) {
          return { error: `You don't have access to the "${action.slug}" skill` };
        }
      }

      if (!skill.instructions) {
        return { error: `No instructions available for "${action.slug}"` };
      }

      return {
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities,
        },
        instructions: skill.instructions,
        executionNote: skillRequiresBrowser(skill)
          ? 'This skill requires the browser extension. Use scrape_url action for URLs - the extension handles scraping.'
          : 'Follow the instructions above to complete the task.',
      };
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

      // Assign task to browser extension via WebSocket
      assignTaskToExtension(userId, { id: taskId, url: action.url });

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

    // Email actions
    case 'draft_email': {
      if (!userId) {
        return { error: 'Authentication required for email' };
      }

      if (!emailCapability?.hasEmail) {
        return { error: 'Email not connected. Please connect Gmail in the Skillomatic dashboard.' };
      }

      if (!emailCapability.canSendEmail) {
        return { error: 'Email drafting is disabled by your admin.' };
      }

      const gmail = await getGmailClientForUser(userId);
      if (!gmail) {
        return { error: 'Failed to connect to Gmail. Please try reconnecting.' };
      }

      const message: EmailMessage = {
        to: parseRecipients(action.to),
        cc: action.cc ? parseRecipients(action.cc) : undefined,
        bcc: action.bcc ? parseRecipients(action.bcc) : undefined,
        subject: action.subject,
        body: action.body,
        bodyType: 'text',
      };

      try {
        const result = await gmail.client.createDraft(message);
        return {
          success: true,
          draftId: result.id,
          messageId: result.message.id,
          message: `Draft created successfully. You can find it in your Gmail Drafts folder.`,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create draft';
        return { error: msg };
      }
    }

    case 'send_email': {
      if (!userId) {
        return { error: 'Authentication required for email' };
      }

      if (!emailCapability?.hasEmail) {
        return { error: 'Email not connected. Please connect Gmail in the Skillomatic dashboard.' };
      }

      if (!emailCapability.canSendEmail) {
        return { error: 'Email sending is disabled by your admin.' };
      }

      const gmail = await getGmailClientForUser(userId);
      if (!gmail) {
        return { error: 'Failed to connect to Gmail. Please try reconnecting.' };
      }

      const message: EmailMessage = {
        to: parseRecipients(action.to),
        cc: action.cc ? parseRecipients(action.cc) : undefined,
        bcc: action.bcc ? parseRecipients(action.bcc) : undefined,
        subject: action.subject,
        body: action.body,
        bodyType: 'text',
      };

      try {
        const result = await gmail.client.sendEmail(message);
        return {
          success: true,
          messageId: result.id,
          threadId: result.threadId,
          message: `Email sent successfully to ${action.to}.`,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to send email';
        return { error: msg };
      }
    }

    case 'search_emails': {
      if (!userId) {
        return { error: 'Authentication required for email' };
      }

      if (!emailCapability?.hasEmail) {
        return { error: 'Email not connected. Please connect Gmail in the Skillomatic dashboard.' };
      }

      const gmail = await getGmailClientForUser(userId);
      if (!gmail) {
        return { error: 'Failed to connect to Gmail. Please try reconnecting.' };
      }

      try {
        const result = await gmail.client.searchMessages(action.query, action.maxResults || 10);
        return {
          success: true,
          emails: result.messages,
          total: result.messages.length,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to search emails';
        return { error: msg };
      }
    }

    default:
      return { error: 'Unknown action' };
  }
}

// POST /chat - Stream chat response with action execution
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages } = body;
  const isDemo = isDemoMode(c.req.raw);
  const user = c.get('user');

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { message: 'Messages array is required' } }, 400);
  }

  // Fetch available skills for context (role-filtered, metadata only)
  const skillsMetadata = user?.id
    ? await getSkillMetadataForUser(user.id)
    : await getAllSkillMetadata();

  // Get email capability for the user (if authenticated)
  const emailCapability = user?.id && user?.organizationId
    ? await getEmailCapability(user.id, user.organizationId)
    : undefined;

  // Get effective access and disabled skills for skill status display
  let effectiveAccess: EffectiveAccess | undefined;
  let disabledSkills: string[] | undefined;
  if (user?.id && user?.organizationId) {
    effectiveAccess = await getEffectiveAccessForUser(user.id, user.organizationId);
    disabledSkills = await getOrgDisabledSkills(user.organizationId);
  }

  // Build messages with skills metadata (progressive disclosure Level 1)
  const systemPrompt = buildSystemPrompt(skillsMetadata, emailCapability, effectiveAccess, disabledSkills);
  const chatMessages: LLMChatMessage[] = [
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

      // Check for action in the response - support chained actions
      let action = parseAction(fullResponse);
      let actionCount = 0;
      const maxActions = 5; // Prevent infinite loops
      let currentMessages = [...chatMessages];
      let currentResponse = fullResponse;

      while (action && actionCount < maxActions) {
        actionCount++;

        // Execute the action
        const result = await executeAction(action, isDemo, user?.id, emailCapability);

        // Send action result
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'action_result',
            action: action.action,
            result,
          }),
        });

        // For load_skill, allow follow-up actions; for others, just summarize
        const allowMoreActions = action.action === 'load_skill';

        // Get a follow-up response from the LLM with the action result
        const followUpMessages: LLMChatMessage[] = [
          ...currentMessages,
          { role: 'assistant', content: currentResponse },
          {
            role: 'user',
            content: allowMoreActions
              ? `[SYSTEM: Action "${action.action}" completed. Result: ${JSON.stringify(result)}]\n\nNow execute the skill by using the appropriate action (e.g., scrape_url for LinkedIn searches). Include an action block.`
              : `[SYSTEM: Action "${action.action}" completed. Result: ${JSON.stringify(result)}]\n\nPlease summarize the results for the user in a helpful way. Do not include another action block.`,
          },
        ];

        // Get follow-up
        const followUp = await chat(followUpMessages, { maxTokens: 1000 });
        if (followUp) {
          await stream.writeSSE({
            data: JSON.stringify({ type: 'text', content: '\n\n' + followUp }),
          });

          // Check if follow-up contains another action
          if (allowMoreActions) {
            action = parseAction(followUp);
            currentMessages = followUpMessages;
            currentResponse = followUp;
          } else {
            action = null;
          }
        } else {
          action = null;
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

// POST /chat/execute-skill - Execute a skill via API (uses progressive disclosure)
chatRoutes.post('/execute-skill', async (c) => {
  const body = await c.req.json<{ skillSlug: string; params?: Record<string, unknown> }>();
  const { skillSlug, params } = body;
  const isDemo = isDemoMode(c.req.raw);
  const user = c.get('user');

  // Load skill using progressive disclosure
  const skill = await loadSkillBySlug(skillSlug);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Check user access
  if (user?.id) {
    const hasAccess = await userCanAccessSkill(user.id, skillSlug);
    if (!hasAccess) {
      return c.json({ error: { message: 'Access denied to this skill' } }, 403);
    }
  }

  // If skill requires browser, return instructions
  if (skillRequiresBrowser(skill)) {
    return c.json({
      data: {
        type: 'instructions',
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities,
        },
        instructions: skill.instructions,
        message: 'This skill requires the browser extension. Use the chat interface to execute it.',
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
        skill: { slug: skill.slug, name: skill.name },
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
        skill: { slug: skill.slug, name: skill.name },
        success: true,
        result,
      },
    });
  }

  return c.json({
    data: {
      type: 'api_ready',
      skill: { slug: skill.slug, name: skill.name },
      message: `Skill "${skill.name}" is available but requires additional configuration.`,
      params: params || {},
    },
  });
});
