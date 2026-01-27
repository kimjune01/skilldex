# Integration Addition Guide

This guide covers how to add new third-party integrations to Skillomatic. The system uses a **centralized provider registry**, Nango for OAuth management, provider manifests for API definition, and a three-way permission system for access control.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Frontend (Web)                                 │
│  - OAuth Connect Flow (Nango Connect UI)        │
│  - Integration Status Display                   │
│  - Access Level Selection                       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Skillomatic API                                │
│  - /integrations/* (OAuth management)           │
│  - /v1/{category}/proxy (ATS, Calendar, Email)  │
│  - Permission enforcement                       │
│  - Token retrieval from Nango                   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  External Services                              │
│  - Nango (OAuth token management)               │
│  - Provider APIs (Greenhouse, Calendly, etc.)   │
└─────────────────────────────────────────────────┘
```

## Key Files

| Purpose | Location |
|---------|----------|
| **Provider Registry (Single Source of Truth)** | `packages/shared/src/providers.ts` |
| Database schema | `packages/db/src/schema.ts` |
| Nango client | `apps/api/src/lib/nango.ts` |
| Integration routes (OAuth) | `apps/api/src/routes/integrations.ts` |
| Permission system | `apps/api/src/lib/integration-permissions.ts` |
| Provider manifests (MCP tools) | `packages/mcp/src/providers/manifests/` |
| ATS proxy route | `apps/api/src/routes/v1/ats.ts` |
| Calendar proxy route | `apps/api/src/routes/v1/calendar.ts` |
| Data proxy route | `apps/api/src/routes/v1/data.ts` |
| Email routes | `apps/api/src/routes/v1/email.ts` |
| Shared types | `packages/shared/src/types.ts` |
| Frontend UI | `apps/web/src/pages/Integrations.tsx` |

---

## Quick Start: Adding a New Integration

Adding a new provider now requires **only 1-2 files** thanks to the centralized provider registry.

### Step 1: Add to Provider Registry (Required)

Add your provider to `packages/shared/src/providers.ts`:

```typescript
export const PROVIDERS: Record<string, ProviderConfig> = {
  // ... existing providers

  'my-provider': {
    id: 'my-provider',
    displayName: 'My Provider',
    category: 'ats',  // 'ats' | 'email' | 'calendar' | 'database' | 'scheduling'
    oauthFlow: 'nango',  // 'nango' | 'google-direct' | 'none'
    nangoKey: 'my-provider',  // Nango integration key (if different from id)
    apiBaseUrl: 'https://api.myprovider.com/v2',
    apiAuth: { type: 'bearer' },  // 'bearer' | 'basic' | 'api-key'
    rateLimit: { requests: 100, windowSeconds: 60 },  // Optional
    blockedPaths: [  // Optional - security blocklist
      /^\/admin/i,
      /^\/settings/i,
    ],
    order: 10,  // Optional - sort order in UI (lower = first)
    devOnly: false,  // Optional - only show in development
    hasManifest: true,  // Optional - has MCP manifest for Claude tools
  },
};
```

### Step 2: Configure in Nango Dashboard (Required for OAuth)

1. Go to [Nango Dashboard](https://app.nango.dev) → Integrations → Add New
2. Search for your provider (or create custom OAuth)
3. Add OAuth credentials:
   - **Client ID**: From provider's developer portal
   - **Client Secret**: From provider's developer portal
   - **Scopes**: Comma-separated (e.g., `data.records:read,data.records:write`)
4. Set redirect URL: `https://api.nango.dev/oauth/callback` (Nango Cloud)

### Step 3: Add Provider Manifest (Optional - for MCP tools)

If your integration should expose API operations as Claude tools, create a manifest:

```typescript
// packages/mcp/src/providers/manifests/my-provider.ts
import type { ProviderManifest } from '../types.js';

export const myProviderManifest: ProviderManifest = {
  provider: 'my-provider',
  displayName: 'My Provider',
  category: 'ats',
  baseUrl: 'https://api.myprovider.com/v2',
  apiVersion: 'v2',

  auth: {
    type: 'bearer',
  },

  rateLimit: {
    requests: 100,
    windowSeconds: 60,
  },

  blocklist: [
    '/admin',
    '/settings',
  ],

  operations: [
    {
      id: 'list_items',
      method: 'GET',
      path: '/items',
      access: 'read',
      description: 'List all items',
      params: {
        page: { type: 'number', description: 'Page number', default: 1 },
        limit: { type: 'number', description: 'Items per page', default: 20 },
      },
      responseHints: ['id', 'name', 'created_at'],
    },
    {
      id: 'create_item',
      method: 'POST',
      path: '/items',
      access: 'write',
      description: 'Create a new item',
      body: {
        name: { type: 'string', description: 'Item name', required: true },
        description: { type: 'string', description: 'Optional description' },
      },
    },
  ],
};
```

Register the manifest:

```typescript
// packages/mcp/src/providers/manifests/index.ts
import { myProviderManifest } from './my-provider.js';

export const manifests: Record<string, ProviderManifest> = {
  // ... existing
  'my-provider': myProviderManifest,
};
```

### Step 4: Add to Shared Types (Optional - for type safety)

If you want the provider to be recognized in TypeScript types:

```typescript
// packages/shared/src/types.ts
export type IntegrationProvider =
  | 'linkedin' | 'ats' | 'email' | 'calendar' | 'granola'
  | 'airtable'
  | 'my-provider';  // Add new provider
```

### Step 5: Add Frontend Icon (Optional)

If the provider needs a custom icon in the UI:

```typescript
// apps/web/src/pages/Integrations.tsx
import { MyIcon } from 'lucide-react';

const providerIcons: Record<IntegrationProvider, LucideIcon> = {
  // ... existing
  'my-provider': MyIcon,
};
```

### Step 6: Verify

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Start dev servers
pnpm dev

# Test OAuth flow
# 1. Go to http://localhost:5173/integrations
# 2. Click Connect on your new integration
# 3. Complete OAuth flow
# 4. Verify connection appears as "Connected"
```

---

## Provider Registry Reference

The provider registry (`packages/shared/src/providers.ts`) is the single source of truth for all provider configuration. It provides:

### ProviderConfig Interface

```typescript
interface ProviderConfig {
  id: string;                    // Unique identifier (e.g., 'greenhouse')
  displayName: string;           // UI display name (e.g., 'Greenhouse')
  category: IntegrationCategory; // 'ats' | 'email' | 'calendar' | 'database' | 'scheduling'
  oauthFlow: OAuthFlow;          // 'nango' | 'google-direct' | 'none'
  nangoKey?: string;             // Nango config key (defaults to id)
  apiBaseUrl: string;            // API base URL
  apiAuth: {
    type: AuthType;              // 'bearer' | 'basic' | 'api-key'
    headerName?: string;         // For api-key auth (e.g., 'X-Api-Key')
  };
  rateLimit?: {
    requests: number;
    windowSeconds: number;
  };
  blockedPaths?: RegExp[];       // Paths that should never be proxied
  order?: number;                // Sort order in UI (lower = first)
  devOnly?: boolean;             // Only available in development
  hasManifest?: boolean;         // Has MCP manifest with tool operations
}
```

### Helper Functions

The registry exports these helper functions (used by API and frontend):

```typescript
// Get all providers, optionally filtered
getProviders(options?: { category?: IntegrationCategory; includeDevOnly?: boolean }): ProviderConfig[]

// Get a specific provider by ID
getProvider(id: string): ProviderConfig | undefined

// Check if a provider ID is valid
isValidProvider(id: string): boolean

// Get the Nango config key for a provider
getNangoKey(providerId: string): string

// Get the category for a provider
getProviderCategory(providerId: string): IntegrationCategory | null

// Get all provider IDs for a category
getProviderIds(category: IntegrationCategory): string[]

// Get blocked paths for a provider
getBlockedPaths(providerId: string): RegExp[]

// Check if a path is blocked
isPathBlocked(providerId: string, path: string): boolean

// Build auth header for a provider
buildAuthHeader(providerId: string, token: string, base64Encoder?: (str: string) => string): Record<string, string>

// Get API base URL
getApiBaseUrl(providerId: string): string | undefined

// Get all categories
getAllCategories(): IntegrationCategory[]
```

---

## What's Automatic

Thanks to the centralized registry, these things happen automatically when you add a provider:

| Feature | How It Works |
|---------|--------------|
| **Category mapping** | `getProviderCategory()` reads from registry |
| **Nango key lookup** | `getNangoKey()` reads from registry |
| **Proxy route support** | Proxy routes use `getProvider()`, `isPathBlocked()`, `buildAuthHeader()` |
| **Frontend provider lists** | `Integrations.tsx` uses `getProviders({ category })` |
| **Auth header generation** | `buildAuthHeader()` handles bearer/basic/api-key based on config |
| **Blocked path enforcement** | `isPathBlocked()` checks against provider's blockedPaths |

---

## OAuth Flow Details

### Connection Flow

```
1. User clicks "Connect" → Frontend opens dialog
2. Frontend: POST /integrations/session
   - Server creates Nango Connect session
   - Returns { token, connectLink }
3. Frontend opens Nango Connect UI with token
4. User authorizes in provider's OAuth screen
5. Nango handles token exchange & storage
6. Nango redirects to: GET /integrations/callback?connection_id=xyz
7. Server updates integration status to 'connected'
8. Redirects to /integrations?success=...
```

### Token Retrieval

```typescript
// When skill needs a token:
GET /integrations/:id/token

// Server flow:
1. Validate user owns integration
2. Call Nango: nango.getToken(providerConfigKey, connectionId)
3. Nango auto-refreshes if expired
4. Return fresh access_token
```

---

## Permission System

### Three-Way Access Control

```
Effective Access = min(Org Admin Setting, User Choice, Connection Status)
```

| Org Admin | User Choice | Connected | Effective |
|-----------|-------------|-----------|-----------|
| read-write | read-write | yes | read-write |
| read-write | read-only | yes | read-only |
| read-only | read-write | yes | read-only |
| disabled | any | any | disabled |
| any | any | no | none |

### Access Levels

- **read-write**: All operations (GET, POST, PUT, PATCH, DELETE)
- **read-only**: Only GET operations
- **disabled**: Admin has disabled this category
- **none**: Integration not connected

### Operation Access Types (in manifests)

- `read`: GET operations (safe, repeatable)
- `write`: POST, PUT, PATCH (creates/modifies data)
- `delete`: DELETE operations (treated as write level)
- `dangerous`: Bulk operations, irreversible (never exposed)

---

## Database Schema

### integrations table

```typescript
{
  id: UUID,
  provider: string,              // 'greenhouse', 'calendly', 'airtable'
  nangoConnectionId: string,     // Nango connection reference
  userId: UUID,
  organizationId: UUID,
  status: 'connected' | 'disconnected' | 'error' | 'pending',
  metadata: JSON,                // { subProvider, accessLevel, ... }
  lastSyncAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### Metadata Structure

```typescript
{
  subProvider?: string,         // e.g., 'greenhouse' when provider is 'ats'
  accessLevel?: 'read-write' | 'read-only',
  pendingAccessLevel?: string,  // During OAuth flow
  isOrgWide?: boolean,          // Organization-wide integration
  // Provider-specific fields:
  zohoRegion?: string,
  calendlyUserUri?: string,
}
```

---

## Special Cases

### Google OAuth (Gmail, Google Calendar)

Uses direct OAuth instead of Nango for better UX. Set `oauthFlow: 'google-direct'` in the registry:

```typescript
gmail: {
  id: 'gmail',
  displayName: 'Gmail',
  category: 'email',
  oauthFlow: 'google-direct',  // Uses apps/api/src/lib/google-oauth.ts
  // ...
},
```

### Mock ATS (Development)

Instant connect without OAuth. Set `oauthFlow: 'none'` and `devOnly: true`:

```typescript
'mock-ats': {
  id: 'mock-ats',
  displayName: 'Mock ATS (Dev)',
  category: 'ats',
  oauthFlow: 'none',
  devOnly: true,
  // ...
},
```

---

## Error Handling

### Standardized Error Codes (PII-safe)

```typescript
// Integration errors
'INTEGRATION_NOT_CONNECTED'
'INTEGRATION_TOKEN_EXPIRED'
'INTEGRATION_OAUTH_FAILED'

// Provider errors
'ATS_AUTH_FAILED'
'ATS_NOT_FOUND'
'ATS_RATE_LIMITED'
'ATS_TIMEOUT'
'ATS_INVALID_REQUEST'
```

Never log raw error messages or response bodies (PII risk).

---

## Security Checklist

- [ ] OAuth tokens stored in Nango, not Skillomatic DB
- [ ] `blockedPaths` in registry prevents access to sensitive endpoints
- [ ] Dangerous operations never exposed via manifests
- [ ] Three-way permission check on every proxy request
- [ ] Error codes used instead of raw messages (no PII)
- [ ] Request/response bodies never logged

---

## Testing Checklist

1. [ ] OAuth connect flow works
2. [ ] Integration appears in user's list
3. [ ] Token retrieval returns fresh token
4. [ ] Access level can be changed
5. [ ] Disconnect updates status correctly
6. [ ] MCP tools appear based on access level
7. [ ] Read-only hides write operations
8. [ ] Blocklisted paths return 403
9. [ ] Type check passes: `pnpm typecheck`
10. [ ] Tests pass: `pnpm test`

---

## Current Integrations

| Provider | Category | OAuth | Manifest | Proxy |
|----------|----------|-------|----------|-------|
| Greenhouse | ATS | Nango | Yes (28 ops) | v1/ats |
| Zoho Recruit | ATS | Nango | Yes (26 ops) | v1/ats |
| Lever | ATS | Nango | Planned | v1/ats |
| Ashby | ATS | Nango | Planned | v1/ats |
| Workable | ATS | Nango | Planned | v1/ats |
| Gmail | Email | Direct | No | v1/email |
| Outlook | Email | Nango | Planned | v1/email |
| Google Calendar | Calendar | Direct | No | v1/calendar |
| Outlook Calendar | Calendar | Nango | Planned | v1/calendar |
| Calendly | Calendar | Nango | Yes | v1/calendar |
| Airtable | Database | Nango | Yes (14 ops) | v1/data |
| Google Sheets | Database | Direct | Yes (dynamic) | v1/data |
| Cal.com | Scheduling | Nango | Planned | v1/scheduling |
| Mock ATS | ATS (dev) | None | Yes (14 ops) | v1/ats |
