# Integration Auth Plan: Org-Wide vs Individual

## Current State

All integrations are per-user:

```
integrations table:
├── userId (required) ← each user connects their own
├── organizationId (optional, for tracking)
└── nangoConnectionId: "{userId}:{provider}"
```

Every user must connect their own Greenhouse, Calendly, etc. This creates friction for ATS integrations where the company has one shared account.

## Problem

| Integration | Current | Should Be |
|-------------|---------|-----------|
| ATS (Greenhouse, Lever) | Per-user | Org-wide - company has one ATS |
| Calendar (Google, Outlook) | Per-user | Per-user - personal calendar |
| Calendly | Per-user | Per-user - personal scheduling links |
| Email | Per-user | Per-user - personal inbox |
| LinkedIn | Per-user (extension) | Per-user - personal session |

**Pain points:**
1. Admin connects Greenhouse, but other users can't use it
2. Every recruiter must have Greenhouse admin credentials to connect
3. No way to share org-wide integrations

## Proposed Solution: Hybrid Auth Model

### Schema Changes

```sql
-- Add scope column to integrations
ALTER TABLE integrations ADD COLUMN scope TEXT NOT NULL DEFAULT 'user';
-- scope: 'user' | 'organization'

-- Make userId nullable (org-wide integrations don't have a specific user)
-- Keep userId for audit trail (who connected it)
ALTER TABLE integrations ALTER COLUMN user_id DROP NOT NULL;

-- Add connected_by for audit
ALTER TABLE integrations ADD COLUMN connected_by TEXT REFERENCES users(id);
```

New schema:

```typescript
export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  nangoConnectionId: text('nango_connection_id'),

  // Scope determines ownership
  scope: text('scope').notNull().default('user'), // 'user' | 'organization'

  // For user-scoped integrations
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // For org-scoped integrations (and tracking for user-scoped)
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Audit: who connected this integration
  connectedBy: text('connected_by').references(() => users.id),

  status: text('status').notNull().default('disconnected'),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  metadata: text('metadata'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

### Connection ID Format

```typescript
// User-scoped (calendar, email, calendly)
connectionId = `user:${userId}:${provider}`
// Example: "user:usr_abc123:google-calendar"

// Org-scoped (ATS)
connectionId = `org:${orgId}:${provider}`
// Example: "org:org_xyz789:greenhouse"
```

### Provider Configuration

Define which integrations are org-wide vs user-scoped:

```typescript
// apps/api/src/lib/integration-config.ts

export const INTEGRATION_SCOPE: Record<string, 'user' | 'organization'> = {
  // ATS - org-wide (company has one account)
  greenhouse: 'organization',
  lever: 'organization',
  ashby: 'organization',
  workable: 'organization',

  // Calendar - per-user (personal calendar)
  'google-calendar': 'user',
  'outlook-calendar': 'user',

  // Scheduling - per-user (personal booking links)
  calendly: 'user',

  // Email - per-user (personal inbox)
  gmail: 'user',
  outlook: 'user',
};

