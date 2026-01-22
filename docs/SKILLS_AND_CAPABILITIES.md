# Skills and Capabilities System

## Overview

Skillomatic has a two-layer system:

1. **Skills** - Prompt-based workflow descriptions that tell Claude *what* to do
2. **Capabilities (Tools)** - API operations that give Claude *how* to do it

Skills are portable across providers. Tools are provider-specific.

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                                   │
│                    "Screen candidates for the PM role"                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SKILL                                       │
│  "candidate-screening"                                                   │
│                                                                          │
│  Instructions (prompt):                                                  │
│  - Find candidates matching job requirements                             │
│  - Review their experience and skills                                    │
│  - Assess cultural fit indicators                                        │
│  - Provide a ranked list with reasoning                                  │
│                                                                          │
│  Required integrations: ['ats']                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AVAILABLE TOOLS                                  │
│                                                                          │
│  User A (Greenhouse):           User B (Zoho):                           │
│  - greenhouse_list_candidates   - zoho_recruit_list_candidates           │
│  - greenhouse_get_candidate     - zoho_recruit_get_candidate             │
│  - greenhouse_list_jobs         - zoho_recruit_list_job_openings         │
│  - greenhouse_list_scorecards   - zoho_recruit_coql_query                │
│                                                                          │
│  Claude figures out which tools to use based on what's available         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Skills Data Model

### Database Schema

```sql
-- packages/db/src/schema.ts

CREATE TABLE skills (
  id              UUID PRIMARY KEY,
  slug            VARCHAR UNIQUE NOT NULL,   -- 'candidate-screening'
  name            VARCHAR NOT NULL,          -- 'Candidate Screening'
  description     TEXT NOT NULL,
  category        VARCHAR NOT NULL,          -- 'recruiting', 'sourcing', 'admin'
  version         VARCHAR DEFAULT '1.0.0',

  -- Instructions (the actual prompt)
  instructions    TEXT,
  intent          TEXT,                      -- What this skill helps accomplish
  capabilities    JSON,                      -- ['search', 'analyze', 'recommend']

  -- Access control
  required_integrations  JSON,               -- ['ats'], ['ats', 'email']
  required_scopes        JSON,               -- OAuth scopes needed
  is_enabled            BOOLEAN DEFAULT true,
  is_global             BOOLEAN DEFAULT true,
  organization_id       UUID REFERENCES organizations(id),

  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Skill Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `recruiting` | Core hiring workflows | candidate-screening, interview-prep |
| `sourcing` | Finding candidates | linkedin-lookup, talent-search |
| `scheduling` | Calendar management | schedule-interview |
| `communication` | Email/messaging | candidate-outreach, rejection-email |
| `analytics` | Reporting | pipeline-report, time-to-hire |
| `admin` | System management | org-users, org-integrations |

### Required Integrations

Skills declare which integrations they need:

```typescript
// Example: candidate-screening skill
{
  requiredIntegrations: ['ats'],        // Needs ATS access
  requiredScopes: ['candidates:read'],  // Specific permissions
}

// Example: interview-scheduling skill
{
  requiredIntegrations: ['ats', 'calendar'],
  requiredScopes: ['candidates:read', 'calendar:write'],
}
```

## Capabilities Data Model

### Capability Profile

When a user connects, the API builds their capability profile:

```typescript
interface CapabilityProfile {
  hasLLM: boolean;
  hasATS: boolean;
  hasCalendar: boolean;
  hasEmail: boolean;

  llmProvider?: string;     // 'anthropic', 'openai', 'groq'
  atsProvider?: string;     // 'greenhouse', 'zoho-recruit', 'lever'

  effectiveAccess?: {
    ats: AccessLevel;       // 'read-write' | 'read-only' | 'disabled' | 'none'
    email: AccessLevel;
    calendar: AccessLevel;
  };

