/**
 * Provider Manifests
 *
 * Shared manifest definitions for Google Workspace providers.
 * Used by both MCP (for Claude Desktop) and API (for web chat).
 */

// Types
export * from './types.js';

// Google Workspace manifests
export { googleSheetsManifest } from './google-sheets.js';
export { googleDriveManifest } from './google-drive.js';
export { googleDocsManifest } from './google-docs.js';
export { googleFormsManifest } from './google-forms.js';
export { googleContactsManifest } from './google-contacts.js';
export { googleTasksManifest } from './google-tasks.js';

import { googleSheetsManifest } from './google-sheets.js';
import { googleDriveManifest } from './google-drive.js';
import { googleDocsManifest } from './google-docs.js';
import { googleFormsManifest } from './google-forms.js';
import { googleContactsManifest } from './google-contacts.js';
import { googleTasksManifest } from './google-tasks.js';
import type { ProviderManifest } from './types.js';

/**
 * All Google Workspace manifests keyed by provider ID
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
 * Get a Google Workspace manifest by provider ID
 */
export function getGoogleWorkspaceManifest(provider: string): ProviderManifest | undefined {
  return googleWorkspaceManifests[provider];
}

/**
 * Check if a provider has a Google Workspace manifest
 */
export function isGoogleWorkspaceProvider(provider: string): boolean {
  return provider in googleWorkspaceManifests;
}

/**
 * Get all Google Workspace provider IDs
 */
export function getGoogleWorkspaceProviders(): string[] {
  return Object.keys(googleWorkspaceManifests);
}
