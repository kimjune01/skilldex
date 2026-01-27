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

// Manifests
export { manifests, getManifest, getAvailableProviders, isProviderSupported } from './manifests/index.js';
export { greenhouseManifest } from './manifests/greenhouse.js';
export { zohoRecruitManifest } from './manifests/zoho-recruit.js';
export { mockAtsManifest } from './manifests/mock-ats.js';

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
