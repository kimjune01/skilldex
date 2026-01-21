# Ephemeral Architecture Plan

## Overview

Migrate Skilldex to a fully ephemeral architecture where no PII passes through or is stored on the server. The server becomes a coordination layer for auth and skill rendering only.

**Key insight:** Skills are rendered server-side with sensitive keys embedded, then sent to client. Client uses rendered skills directly with LLM/ATS - no separate key distribution.

## Current vs Target Architecture

### Current (Server-Proxied)
```
User Browser ──► Skilldex API ──► LLM Provider
                      │
                      ├──► ATS APIs
                      │
                      └──► Scrape Results (DB)
```
- PII flows through server
- Server stores scrape results
- Requires DPA, compliance obligations

### Target (Ephemeral)
```
User Browser ──────────────────► LLM Provider (direct)
      │
      ├─────────────────────────► ATS APIs (direct)
      │
      ├── IndexedDB (scrape cache, local only)
      │
      └──► Skilldex API (auth, rendered skills only)
```
- No PII on server
- Client calls LLM/ATS directly
- Scrape results stored client-side
- Minimal compliance burden

## Core Concept: Rendered Skills

Skills are markdown templates with placeholders for sensitive values. Server renders them with org-specific secrets before sending to client.

### Skill Template (stored in DB)
```markdown
---
name: linkedin-lookup
intent: Find candidates on LinkedIn
---

# LinkedIn Candidate Search

Use the ATS API to search candidates:

```bash
curl -H "Authorization: Bearer {{ATS_TOKEN}}" \
  "{{ATS_BASE_URL}}/api/candidates?q=$QUERY"
```

Use the LLM to analyze results with your API key: {{LLM_API_KEY}}
```

### Rendered Skill (sent to client)
```markdown
---
name: linkedin-lookup
intent: Find candidates on LinkedIn
---

# LinkedIn Candidate Search

Use the ATS API to search candidates:

```bash
curl -H "Authorization: Bearer sk_ats_abc123..." \
  "https://api.greenhouse.io/v1/candidates?q=$QUERY"
```

Use the LLM to analyze results with your API key: sk-ant-abc123...
```

### Benefits
- Single endpoint for skills (already exists)
- Keys embedded in context, not separate API calls
- Client doesn't need to know about key management
- Skills are self-contained instructions

## Components to Change

### 1. Skill Rendering (New)

**Add:** Server-side skill template rendering
- Parse `{{VARIABLE}}` placeholders in skill instructions
- Resolve from org's config (LLM key, ATS token, base URLs)
- Return fully rendered skill to client

**Variables to support:**
```
{{LLM_API_KEY}}      - Org's Anthropic/OpenAI key
{{LLM_PROVIDER}}     - 'anthropic' | 'openai'
{{ATS_TOKEN}}        - OAuth token (fetched fresh from Nango)
{{ATS_BASE_URL}}     - ATS API base URL
{{SKILLDEX_API_URL}} - This server's URL (for scrape coordination)
{{SKILLDEX_API_KEY}} - User's API key (for scrape tasks)
```

**Files to modify:**
- Add: `apps/api/src/lib/skill-renderer.ts`
- Modify: `apps/api/src/lib/skills.ts` - render before returning
- Modify: Skill download endpoint to render

### 2. LLM Chat (Server → Client)

**Current:** `POST /api/chat` - server builds prompt, calls LLM, streams response

**Target:** Client-side chat module
- Fetch rendered skills (keys already embedded)
- Build system prompt client-side
- Call Anthropic API directly from browser (key from rendered skill)
- Stream response client-side

**Files to modify:**
- Remove: `apps/api/src/routes/chat.ts` (most of it)
- Add: `apps/web/src/lib/llm-client.ts`
- Modify: `apps/web/src/components/chat/` components

### 3. ATS Integration (Server → Client)

**Current:** Server proxies ATS calls

**Target:** Client calls ATS directly using credentials from rendered skills
- ATS token embedded in skill instructions via `{{ATS_TOKEN}}`
- Client parses token from skill context or dedicated config skill
- Client makes ATS API calls directly
- Results never touch server

**Files to modify:**
- Add: `apps/web/src/lib/ats-client.ts`
- Modify: Action execution to use client-side ATS
- No separate token endpoint needed (embedded in skills)

### 4. Scrape Results (Server DB → Client IndexedDB)

**Current:** `scrapeTasks` table stores URLs and results

