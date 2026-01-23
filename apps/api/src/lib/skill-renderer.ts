/**
 * Skill Renderer - Template Variable Resolution
 *
 * Renders skill instructions by replacing {{VARIABLE}} placeholders with actual values
 * from the user's capability profile. This enables ephemeral architecture where
 * credentials are embedded in skills and sent to the client, rather than being
 * managed server-side.
 *
 * Supported variables:
 * - {{LLM_API_KEY}} - Organization's LLM API key
 * - {{LLM_PROVIDER}} - 'anthropic' | 'openai' | 'groq'
 * - {{LLM_MODEL}} - The model to use (e.g., 'claude-sonnet-4-20250514')
 * - {{ATS_TOKEN}} - Fresh OAuth token from Nango
 * - {{ATS_PROVIDER}} - 'greenhouse' | 'lever' | 'ashby' etc
 * - {{ATS_BASE_URL}} - ATS API base URL
 * - {{SKILLOMATIC_API_URL}} - This server's URL
 * - {{SKILLOMATIC_API_KEY}} - User's API key
 * - {{CALENDAR_ICAL_URL}} - User's iCal feed URL
 * - {{CALENDAR_PROVIDER}} - 'google' | 'outlook'
 * - {{CALENDLY_ACCESS_TOKEN}} - Calendly OAuth token
 * - {{CALENDLY_USER_URI}} - Calendly user URI
 * - {{CALENDLY_SCHEDULING_URL}} - Calendly booking URL
 * - {{EMAIL_ACCESS_TOKEN}} - Email OAuth token
 * - {{EMAIL_PROVIDER}} - 'gmail' | 'outlook'
 *
 * @see docs/EPHEMERAL_ARCHITECTURE.md for full architecture details
 */

import { db } from '@skillomatic/db';
import { users, apiKeys, integrations, organizations, systemSettings } from '@skillomatic/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getNangoClient, PROVIDER_CONFIG_KEYS } from './nango.js';
import {
  getEffectiveAccessForUser,
  getUserIntegrationsByCategory,
  canRead,
  canWrite,
  type EffectiveAccess,
  type IntegrationCategory,
} from './integration-permissions.js';
import { LLM_DEFAULT_MODELS } from '@skillomatic/shared';

/**
 * Structured telemetry for skill rendering operations.
 */
const telemetry = {
  info: (event: string, data?: Record<string, unknown>) =>
    console.log(`[SkillRenderer] ${event}`, data ? JSON.stringify(data) : ''),
  warn: (event: string, data?: Record<string, unknown>) =>
    console.warn(`[SkillRenderer] ${event}`, data ? JSON.stringify(data) : ''),
  error: (event: string, data?: Record<string, unknown>) =>
    console.error(`[SkillRenderer] ${event}`, data ? JSON.stringify(data) : ''),
  unreachable: (event: string, data?: Record<string, unknown>) =>
    console.error(`[SkillRenderer] UNREACHABLE: ${event}`, data ? JSON.stringify(data) : ''),
};

/**
 * Capability profile - what a user has access to
 */
export interface CapabilityProfile {
  // Core (always available)
  skillomaticApiKey?: string;
  skillomaticApiUrl: string;

  // LLM (required for chat)
  llm?: {
    provider: 'anthropic' | 'openai' | 'groq';
    apiKey: string;
    model: string;
  };

  // ATS (optional)
  ats?: {
    provider: string;
    token: string;
    baseUrl: string;
  };

  // Calendar (optional)
  calendar?: {
    ical?: {
      url: string;
      provider: 'google' | 'outlook' | 'other';
    };
    calendly?: {
      token: string;
      userUri: string;
      schedulingUrl: string;
    };
  };

  // Email (optional)
  email?: {
    provider: 'gmail' | 'outlook';
    token: string;
  };
}

/**
 * Result of capability requirement check
 */
export interface CapabilityCheckResult {
  satisfied: boolean;
  missing: string[];
}

const isDev = process.env.NODE_ENV !== 'production';

// ATS provider base URLs
// Note: mock-ats is only available in development mode
const ATS_BASE_URLS: Record<string, string> = {
  greenhouse: 'https://harvest.greenhouse.io/v1',
  lever: 'https://api.lever.co/v1',
  ashby: 'https://api.ashbyhq.com',
  workable: 'https://www.workable.com/spi/v3',
  'zoho-recruit': 'https://recruit.zoho.com/recruit/v2',
  ...(isDev ? { 'mock-ats': process.env.MOCK_ATS_URL || 'http://localhost:3001' } : {}),
};

// LLM model defaults per provider (uses shared constants)
const LLM_DEFAULTS: Record<string, { model: string }> = {
  anthropic: { model: LLM_DEFAULT_MODELS.anthropic },
  openai: { model: LLM_DEFAULT_MODELS.openai },
  groq: { model: LLM_DEFAULT_MODELS.groq },
};