  isSuperAdmin?: boolean;
}
```

### How Capabilities Are Determined

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CAPABILITY DETERMINATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Query user's integrations from database                              │
│     SELECT * FROM integrations                                           │
│     WHERE user_id = ? OR organization_id = ?                             │
│     AND status = 'connected'                                             │
│                                                                          │
│  2. Query organization settings                                          │
│     SELECT llm_provider, llm_api_key, ats_provider                       │
│     FROM organizations WHERE id = ?                                      │
│                                                                          │
│  3. Get effective access (3-way intersection)                            │
│     - Org admin permissions                                              │
│     - User's connected integrations                                      │
│     - User's personal access level choice                                │
│                                                                          │
│  4. Build profile                                                        │
│     {                                                                    │
│       hasATS: integrations.some(i => i.provider === 'ats'),              │
│       atsProvider: metadata.subProvider || 'zoho-recruit',               │
│       effectiveAccess: { ats: 'read-write', ... }                        │
│     }                                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Skill Rendering Flow

Skills can contain template variables that get replaced at render time:

```markdown
<!-- Original skill instructions -->
# ATS Search

Search the connected ATS using these credentials:
- API Base: {{ATS_BASE_URL}}
- Token: {{ATS_TOKEN}}

Find candidates matching the criteria...
```

```markdown
<!-- Rendered for user with Greenhouse -->
# ATS Search

Search the connected ATS using these credentials:
- API Base: https://harvest.greenhouse.io/v1
- Token: [fetched from Nango at render time]

Find candidates matching the criteria...
```

### Rendering Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SKILL RENDERING                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GET /api/skills/:slug/rendered                                          │
│                                                                          │
│  1. Load skill from database                                             │
│                                                                          │
│  2. Build user's capability profile                                      │
│     - Which integrations are connected?                                  │
│     - What access levels do they have?                                   │
│                                                                          │
│  3. Check capability requirements                                        │
│     if skill.requiredIntegrations includes 'ats'                         │
│       and user doesn't have ATS connected                                │
│     → Return 400 with MISSING_CAPABILITIES error                         │
│                                                                          │
│  4. Render template variables                                            │
│     {{ATS_BASE_URL}} → profile.ats.baseUrl                               │
│     {{ATS_TOKEN}} → [fetch from Nango]                                   │
│     {{LLM_API_KEY}} → profile.llm.apiKey                                 │
│                                                                          │
│  5. Return rendered skill                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## MCP Tool Registration

For MCP (Claude Desktop), tools are registered dynamically based on capabilities:

```typescript
// packages/mcp/src/tools/index.ts

async function registerTools(server, client, profile) {
  // Always register: skill discovery tools
  server.tool('list_skills', ...);
  server.tool('get_skill', ...);

  // ATS tools: dynamic or static based on provider
  if (profile.hasATS) {
    const provider = profile.atsProvider;
    const access = profile.effectiveAccess?.ats || 'read-write';

    if (isProviderSupported(provider)) {
      // Dynamic: Generate tools from manifest
      const manifest = getManifest(provider);
      const tools = generateToolsFromManifest(manifest, access);
      registerGeneratedTools(server, tools, client);
    } else {
      // Static: Generic CRUD tools
      registerAtsTools(server, client);
    }
  }

  // Email tools
  if (profile.hasEmail) {
    registerEmailTools(server, client, profile.effectiveAccess?.email);
  }

  // Calendar tools
  if (profile.hasCalendar) {
    registerCalendarTools(server, client);
  }

  // Admin tools
  if (profile.isSuperAdmin) {
    registerDatabaseTools(server, client);
  }
}
```

## Skill Access Control

### Admin-Disabled Skills

Organization admins can disable specific skills:

```typescript
// Stored in organizations.disabled_skills JSON array
['linkedin-lookup', 'bulk-email']  // These skills won't show for org users
```

### Skill Status Determination

```typescript
type SkillStatus = 'available' | 'limited' | 'disabled';

