/**
 * Provider Registry - Single Source of Truth
 *
 * Central configuration for all integrations. Used by API, frontend, and MCP server.
 * Adding a new provider only requires adding an entry here + creating a manifest.
 */

// ============ Types ============

export type IntegrationCategory = 'ats' | 'email' | 'calendar' | 'database' | 'scheduling';
export type AuthType = 'bearer' | 'basic' | 'api-key';
export type OAuthFlow = 'nango' | 'google-direct' | 'none';

export interface ProviderConfig {
  /** Unique identifier (e.g., 'greenhouse', 'gmail', 'calendly') */
  id: string;

  /** Display name for UI (e.g., 'Greenhouse', 'Gmail', 'Calendly') */
  displayName: string;

  /** Integration category for permissions */
  category: IntegrationCategory;

  /** OAuth flow type */
  oauthFlow: OAuthFlow;

  /** Nango provider config key (if different from id) */
  nangoKey?: string;

  /** API base URL */
  apiBaseUrl: string;

  /** Authentication configuration */
  apiAuth: {
    type: AuthType;
    /** Header name for api-key auth */
    headerName?: string;
  };

  /** Rate limiting */
  rateLimit?: {
    requests: number;
    windowSeconds: number;
  };

  /** Paths that should never be proxied (security) */
  blockedPaths?: RegExp[];

  /** Sort order in UI (lower = first) */
  order?: number;

  /** Only available in development */
  devOnly?: boolean;

  /** Has MCP manifest with tool operations */
  hasManifest?: boolean;
}

// ============ Provider Registry ============

