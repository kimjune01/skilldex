/**
 * Provider Manifest Types
 *
 * Defines the structure for dynamic tool generation from ATS/CRM provider APIs.
 * Manifests describe available operations, parameters, and access requirements.
 */

import type { AccessLevel } from './permissions.js';

/**
 * Access requirement for an operation
 * - 'read': Only requires read access (GET operations)
 * - 'write': Requires write access (POST, PUT, PATCH)
 * - 'delete': Requires delete access (DELETE operations)
 * - 'dangerous': Requires explicit confirmation (bulk deletes, anonymization)
 */
export type OperationAccess = 'read' | 'write' | 'delete' | 'dangerous';

/**
 * HTTP methods supported by operations
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Parameter type definitions for tool schemas
 */
export interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  format?: 'date' | 'date-time' | 'email' | 'uri';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  items?: ParameterDef; // For array types
  properties?: Record<string, ParameterDef>; // For object types
}

/**
 * A single API operation that becomes an MCP tool
 */
export interface ProviderOperation {
  /** Unique operation ID (becomes part of tool name: {provider}_{id}) */
  id: string;

  /** HTTP method */
  method: HttpMethod;

  /** API path with placeholders (e.g., /candidates/{id}) */
  path: string;

  /** Access level required */
  access: OperationAccess;

  /** Human-readable description for Claude */
  description: string;

  /** URL/query parameters */
  params?: Record<string, ParameterDef>;

  /** Request body schema (for POST/PUT/PATCH) */
  body?: Record<string, ParameterDef>;

  /** Response hints for Claude (what fields to expect) */
  responseHints?: string[];

  /** Provider-specific metadata */
  meta?: Record<string, unknown>;
}

/**
 * Provider manifest defining all available operations
 */
export interface ProviderManifest {
  /** Provider identifier (e.g., 'greenhouse', 'zoho-recruit') */
  provider: string;

  /** Display name for the provider */
  displayName: string;

  /** Integration category */
  category: 'ats' | 'crm' | 'email' | 'calendar' | 'database';

  /** Base API URL (can be overridden per-user for on-premise) */
  baseUrl: string;

  /** API version */
  apiVersion: string;

  /** Authentication method */
  auth: {
    type: 'bearer' | 'basic' | 'api-key' | 'oauth2';
    headerName?: string; // For api-key auth
  };

  /** All available operations */
  operations: ProviderOperation[];

  /** Paths/operations to never expose (security blocklist) */
  blocklist?: string[];

  /** Rate limiting info */
  rateLimit?: {
    requests: number;
    windowSeconds: number;
  };

  /** Regional variants */
  regions?: Record<string, { baseUrl: string }>;
}

/**
 * Filter operations based on user's effective access level
 */
export function filterOperationsByAccess(
  operations: ProviderOperation[],
  accessLevel: AccessLevel
): ProviderOperation[] {
  if (accessLevel === 'none' || accessLevel === 'disabled') {
    return [];
  }

  return operations.filter((op) => {
    // Read-only users can only use read operations
    if (accessLevel === 'read-only') {
      return op.access === 'read';
    }

    // Read-write users can use read and write, but not dangerous
    if (accessLevel === 'read-write') {
      return op.access !== 'dangerous';
    }

    return false;
  });
}

/**
 * Check if an operation is allowed given the access level
 */
export function isOperationAllowed(
  operation: ProviderOperation,
  accessLevel: AccessLevel
): boolean {
  if (accessLevel === 'none' || accessLevel === 'disabled') {
    return false;
  }

  if (accessLevel === 'read-only') {
    return operation.access === 'read';
  }

  if (accessLevel === 'read-write') {
    return operation.access !== 'dangerous';
  }

  return false;
}
