/**
 * Provider Manifests Index
 *
 * Re-exports all manifests from the shared package.
 * This is the single source of truth for all provider manifests.
 */

// Re-export everything from shared
export {
  // Types
  type ProviderManifest,
  type ProviderOperation,
  type ParameterDef,
  // ATS manifests
  greenhouseManifest,
  zohoRecruitManifest,
  mockAtsManifest,
  // Calendar manifests
  calendlyManifest,
  // Database manifests
  airtableManifest,
  notionManifest,
  // Google Workspace manifests
  googleSheetsManifest,
  googleDriveManifest,
  googleDocsManifest,
  googleFormsManifest,
  googleContactsManifest,
  googleTasksManifest,
  // Time tracking manifests
  clockifyManifest,
  // Manifest collections
  atsManifests,
  calendarManifests,
  databaseManifests,
  googleWorkspaceManifests,
  timeTrackingManifests,
  allManifests,
  // Helper functions
  getManifest,
  getAvailableProviders,
  isProviderSupported,
  getGoogleWorkspaceManifest,
  getTimeTrackingManifest,
  isGoogleWorkspaceProvider,
  isTimeTrackingProvider,
  getGoogleWorkspaceProviders,
  getTimeTrackingProviders,
} from '@skillomatic/shared';

// Import for local use
import { allManifests } from '@skillomatic/shared';

// Legacy exports for backwards compatibility with existing MCP code
export const manifests = allManifests;