// Note: isDev is determined at runtime. In browser, defaults to false.
// In Node, checks NODE_ENV. This avoids direct process.env access for browser compatibility.
let isDev = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDev = (globalThis as any).process?.env?.NODE_ENV !== 'production';
} catch {
  isDev = false;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  // ==================== ATS ====================
  greenhouse: {
    id: 'greenhouse',
    displayName: 'Greenhouse',
    category: 'ats',
    oauthFlow: 'nango',
    nangoKey: 'greenhouse',
    apiBaseUrl: 'https://harvest.greenhouse.io/v1',
    apiAuth: { type: 'basic' },
    rateLimit: { requests: 50, windowSeconds: 10 },
    blockedPaths: [
      /^\/users/i,
      /^\/user_roles/i,
      /^\/custom_fields/i,
      /^\/webhooks/i,
      /^\/tracking_links/i,
      /^\/eeoc/i,
      /^\/demographics/i,
    ],
    order: 1,
    hasManifest: true,
  },

  'zoho-recruit': {
    id: 'zoho-recruit',
    displayName: 'Zoho Recruit',
    category: 'ats',
    oauthFlow: 'nango',
    nangoKey: 'zoho-recruit',
    apiBaseUrl: 'https://recruit.zoho.com/recruit/v2',
    apiAuth: { type: 'bearer' },
    blockedPaths: [
      /^\/settings/i,
      /^\/org/i,
      /^\/users/i,
      /^\/.*__schedule_mass_delete/i,
    ],
    order: 2,
    hasManifest: true,
  },

  lever: {
    id: 'lever',
    displayName: 'Lever',
    category: 'ats',
    oauthFlow: 'nango',
    nangoKey: 'lever',
    apiBaseUrl: 'https://api.lever.co/v1',
    apiAuth: { type: 'bearer' },
    order: 3,
  },

  ashby: {
    id: 'ashby',
    displayName: 'Ashby',
    category: 'ats',
    oauthFlow: 'nango',
    nangoKey: 'ashby',
    apiBaseUrl: 'https://api.ashbyhq.com',
    apiAuth: { type: 'bearer' },
    order: 4,
  },

  workable: {
    id: 'workable',
    displayName: 'Workable',
    category: 'ats',
    oauthFlow: 'nango',
    nangoKey: 'workable',
    apiBaseUrl: 'https://www.workable.com/spi/v3',
    apiAuth: { type: 'bearer' },
    order: 5,
  },

  'mock-ats': {
    id: 'mock-ats',
    displayName: 'Mock ATS (Dev)',
    category: 'ats',
    oauthFlow: 'none',
    // Note: apiBaseUrl can be overridden at runtime via getMockAtsUrl()
    apiBaseUrl: 'http://localhost:3001',
    apiAuth: { type: 'bearer' },
    order: 0,
    devOnly: true,
    hasManifest: true,
  },

  // ==================== Email ====================
  gmail: {
    id: 'gmail',
    displayName: 'Gmail',
    category: 'email',
    oauthFlow: 'google-direct',
    nangoKey: 'google-mail',
    apiBaseUrl: 'https://www.googleapis.com/gmail/v1',
    apiAuth: { type: 'bearer' },
    order: 1,
  },

  outlook: {
    id: 'outlook',
    displayName: 'Outlook',
    category: 'email',
    oauthFlow: 'nango',
    nangoKey: 'outlook',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0/me',
    apiAuth: { type: 'bearer' },
    order: 2,
  },

  // ==================== Calendar ====================
  'google-calendar': {
    id: 'google-calendar',
    displayName: 'Google Calendar',
    category: 'calendar',
    oauthFlow: 'google-direct',
    nangoKey: 'google-calendar',
    apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
    apiAuth: { type: 'bearer' },
    blockedPaths: [/^\/users\/.*\/settings/i],
    order: 1,
  },

  calendly: {
    id: 'calendly',
    displayName: 'Calendly',
    category: 'calendar',
    oauthFlow: 'nango',
    nangoKey: 'calendly',
    apiBaseUrl: 'https://api.calendly.com',
    apiAuth: { type: 'bearer' },
    rateLimit: { requests: 100, windowSeconds: 60 },
    blockedPaths: [/^\/webhook_subscriptions/i, /^\/data_compliance/i],
    order: 2,
    hasManifest: true,
  },

  'outlook-calendar': {
    id: 'outlook-calendar',
    displayName: 'Outlook Calendar',
    category: 'calendar',
    oauthFlow: 'nango',
    nangoKey: 'outlook-calendar',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0/me/calendar',
    apiAuth: { type: 'bearer' },
    order: 3,
  },

  // ==================== Scheduling ====================
  'cal-com': {
    id: 'cal-com',
    displayName: 'Cal.com',
    category: 'scheduling',
    oauthFlow: 'nango',
    nangoKey: 'cal-com-v2',
    apiBaseUrl: 'https://api.cal.com/v2',
    apiAuth: { type: 'bearer' },
    order: 1,
  },

  // ==================== Database ====================
  airtable: {
    id: 'airtable',
    displayName: 'Airtable',
    category: 'database',
    oauthFlow: 'nango',
    nangoKey: 'airtable',
    apiBaseUrl: 'https://api.airtable.com/v0',
    apiAuth: { type: 'bearer' },
    rateLimit: { requests: 5, windowSeconds: 1 },
    blockedPaths: [/^\/enterprise/i],
    order: 1,
    hasManifest: true,
  },

  'google-sheets': {
    id: 'google-sheets',
    displayName: 'Google Sheets',
    category: 'database',
    oauthFlow: 'google-direct',
    apiBaseUrl: 'https://sheets.googleapis.com/v4',
    apiAuth: { type: 'bearer' },
    order: 2,
    hasManifest: true,
  },
};

// ============ Query Functions ============

/**
 * Get all providers, optionally filtered by category
 */