export const INTEGRATION_CONNECT_ROLE: Record<string, 'admin' | 'member'> = {
  // Only admins can connect org-wide integrations
  greenhouse: 'admin',
  lever: 'admin',
  ashby: 'admin',
  workable: 'admin',

  // Any user can connect their own
  'google-calendar': 'member',
  'outlook-calendar': 'member',
  calendly: 'member',
  gmail: 'member',
  outlook: 'member',
};
```

### API Changes

#### POST /api/integrations/connect

```typescript
integrationsRoutes.post('/connect', async (c) => {
  const body = await c.req.json<{ provider: string; subProvider?: string }>();
  const user = c.get('user');

  const providerKey = body.subProvider || body.provider;
  const scope = INTEGRATION_SCOPE[providerKey] || 'user';
  const requiredRole = INTEGRATION_CONNECT_ROLE[providerKey] || 'member';

  // Check permissions for org-wide integrations
  if (scope === 'organization' && requiredRole === 'admin') {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return c.json({
        error: { message: 'Only admins can connect organization-wide integrations' }
      }, 403);
    }
  }

  // Generate connection ID based on scope
  const connectionId = scope === 'organization'
    ? `org:${user.organizationId}:${providerKey}`
    : `user:${user.sub}:${providerKey}`;

  // For org-wide, check if already connected by someone else
  if (scope === 'organization') {
    const existing = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.organizationId, user.organizationId),
        eq(integrations.provider, body.provider),
        eq(integrations.scope, 'organization'),
        eq(integrations.status, 'connected')
      ))
      .limit(1);

    if (existing.length > 0) {
      return c.json({
        error: { message: 'This integration is already connected for your organization' }
      }, 400);
    }
  }

  // Create integration record
  await db.insert(integrations).values({
    id: randomUUID(),
    provider: body.provider,
    scope,
    userId: scope === 'user' ? user.sub : null,
    organizationId: user.organizationId,
    connectedBy: user.sub, // Audit trail
    nangoConnectionId: connectionId,
    status: 'pending',
    // ...
  });

  // ... rest of OAuth flow
});
```

#### GET /api/integrations

Return both user's personal integrations AND org-wide integrations:

```typescript
integrationsRoutes.get('/', async (c) => {
  const user = c.get('user');

  // Get user's personal integrations
  const userIntegrations = await db
    .select()
    .from(integrations)
    .where(and(
      eq(integrations.userId, user.sub),
      eq(integrations.scope, 'user')
    ));

  // Get org-wide integrations
  const orgIntegrations = await db
    .select()
    .from(integrations)
    .where(and(
      eq(integrations.organizationId, user.organizationId),
      eq(integrations.scope, 'organization')
    ));

  return c.json({
    data: {
      user: userIntegrations.map(toPublic),
      organization: orgIntegrations.map(toPublic),
    }
  });
});
```

#### GET /api/integrations/:id/token

Works for both scopes - just need to verify user has access:

```typescript
integrationsRoutes.get('/:id/token', async (c) => {
  const user = c.get('user');
  const integrationId = c.req.param('id');

  const integration = await db
    .select()
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1);

  if (integration.length === 0) {
    return c.json({ error: { message: 'Integration not found' } }, 404);
  }

  const int = integration[0];

  // Check access based on scope
  if (int.scope === 'user' && int.userId !== user.sub) {
    return c.json({ error: { message: 'Not authorized' } }, 403);
  }

  if (int.scope === 'organization' && int.organizationId !== user.organizationId) {
    return c.json({ error: { message: 'Not authorized' } }, 403);
  }

  // Fetch token from Nango...
});
```

### Skill Rendering Changes

Update `buildCapabilityProfile` to check org integrations:

```typescript
// apps/api/src/lib/skill-renderer.ts

async function buildCapabilityProfile(userId: string, orgId: string): Promise<CapabilityProfile> {
  // Get user's personal integrations
  const userIntegrations = await db
    .select()
    .from(integrations)
    .where(and(
      eq(integrations.userId, userId),
      eq(integrations.scope, 'user'),
      eq(integrations.status, 'connected')
    ));

  // Get org-wide integrations
  const orgIntegrations = await db
    .select()
    .from(integrations)
    .where(and(
      eq(integrations.organizationId, orgId),
      eq(integrations.scope, 'organization'),
      eq(integrations.status, 'connected')
    ));

  const allIntegrations = [...userIntegrations, ...orgIntegrations];

  // Build profile from combined integrations
  const profile: CapabilityProfile = { /* ... */ };

  for (const int of allIntegrations) {
    if (int.provider === 'greenhouse' || int.provider === 'lever') {
      const token = await nango.getToken(int.nangoConnectionId);
      profile.ats = {
        provider: int.provider,
        token: token.access_token,
        // ...
      };
    }
    // ... other providers
  }

  return profile;
}
```

### UI Changes

#### Integrations Page

Split into two sections:

```
┌─────────────────────────────────────────────────────────────┐
│  Organization Integrations                    [Admin only]  │
│  ─────────────────────────────────────────────────────────  │
│  These integrations are shared across your organization.    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ Greenhouse  │  │ Lever       │                          │
│  │ ✓ Connected │  │ Not set up  │                          │
│  │ by Jane D.  │  │ [Connect]   │                          │
│  │ [Manage]    │  │             │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Your Personal Integrations                                 │
│  ─────────────────────────────────────────────────────────  │
│  Only you can access these integrations.                    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Google Cal  │  │ Calendly    │  │ Gmail       │         │
│  │ ✓ Connected │  │ Not set up  │  │ Not set up  │         │
│  │ [Disconnect]│  │ [Connect]   │  │ [Connect]   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### Admin Settings