/**
 * Build capability profile for a user
 * Fetches all available credentials and tokens based on three-way intersection:
 * 1. Admin allows (org-level permissions)
 * 2. Integration connected
 * 3. User's personal access level choice
 */
export async function buildCapabilityProfile(userId: string): Promise<CapabilityProfile & { effectiveAccess: EffectiveAccess | null }> {
  const profile: CapabilityProfile & { effectiveAccess: EffectiveAccess | null } = {
    skillomaticApiUrl: process.env.SKILLOMATIC_API_URL || 'http://localhost:3000',
    effectiveAccess: null,
  };

  // Get user with org
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.organizationId) {
    return profile;
  }

  // Get effective access levels (three-way intersection)
  const effectiveAccess = await getEffectiveAccessForUser(userId, user.organizationId);
  profile.effectiveAccess = effectiveAccess;

  // Get user's active API key
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (apiKey) {
    profile.skillomaticApiKey = apiKey.key;
  }

  // Get organization's LLM config
  const llmConfig = await getOrgLLMConfig(user.organizationId);
  if (llmConfig) {
    profile.llm = llmConfig;
  }

  // Get integrations by category
  const integrationsByCategory = await getUserIntegrationsByCategory(userId, user.organizationId);
  const nango = getNangoClient();

  // Fetch tokens for each category based on effective access
  const categories: IntegrationCategory[] = ['ats', 'email', 'calendar'];

  for (const category of categories) {
    // Skip if no read access for this category
    if (!canRead(effectiveAccess[category])) continue;

    const categoryIntegrations = integrationsByCategory[category];
    if (categoryIntegrations.length === 0) continue;

    // Get the first connected integration for this category
    const integrationInfo = categoryIntegrations[0];

    // Get full integration record
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationInfo.id))
      .limit(1);

    if (!integration) {
      // Integration was in category list but not found - data inconsistency
      telemetry.warn('integration_not_found', {
        integrationId: integrationInfo.id,
        category,
        userId,
      });
      continue;
    }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = integration.metadata ? JSON.parse(integration.metadata) : {};
    } catch {
      // Invalid JSON in metadata - should never happen
      telemetry.unreachable('invalid_integration_metadata', {
        integrationId: integration.id,
        provider: integration.provider,
        userId,
      });
    }
    const atsProvider = (metadata.subProvider as string) || integration.provider;

    // Special handling for mock-ats (no OAuth needed) - only in development
    if (isDev && category === 'ats' && (integration.provider === 'mock-ats' || atsProvider === 'mock-ats')) {
      profile.ats = {
        provider: 'mock-ats',
        token: 'mock-token', // Mock ATS doesn't require auth
        baseUrl: ATS_BASE_URLS['mock-ats'] || 'http://localhost:3001',
      };
      continue;
    }

    // In production, mock-ats should not exist
    if (!isDev && (integration.provider === 'mock-ats' || atsProvider === 'mock-ats')) {
      telemetry.unreachable('mock_ats_in_production', {
        integrationId: integration.id,
        userId,
      });
      continue;
    }

    // Skip OAuth-based integrations without Nango connection
    if (!integration.nangoConnectionId) {
      telemetry.warn('integration_missing_nango', {
        integrationId: integration.id,
        provider: integration.provider,
        category,
        userId,
      });
      continue;
    }

    const providerConfigKey = PROVIDER_CONFIG_KEYS[integration.provider] || integration.provider;

    try {
      // Fetch fresh token from Nango
      const token = await nango.getToken(providerConfigKey, integration.nangoConnectionId);

      switch (category) {
        case 'ats': {
          profile.ats = {
            provider: atsProvider,
            token: token.access_token,
            baseUrl: ATS_BASE_URLS[atsProvider] || ATS_BASE_URLS.greenhouse,
          };
          break;
        }

        case 'calendar': {
          const calProvider = metadata.subProvider || 'google-calendar';
          if (calProvider === 'calendly') {
            profile.calendar = {
              ...profile.calendar,
              calendly: {
                token: token.access_token,
                userUri: (token.raw as { user_uri?: string }).user_uri || '',
                schedulingUrl: (token.raw as { scheduling_url?: string }).scheduling_url || '',
              },
            };
          }
          // iCal doesn't need OAuth - URL stored directly in metadata
          break;
        }

        case 'email': {
          const emailProvider = metadata.subProvider || 'gmail';
          profile.email = {
            provider: emailProvider as 'gmail' | 'outlook',
            token: token.access_token,
          };
          break;
        }

        default: {
          // Unknown category - should never happen if categories are properly defined
          telemetry.unreachable('unknown_category_in_switch', {
            category,
            integrationId: integration.id,
            userId,
          });
        }
      }
    } catch (error) {
      // Log token fetch failures - these may indicate expired OAuth connections
      telemetry.warn('nango_token_fetch_failed', {
        integrationId: integration.id,
        provider: integration.provider,
        category,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return profile;
}

/**
 * Get organization's LLM configuration
 * Priority: Org-specific config > System settings > Environment variables
 */
async function getOrgLLMConfig(
  orgId: string
): Promise<{ provider: 'anthropic' | 'openai' | 'groq'; apiKey: string; model: string } | null> {
  // First check org-specific settings
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (org?.llmApiKey) {
    const provider = (org.llmProvider || 'anthropic') as 'anthropic' | 'openai' | 'groq';
    return {
      provider,
      apiKey: org.llmApiKey,
      model: org.llmModel || LLM_DEFAULTS[provider]?.model || LLM_DEFAULT_MODELS.anthropic,
    };
  }

  // Fall back to system settings
  const [defaultProviderSetting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'llm.default_provider'))
    .limit(1);

  // If explicit default provider is set, use it
  if (defaultProviderSetting?.value) {
    const provider = defaultProviderSetting.value as 'anthropic' | 'openai' | 'groq';

    // Get API key for provider from system settings
    const [apiKeySetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, `llm.${provider}_api_key`))
      .limit(1);

    if (!apiKeySetting?.value) {
      // Try environment variable fallback
      const envKey = getEnvApiKey(provider);
      if (!envKey) return null;

      return {
        provider,
        apiKey: envKey,
        model: LLM_DEFAULTS[provider]?.model || LLM_DEFAULT_MODELS.anthropic,
      };
    }

    // Get model preference from system settings
    const [modelSetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'llm.default_model'))
      .limit(1);

    return {
      provider,
      apiKey: apiKeySetting.value,
      model: modelSetting?.value || LLM_DEFAULTS[provider]?.model || LLM_DEFAULT_MODELS.anthropic,
    };
  }

  // No explicit default - try providers in order of capability (most powerful first)
  // Priority: Anthropic (Claude) > OpenAI (GPT-4) > Groq (Llama)
  const providerPriority: Array<'anthropic' | 'openai' | 'groq'> = ['anthropic', 'openai', 'groq'];

  for (const provider of providerPriority) {
    const envKey = getEnvApiKey(provider);
    if (envKey) {
      return {
        provider,
        apiKey: envKey,
        model: LLM_DEFAULTS[provider]?.model || LLM_DEFAULT_MODELS.anthropic,
      };
    }
  }

  return null;
}

