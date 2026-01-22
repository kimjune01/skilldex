# Dynamic Tools Architecture

## Overview

Skillomatic supports two modes for ATS tool generation:

1. **Static Generic Tools** - Normalized CRUD operations that work across all providers
2. **Dynamic Provider Tools** - Full provider API surface exposed as MCP tools

This document covers the dynamic tools architecture, which generates MCP tools from provider manifests at connection time.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MCP CONNECTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Claude Desktop connects to MCP server                                │
│                                                                          │
│  2. MCP server calls Skillomatic API:                                    │
│     GET /api/skills/config                                               │
│                                                                          │
│  3. API returns CapabilityProfile:                                       │
│     {                                                                    │
│       hasATS: true,                                                      │
│       atsProvider: "greenhouse",                                         │
│       effectiveAccess: { ats: "read-write", email: "none", ... }         │
│     }                                                                    │
│                                                                          │
│  4. MCP server loads provider manifest:                                  │
│     getManifest("greenhouse") → GreenhouseManifest                       │
│                                                                          │
│  5. Generate tools filtered by access level:                             │
│     generateToolsFromManifest(manifest, "read-write")                    │
│     → 22 tools (dangerous operations excluded)                           │
│                                                                          │
│  6. Register tools with MCP server:                                      │
│     server.tool("greenhouse_list_candidates", ...)                       │
│                                                                          │
│  7. Claude sees provider-specific tools                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TOOL EXECUTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Claude calls: greenhouse_advance_application({ id: 123 })            │
│                                                                          │
│  2. MCP tool handler:                                                    │
│     - Looks up operation in manifest                                     │
│     - Categorizes params (path vs query vs body)                         │
│     - Interpolates path: /applications/{id} → /applications/123          │
│                                                                          │
│  3. Calls Skillomatic API:                                               │
│     POST /api/v1/ats/proxy                                               │
│     {                                                                    │
│       provider: "greenhouse",                                            │
│       method: "POST",                                                    │
│       path: "/applications/123/advance",                                 │
│       body: { from_stage_id: 456 }                                       │
│     }                                                                    │
│                                                                          │
│  4. API validates:                                                       │
│     - User has organization context                                      │
│     - Effective access allows write operations                           │
│     - Path is not blocklisted                                            │
│     - Provider matches user's connected integration                      │
│                                                                          │
│  5. API fetches OAuth token from Nango                                   │
│                                                                          │
│  6. API proxies to Greenhouse:                                           │
│     POST https://harvest.greenhouse.io/v1/applications/123/advance       │
│     Authorization: Basic <token>                                         │
│                                                                          │
│  7. Response flows back to Claude                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Permission Model

### Three-Way Access Control

```
Effective Access = min(Admin Level, User Level) when connected

┌──────────────┬─────────────┬─────────────────┬─────────────────────────┐
│ Org Admin    │ User Choice │ Integration     │ Effective Access        │
├──────────────┼─────────────┼─────────────────┼─────────────────────────┤
│ read-write   │ read-write  │ connected       │ read-write              │
│ read-write   │ read-only   │ connected       │ read-only               │
│ read-only    │ read-write  │ connected       │ read-only               │
│ disabled     │ any         │ any             │ disabled                │
│ read-write   │ read-write  │ not connected   │ none                    │
└──────────────┴─────────────┴─────────────────┴─────────────────────────┘
```

### Access Level → Tool Filtering

```
┌─────────────────┬─────────────────────────────────────────────────────┐
│ Access Level    │ Operations Exposed                                  │
├─────────────────┼─────────────────────────────────────────────────────┤
│ read-write      │ read + write + delete (not dangerous)               │
│ read-only       │ read only                                           │
│ disabled        │ none                                                │
│ none            │ none                                                │
└─────────────────┴─────────────────────────────────────────────────────┘
```

### Operation Access Types

