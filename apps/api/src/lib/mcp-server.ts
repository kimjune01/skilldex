/**
 * MCP Server Factory for Hosted Endpoint
 *
 * Creates MCP server instances for ChatGPT web/mobile connections.
 * Reuses the same tool registration logic as the local MCP server (packages/mcp).
 *
 * @see packages/mcp/src/tools/index.ts for tool implementations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createLogger } from './logger.js';
import { buildCapabilityProfile } from './skill-renderer.js';
import type { CapabilityProfile } from './skill-renderer.js';
import { db } from '@skillomatic/db';
import { skills, users } from '@skillomatic/db/schema';
import { eq } from 'drizzle-orm';
import * as emailService from '../services/email.js';

const log = createLogger('McpServer');

// Version for the hosted MCP server
const MCP_VERSION = '0.1.0';

/**
 * API client interface for MCP tools
 * Matches the interface expected by tool implementations
 */
interface McpApiClient {
  baseUrl: string;
  apiKey: string;
  userId: string;
  getSkills(): Promise<SkillPublic[]>;
  getRenderedSkill(slug: string): Promise<{ instructions: string }>;
}

interface SkillPublic {
  slug: string;
  name: string;
  description: string;
  intent?: string;
  capabilities?: string[];
  isEnabled: boolean;
}

/**
 * Capability profile for MCP tools (matches packages/mcp expectations)
 */
interface McpCapabilityProfile {
  hasLLM: boolean;
  hasATS: boolean;
  hasCalendar: boolean;
  hasEmail: boolean;
  hasAirtable: boolean;
  isSuperAdmin: boolean;
  atsProvider?: string;
  calendarProvider?: string;
  airtableProvider?: string;
  effectiveAccess?: {
    ats?: 'none' | 'read-only' | 'read-write';
    calendar?: 'none' | 'read-only' | 'read-write';
    database?: 'none' | 'read-only' | 'read-write';
  };
}

/**
 * Create an API client that makes direct DB calls
 * Used for skill operations that don't need external API calls
 */
function createInternalApiClient(userId: string, apiKey: string): McpApiClient {
  const baseUrl = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';

  return {
    baseUrl,
    apiKey,
    userId,

    async getSkills(): Promise<SkillPublic[]> {
      // Get user's org to check skill visibility
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

    async getRenderedSkill(slug: string): Promise<{ instructions: string }> {
      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.slug, slug))
        .limit(1);

      if (!skill) {
        throw new Error(`Skill not found: ${slug}`);
      }

      // For now, return raw instructions
      // TODO: Render with user's credentials if needed
      return { instructions: skill.instructions || `No instructions found for skill: ${slug}` };
    },
  };
}

/**
 * Convert CapabilityProfile to McpCapabilityProfile format
 */
function toMcpProfile(profile: CapabilityProfile & { effectiveAccess: unknown }): McpCapabilityProfile {
  return {
    hasLLM: !!profile.llm,
    hasATS: !!profile.ats,
    hasCalendar: !!profile.calendar,
    hasEmail: !!profile.email,
    hasAirtable: false, // TODO: Check Airtable integration
    isSuperAdmin: false, // Super admin tools not exposed via hosted MCP
    atsProvider: profile.ats?.provider,
    calendarProvider: profile.calendar?.calendly ? 'calendly' : undefined,
    effectiveAccess: profile.effectiveAccess as McpCapabilityProfile['effectiveAccess'],
  };
}

/**
 * Register all tools on an MCP server instance
 */
