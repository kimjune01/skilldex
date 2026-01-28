/**
 * Tool registry for the MCP server.
 * Dynamically registers tools based on the user's connected integrations.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient, CapabilityProfile } from '../api-client.js';
import { registerAtsTools } from './ats.js';
import { registerScrapeTools } from './scrape.js';
import { registerEmailTools } from './email.js';
import { registerDatabaseTools } from './database.js';
import { registerSheetsTools } from './sheets.js';
import { log } from '../logger.js';
import {
  getManifest,
  isProviderSupported,
  generateToolsFromManifest,
  getToolSummary,
  registerGeneratedTools,
} from '../providers/index.js';
import type { AccessLevel } from '../providers/index.js';

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

  // Skill discovery tools - always register
  // These help Claude find the right workflow for automation tasks
  server.tool(
    'get_skill_catalog',
    'Get available automation workflows and their intents. Call this FIRST when user asks about business tasks like managing spreadsheets, tracking data, web scraping, scheduling, or any workflow automation.',
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
          content: [
            {
              type: 'text' as const,
              text: catalog || 'No skills available.',
            },
          ],
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
    'Get detailed instructions for a specific automation workflow. Call this after identifying the right skill from the catalog.',
    { slug: z.string().describe('Skill slug from the catalog') },
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

  /**
   * create_skill tool - Create or update a skill
   *
   * SYNC: When updating params, see docs/architecture/SKILL_CREATION.md
   * for the full list of files that must be updated together.
   */
  server.tool(
    'create_skill',
    `Create or update a reusable skill (workflow template).

WHEN TO USE: When user says "create a skill", "save this as a skill", "build a skill", "turn this into a skill", "automate this", "automate [task]", or describes a repeatable workflow they want to save.

SKILL FORMAT (YAML frontmatter + markdown instructions):
\`\`\`markdown
---
name: [3-100 chars, action-oriented]
description: [10-500 chars, one sentence]
category: [Sourcing|Outreach|Screening|Interview|Analytics|Productivity|Admin]
intent: [optional - phrases that trigger this skill]
capabilities: [optional - list of things it can do]
requires: [optional - integrations needed]
  ats: read-only|read-write
  email: read-only|read-write
  calendar: read-only|read-write
---

# [Skill Name]

[Instructions - clear steps for how the skill works, 50+ chars]
\`\`\`

REQUIRED FIELDS: name, description, instructions (the markdown body)
OPTIONAL FIELDS: category, intent, capabilities, requires

PROCESS:
1. Extract details from user's description (name, purpose, steps, integrations)
2. If missing required fields, ask for just what's missing
3. Generate the skill markdown with YAML frontmatter
4. Show preview and confirm before saving
5. Ask if they want scheduling (cron)

CRON PATTERNS:
- "0 9 * * *" = Daily at 9am
- "0 9 * * 1" = Every Monday at 9am
- "0 9 * * 1-5" = Weekdays at 9am
- "0 0 1 * *" = First of each month

If scheduled, results are emailed to the user automatically.`,
    {
      content: z.string().describe('Full skill markdown with YAML frontmatter. Must include name, description in frontmatter and instructions in body.'),
      force: z.boolean().optional().describe('If true, overwrite existing skill with same slug. Use when updating an existing skill.'),
      cron: z.string().optional().describe('Cron expression to schedule automatic runs (e.g., "0 9 * * 1" for Mondays at 9am). Results emailed to user.'),
    },
    async (args) => {
      try {
        const skill = await client.createSkill(args.content, args.force, args.cron);
        const cronMsg = args.cron ? `\nScheduled: ${args.cron}` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Skill "${skill.name}" created successfully.\nSlug: ${skill.slug}${cronMsg}\nView at: /skills/${skill.slug}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error creating skill: ${message}` }],
          isError: true,
        };
      }
    }
  );
  registeredTools.push('create_skill');

  // ATS tools - only if ATS is connected
  if (profile.hasATS) {
    const atsProvider = profile.atsProvider || 'zoho-recruit';
    const atsAccess: AccessLevel = profile.effectiveAccess?.ats || 'read-write';

    // Use dynamic tools if provider has a manifest
    if (isProviderSupported(atsProvider)) {
      const manifest = getManifest(atsProvider);
      if (manifest) {
        const tools = generateToolsFromManifest(manifest, atsAccess);
        const toolNames = registerGeneratedTools(server, tools, client);
        registeredTools.push(...toolNames);

        const summary = getToolSummary(manifest, atsAccess);
        log.info(
          `Dynamic ATS tools registered: ${toolNames.length} tools ` +
          `(provider: ${atsProvider}, access: ${atsAccess}, ` +
          `read: ${summary.read}, write: ${summary.write}, filtered: ${summary.filtered})`
        );
      }
    } else {
      // Fallback to static generic tools
      registerAtsTools(server, client);
      registeredTools.push('search_ats_candidates', 'get_ats_candidate', 'create_ats_candidate', 'update_ats_candidate');
      log.info(`Static ATS tools registered (provider: ${atsProvider} not supported for dynamic tools)`);
    }
  } else {
    log.info('ATS tools not registered (no ATS integration connected)');
  }

  // Scrape tools - always available (but require browser extension to work)
  registerScrapeTools(server, client);
  registeredTools.push('create_scrape_task', 'get_scrape_task', 'scrape_url');
  log.info('Scrape tools registered');

  // Email tools - only if email is connected
  if (profile.hasEmail) {
    // Note: canSendEmail flag should come from capability profile
    // For now, we pass true as default since the profile doesn't have this flag yet
    // The API will still enforce canSendEmail from the server-side capability profile
    registerEmailTools(server, client, true);
    registeredTools.push('get_email_profile', 'search_emails', 'list_email_drafts', 'draft_email', 'send_email');
    log.info('Email tools registered');
  } else {
    log.info('Email tools not registered (no email integration connected)');
  }

  // Calendar tools - only if calendar is connected
  if (profile.hasCalendar) {
    const calendarProvider = profile.calendarProvider || 'calendly';
    const calendarAccess: AccessLevel = profile.effectiveAccess?.calendar || 'read-write';

    // Use dynamic tools if provider has a manifest
    if (isProviderSupported(calendarProvider)) {
      const manifest = getManifest(calendarProvider);
      if (manifest) {
        const tools = generateToolsFromManifest(manifest, calendarAccess);
        const toolNames = registerGeneratedTools(server, tools, client);
        registeredTools.push(...toolNames);

        const summary = getToolSummary(manifest, calendarAccess);
        log.info(
          `Dynamic Calendar tools registered: ${toolNames.length} tools ` +
          `(provider: ${calendarProvider}, access: ${calendarAccess}, ` +
          `read: ${summary.read}, write: ${summary.write}, filtered: ${summary.filtered})`
        );
      }
    } else {
      log.info(`Calendar tools not registered (provider: ${calendarProvider} not supported for dynamic tools)`);
    }
  } else {
    log.info('Calendar tools not registered (no calendar integration connected)');
  }

  // Database tools (Airtable) - only if connected
  if (profile.hasAirtable) {
    const dataProvider = profile.airtableProvider || 'airtable';
    const dataAccess: AccessLevel = profile.effectiveAccess?.database || 'read-write';

    // Use dynamic tools if provider has a manifest
    if (isProviderSupported(dataProvider)) {
      const manifest = getManifest(dataProvider);
      if (manifest) {
        const tools = generateToolsFromManifest(manifest, dataAccess);
        const toolNames = registerGeneratedTools(server, tools, client);
        registeredTools.push(...toolNames);

        const summary = getToolSummary(manifest, dataAccess);
        log.info(
          `Dynamic Data tools registered: ${toolNames.length} tools ` +
          `(provider: ${dataProvider}, access: ${dataAccess}, ` +
          `read: ${summary.read}, write: ${summary.write}, filtered: ${summary.filtered})`
        );
      }
    } else {
      log.info(`Data tools not registered (provider: ${dataProvider} not supported for dynamic tools)`);
    }
  } else {
    log.info('Data tools not registered (no data integration connected)');
  }

  // Database tools - only for super admins
  if (profile.isSuperAdmin) {
    registerDatabaseTools(server, client);
    registeredTools.push('list_database_tables', 'get_table_schema', 'query_database', 'get_database_stats');
    log.info('Database tools registered (super admin)');
  }

  // Google Sheets tools - only if Google Sheets is connected
  if (profile.hasGoogleSheets) {
    const sheetsTools = await registerSheetsTools(server, client);
    registeredTools.push(...sheetsTools);
    log.info(`Google Sheets tools registered: ${sheetsTools.length} tools`);
  } else {
    log.info('Google Sheets tools not registered (no Google Sheets integration connected)');
  }

  // Google Workspace tools - register based on connection status
  const googleWorkspaceTools: Array<{ flag: boolean | undefined; provider: string; name: string }> = [
    { flag: profile.hasGoogleDrive, provider: 'google-drive', name: 'Google Drive' },
    { flag: profile.hasGoogleDocs, provider: 'google-docs', name: 'Google Docs' },
    { flag: profile.hasGoogleForms, provider: 'google-forms', name: 'Google Forms' },
    { flag: profile.hasGoogleContacts, provider: 'google-contacts', name: 'Google Contacts' },
    { flag: profile.hasGoogleTasks, provider: 'google-tasks', name: 'Google Tasks' },
  ];

  const databaseAccess: AccessLevel = profile.effectiveAccess?.database || 'read-write';

  for (const { flag, provider, name } of googleWorkspaceTools) {
    if (flag) {
      if (isProviderSupported(provider)) {
        const manifest = getManifest(provider);
        if (manifest) {
          const tools = generateToolsFromManifest(manifest, databaseAccess);
          const toolNames = registerGeneratedTools(server, tools, client);
          registeredTools.push(...toolNames);

          const summary = getToolSummary(manifest, databaseAccess);
          log.info(
            `${name} tools registered: ${toolNames.length} tools ` +
            `(access: ${databaseAccess}, read: ${summary.read}, write: ${summary.write}, filtered: ${summary.filtered})`
          );
        }
      } else {
        log.info(`${name} tools not registered (provider not supported for dynamic tools)`);
      }
    } else {
      log.info(`${name} tools not registered (not connected)`);
    }
  }

  log.info(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
}