Add org integration management:

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Integrations                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Organization ATS                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Greenhouse                                           │   │
│  │ Connected by: jane@acme.com on Jan 15, 2026         │   │
│  │ Last sync: 2 hours ago                               │   │
│  │                                                      │   │
│  │ [Reconnect]  [Disconnect]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ Disconnecting will affect all users in your org.       │
└─────────────────────────────────────────────────────────────┘
```

### Migration Plan

#### Phase 1: Schema Migration

```typescript
// packages/db/migrations/0015_integration_scope.ts

export async function up(db: Database) {
  // Add new columns
  await db.run(`ALTER TABLE integrations ADD COLUMN scope TEXT NOT NULL DEFAULT 'user'`);
  await db.run(`ALTER TABLE integrations ADD COLUMN connected_by TEXT REFERENCES users(id)`);

  // Set connected_by to userId for existing records
  await db.run(`UPDATE integrations SET connected_by = user_id WHERE user_id IS NOT NULL`);
}
```

#### Phase 2: API Updates

1. Update `/connect` to handle scope
2. Update `/` to return user + org integrations
3. Update `/token` to check scope-based access
4. Update skill renderer to use combined integrations

#### Phase 3: UI Updates

1. Update Integrations page with two sections
2. Add admin controls for org integrations
3. Show "Connected by" for org integrations

#### Phase 4: Migration of Existing Data

For existing deployments with ATS integrations:
- If multiple users connected the same ATS, pick the admin's connection
- Convert to org-wide scope
- Notify affected users

### Edge Cases

#### 1. User leaves organization

- User-scoped integrations: deleted (cascade)
- Org-scoped integrations: remain (connected_by becomes orphaned but integration still works)

#### 2. Admin who connected org integration leaves

- Integration stays connected
- Another admin can reconnect if needed
- `connected_by` becomes historical record

#### 3. User in multiple orgs (future)

- User-scoped integrations belong to user, accessible from any org
- Org-scoped integrations are per-org

#### 4. OAuth token refresh fails

- Same as today: mark integration as error
- For org-wide: admin notified to reconnect

### Security Considerations

1. **Token access**: Any user in org can get tokens for org-wide integrations
   - This is intentional - they need ATS access to do their job
   - Audit trail via `connected_by` and usage logs

2. **Connection permissions**: Only admins can connect/disconnect org-wide integrations
   - Prevents unauthorized integration changes

3. **Nango connection IDs**: Include scope prefix to prevent collision
   - `user:usr_123:greenhouse` vs `org:org_456:greenhouse`

### Implementation Order

1. **Database migration** - Add `scope` and `connected_by` columns
2. **API: /connect** - Handle scope-based connection logic
3. **API: /list** - Return user + org integrations
4. **Skill renderer** - Use combined integrations
5. **UI: Integrations page** - Two-section layout
6. **UI: Admin settings** - Org integration management
7. **Data migration** - Convert existing ATS integrations to org-wide

### Estimated Effort

| Task | Effort |
|------|--------|
| Schema migration | Small |
| API changes | Medium |
| Skill renderer updates | Small |
| UI updates | Medium |
| Testing | Medium |
| Data migration script | Small |

Total: ~3-4 focused sessions
