# Integration Addition Guide

This guide covers how to add new third-party integrations to Skillomatic. The system uses Nango for OAuth management, provider manifests for API definition, and a three-way permission system for access control.

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
| Database schema | `packages/db/src/schema.ts` |
| Nango client & provider keys | `apps/api/src/lib/nango.ts` |
| Integration routes (OAuth) | `apps/api/src/routes/integrations.ts` |
| Permission system | `apps/api/src/lib/integration-permissions.ts` |
| Provider manifests | `packages/mcp/src/providers/manifests/` |
| ATS proxy route | `apps/api/src/routes/v1/ats.ts` |
| Calendar proxy route | `apps/api/src/routes/v1/calendar.ts` |
| Email routes | `apps/api/src/routes/v1/email.ts` |
| Shared types | `packages/shared/src/types.ts` |
| Frontend UI | `apps/web/src/pages/Integrations.tsx` |

---

## Step-by-Step: Adding a New Integration

### Step 1: Add to Shared Types

Add your provider to the `IntegrationProvider` union type:

```typescript
// packages/shared/src/types.ts
export type IntegrationProvider =
  | 'linkedin' | 'ats' | 'email' | 'calendar' | 'granola'
  | 'airtable'  // Add new provider
  | 'my-new-provider';
```

### Step 2: Configure Nango

#### 2a. Add to Provider Config Keys

```typescript
// apps/api/src/lib/nango.ts
export const PROVIDER_CONFIG_KEYS: Record<string, string> = {
  // ... existing providers

  // Your new provider
  'my-provider': 'my-provider',  // Maps to Nango provider config key
};
```

#### 2b. Configure in Nango Dashboard

1. Go to [Nango Dashboard](https://app.nango.dev) → Integrations → Add New
2. Search for your provider (or create custom OAuth)
3. Add OAuth credentials:
   - **Client ID**: From provider's developer portal
   - **Client Secret**: From provider's developer portal
   - **Scopes**: Comma-separated (e.g., `data.records:read,data.records:write`)
4. Set redirect URL: `https://api.nango.dev/oauth/callback` (Nango Cloud)

### Step 3: Add Category Mapping (if needed)

If your provider belongs to an existing category (ats, email, calendar, database):

```typescript
// apps/api/src/lib/integration-permissions.ts
export function providerToCategory(provider: string): IntegrationCategory | null {
  switch (provider) {
    // ATS providers
    case 'ats':
    case 'greenhouse':
    case 'lever':
    case 'my-new-ats':  // Add here if ATS
      return 'ats';

    // Email providers
    case 'email':
    case 'gmail':
    case 'outlook':
      return 'email';

    // Calendar providers
    case 'calendar':
    case 'google-calendar':
    case 'calendly':
      return 'calendar';

    // Database providers (Airtable, etc.)
    case 'airtable':
      return 'database';

    default:
      return null;  // Standalone integration
  }
}
```

### Step 4: Create Provider Manifest (for MCP tools)

If your integration should expose API operations as Claude tools:

```typescript
// packages/mcp/src/providers/manifests/my-provider.ts
import type { ProviderManifest } from '../types.js';

export const myProviderManifest: ProviderManifest = {
  provider: 'my-provider',
  displayName: 'My Provider',
  category: 'ats',  // 'ats' | 'calendar' | 'email' | 'database'
  baseUrl: 'https://api.myprovider.com/v2',
  apiVersion: 'v2',

  auth: {
    type: 'bearer',  // 'bearer' | 'basic' | 'api-key'
    // headerName: 'X-Api-Key',  // For api-key auth
  },

  rateLimit: {
    requests: 100,
    windowSeconds: 60,
  },

  // Endpoints that should NEVER be exposed
  blocklist: [
    '/admin',
    '/settings',
    '/users/*/delete',
  ],

  operations: [
    {
      id: 'list_items',
      method: 'GET',
      path: '/items',
      access: 'read',  // 'read' | 'write' | 'delete' | 'dangerous'
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

### Step 5: Add Proxy Route Config (for API proxying)

If using the proxy pattern (ATS/Calendar/Database categories):

```typescript
// apps/api/src/routes/v1/ats.ts (or calendar.ts)

const PROVIDER_CONFIG: Record<string, {
  getBaseUrl: (orgConfig?: { baseUrl?: string }) => string;
  getAuthHeader: (token: string) => Record<string, string>;
}> = {
  // ... existing providers

  'my-provider': {
    getBaseUrl: () => 'https://api.myprovider.com/v2',
    getAuthHeader: (token) => ({
      'Authorization': `Bearer ${token}`,
    }),
  },
};

const BLOCKLISTED_PATHS: Record<string, RegExp[]> = {
  // ... existing

  'my-provider': [
    /^\/admin/i,
    /^\/settings/i,
    /^\/users\/.*\/delete/i,
  ],
};
```

### Step 6: Add to Frontend UI

```typescript
// apps/web/src/pages/Integrations.tsx

// 1. Add icon import
import { Table2 } from 'lucide-react';

// 2. Add to provider icons
const providerIcons: Record<IntegrationProvider, typeof Briefcase> = {
  // ... existing
  'my-provider': Table2,
};

// 3. Add to appropriate provider list
const otherProviders: ProviderConfig[] = [
  // ... existing
  {
    id: 'my-provider',
    name: 'My Provider',
    description: 'Connect your My Provider account',
  },
];

// OR if it's a sub-provider of an existing category:
const atsProviders = [
  // ... existing
  { id: 'my-provider', name: 'My Provider' },
];
```

### Step 7: Verify

```bash
# Type check
pnpm typecheck

# Build affected packages
pnpm --filter @skillomatic/mcp build

# Start dev servers
pnpm dev

# Test OAuth flow
# 1. Go to http://localhost:5173/integrations
# 2. Click Connect on your new integration
# 3. Complete OAuth flow
# 4. Verify connection appears as "Connected"
```

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

Uses direct OAuth instead of Nango for better UX:

```typescript
// apps/api/src/lib/google-oauth.ts
// Handles: /integrations/gmail/connect, /integrations/google-calendar/connect
```

### Mock ATS (Development)

Instant connect without OAuth:

```typescript
// POST /integrations/mock-ats/connect
// Only available when NODE_ENV !== 'production'
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
- [ ] Blocklist prevents access to sensitive endpoints
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

---

## Current Integrations

| Provider | Category | OAuth | Manifest | Proxy |
|----------|----------|-------|----------|-------|
| Greenhouse | ATS | Nango | Yes (28 ops) | v1/ats |
| Zoho Recruit | ATS | Nango | Yes (26 ops) | v1/ats |
| Lever | ATS | Nango | Planned | v1/ats |
| Ashby | ATS | Nango | Planned | v1/ats |
| Gmail | Email | Direct | No | v1/email |
| Outlook | Email | Nango | Planned | v1/email |
| Google Calendar | Calendar | Direct | No | v1/calendar |
| Calendly | Calendar | Nango | Yes | v1/calendar |
| Airtable | Database | Nango | Yes (14 ops) | v1/data |
| Mock ATS | ATS (dev) | None | Yes | v1/ats |
