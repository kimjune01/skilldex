/**
 * MCP Resources for Skillomatic skills.
 * Skills are exposed as readable resources (prompts/context) that Claude can read.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient, SkillPublic } from './api-client.js';

/**
 * Register skill resources with the MCP server.
 *
 * Resources:
 * - skillomatic://skills - List all available skills
 * - skillomatic://skills/{slug} - Get specific skill content (rendered with credentials)
 */
export function registerResources(server: McpServer, client: SkillomaticClient): void {
  // Resource template for individual skills
  server.resource(
    'skillomatic://skills/{slug}',
    'Get Skillomatic skill instructions by slug',
    async (uri) => {
      // Extract slug from URI: skillomatic://skills/linkedin-lookup -> linkedin-lookup
      const slug = uri.pathname.split('/').pop();
      if (!slug) {
        throw new Error('Invalid skill URI: missing slug');
      }

      try {
        const skill = await client.getRenderedSkill(slug);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/markdown',
              text: formatSkillContent(skill),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch skill '${slug}': ${message}`);
      }
    }
  );

  // List resource for all skills
  server.resource(
    'skillomatic://skills',
    'List all available Skillomatic skills',
    async () => {
      try {
        const skills = await client.getSkills();
        const enabledSkills = skills.filter(s => s.isEnabled);

        return {
          contents: [
            {
              uri: 'skillomatic://skills',
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  skills: enabledSkills.map(s => ({
                    slug: s.slug,
                    name: s.name,
                    description: s.description,
                    category: s.category,
                    intent: s.intent,
                    capabilities: s.capabilities,
                    uri: `skillomatic://skills/${s.slug}`,
                  })),
                  count: enabledSkills.length,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch skills: ${message}`);
      }
    }
  );
}

/**
 * Format a skill into readable content for the LLM.
 */
function formatSkillContent(skill: SkillPublic & { instructions?: string }): string {
  const parts: string[] = [];

  // Header
  parts.push(`# ${skill.name}`);
  parts.push('');
  parts.push(skill.description);
  parts.push('');

  // Metadata
  parts.push('## Skill Info');
  parts.push(`- **Category:** ${skill.category}`);
  parts.push(`- **Version:** ${skill.version}`);

  if (skill.intent) {
    parts.push(`- **Intent:** ${skill.intent}`);
  }

  if (skill.capabilities.length > 0) {
    parts.push('');
    parts.push('## Capabilities');
    for (const cap of skill.capabilities) {
      parts.push(`- ${cap}`);
    }
  }

  if (skill.requiredIntegrations.length > 0) {
    parts.push('');
    parts.push('## Required Integrations');
    for (const integration of skill.requiredIntegrations) {
      parts.push(`- ${integration}`);
    }
  }

  // Instructions (the main content)
  if (skill.instructions) {
    parts.push('');
    parts.push('## Instructions');
    parts.push('');
    parts.push(skill.instructions);
  }

  return parts.join('\n');
}