```typescript
type OperationAccess = 'read' | 'write' | 'delete' | 'dangerous';

// read      - GET operations, safe to execute repeatedly
// write     - POST, PUT, PATCH - creates or modifies data
// delete    - DELETE - removes data (treated as write level)
// dangerous - Bulk deletes, anonymization, irreversible actions (never exposed)
```

## File Structure

```
packages/mcp/src/providers/
├── types.ts                    # Core type definitions
│   ├── OperationAccess         # read | write | delete | dangerous
│   ├── ParameterDef            # Parameter schema definition
│   ├── ProviderOperation       # Single API operation
│   ├── ProviderManifest        # Full provider definition
│   └── filterOperationsByAccess()
│
├── permissions.ts              # AccessLevel type re-export
│
├── generator.ts                # Tool generation logic
│   ├── GeneratedTool           # MCP tool definition
│   ├── generateToolsFromManifest()
│   ├── getToolSummary()
│   ├── interpolatePath()
│   └── categorizeParams()
│
├── proxy.ts                    # Tool handler registration
│   └── registerGeneratedTools()
│
├── index.ts                    # Public exports
│
└── manifests/
    ├── index.ts                # Manifest registry
    ├── greenhouse.ts           # 28 operations
    └── zoho-recruit.ts         # 26 operations
```

## Provider Manifest Structure

```typescript
interface ProviderManifest {
  provider: string;           // 'greenhouse', 'zoho-recruit'
  displayName: string;        // 'Greenhouse', 'Zoho Recruit'
  category: 'ats' | 'crm' | 'email' | 'calendar';
  baseUrl: string;            // 'https://harvest.greenhouse.io/v1'
  apiVersion: string;

  auth: {
    type: 'bearer' | 'basic' | 'api-key' | 'oauth2';
    headerName?: string;
  };

  operations: ProviderOperation[];

  blocklist?: string[];       // Paths to never expose

  rateLimit?: {
    requests: number;
    windowSeconds: number;
  };

  regions?: Record<string, { baseUrl: string }>;
}

interface ProviderOperation {
  id: string;                 // 'list_candidates' → tool name: greenhouse_list_candidates
  method: HttpMethod;
  path: string;               // '/candidates/{id}'
  access: OperationAccess;
  description: string;        // Shown to Claude
  params?: Record<string, ParameterDef>;
  body?: Record<string, ParameterDef>;
  responseHints?: string[];   // Expected response fields
  meta?: {
    requiresOnBehalfOf?: boolean;  // Greenhouse audit header
    wrapInData?: boolean;          // Zoho { data: [record] } format
  };
}
```

## Security Layers

### 1. Tool Registration Filtering
Tools are filtered at MCP server startup based on user's effective access level:
- Read-only users never see write tools
- Dangerous operations are never registered

### 2. API Endpoint Validation
The `/api/v1/ats/proxy` endpoint validates every request:
- User must have organization context
- Effective access checked again (defense in depth)
- Write operations require write access
- Path checked against blocklist

### 3. Path Blocklist
Sensitive endpoints are blocked at both manifest and API levels:

**Greenhouse blocklist:**
- `/users`, `/user_roles` - User management
- `/custom_fields` - Schema changes
- `/webhooks` - System config
- `/eeoc`, `/demographics` - Sensitive data

**Zoho Recruit blocklist:**
- `/settings`, `/org` - System config
- `/users` - User management
- `/__schedule_mass_delete` - Bulk operations

### 4. OAuth Token Isolation
- Tokens stored in Nango, not Skillomatic database
- Per-request token retrieval
- Organization-scoped integrations

## Adding a New Provider

### 1. Create Manifest File

