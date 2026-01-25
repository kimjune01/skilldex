/**
 * API Client
 *
 * Re-exports all API modules for backwards compatibility.
 * All existing imports will continue to work:
 *   import { auth, skills, integrations } from '@/lib/api';
 */

// Auth
export { auth } from './auth';

// Skills
export { skills, type SkillListOptions } from './skills';

// API Keys
export { apiKeys } from './api-keys';

// Integrations
export { integrations, type IntegrationAccessLevel } from './integrations';

// Users (admin)
export { users } from './users';

// Analytics
export { analytics, type UsageStats } from './analytics';

// Proposals (deprecated)
export { proposals } from './proposals';

// Scrape Tasks
export { scrape } from './scrape';

// Settings (admin)
export { settings, type LLMProviderConfig, type LLMSettings, type DeploymentSettings } from './settings';

// Organizations (super admin)
export { organizations } from './organizations';

// Invites
export { invites } from './invites';

// Onboarding
export { onboarding } from './onboarding';

// Account Type Selection
export { accountType } from './account-type';