**Target:**
- Server only coordinates: task queue with URLs
- Extension sends results directly to client via WebSocket
- Client stores in IndexedDB with TTL

**Files to modify:**
- Modify: `apps/api/src/routes/ws/scrape.ts` - route results to client, not DB
- Modify: `apps/skilldex-scraper/background.js` - send to client WebSocket
- Add: `apps/web/src/lib/scrape-cache.ts` - IndexedDB wrapper
- Remove: `result` column usage from `scrapeTasks` table

### 5. Simplified API (Skills Only)

**Existing endpoints (modified):**
```
GET /api/skills             → [{ slug, name, description, intent, capabilities }] (metadata only)
GET /api/skills/:slug       → { instructions } (rendered with keys)
GET /api/skills/:slug/download → Full rendered SKILL.md
```

**Security:**
- All endpoints require JWT auth
- Rendered skills contain org-specific secrets
- Skills scoped to user's organization and role
- Never log rendered skill content

## Database Changes

### Remove
- `scrapeTasks.result` - no longer stored server-side
- `scrapeTasks.errorMessage` - errors handled client-side

### Keep
- `scrapeTasks.id, userId, url, urlHash, status, createdAt, expiresAt` - for coordination
- All other tables unchanged

### Add (to organizations table)
```sql
ALTER TABLE organizations ADD COLUMN llm_provider TEXT DEFAULT 'anthropic';
ALTER TABLE organizations ADD COLUMN llm_api_key TEXT;  -- encrypted
ALTER TABLE organizations ADD COLUMN ats_provider TEXT;
ALTER TABLE organizations ADD COLUMN ats_base_url TEXT;
-- ATS tokens fetched fresh from Nango, not stored
```

## Implementation Phases

### Phase 1: Skill Rendering + Client-Side LLM Chat

1. Create `apps/api/src/lib/skill-renderer.ts`
   - `renderSkill(instructions, context)` - replace `{{VAR}}` placeholders
   - `getOrgContext(orgId)` - fetch org's LLM key, ATS config
   - `getUserContext(userId)` - fetch user's API key

2. Modify `apps/api/src/lib/skills.ts`
   - `loadSkillBySlug()` now calls `renderSkill()` before returning
   - Add special `_config` skill with all keys for system prompt

3. Create `apps/web/src/lib/llm-client.ts`
   - `streamChat(messages, systemPrompt, apiKey)` - direct Anthropic call
   - Extract API key from rendered config skill
   - Handle streaming response