```typescript
// packages/mcp/src/providers/manifests/lever.ts

import type { ProviderManifest } from '../types.js';

export const leverManifest: ProviderManifest = {
  provider: 'lever',
  displayName: 'Lever',
  category: 'ats',
  baseUrl: 'https://api.lever.co/v1',
  apiVersion: 'v1',

  auth: { type: 'bearer' },

  blocklist: ['/users', '/webhooks'],

  operations: [
    {
      id: 'list_opportunities',
      method: 'GET',
      path: '/opportunities',
      access: 'read',
      description: 'List all opportunities (candidates)',
      params: {
        limit: { type: 'number', description: 'Max results', default: 100 },
        // ...
      },
    },
    // ... more operations
  ],
};
```

### 2. Register in Index

```typescript
// packages/mcp/src/providers/manifests/index.ts

import { leverManifest } from './lever.js';

export const manifests: Record<string, ProviderManifest> = {
  greenhouse: greenhouseManifest,
  'zoho-recruit': zohoRecruitManifest,
  lever: leverManifest,  // Add here
};
```

### 3. Add Provider Config in API

```typescript
// apps/api/src/routes/v1/ats.ts

const PROVIDER_CONFIG: Record<string, {...}> = {
  // ...existing...
  'lever': {
    getBaseUrl: () => 'https://api.lever.co/v1',
    getAuthHeader: (token) => ({
      'Authorization': `Bearer ${token}`,
    }),
  },
};

const BLOCKLISTED_PATHS: Record<string, RegExp[]> = {
  // ...existing...
  'lever': [
    /^\/users/i,
    /^\/webhooks/i,
  ],
};
```

### 4. Configure Nango Integration
Add OAuth configuration in Nango dashboard for the new provider.

## Maintenance

### Updating Manifests

When a provider adds new API endpoints:

1. Check provider's API changelog/documentation
2. Add new operations to the manifest
3. Set appropriate access level (read/write/dangerous)
4. Add to blocklist if sensitive
5. Test with a connected account

### Monitoring

The proxy logs usage to `skillUsageLogs` with:
- Skill slug: `ats-proxy`
- Duration in milliseconds
- Error codes (not raw messages, for PII safety)

### Common Issues

**"Unsupported provider"**
- Provider not in `PROVIDER_CONFIG` in ats.ts
- Or user's `atsProvider` doesn't match connected integration

**"Access to this endpoint is not allowed"**
- Path matches a blocklist pattern
- Check `BLOCKLISTED_PATHS` in ats.ts

**"You have read-only access to the ATS"**
- User or org admin has restricted access
- Check `effectiveAccess.ats` in capability profile

**"No ATS integration connected"**
- No integration record with status='connected'
- Or no Nango connection ID

## Testing

Unit tests are in:
- `packages/mcp/src/providers/__tests__/generator.test.ts`
- `apps/api/src/__tests__/ats-proxy.test.ts`

Run with:
```bash
pnpm vitest run packages/mcp/src/providers/__tests__/generator.test.ts
pnpm vitest run apps/api/src/__tests__/ats-proxy.test.ts
```

## Trade-offs

### Curated Manifests vs. OpenAPI Generation

| Aspect | Curated Manifests | OpenAPI Generation |
|--------|-------------------|-------------------|
| Quality of descriptions | High (hand-written) | Variable (depends on spec) |
| Security control | Full (explicit blocklist) | Requires post-processing |
| Maintenance burden | Manual updates needed | Auto-updates possible |
| Completeness | Curated subset | Full API surface |
| Consistency | Controlled | Varies by provider |

**Our choice:** Curated manifests, because:
- Security is critical for recruiting (PII)
- Quality descriptions help Claude understand tools
- Providers update APIs infrequently
- Can validate against OpenAPI specs if desired

### Static vs. Dynamic Tools

| Aspect | Static Generic | Dynamic Per-Provider |
|--------|---------------|---------------------|
| Skill portability | High | Medium |
| Provider features | Limited | Full |
| Claude confusion | Low | Medium |
| Maintenance | Adapters | Manifests |

**Our choice:** Dynamic tools for MCP Desktop, because:
- Users expect full provider capabilities
- Frontier models handle provider-specific names well
- Skills are prompts that describe workflows, not tool-specific
