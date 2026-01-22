/**
 * Dynamic Tool Generator
 *
 * Generates MCP tool definitions from provider manifests,
 * filtered by user's effective access level.
 */

import { z, ZodTypeAny } from 'zod';
import type { ProviderManifest, ProviderOperation, ParameterDef } from './types.js';
import { filterOperationsByAccess } from './types.js';
import type { AccessLevel } from './permissions.js';

/**
 * Generated tool definition ready for MCP registration
 */
export interface GeneratedTool {
  /** Tool name: {provider}_{operation_id} */
  name: string;

  /** Human-readable description */
  description: string;

  /** Zod schema for input validation */
  inputSchema: Record<string, ZodTypeAny>;

  /** Metadata for proxy handler */
  meta: {
    provider: string;
    method: string;
    path: string;
    category: string;
    requiresOnBehalfOf?: boolean;
    wrapInData?: boolean;
  };
}

/**
 * Convert a ParameterDef to a Zod schema
 */
function paramDefToZod(param: ParameterDef): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (param.type) {
    case 'string':
      schema = z.string();
      if (param.format === 'email') {
        schema = z.string().email();
      } else if (param.format === 'date-time') {
        schema = z.string().datetime().or(z.string()); // Allow ISO strings
      } else if (param.format === 'date') {
        schema = z.string(); // YYYY-MM-DD format
      } else if (param.format === 'uri') {
        schema = z.string().url();
      }
      if (param.enum) {
        schema = z.enum(param.enum as [string, ...string[]]);
      }
      break;

    case 'number':
      schema = z.number();
      break;

    case 'boolean':
      schema = z.boolean();
      break;

    case 'array':
      if (param.items) {
        schema = z.array(paramDefToZod(param.items));
      } else {
        schema = z.array(z.unknown());
      }
      break;

    case 'object':
      if (param.properties) {
        const shape: Record<string, ZodTypeAny> = {};
        for (const [key, propDef] of Object.entries(param.properties)) {
          shape[key] = propDef.required
            ? paramDefToZod(propDef)
            : paramDefToZod(propDef).optional();
        }
        schema = z.object(shape);
      } else {
        schema = z.record(z.unknown());
      }
      break;

    default:
      schema = z.unknown();
  }

  // Add description
  schema = schema.describe(param.description);

  // Handle default value
  if (param.default !== undefined) {
    schema = schema.default(param.default);
  }

  return schema;
}

/**
 * Build Zod input schema from operation params and body
 */
function buildInputSchema(operation: ProviderOperation): Record<string, ZodTypeAny> {
  const schema: Record<string, ZodTypeAny> = {};

  // Add path/query parameters
  if (operation.params) {
    for (const [name, def] of Object.entries(operation.params)) {
      const zodSchema = paramDefToZod(def);
      schema[name] = def.required ? zodSchema : zodSchema.optional();
    }
  }

  // Add body parameters (for POST/PUT/PATCH)
  if (operation.body) {
    for (const [name, def] of Object.entries(operation.body)) {
      const zodSchema = paramDefToZod(def);
      schema[name] = def.required ? zodSchema : zodSchema.optional();
    }
  }

  return schema;
}

/**
 * Generate MCP tools from a provider manifest
 */
export function generateToolsFromManifest(
  manifest: ProviderManifest,
  accessLevel: AccessLevel
): GeneratedTool[] {
  // Filter operations by access level
  const allowedOps = filterOperationsByAccess(manifest.operations, accessLevel);

  return allowedOps.map((op) => ({
    name: `${manifest.provider.replace(/-/g, '_')}_${op.id}`,
    description: `[${manifest.displayName}] ${op.description}`,
    inputSchema: buildInputSchema(op),
    meta: {
      provider: manifest.provider,
      method: op.method,
      path: op.path,
      category: manifest.category,
      requiresOnBehalfOf: op.meta?.requiresOnBehalfOf as boolean | undefined,
      wrapInData: op.meta?.wrapInData as boolean | undefined,
    },
  }));
}

/**
 * Get tool count summary for logging
 */
export function getToolSummary(
  manifest: ProviderManifest,
  accessLevel: AccessLevel
): { total: number; read: number; write: number; filtered: number } {
  const allOps = manifest.operations;
  const allowedOps = filterOperationsByAccess(allOps, accessLevel);

  return {
    total: allOps.length,
    read: allowedOps.filter((op) => op.access === 'read').length,
    write: allowedOps.filter((op) => op.access === 'write').length,
    filtered: allOps.length - allowedOps.length,
  };
}

/**
 * Interpolate path parameters into URL path
 * e.g., /candidates/{id} with { id: 123 } → /candidates/123
 */
export function interpolatePath(
  path: string,
  params: Record<string, unknown>
): { path: string; unusedParams: Record<string, unknown> } {
  const unusedParams = { ...params };

  const interpolated = path.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    if (value !== undefined) {
      delete unusedParams[key];
      return encodeURIComponent(String(value));
    }
    return `{${key}}`; // Leave unmatched placeholders
  });

  return { path: interpolated, unusedParams };
}

/**
 * Separate params into path params, query params, and body
 */
export function categorizeParams(
  operation: ProviderOperation,
  args: Record<string, unknown>
): {
  pathParams: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  bodyParams: Record<string, unknown>;
} {
  const pathParams: Record<string, unknown> = {};
  const queryParams: Record<string, unknown> = {};
  const bodyParams: Record<string, unknown> = {};

  // Extract path parameters from the path template
  const pathParamNames = new Set(
    [...operation.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
  );

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined) continue;

    if (pathParamNames.has(key)) {
      pathParams[key] = value;
    } else if (operation.body && key in operation.body) {
      bodyParams[key] = value;
    } else if (operation.params && key in operation.params) {
      queryParams[key] = value;
    }
  }

  return { pathParams, queryParams, bodyParams };
}
