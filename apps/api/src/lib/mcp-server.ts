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
 * Create an API client that makes internal requests
 * Since we're running inside the API server, we can make direct DB calls
 */
function createInternalApiClient(userId: string, apiKey: string): McpApiClient {
  const baseUrl = process.env.SKILLOMATIC_API_URL || 'http://localhost:3000';

  return {
    baseUrl,
    apiKey,

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
 */
export async function createMcpServer(
  userId: string,
  apiKey: string
): Promise<McpServer> {
  log.info('mcp_server_creating', { userId });

  // Build capability profile
  const profile = await buildCapabilityProfile(userId);
  const mcpProfile = toMcpProfile(profile);

  // Create internal API client
  const client = createInternalApiClient(userId, apiKey);

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