export function getProviders(options?: {
  category?: IntegrationCategory;
  includeDevOnly?: boolean;
}): ProviderConfig[] {
  const includeDevOnly = options?.includeDevOnly ?? isDev;

  return Object.values(PROVIDERS)
    .filter((p) => {
      if (p.devOnly && !includeDevOnly) return false;
      if (options?.category && p.category !== options.category) return false;
      return true;
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Get a specific provider by ID
 */
export function getProvider(id: string): ProviderConfig | undefined {
  const provider = PROVIDERS[id];
  if (!provider) return undefined;
  if (provider.devOnly && !isDev) return undefined;
  return provider;
}

/**
 * Check if a provider ID is valid and available
 */
export function isValidProvider(id: string): boolean {
  return getProvider(id) !== undefined;
}

/**
 * Get the Nango config key for a provider
 */
export function getNangoKey(providerId: string): string {
  return PROVIDERS[providerId]?.nangoKey ?? providerId;
}

/**
 * Get the category for a provider
 */
export function getProviderCategory(providerId: string): IntegrationCategory | null {
  return PROVIDERS[providerId]?.category ?? null;
}

/**
 * Get all provider IDs for a category
 */
export function getProviderIds(category: IntegrationCategory): string[] {
  return getProviders({ category }).map((p) => p.id);
}

/**
 * Get blocked paths for a provider
 */
export function getBlockedPaths(providerId: string): RegExp[] {
  return PROVIDERS[providerId]?.blockedPaths ?? [];
}

/**
 * Check if a path is blocked for a provider
 */
export function isPathBlocked(providerId: string, path: string): boolean {
  const patterns = getBlockedPaths(providerId);
  return patterns.some((pattern) => pattern.test(path));
}

/**
 * Build auth header for a provider.
 * Note: For 'basic' auth, caller must provide base64 encoding (browser-compatible).
 */
export function buildAuthHeader(
  providerId: string,
  token: string,
  /** For basic auth, provide pre-encoded base64 string, or use encodeBasicAuth helper */
  base64Encoder?: (str: string) => string
): Record<string, string> {
  const provider = PROVIDERS[providerId];
  if (!provider) return { Authorization: `Bearer ${token}` };

  switch (provider.apiAuth.type) {
    case 'basic': {
      // Use provided encoder or default to btoa (browser) or throw if unavailable
      const encode = base64Encoder || ((s: string) => {
        if (typeof btoa !== 'undefined') return btoa(s);
        throw new Error('base64Encoder required for basic auth in Node.js');
      });
      return {
        Authorization: `Basic ${encode(`${token}:`)}`,
      };
    }
    case 'api-key':
      return {
        [provider.apiAuth.headerName || 'X-Api-Key']: token,
      };
    case 'bearer':
    default:
      return { Authorization: `Bearer ${token}` };
  }
}

/**
 * Get API base URL for a provider
 */
export function getApiBaseUrl(providerId: string): string | undefined {
  return PROVIDERS[providerId]?.apiBaseUrl;
}

/**
 * Get all categories
 */
export function getAllCategories(): IntegrationCategory[] {
  return ['ats', 'email', 'calendar', 'database', 'scheduling'];
}

// ============ Individual Account Restrictions ============

/**
 * Integrations allowed for individual (free) accounts.
 * Organization accounts have access to all integrations.
 *
 * Individual accounts are limited to:
 * - Email (personal productivity)
 * - Calendar (scheduling)
 * - Google Sheets (basic data management)
 *
 * ATS and Airtable require an organization account.
 */
export const INDIVIDUAL_ALLOWED_PROVIDERS = [
  // Email
  'gmail',
  'outlook',
  // Calendar
  'google-calendar',
  'calendly',
  'outlook-calendar',
  // Database (only Google Sheets, NOT Airtable)
  'google-sheets',
  // Scheduling
  'cal-com',
] as const;

/**
 * Categories that individual accounts have FULL access to.
 * Note: 'database' is partially allowed (google-sheets only, not airtable)
 */
export const INDIVIDUAL_FULL_ACCESS_CATEGORIES: IntegrationCategory[] = ['email', 'calendar', 'scheduling'];

/**
 * Check if a provider is allowed for individual (free) accounts.
 */
export function isProviderAllowedForIndividual(providerId: string): boolean {
  return INDIVIDUAL_ALLOWED_PROVIDERS.includes(providerId as typeof INDIVIDUAL_ALLOWED_PROVIDERS[number]);
}

/**
 * Get providers that are blocked for individual accounts.
 * Returns providers that require an organization account.
 */
export function getProvidersBlockedForIndividual(): ProviderConfig[] {
  return Object.values(PROVIDERS).filter(
    (p) => !isProviderAllowedForIndividual(p.id) && !p.devOnly
  );
}

// ============ Premium Provider Detection (for Pay Intention) ============

/**
 * Free providers that don't require pay intention confirmation.
 * Users can connect these without adding a payment method.
 */
export const FREE_PROVIDERS = [
  'gmail',
  'google-calendar',
  'calendly',
  'google-sheets',
  'cal-com',
] as const;

/**
 * Check if a provider requires pay intention confirmation.
 * Premium providers require users to add a payment method before connecting.
 *
 * Free providers: Gmail, Google Calendar, Calendly, Google Sheets
 * Premium providers: All ATS providers, Outlook, Outlook Calendar, Airtable, etc.
 *
 * Note: For individual accounts, ATS providers are completely blocked (not just premium).
 * This function is used for org members who can access premium integrations
 * after confirming pay intention.
 */
export function isPremiumProvider(providerId: string): boolean {
  // Dev-only providers (mock-ats) are not premium
  const provider = PROVIDERS[providerId];
  if (!provider || provider.devOnly) return false;

  // Free providers don't require pay intention
  return !FREE_PROVIDERS.includes(providerId as typeof FREE_PROVIDERS[number]);
}
