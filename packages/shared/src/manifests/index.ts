/**
 * Provider Manifests
 *
 * Single source of truth for all provider manifest definitions.
 * Used by both MCP (for Claude Desktop) and API (for web chat).
 */

// Types
export * from './types.js';

// ATS manifests
export { greenhouseManifest } from './greenhouse.js';
export { zohoRecruitManifest } from './zoho-recruit.js';

// Calendar manifests
export { calendlyManifest } from './calendly.js';

// Database manifests
export { airtableManifest } from './airtable.js';
export { notionManifest } from './notion.js';

// Google Workspace manifests
export { googleSheetsManifest } from './google-sheets.js';
export { googleDriveManifest } from './google-drive.js';
export { googleDocsManifest } from './google-docs.js';
export { googleFormsManifest } from './google-forms.js';
export { googleContactsManifest } from './google-contacts.js';
export { googleTasksManifest } from './google-tasks.js';

// Time tracking manifests
export { clockifyManifest } from './clockify.js';

import { greenhouseManifest } from './greenhouse.js';
import { zohoRecruitManifest } from './zoho-recruit.js';
import { calendlyManifest } from './calendly.js';
import { airtableManifest } from './airtable.js';
import { notionManifest } from './notion.js';
import { googleSheetsManifest } from './google-sheets.js';
import { googleDriveManifest } from './google-drive.js';
import { googleDocsManifest } from './google-docs.js';
import { googleFormsManifest } from './google-forms.js';
import { googleContactsManifest } from './google-contacts.js';
import { googleTasksManifest } from './google-tasks.js';
import { clockifyManifest } from './clockify.js';
import type { ProviderManifest } from './types.js';

/**
 * ATS manifests keyed by provider ID
 */
export const atsManifests: Record<string, ProviderManifest> = {
  greenhouse: greenhouseManifest,
  'zoho-recruit': zohoRecruitManifest,
};

/**
 * Calendar manifests keyed by provider ID
 */
export const calendarManifests: Record<string, ProviderManifest> = {
  calendly: calendlyManifest,
};

/**
 * Database manifests keyed by provider ID
 */
export const databaseManifests: Record<string, ProviderManifest> = {
  airtable: airtableManifest,
  notion: notionManifest,
};

/**
 * Google Workspace manifests keyed by provider ID
 */
export const googleWorkspaceManifests: Record<string, ProviderManifest> = {
  'google-sheets': googleSheetsManifest,
  'google-drive': googleDriveManifest,
  'google-docs': googleDocsManifest,
  'google-forms': googleFormsManifest,
  'google-contacts': googleContactsManifest,
  'google-tasks': googleTasksManifest,
};

/**
 * Time tracking manifests keyed by provider ID
 */
export const timeTrackingManifests: Record<string, ProviderManifest> = {
  clockify: clockifyManifest,
};

/**
 * All provider manifests keyed by provider ID
 */
export const allManifests: Record<string, ProviderManifest> = {
  ...atsManifests,
  ...calendarManifests,
  ...databaseManifests,
  ...googleWorkspaceManifests,
  ...timeTrackingManifests,
};

/**
 * Get a manifest by provider ID
 */
export function getManifest(provider: string): ProviderManifest | undefined {
  return allManifests[provider];
}

/**
 * Get all available provider IDs
 */
export function getAvailableProviders(): string[] {
  return Object.keys(allManifests);
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(provider: string): boolean {
  return provider in allManifests;
}

/**
 * Get a Google Workspace manifest by provider ID
 */
export function getGoogleWorkspaceManifest(provider: string): ProviderManifest | undefined {
  return googleWorkspaceManifests[provider];
}

/**
 * Get a time tracking manifest by provider ID
 */
export function getTimeTrackingManifest(provider: string): ProviderManifest | undefined {
  return timeTrackingManifests[provider];
}

/**
 * Check if a provider has a Google Workspace manifest
 */
export function isGoogleWorkspaceProvider(provider: string): boolean {
  return provider in googleWorkspaceManifests;
}

/**
 * Check if a provider has a time tracking manifest
 */
export function isTimeTrackingProvider(provider: string): boolean {
  return provider in timeTrackingManifests;
}

/**
 * Get all Google Workspace provider IDs
 */
export function getGoogleWorkspaceProviders(): string[] {
  return Object.keys(googleWorkspaceManifests);
}

/**
 * Get all time tracking provider IDs
 */
export function getTimeTrackingProviders(): string[] {
  return Object.keys(timeTrackingManifests);
}

// Legacy exports for backwards compatibility
export const allSharedManifests = allManifests;
export const getSharedManifest = getManifest;
