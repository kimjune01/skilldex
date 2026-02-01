/**
 * Skills Client for Ephemeral Architecture
 *
 * Provides methods to fetch skills and rendered skill content from the API.
 * Skill metadata is cached, but rendered skills (with credentials) are NOT cached
 * to ensure credentials don't persist beyond the session.
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md
 */

import type { SkillPublic } from '@skillomatic/shared';
import { parseLLMConfigFromSkill, type LLMConfig } from './llm-client';

const API_BASE = import.meta.env.VITE_API_URL;

// Cache for skill metadata (Level 1 - no secrets)
let metadataCache: SkillPublic[] | null = null;
let metadataCacheTime = 0;
const METADATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Rendered skill response from API
 */
export interface RenderedSkill extends SkillPublic {
  rendered: true;
  instructions: string;
}

/**
 * Config skill response from API
 */
export interface ConfigSkill {
  slug: '_config';
  name: string;
  rendered: true;
  instructions: string;
  profile: {
    hasLLM: boolean;
    hasATS: boolean;
    hasCalendar: boolean;
    hasEmail: boolean;
    hasAirtable?: boolean;
    hasGoogleSheets?: boolean;
    hasGoogleDrive?: boolean;
    hasGoogleDocs?: boolean;
    hasGoogleForms?: boolean;
    hasGoogleContacts?: boolean;
    hasGoogleTasks?: boolean;
    hasGoogleCalendar?: boolean;
    isSuperAdmin?: boolean;
    llmProvider?: string;
    atsProvider?: string;
    calendarProvider?: string;
    emailProvider?: string;
  };
}

/**
 * Make authenticated API request
 */
async function request<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch skill metadata (Level 1 - cached)
 * @param forceRefresh - Force refresh the cache
 * @param includeAccess - Include access info (permissions status)
 */
export async function fetchSkillMetadata(forceRefresh = false, includeAccess = false): Promise<SkillPublic[]> {
  const now = Date.now();

  // Only use cache if not requesting access info (access info can change with integration status)
  if (!forceRefresh && !includeAccess && metadataCache && now - metadataCacheTime < METADATA_CACHE_TTL) {
    return metadataCache;
  }

  const endpoint = includeAccess ? '/skills?includeAccess=true' : '/skills';
  const skills = await request<SkillPublic[]>(endpoint);

  // Only cache non-access requests (access info should always be fresh)
  if (!includeAccess) {
    metadataCache = skills;
    metadataCacheTime = now;
  }

  return skills;
}

/**
 * Clear the metadata cache
 */
export function clearMetadataCache(): void {
  metadataCache = null;
  metadataCacheTime = 0;
}

/**
 * Load rendered skill with credentials (Level 2 - NOT cached)
 */
export async function loadRenderedSkill(slug: string): Promise<RenderedSkill> {
  return request<RenderedSkill>(`/skills/${slug}/rendered`);
}

/**
 * Load the _config skill containing all credentials
 */
export async function loadConfigSkill(): Promise<ConfigSkill> {
  return request<ConfigSkill>('/skills/config');
}

/**
 * Extract LLM config from the _config skill
 */
export async function getLLMConfig(): Promise<LLMConfig | null> {
  try {
    const configSkill = await loadConfigSkill();
    return parseLLMConfigFromSkill(configSkill.instructions);
  } catch (error) {
    console.error('Failed to load LLM config:', error);
    return null;
  }
}

/**
 * Check if user has a specific capability
 */
export async function checkCapability(
  capability: 'llm' | 'ats' | 'calendar' | 'email'
): Promise<boolean> {
  try {
    const configSkill = await loadConfigSkill();
    switch (capability) {
      case 'llm':
        return configSkill.profile.hasLLM;
      case 'ats':
        return configSkill.profile.hasATS;
      case 'calendar':
        return configSkill.profile.hasCalendar;
      case 'email':
        return configSkill.profile.hasEmail;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Check if a skill is executable based on its access info
 */
export function isSkillExecutable(skill: SkillPublic): boolean {
  // Disabled skills are not executable
  if (!skill.isEnabled) return false;

  // If no access info, assume executable (backwards compatibility)
  if (!skill.accessInfo) return true;

  // Only 'available' status skills are fully executable
  // 'limited' and 'disabled' statuses mean the skill can't be executed
  return skill.accessInfo.status === 'available';
}

/**
 * Build system prompt from skill metadata
 * This mirrors the server-side buildSkillsPromptSection function
 * Only includes skills that are fully executable (not limited or disabled)
 */
export function buildSkillsPromptSection(skillsMetadata: SkillPublic[]): string {
  // Filter to only executable skills
  const executableSkills = skillsMetadata.filter(isSkillExecutable);

  if (executableSkills.length === 0) {
    return 'No skills are currently available.';
  }

  const skillsList = executableSkills
    .map((s) => {
      let entry = `- **${s.slug}**: ${s.description}`;
      if (s.intent) {
        entry += `\n  - *Use when*: ${s.intent}`;
      }
      return entry;
    })
    .join('\n');

  return `## Available Skills

The following skills are available. To use a skill, first load its full instructions with the load_skill action, then follow those instructions.

${skillsList}

### How to Use Skills

1. When a user's request matches a skill's intent, use \`load_skill\` to get full instructions:
   \`\`\`action
   {"action": "load_skill", "slug": "skill-slug-here"}
   \`\`\`

2. The system will return the skill's full instructions
3. Follow those instructions to complete the task (may involve additional actions like \`scrape_url\`)`;
}

/**
 * Build the full system prompt for client-side chat
 *
 * Note: The web chat uses action blocks (not native tool calling) because
 * the LLM client streams text directly. MCP handles tool execution.
 */
export async function buildSystemPrompt(): Promise<string> {
  // Fetch with access info to properly filter limited/disabled skills
  const metadata = await fetchSkillMetadata(false, true);
  const skillsSection = buildSkillsPromptSection(metadata);

  return `You are a helpful assistant with access to various skills and tools.

${skillsSection}

## Action Execution

When you need to perform an action, output it in this EXACT format:

\`\`\`action
{"action": "tool_name", "param1": "value1"}
\`\`\`

The system will execute the action and return the result. Then continue your response based on the result.

**Important:** Never make up data. Always use an action to fetch real information first.

## Common Actions

- \`scrape_url\` - Scrape content from a URL. Params: url
- \`load_skill\` - Load a skill's instructions. Params: slug
- \`submit_skill\` - Create a new skill. Params: content (markdown with YAML frontmatter)

## Example

User: "scrape https://example.com"

Response:
I'll scrape that page for you.

\`\`\`action
{"action": "scrape_url", "url": "https://example.com"}
\`\`\``;
}