function getSkillStatus(skill, effectiveAccess, disabledSkills, isAdmin) {
  // Admin-disabled check
  if (disabledSkills.includes(skill.slug) && !isAdmin) {
    return { status: 'disabled', reason: 'Disabled by administrator' };
  }

  // Check each required integration
  for (const integration of skill.requiredIntegrations) {
    const access = effectiveAccess[integration];

    if (access === 'none' || access === 'disabled') {
      return { status: 'disabled', reason: `${integration} not connected` };
    }

    if (access === 'read-only' && skillRequiresWrite(skill)) {
      return { status: 'limited', reason: `${integration} is read-only` };
    }
  }

  return { status: 'available' };
}
```

## Data Flow Summary

### Skill Discovery (MCP)

```
Claude                    MCP Server               Skillomatic API
  │                           │                           │
  │──── list_skills ─────────►│                           │
  │                           │──── GET /api/skills ─────►│
  │                           │                           │
  │                           │◄──── [skill metadata] ────│
  │◄──── [skills list] ───────│                           │
```

### Skill Execution (MCP)

```
Claude                    MCP Server               Skillomatic API         Provider
  │                           │                           │                    │
  │── get_skill('screening')─►│                           │                    │
  │                           │── GET /skills/screening/rendered ─►│           │
  │                           │                           │── fetch token ────►│
  │                           │◄──── [rendered prompt] ───│◄──── token ────────│
  │◄──── [skill prompt] ──────│                           │                    │
  │                           │                           │                    │
  │── greenhouse_list_candidates ─►│                      │                    │
  │                           │── POST /api/v1/ats/proxy ─►│                   │
  │                           │                           │── GET /candidates ─►│
  │                           │◄──── [candidates] ────────│◄──── [data] ───────│
  │◄──── [candidates] ────────│                           │                    │
```

## Maintenance Tasks

### Adding a New Skill

1. **Create skill record in database** (via admin UI or migration)
   ```sql
   INSERT INTO skills (slug, name, description, category, instructions, required_integrations)
   VALUES ('new-skill', 'New Skill', 'Does something', 'recruiting', '...prompt...', '["ats"]');
   ```

2. **Test rendering**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.skillomatic.com/api/skills/new-skill/rendered
   ```

3. **Verify in Claude Desktop**
   - Restart MCP server
   - Run `list_skills` to see new skill
   - Run `get_skill('new-skill')` to get instructions

### Adding a New Integration Category

1. **Update types**
   ```typescript
   // packages/shared/src/types.ts
   type IntegrationCategory = 'ats' | 'email' | 'calendar' | 'crm';  // Add new
   ```

2. **Update capability profile builder**
   ```typescript
   // apps/api/src/lib/skill-renderer.ts
   hasCRM: integrations.some(i => i.provider === 'crm'),
   ```

3. **Update MCP tool registration**
   ```typescript
   // packages/mcp/src/tools/index.ts
   if (profile.hasCRM) {
     registerCrmTools(server, client);
   }
   ```

4. **Create provider manifests** (if using dynamic tools)

### Updating Skill Instructions

Skills can be updated via:
- Admin UI (web app)
- Direct database update
- API endpoint (admin only)

Changes take effect on next skill render (no restart needed).

### Monitoring Skill Usage

Usage is logged to `skill_usage_logs`:

```sql
SELECT
  skill_id,
  COUNT(*) as executions,
  AVG(duration_ms) as avg_duration,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
FROM skill_usage_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY skill_id
ORDER BY executions DESC;
```

## Related Documentation

- [Dynamic Tools Architecture](./DYNAMIC_TOOLS_ARCHITECTURE.md) - Provider manifests and tool generation
- [Ephemeral Architecture](./EPHEMERAL_ARCHITECTURE.md) - Client-side execution model
- [Integration Auth Plan](./INTEGRATION_AUTH_PLAN.md) - OAuth and Nango setup
