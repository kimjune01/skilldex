/**
 * Tool registry for the MCP server.
 * Dynamically registers tools based on the user's connected integrations.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient, CapabilityProfile } from '../api-client.js';
import { registerAtsTools } from './ats.js';
import { registerScrapeTools } from './scrape.js';
import { log } from '../logger.js';

/**
 * Register all tools based on user's capabilities.
 * Tools are only registered if the user has the required integrations connected.
 */
export async function registerTools(
  server: McpServer,
  client: SkillomaticClient,
  profile: CapabilityProfile
): Promise<void> {
  const registeredTools: string[] = [];

  // Always register: list_skills tool
  server.tool(
    'list_skills',
    'List all available Skillomatic skills for the current user',
    {},
    async () => {
      try {
        const skills = await client.getSkills();
        const enabledSkills = skills.filter(s => s.isEnabled);

        const skillList = enabledSkills.map(s => ({
          slug: s.slug,
          name: s.name,
          description: s.description,
          category: s.category,
          intent: s.intent,
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  skills: skillList,
                  count: skillList.length,
                  hint: 'Use the resource URI skillomatic://skills/{slug} to read full skill instructions.',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error listing skills: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('list_skills');

  // Always register: get_skill tool
  server.tool(
    'get_skill',
    'Get the full instructions for a specific skill',
    { slug: z.string().describe('Skill slug (e.g., linkedin-lookup, ats-candidate-search)') },
    async (args) => {
      try {
        const skill = await client.getRenderedSkill(args.slug);

        return {
          content: [
            {
              type: 'text' as const,
              text: skill.instructions || `No instructions found for skill: ${args.slug}`,
            },
          ],
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

  // ATS tools - only if ATS is connected
  if (profile.hasATS) {
    registerAtsTools(server, client);
    registeredTools.push('search_ats_candidates', 'get_ats_candidate', 'create_ats_candidate', 'update_ats_candidate');
    log.info(`ATS tools registered (provider: ${profile.atsProvider || 'unknown'})`);
  } else {
    log.info('ATS tools not registered (no ATS integration connected)');
  }

  // Scrape tools - always available (but require browser extension to work)
  registerScrapeTools(server, client);
  registeredTools.push('create_scrape_task', 'get_scrape_task', 'scrape_url');
  log.info('Scrape tools registered');

  // TODO: Email tools - only if email is connected
  // if (profile.hasEmail) {
  //   registerEmailTools(server, client);
  //   registeredTools.push('draft_email', 'send_email');
  //   log.info('Email tools registered');
  // }

  // TODO: Calendar tools - only if calendar is connected
  // if (profile.hasCalendar) {
  //   registerCalendarTools(server, client);
  //   registeredTools.push('check_availability', 'schedule_meeting');
  //   log.info('Calendar tools registered');
  // }

  log.info(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
}
