/**
 * MCP Server Factory for Hosted Endpoint
 *
 * Creates MCP server instances for ChatGPT web/mobile and web chat connections.
 * Uses the shared tool registration from @skillomatic/mcp with an internal API client adapter.
 *
 * @see packages/mcp/src/tools/index.ts for tool implementations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '@skillomatic/mcp/tools';
import type { SkillomaticClient as McpClientInterface, CapabilityProfile as McpCapabilityProfile } from '@skillomatic/mcp/api-client';
import { createLogger } from './logger.js';
import { buildCapabilityProfile } from './skill-renderer.js';
import type { CapabilityProfile } from './skill-renderer.js';
import { db } from '@skillomatic/db';
import { skills, users } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import * as emailService from '../services/email.js';
import { createSkillFromMarkdown, deleteSkill as deleteSkillService } from './skill-validator.js';
import { createScrapeTaskInternal, getScrapeTaskInternal } from './scrape-service.js';

const log = createLogger('McpServer');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any; // We use a duck-typed client that implements only what we need

// Version for the hosted MCP server
const MCP_VERSION = '0.1.0';

/**
 * Create an internal API client adapter that implements the SkillomaticClient interface
 * but makes direct DB/service calls instead of HTTP API calls.
 *
 * This allows the hosted MCP server (web chat, ChatGPT) to use the same tool registration
 * as the Docker MCP server (Claude Desktop) without code duplication.
 */
function createInternalApiClient(userId: string): AnyClient {
  const baseUrl = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';

  // Create a partial implementation that supports the tools we need
  // Methods throw if called but not implemented - fail fast if tools evolve
  const notImplemented = (method: string) => () => {
    throw new Error(`${method} not implemented in internal API client`);
  };

  return {
    // Required by base class but not used directly
    baseUrl,
    apiKey: '',
    timeoutMs: 30000,

    // Skill operations - direct DB calls
    async getSkills() {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const allSkills = await db.select().from(skills);

      return allSkills
        .filter((s) => s.isEnabled || user?.isAdmin)
        .map((s) => ({
          slug: s.slug,
          name: s.name,
          description: s.description || '',
          intent: s.intent || undefined,
          capabilities: s.capabilities ? JSON.parse(s.capabilities) : undefined,
          isEnabled: s.isEnabled,
        }));
    },

    async getSkill(slug: string) {
      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.slug, slug))
        .limit(1);

      if (!skill) {
        throw new Error(`Skill not found: ${slug}`);
      }

      return {
        slug: skill.slug,
        name: skill.name,
        description: skill.description || '',
        intent: skill.intent || undefined,
        capabilities: skill.capabilities ? JSON.parse(skill.capabilities) : undefined,
        isEnabled: skill.isEnabled,
      };
    },

    async getRenderedSkill(slug: string) {
      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.slug, slug))
        .limit(1);

      if (!skill) {
        throw new Error(`Skill not found: ${slug}`);
      }

      return { instructions: skill.instructions || `No instructions found for skill: ${slug}` };
    },

    async createSkill(content: string, force?: boolean, cron?: string) {
      const result = await createSkillFromMarkdown(content, userId, { force, cron });
      return {
        slug: result.slug,
        name: result.name,
        description: result.description || '',
        isEnabled: result.isEnabled,
      };
    },

    async deleteSkill(slug: string) {
      const result = await deleteSkillService(slug, userId);
      return { success: true, message: result.message };
    },

    async getCapabilities() {
      const profile = await buildCapabilityProfile(userId);
      return {
        llm: profile.llm,
        ats: profile.ats,
        calendar: profile.calendar,
        email: profile.email,
      };
    },

    async verifyAuth() {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      return { id: user.id, email: user.email, name: user.name || '' };
    },

    // Scrape operations - direct service calls
    async createScrapeTask(url: string) {
      return createScrapeTaskInternal(userId, url);
    },

    async getScrapeTask(id: string) {
      return getScrapeTaskInternal(userId, id);
    },

    async waitForScrapeResult(id: string, options?: { timeout?: number; interval?: number }) {
      const timeout = options?.timeout || 60000;
      const interval = options?.interval || 2000;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const task = await getScrapeTaskInternal(userId, id);
        if (task.status === 'completed' || task.status === 'failed' || task.status === 'expired') {
          return task;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      throw new Error(`Scrape task ${id} timed out after ${timeout}ms`);
    },

    // Email operations - direct service calls
    async getEmailProfile() {
      return emailService.getEmailProfile(userId);
    },

    async createDraft(data: Parameters<typeof emailService.createDraft>[1]) {
      return emailService.createDraft(userId, data);
    },

    async sendEmail(data: Parameters<typeof emailService.sendEmail>[1]) {
      return emailService.sendEmail(userId, data);
    },

    async searchEmails(query: string, maxResults?: number) {
      return emailService.searchEmails(userId, query, maxResults);
    },

    async listDrafts(maxResults?: number) {
      return emailService.listDrafts(userId, maxResults);
    },

    // ATS operations - not supported in hosted MCP (use Claude Desktop for ATS)
    searchCandidates: notImplemented('searchCandidates'),
    getCandidate: notImplemented('getCandidate'),
    createCandidate: notImplemented('createCandidate'),
    updateCandidate: notImplemented('updateCandidate'),
    proxyAtsRequest: notImplemented('proxyAtsRequest'),
    proxyCalendarRequest: notImplemented('proxyCalendarRequest'),
    proxyDataRequest: notImplemented('proxyDataRequest'),

    // Database operations - not supported in hosted MCP
    listDatabaseTables: notImplemented('listDatabaseTables'),
    getTableSchema: notImplemented('getTableSchema'),
    queryDatabase: notImplemented('queryDatabase'),
    getDatabaseStats: notImplemented('getDatabaseStats'),

    // Sheets operations - not supported in hosted MCP yet
    listTabs: notImplemented('listTabs'),
    createTab: notImplemented('createTab'),
    updateTabSchema: notImplemented('updateTabSchema'),
    deleteTab: notImplemented('deleteTab'),
    readTabRows: notImplemented('readTabRows'),
    appendTabRow: notImplemented('appendTabRow'),
    updateTabRow: notImplemented('updateTabRow'),
    deleteTabRow: notImplemented('deleteTabRow'),
    searchTab: notImplemented('searchTab'),
    upsertTabRow: notImplemented('upsertTabRow'),
  } as unknown as McpClientInterface;
}