4. Create `apps/web/src/lib/skills-client.ts`
   - `fetchSkillMetadata()` - get available skills (no secrets)
   - `loadSkill(slug)` - get rendered instructions (with secrets)
   - Cache metadata, not rendered skills (secrets shouldn't persist)

5. Update `apps/web/src/components/chat/ChatInterface.tsx`
   - Fetch rendered `_config` skill on mount (contains LLM key)
   - Use client-side LLM instead of `/api/chat`
   - Parse and execute actions client-side

6. Deprecate `POST /api/chat` (remove after migration)

### Phase 2: Client-Side Action Execution

1. Create `apps/web/src/lib/action-executor.ts`
   - Parse action blocks from LLM response
   - Route to appropriate handler
   - `executeAction(action, context)` dispatcher
   - Context contains rendered credentials from skills

2. Create `apps/web/src/lib/ats-client.ts`
   - `searchCandidates(query, token, baseUrl)` - direct ATS call
   - `getCandidate(id, ...)`, `createCandidate(data, ...)`, etc.
   - Credentials passed in, not fetched separately

3. Update action execution flow
   - `load_skill` action returns rendered skill with ATS credentials
   - Subsequent ATS actions use credentials from skill context
   - No server round-trip for tokens

### Phase 3: Client-Side Scrape Cache
1. Create `apps/web/src/lib/scrape-cache.ts`
   - IndexedDB wrapper for scrape results
   - `get(urlHash)`, `set(urlHash, content, ttl)`
   - Auto-expire entries

2. Modify WebSocket flow
   - Server: `ws/scrape` routes task assignments
   - Extension: completes task, sends result
   - Server: forwards result to client WebSocket (not DB)
   - Client: stores in IndexedDB

3. Modify `scrapeTasks` table
   - Remove `result`, `errorMessage` columns
   - Keep for coordination only

4. Update scrape action handler
   - Check IndexedDB cache first
   - If miss, create task and wait for WebSocket result
   - Store result in IndexedDB

### Phase 4: Cleanup
1. Remove unused server-side code
   - LLM streaming logic in chat.ts
   - ATS proxy endpoints (if any)
   - Scrape result storage

2. Update documentation
   - Architecture docs
   - API docs (new config endpoints)
   - Privacy policy (no PII stored)

3. Migration for existing deployments
   - Clear `scrapeTasks.result` data
   - Ensure org LLM keys are configured

## API Changes Summary

### Modified Endpoints
```
GET /api/skills              # Metadata only (unchanged)
GET /api/skills/:slug        # Now returns RENDERED instructions with secrets
GET /api/skills/:slug/download # Now returns RENDERED SKILL.md with secrets
```

### Deprecated Endpoints
```
POST /api/chat               # Replaced by client-side LLM
PUT /api/v1/scrape/tasks/:id # Results no longer stored server-side
```

### Unchanged Endpoints
```
POST /api/auth/*             # Auth still server-side
POST /api/v1/scrape/tasks    # Create scrape task (URL only)
WS /ws/scrape                # Coordination (modified to forward results to client)
```

## Security Considerations

1. **Rendered Skills Contain Secrets**
   - Skills only rendered for authenticated users
   - Rendered content never logged
   - Skills scoped to user's org and role
   - Accept: Org admins trust their users with org's API keys

2. **Secrets in Browser Memory**
   - Rendered skills held in memory, not persisted
   - Cleared on page refresh
   - XSS risk: same as any authenticated web app

3. **IndexedDB Security**: Scrape results stored locally
   - Contains scraped page content, not credentials
   - User's device, user's responsibility

4. **CORS**: Direct API calls from browser
   - Anthropic API supports browser calls with `dangerouslyAllowBrowser: true`
   - ATS APIs may need thin proxy for CORS (URL pass-through only, no data storage)

## Rollout Strategy

1. **Feature flag**: `useClientSideChat` per org
2. **Gradual migration**: New orgs default to client-side
3. **Monitoring**: Track errors during transition
4. **Fallback**: Keep server-side chat available initially

## Success Metrics

- Zero PII in server logs
- Zero PII in database (except user accounts)
- Chat latency unchanged or improved (one less hop)
- No compliance/DPA requirements for AI features

## Timeline Estimate

- Phase 1: Client-side LLM - Core functionality
- Phase 2: Client-side ATS - When ATS integrations are needed
- Phase 3: Client-side scrape cache - Optimization
- Phase 4: Cleanup - After validation

## Open Questions

1. **ATS CORS**: Which ATS providers support browser calls?
   - May need thin proxy for some (URL rewriting only, no data storage)

2. **Offline support**: Should scrape cache persist across sessions?
   - Current plan: Yes, IndexedDB persists

3. **Multi-tab**: How to handle scrape WebSocket across tabs?
   - SharedWorker or BroadcastChannel

4. **Error handling**: Where do errors get logged?
   - Client-side only, user sees errors directly
   - Optional: anonymized error reporting (no PII)

5. **Skill template syntax**: Use `{{VAR}}` or something else?
   - `{{VAR}}` is simple and familiar (Handlebars-like)
   - Alternative: `${{VAR}}` to avoid conflicts with bash
   - Alternative: `%{VAR}%` for clarity

## Example: Rendered Config Skill

A special `_config` skill provides all credentials to the client:

**Template (in DB):**
```markdown
---
name: _config
intent: System configuration (auto-loaded)
---

## LLM Configuration
- Provider: {{LLM_PROVIDER}}
- API Key: {{LLM_API_KEY}}

## ATS Configuration
- Provider: {{ATS_PROVIDER}}
- Base URL: {{ATS_BASE_URL}}
- Token: {{ATS_TOKEN}}

## Skilldex Configuration
- API URL: {{SKILLDEX_API_URL}}
- API Key: {{SKILLDEX_API_KEY}}
```

**Rendered (sent to client):**
```markdown
---
name: _config
intent: System configuration (auto-loaded)
---

## LLM Configuration
- Provider: anthropic
- API Key: sk-ant-abc123...

## ATS Configuration
- Provider: greenhouse
- Base URL: https://harvest.greenhouse.io/v1
- Token: gh_token_xyz...

## Skilldex Configuration
- API URL: https://skilldex.example.com
- API Key: sk_live_user123...
```

Client parses this on mount, extracts credentials, uses for all subsequent calls.
