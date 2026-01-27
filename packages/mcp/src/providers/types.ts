/**
 * Provider Manifest Types
 *
 * Re-exports types from @skillomatic/shared for backward compatibility.
 * MCP-specific providers (ATS, calendar) still use these types.
 */

// Re-export all manifest types from shared
export type {
  AccessLevel,
  OperationAccess,
  HttpMethod,
  ParameterDef,
  ProviderOperation,
  ProviderManifest,
} from '@skillomatic/shared';

export {
  filterOperationsByAccess,
  isOperationAllowed,
} from '@skillomatic/shared';