/**
 * Convert internal CapabilityProfile to MCP CapabilityProfile format
 */
function toMcpProfile(profile: CapabilityProfile & { effectiveAccess?: unknown }): McpCapabilityProfile {
  return {
    hasLLM: !!profile.llm,
    hasATS: false, // ATS not supported in hosted MCP - use Claude Desktop
    hasCalendar: !!profile.calendar,
    hasEmail: !!profile.email,
    hasAirtable: false,
    hasGoogleSheets: false,
    hasGoogleDrive: false,
    hasGoogleDocs: false,
    hasGoogleForms: false,
    hasGoogleContacts: false,
    hasGoogleTasks: false,
    hasExtension: true, // Enable scrape tools for web chat
    isSuperAdmin: false, // Super admin tools not exposed via hosted MCP
    atsProvider: undefined,
    calendarProvider: profile.calendar?.calendly ? 'calendly' : undefined,
    airtableProvider: undefined,
    effectiveAccess: profile.effectiveAccess as McpCapabilityProfile['effectiveAccess'],
  };
}

/**
 * Create a new MCP server instance for a user session
 * @param userId - The user's ID
 */
export async function createMcpServer(userId: string): Promise<McpServer> {
  log.info('mcp_server_creating', { userId });

  // Build capability profile
  const profile = await buildCapabilityProfile(userId);
  const mcpProfile = toMcpProfile(profile);

  // Create internal API client adapter
  const client = createInternalApiClient(userId);

  // Create MCP server
  const server = new McpServer(
    {
      name: 'skillomatic',
      version: MCP_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools using the shared implementation from @skillomatic/mcp
  await registerTools(server, client, mcpProfile);

  log.info('mcp_server_created', { userId });

  return server;
}
