# Integrations Architecture

This document explains how third-party integrations work in Skillomatic and how to add new ones.

## Overview

Skillomatic integrations enable the MCP server to interact with external services like ATS systems (Greenhouse, Zoho Recruit), calendar tools (Calendly, Google Calendar), and email providers (Gmail, Outlook).

### Key Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  Manifest   │───▶│  Generator   │───▶│  Generated Tools  │  │
│  │  (scope)    │    │  (filter by  │    │  (user-specific)  │  │
│  │             │    │   access)    │    │                   │  │
│  └─────────────┘    └──────────────┘    └─────────┬─────────┘  │
│                                                    │            │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Skillomatic API                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Proxy Route │───▶│ Permission   │───▶│  Provider API     │  │
│  │ /v1/*/proxy │    │   Check      │    │  (external)       │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
│                                                    │            │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │    Nango     │
                                              │ (OAuth mgmt) │
                                              └──────────────┘
```

## Concepts

### 1. Provider Manifest

A manifest defines what operations are available for a provider, their access levels (read/write), and API details.

**Location**: `packages/mcp/src/providers/manifests/`

```typescript
// Example: calendly.ts
export const calendlyManifest: ProviderManifest = {
  provider: 'calendly',
  displayName: 'Calendly',
  category: 'calendar',          // 'ats' | 'calendar' | 'email'
  baseUrl: 'https://api.calendly.com',

  operations: [
    {
      id: 'list_scheduled_events',
      method: 'GET',
      path: '/scheduled_events',
      access: 'read',            // 'read' or 'write'
      description: 'List scheduled events',
      params: {
        user: { type: 'string', format: 'uri' },
        // ...
      },
    },
    {
      id: 'cancel_scheduled_event',
      method: 'POST',
      path: '/scheduled_events/{uuid}/cancellation',
      access: 'write',           // Write operation
      // ...
    },
  ],

  blocklist: ['/webhook_subscriptions'],  // Blocked for security
};
```

### 2. Access Levels

Each integration category (ATS, calendar, email) has an access level:

| Level | Description |
|-------|-------------|
| `disabled` | No access at all |
| `read-only` | Can only use GET operations |
| `read-write` | Can use all operations |

Access is determined by a **three-way intersection**:
1. **Admin allows** - Organization-level permissions
2. **Integration connected** - User has OAuth connected
3. **User's choice** - User's personal capability profile setting

### 3. Tool Generation

MCP tools are generated dynamically based on:
- Provider manifest operations
- User's effective access level

```typescript
// packages/mcp/src/providers/generator.ts
const tools = generateToolsFromManifest(manifest, accessLevel);
// Returns tools filtered by access level
// e.g., if read-only, only GET operations become tools
```

### 4. Proxy Routes

API proxy routes handle actual requests to external providers:

| Category | Route | File |
|----------|-------|------|
| ATS | `POST /v1/ats/proxy` | `apps/api/src/routes/v1/ats.ts` |
| Calendar | `POST /v1/calendar/proxy` | `apps/api/src/routes/v1/calendar.ts` |
| Email | Direct methods | `apps/api/src/routes/v1/email.ts` |

## Adding a New Integration

### Step 1: Create the Manifest

Create a new file in `packages/mcp/src/providers/manifests/`:

```typescript
// packages/mcp/src/providers/manifests/my-provider.ts
import type { ProviderManifest } from '../types.js';

export const myProviderManifest: ProviderManifest = {
  provider: 'my-provider',
  displayName: 'My Provider',
  category: 'ats',  // or 'calendar', 'email'
  baseUrl: 'https://api.myprovider.com',
  apiVersion: 'v1',

  auth: {
    type: 'bearer',
  },

  // Security: paths that should never be accessible
  blocklist: [
    '/admin',
    '/settings',
  ],

  operations: [
    // Read operation
    {
      id: 'list_items',
      method: 'GET',
      path: '/items',
      access: 'read',
      description: 'List all items',
      params: {
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
        },
      },
    },
    // Write operation
    {
      id: 'create_item',
      method: 'POST',
      path: '/items',
      access: 'write',
      description: 'Create a new item',
      body: {
        name: {
          type: 'string',
          required: true,
          description: 'Item name',
        },
      },
    },
  ],
};
```

### Step 2: Register the Manifest

Update `packages/mcp/src/providers/manifests/index.ts`:

```typescript
import { myProviderManifest } from './my-provider.js';

export const manifests: Record<string, ProviderManifest> = {
  // ... existing
  'my-provider': myProviderManifest,
};

export { myProviderManifest };
```

### Step 3: Add Provider Config (Proxy Route)

Update the appropriate proxy route with provider config:

```typescript
// apps/api/src/routes/v1/ats.ts (for ATS)
// or apps/api/src/routes/v1/calendar.ts (for calendar)

const PROVIDER_CONFIG = {
  // ... existing
  'my-provider': {
    getBaseUrl: () => 'https://api.myprovider.com/v1',
    getAuthHeader: (token) => ({
      'Authorization': `Bearer ${token}`,
    }),
  },
};
```

### Step 4: Configure Nango

Add the provider to Nango configuration in `apps/api/src/lib/nango.ts`:

```typescript
export const PROVIDER_CONFIG_KEYS: Record<string, string> = {
  // ... existing
  'my-provider': 'my-provider',  // Maps to Nango provider config key
};
```

Then configure the OAuth app in your Nango dashboard.

### Step 5: Add to UI (Optional)

If users should be able to connect from the Integrations page:

```typescript
// apps/web/src/pages/Integrations.tsx
const atsProviders = [
  // ... existing
  { id: 'my-provider', name: 'My Provider' },
];
```

### Step 6: Map to Category

Update the provider-to-category mapping:

```typescript
// apps/api/src/lib/integration-permissions.ts
export function providerToCategory(provider: string): IntegrationCategory | null {
  switch (provider) {
    // ... existing
    case 'my-provider':
      return 'ats';  // or 'calendar', 'email'
    // ...
  }
}
```

## File Reference

| File | Purpose |
|------|---------|
| `packages/mcp/src/providers/types.ts` | TypeScript types for manifests |
| `packages/mcp/src/providers/generator.ts` | Generates MCP tools from manifests |
| `packages/mcp/src/providers/proxy.ts` | Registers tools and routes to proxy |
| `packages/mcp/src/providers/permissions.ts` | Access level utilities |
| `packages/mcp/src/providers/manifests/*.ts` | Provider manifests |
| `apps/api/src/routes/v1/ats.ts` | ATS proxy route |
| `apps/api/src/routes/v1/calendar.ts` | Calendar proxy route |
| `apps/api/src/lib/nango.ts` | Nango OAuth configuration |
| `apps/api/src/lib/integration-permissions.ts` | Permission checking |

## Testing

1. **Build the MCP package**:
   ```bash
   pnpm --filter @skillomatic/mcp build
   ```

2. **Type check**:
   ```bash
   pnpm tsc --noEmit
   ```

3. **Manual testing**:
   - Connect the integration via the web UI
   - Start Claude Code with the MCP server
   - Verify tools appear: `calendly_list_scheduled_events`, etc.
   - Test read operations
   - Test write operations (if you have write access)

## Security Considerations

1. **Blocklist sensitive endpoints** - Always add admin/settings paths to the blocklist
2. **Access level enforcement** - Write operations are blocked for read-only users
3. **Token handling** - Tokens are fetched fresh from Nango, never stored
4. **Request validation** - All requests go through the proxy which validates access

## Current Integrations

| Provider | Category | Manifest Location |
|----------|----------|-------------------|
| Greenhouse | ATS | `manifests/greenhouse.ts` |
| Zoho Recruit | ATS | `manifests/zoho-recruit.ts` |
| Mock ATS (dev only) | ATS | `manifests/mock-ats.ts` |
| Calendly | Calendar | `manifests/calendly.ts` |
