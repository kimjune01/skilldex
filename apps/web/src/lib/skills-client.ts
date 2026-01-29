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
      if (s.capabilities && s.capabilities.length > 0) {
        entry += `\n  - *Can*: ${s.capabilities.join(', ')}`;
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
 */
export async function buildSystemPrompt(): Promise<string> {
  // Fetch with access info to properly filter limited/disabled skills
  const metadata = await fetchSkillMetadata(false, true);
  const skillsSection = buildSkillsPromptSection(metadata);

  return `You are a recruiting assistant with access to various skills for sourcing candidates, managing applications, and scheduling interviews.

${skillsSection}

## CRITICAL: Action Execution

You CANNOT access external websites, databases, or APIs directly. You MUST use action blocks to perform any operations.

**NEVER hallucinate or make up data.** If you need information from a URL or database, you MUST execute an action first and wait for the result.

When you need to perform an action, output it in this EXACT format:

\`\`\`action
{"action": "action_name", "param1": "value1"}
\`\`\`

The system will execute the action and return the result. You will then see the actual data and can respond based on it.

## Available Actions

- \`load_skill\` - Load a skill's full instructions
- \`create_skill\` - Create or update a skill. Params: content (markdown with YAML frontmatter), force (optional, set true to overwrite existing)
- \`search_candidates\` - Search ATS for candidates
- \`get_candidate\` - Get candidate details
- \`create_candidate\` - Create a new candidate
- \`update_candidate\` - Update candidate information
- \`delete_candidate\` - Delete/remove a candidate from ATS
- \`list_jobs\` - List open jobs
- \`get_job\` - Get job details
- \`scrape_url\` - Scrape content from a URL (LinkedIn profiles, job postings, etc.)
- \`update_application_stage\` - Move candidate through pipeline

## Example: Scraping a LinkedIn Profile

User: "scrape linkedin https://www.linkedin.com/in/someone"

You should respond with:
"I'll scrape that LinkedIn profile for you."

\`\`\`action
{"action": "scrape_url", "url": "https://www.linkedin.com/in/someone"}
\`\`\`

Then STOP and wait for the result. Do NOT make up profile information.

## Important Rules

1. Always use action blocks - never pretend you already have data
2. Wait for action results before summarizing information
3. If an action fails, explain the error to the user
4. Be concise - let the action results speak for themselves`;
}
