/**
 * Provider System - Dynamic Tool Generation
 *
 * This module provides:
 * - Provider manifests defining available API operations
 * - Tool generation filtered by user permissions
 * - Proxy handlers for executing API calls
 */

// Types
export type { ProviderManifest, ProviderOperation, ParameterDef, OperationAccess, HttpMethod, AccessLevel } from './types.js';
export { filterOperationsByAccess, isOperationAllowed } from './types.js';

// Manifests - all re-exported from shared via manifests/index.js
export {
  manifests,
  getManifest,
  getAvailableProviders,
  isProviderSupported,
  greenhouseManifest,
  zohoRecruitManifest,
  calendlyManifest,
  airtableManifest,
  notionManifest,
  googleSheetsManifest,
  googleDriveManifest,
  googleDocsManifest,
  googleFormsManifest,
  googleContactsManifest,
  googleTasksManifest,
  clockifyManifest,
  atsManifests,
  calendarManifests,
  databaseManifests,
  googleWorkspaceManifests,
  timeTrackingManifests,
  allManifests,
} from './manifests/index.js';

// Generator
export type { GeneratedTool } from './generator.js';
export {
  generateToolsFromManifest,
  getToolSummary,
  interpolatePath,
  categorizeParams,
} from './generator.js';

// Proxy
export type { ProxyRequest } from './proxy.js';
export { registerGeneratedTools } from './proxy.js';