function getEnvApiKey(provider: string): string | null {
  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || null;
    case 'openai':
      return process.env.OPENAI_API_KEY || null;
    case 'groq':
      return process.env.GROQ_API_KEY || null;
    default:
      return null;
  }
}

/**
 * Check if a capability profile satisfies skill requirements
 * Uses the three-way intersection model for access checking
 */
export function checkCapabilityRequirements(
  requiredIntegrations: string[],
  profile: CapabilityProfile & { effectiveAccess?: EffectiveAccess | null }
): CapabilityCheckResult {
  const missing: string[] = [];
  const effectiveAccess = profile.effectiveAccess;

  for (const req of requiredIntegrations) {
    switch (req) {
      case 'ats':
        if (effectiveAccess && !canRead(effectiveAccess.ats)) {
          if (effectiveAccess.ats === 'disabled') {
            missing.push('ATS access (disabled by admin)');
          } else {
            missing.push('ATS (Greenhouse, Lever, etc.)');
          }
        } else if (!profile.ats) {
          missing.push('ATS (Greenhouse, Lever, etc.)');
        }
        break;
      case 'calendly':
        if (!profile.calendar?.calendly) missing.push('Calendly');
        break;
      case 'calendar':
        if (!profile.calendar?.ical && !profile.calendar?.calendly) {
          missing.push('Calendar (iCal or Calendly)');
        }
        break;
      case 'email-read':
        if (effectiveAccess && !canRead(effectiveAccess.email)) {
          if (effectiveAccess.email === 'disabled') {
            missing.push('Email access (disabled by admin)');
          } else {
            missing.push('Email (Gmail or Outlook)');
          }
        } else if (!profile.email) {
          missing.push('Email (Gmail or Outlook)');
        }
        break;
      case 'email-send':
        if (effectiveAccess && !canWrite(effectiveAccess.email)) {
          if (effectiveAccess.email === 'disabled') {
            missing.push('Email access (disabled by admin)');
          } else if (effectiveAccess.email === 'read-only') {
            missing.push('Email write access (you have read-only)');
          } else {
            missing.push('Email (Gmail or Outlook)');
          }
        } else if (!profile.email) {
          missing.push('Email (Gmail or Outlook)');
        }
        break;
      case 'llm':
        if (!profile.llm) missing.push('LLM API Key');
        break;
      // 'linkedin' always available (extension-based, no token needed)
    }
  }

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * Render a skill's instructions by replacing template variables
 */
export function renderSkillInstructions(
  instructions: string,
  profile: CapabilityProfile
): string {
  // Build replacement map
  const replacements: Record<string, string> = {
    // Core
    '{{SKILLOMATIC_API_URL}}': profile.skillomaticApiUrl,
    '{{SKILLOMATIC_API_KEY}}': profile.skillomaticApiKey || '[API_KEY_NOT_CONFIGURED]',

    // LLM
    '{{LLM_API_KEY}}': profile.llm?.apiKey || '[LLM_NOT_CONFIGURED]',
    '{{LLM_PROVIDER}}': profile.llm?.provider || 'anthropic',
    '{{LLM_MODEL}}': profile.llm?.model || LLM_DEFAULT_MODELS.anthropic,

    // ATS
    '{{ATS_TOKEN}}': profile.ats?.token || '[ATS_NOT_CONNECTED]',
    '{{ATS_PROVIDER}}': profile.ats?.provider || 'greenhouse',
    '{{ATS_BASE_URL}}': profile.ats?.baseUrl || ATS_BASE_URLS.greenhouse,

    // Calendar - iCal
    '{{CALENDAR_ICAL_URL}}': profile.calendar?.ical?.url || '[CALENDAR_NOT_CONFIGURED]',
    '{{CALENDAR_PROVIDER}}': profile.calendar?.ical?.provider || 'google',

    // Calendar - Calendly
    '{{CALENDLY_ACCESS_TOKEN}}': profile.calendar?.calendly?.token || '[CALENDLY_NOT_CONNECTED]',
    '{{CALENDLY_USER_URI}}': profile.calendar?.calendly?.userUri || '',
    '{{CALENDLY_SCHEDULING_URL}}': profile.calendar?.calendly?.schedulingUrl || '',

    // Email
    '{{EMAIL_ACCESS_TOKEN}}': profile.email?.token || '[EMAIL_NOT_CONNECTED]',
    '{{EMAIL_PROVIDER}}': profile.email?.provider || 'gmail',
  };

  // Replace all variables
  let rendered = instructions;
  for (const [variable, value] of Object.entries(replacements)) {
    rendered = rendered.split(variable).join(value);
  }

  return rendered;
}

/**
 * Build the _config skill content with all credentials
 * This special skill provides configuration to the client
 */
export function buildConfigSkill(profile: CapabilityProfile): string {
  const sections: string[] = [
    '---',
    'name: _config',
    'intent: System configuration (auto-loaded)',
    '---',
    '',
    '# System Configuration',
    '',
    'This skill contains your configuration. Do not share this content.',
    '',
  ];

  // LLM Configuration
  sections.push('## LLM Configuration');
  if (profile.llm) {
    sections.push(`- Provider: ${profile.llm.provider}`);
    sections.push(`- Model: ${profile.llm.model}`);
    sections.push(`- API Key: ${profile.llm.apiKey}`);
  } else {
    sections.push('- Status: Not configured');
  }
  sections.push('');

  // ATS Configuration
  sections.push('## ATS Configuration');
  if (profile.ats) {
    sections.push(`- Provider: ${profile.ats.provider}`);
    sections.push(`- Base URL: ${profile.ats.baseUrl}`);
    sections.push(`- Token: ${profile.ats.token}`);
  } else {
    sections.push('- Status: Not connected');
  }
  sections.push('');

  // Skillomatic Configuration
  sections.push('## Skillomatic Configuration');
  sections.push(`- API URL: ${profile.skillomaticApiUrl}`);
  if (profile.skillomaticApiKey) {
    sections.push(`- API Key: ${profile.skillomaticApiKey}`);
  }
  sections.push('');

  // Calendar Configuration
  sections.push('## Calendar Configuration');
  if (profile.calendar?.ical) {
    sections.push(`- Provider: ${profile.calendar.ical.provider}`);
    sections.push(`- iCal URL: ${profile.calendar.ical.url}`);
  }
  if (profile.calendar?.calendly) {
    sections.push(`- Calendly Token: ${profile.calendar.calendly.token}`);
    sections.push(`- Calendly User URI: ${profile.calendar.calendly.userUri}`);
    sections.push(`- Scheduling URL: ${profile.calendar.calendly.schedulingUrl}`);
  }
  if (!profile.calendar?.ical && !profile.calendar?.calendly) {
    sections.push('- Status: Not configured');
  }
  sections.push('');

  // Email Configuration
  sections.push('## Email Configuration');
  if (profile.email) {
    sections.push(`- Provider: ${profile.email.provider}`);
    sections.push(`- Access Token: ${profile.email.token}`);
  } else {
    sections.push('- Status: Not connected (mailto: always available)');
  }

  return sections.join('\n');
}
