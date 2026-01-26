import { randomUUID } from 'crypto';
import { db } from '@skillomatic/db';
import { scrapeTasks, integrations } from '@skillomatic/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { tavily } from '@tavily/core';
import {
  generateDemoCandidates,
  generateDemoJobs,
  generateDemoApplications,
} from './demo-data.js';
import { loadSkillBySlug, userCanAccessSkill, type SkillMetadata } from './skills.js';
import { GmailClient, type EmailMessage } from './gmail.js';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from './nango.js';
import { assignTaskToExtension } from './scrape-events.js';
import { normalizeUrl, hashUrl, parseRecipients, waitForScrapeTask } from './chat-helpers.js';

// ============ Action Types ============

export type ChatAction =
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
  | { action: 'search_emails'; query: string; maxResults?: number }
  // Web search
  | {
      action: 'web_search';
      query: string;
      maxResults?: number;
      topic?: 'general' | 'news';
      includeAnswer?: boolean;
    };

// ============ Email Capability ============

export interface EmailCapability {
  hasEmail: boolean;
  canSendEmail: boolean;
  emailAddress?: string;
}

/**
 * Get a Gmail client for the user if they have email connected
 */
export async function getGmailClientForUser(
  userId: string
): Promise<{ client: GmailClient; emailAddress: string } | null> {
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

// ============ Skill Helpers ============

/**
 * Determine if a skill requires browser extension
 */
export function skillRequiresBrowser(skill: SkillMetadata): boolean {
  const reqs = Object.keys(skill.requiredIntegrations || {});
  return reqs.includes('linkedin') || reqs.includes('browser');
}

// ============ Action Parser ============

/**
 * Parse action from response text
 */
export function parseAction(text: string): ChatAction | null {
  const match = text.match(/```action\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ChatAction;
  } catch {
    return null;
  }
}

// ============ Action Executor ============

/**
 * Execute a chat action
 */
export async function executeAction(
  action: ChatAction,
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
          (c) =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.skills.some((s) => s.toLowerCase().includes(q))
        );
      }
      if (action.status) {
        candidates = candidates.filter((c) => c.status === action.status);
      }
      if (action.stage) {
        candidates = candidates.filter((c) => c.stage === action.stage);
      }
      return { candidates, total: candidates.length, demo: isDemo };
    }

    case 'get_candidate': {
      const candidates = generateDemoCandidates();
      const candidate = candidates.find((c) => c.id === action.id);
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
      const candidate = candidates.find((c) => c.id === action.id);
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
      const job = jobs.find((j) => j.id === action.id);
      return job ? { job, demo: isDemo } : { error: 'Job not found' };
    }

    case 'list_applications': {
      let applications = generateDemoApplications();
      if (action.candidateId) {
        applications = applications.filter((a) => a.candidateId === action.candidateId);
      }
      if (action.jobId) {
        applications = applications.filter((a) => a.jobId === action.jobId);
      }
      if (action.stage) {
        applications = applications.filter((a) => a.stage === action.stage);
      }
      return { applications, total: applications.length, demo: isDemo };
    }

    case 'update_application_stage': {
      const applications = generateDemoApplications();
      const application = applications.find((a) => a.id === action.id);
      if (!application) return { error: 'Application not found' };
      const updated = {
        ...application,
        stage: action.stage,
        stageHistory: [
          ...application.stageHistory,
          { stage: action.stage, date: new Date().toISOString() },
        ],
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
      let normalizedUrlValue: string;
      let urlHash: string;
      try {
        normalizedUrlValue = normalizeUrl(action.url);
        urlHash = hashUrl(normalizedUrlValue);
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
      const result = await waitForScrapeTask(userId, taskId, action.url, MAX_WAIT_MS);
      return result;
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

    case 'web_search': {
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      if (!tavilyApiKey) {
        return { error: 'Web search is not configured. Missing TAVILY_API_KEY.' };
      }

      try {
        const client = tavily({ apiKey: tavilyApiKey });
        const response = await client.search(action.query, {
          maxResults: Math.min(action.maxResults || 5, 10),
          topic: action.topic || 'general',
          includeAnswer: action.includeAnswer !== false,
        });

        return {
          success: true,
          query: action.query,
          answer: response.answer,
          results: response.results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
          })),
          total: response.results.length,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Web search failed';
        return { error: msg };
      }
    }

    default:
      return { error: 'Unknown action' };
  }
}