async function registerTools(
  server: McpServer,
  client: McpApiClient,
  profile: McpCapabilityProfile
): Promise<string[]> {
  const registeredTools: string[] = [];

  // Skill discovery tools - always register
  server.tool(
    'get_skill_catalog',
    'Get available automation workflows and their intents. Call this FIRST when user asks about business tasks.',
    {},
    async () => {
      try {
        const skills = await client.getSkills();
        const enabledSkills = skills.filter((s) => s.isEnabled);

        const catalog = enabledSkills
          .map((s) => {
            const parts = [`## ${s.name} (${s.slug})`, s.description];
            if (s.intent) parts.push(`**When to use:** ${s.intent}`);
            if (s.capabilities?.length) parts.push(`**Capabilities:** ${s.capabilities.join(', ')}`);
            return parts.join('\n');
          })
          .join('\n\n---\n\n');

        return {
          content: [{ type: 'text' as const, text: catalog || 'No skills available.' }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error fetching skill catalog: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('get_skill_catalog');

  server.tool(
    'get_skill',
    'Get detailed instructions for a specific automation workflow.',
    { slug: z.string().describe('Skill slug from the catalog') },
    async (args: { slug: string }) => {
      try {
        const skill = await client.getRenderedSkill(args.slug);
        return {
          content: [{ type: 'text' as const, text: skill.instructions }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error fetching skill: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('get_skill');

  // Alias for load_skill (used by system prompt) -> get_skill
  server.tool(
    'load_skill',
    'Load detailed instructions for a specific automation workflow. Alias for get_skill.',
    { slug: z.string().describe('Skill slug from the catalog') },
    async (args: { slug: string }) => {
      try {
        const skill = await client.getRenderedSkill(args.slug);
        return {
          content: [{ type: 'text' as const, text: skill.instructions }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error fetching skill: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('load_skill');

  // Email tools - only if email is connected
  if (profile.hasEmail) {
    const userId = client.userId;

    server.tool(
      'get_email_profile',
      'Get information about the connected email account',
      {},
      async () => {
        try {
          const emailProfile = await emailService.getEmailProfile(userId);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(emailProfile, null, 2) }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error fetching email profile: ${message}` }],
            isError: true,
          };
        }
      }
    );
    registeredTools.push('get_email_profile');

    server.tool(
      'search_emails',
      'Search emails in the connected mailbox using Gmail search syntax',
      {
        query: z.string().describe('Gmail search query (e.g., "from:user@example.com", "subject:interview", "newer_than:1d")'),
        maxResults: z.number().optional().default(10).describe('Maximum number of results (default: 10)'),
      },
      async (args: { query: string; maxResults?: number }) => {
        try {
          const result = await emailService.searchEmails(userId, args.query, args.maxResults);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({ emails: result.emails, total: result.total, query: args.query }, null, 2),
            }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error searching emails: ${message}` }],
            isError: true,
          };
        }
      }
    );
    registeredTools.push('search_emails');

    server.tool(
      'list_email_drafts',
      'List email drafts in the connected mailbox',
      {
        maxResults: z.number().optional().default(10).describe('Maximum number of drafts to list (default: 10)'),
      },
      async (args: { maxResults?: number }) => {
        try {
          const result = await emailService.listDrafts(userId, args.maxResults);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error listing drafts: ${message}` }],
            isError: true,
          };
        }
      }
    );
    registeredTools.push('list_email_drafts');

    server.tool(
      'draft_email',
      'Create an email draft (saved to Gmail Drafts folder)',
      {
        to: z.string().describe('Recipient email address'),
        subject: z.string().describe('Email subject line'),
        body: z.string().describe('Email body text'),
        cc: z.string().optional().describe('CC recipient email address'),
        bcc: z.string().optional().describe('BCC recipient email address'),
      },
      async (args: { to: string; subject: string; body: string; cc?: string; bcc?: string }) => {
        try {
          const result = await emailService.createDraft(userId, args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                message: `Draft created successfully. You can find it in your Gmail Drafts folder.`,
                draftId: result.draftId,
                messageId: result.messageId,
              }, null, 2),
            }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error creating draft: ${message}` }],
            isError: true,
          };
        }
      }
    );
    registeredTools.push('draft_email');

    server.tool(
      'send_email',
      'Send an email directly. Use with caution - confirm with the user before sending.',
      {
        to: z.string().describe('Recipient email address'),
        subject: z.string().describe('Email subject line'),
        body: z.string().describe('Email body text'),
        cc: z.string().optional().describe('CC recipient email address'),
        bcc: z.string().optional().describe('BCC recipient email address'),
      },
      async (args: { to: string; subject: string; body: string; cc?: string; bcc?: string }) => {
        try {
          const result = await emailService.sendEmail(userId, args);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                message: `Email sent successfully to ${args.to}.`,
                messageId: result.messageId,
                threadId: result.threadId,
              }, null, 2),
            }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error sending email: ${message}` }],
            isError: true,
          };
        }
      }
    );
    registeredTools.push('send_email');

    log.info('email_tools_registered');
  } else {
    log.info('email_tools_not_registered', { reason: 'no email integration connected' });
  }

  // Log capability summary
  log.info('mcp_tools_registered', {
    toolCount: registeredTools.length,
    tools: registeredTools,
    hasATS: profile.hasATS,
    hasEmail: profile.hasEmail,
    hasCalendar: profile.hasCalendar,
  });

  return registeredTools;
}

/**
 * Create a new MCP server instance for a user session
 * @param userId - The user's ID
 * @param apiKey - Optional API key (not needed for web chat which uses JWT)
 */
export async function createMcpServer(
  userId: string,
  apiKey?: string
): Promise<McpServer> {
  log.info('mcp_server_creating', { userId });

  // Build capability profile
  const profile = await buildCapabilityProfile(userId);
  const mcpProfile = toMcpProfile(profile);

  // Create internal API client
  const client = createInternalApiClient(userId, apiKey || '');

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

  // Register tools based on capabilities
  await registerTools(server, client, mcpProfile);

  log.info('mcp_server_created', { userId });

  return server;
}
