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
    llmProvider?: string;
    atsProvider?: string;
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
 */
export async function fetchSkillMetadata(forceRefresh = false): Promise<SkillPublic[]> {
  const now = Date.now();

  if (!forceRefresh && metadataCache && now - metadataCacheTime < METADATA_CACHE_TTL) {
    return metadataCache;
  }

  const skills = await request<SkillPublic[]>('/skills');
  metadataCache = skills;
  metadataCacheTime = now;

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
 * Build system prompt from skill metadata
 * This mirrors the server-side buildSkillsPromptSection function
 */
export function buildSkillsPromptSection(skillsMetadata: SkillPublic[]): string {
  if (skillsMetadata.length === 0) {
    return 'No skills are currently available.';
  }

  const skillsList = skillsMetadata
    .filter((s) => s.isEnabled)
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
  const metadata = await fetchSkillMetadata();
  const skillsSection = buildSkillsPromptSection(metadata);

  return `You are a recruiting assistant with access to various skills for sourcing candidates, managing applications, and scheduling interviews.

${skillsSection}

## Action Format

When you need to perform an action, output it in this format:

\`\`\`action
{"action": "action_name", "param1": "value1", ...}
\`\`\`

The system will execute the action and return the result. You can then continue the conversation based on the result.

## Available Actions

- \`load_skill\` - Load a skill's full instructions
- \`search_candidates\` - Search ATS for candidates
- \`get_candidate\` - Get candidate details
- \`create_candidate\` - Create a new candidate
- \`update_candidate\` - Update candidate information
- \`list_jobs\` - List open jobs
- \`get_job\` - Get job details
- \`scrape_url\` - Scrape content from a URL
- \`update_application_stage\` - Move candidate through pipeline

Always explain what you're doing and why before executing actions.`;
}
