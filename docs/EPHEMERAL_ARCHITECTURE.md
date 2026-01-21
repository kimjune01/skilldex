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

## Core Concept: Skill Rendering with Capability Gating

Skills are individual objects in the database, each with a specific purpose. When a user requests a skill, the server:

1. **Checks capability requirements** - Does user have required integrations?
2. **Renders the skill** - Replaces `{{VAR}}` placeholders with actual credentials
3. **Returns the rendered skill** - Ready to use with embedded secrets

### Why This Model?

1. **Skills as objects** - Each skill is a row in DB, can be enabled/disabled, assigned to roles, versioned
2. **Progressive disclosure** - Metadata in system prompt, full instructions loaded on demand
3. **Capability gating** - Fail fast if user lacks required integrations
4. **Fresh credentials** - OAuth tokens fetched at render time, not stale

### Capability Profile (for Gating)

The capability profile determines what a user has access to:

```typescript
interface CapabilityProfile {
  // Core (always available)
  skilldexApiKey: string;
  skilldexApiUrl: string;

  // LLM (required for chat)
  llm?: {
    provider: 'anthropic' | 'openai' | 'groq';
    apiKey: string;
    model: string;
  };

  // ATS (optional)
  ats?: {
    provider: 'greenhouse' | 'lever' | 'ashby';
    token: string;
    baseUrl: string;
  };

  // LinkedIn (optional - extension-based)
  linkedin?: {
    enabled: true;  // Just needs extension, no token
  };

  // Calendar (optional)
  calendar?: {
    ical?: {
      url: string;           // Validated free/busy feed
      provider: 'google' | 'outlook';
    };
    calendly?: {
      token: string;         // OAuth token
      userUri: string;       // Calendly user URI
      schedulingUrl: string; // Base booking URL
    };
  };

  // Email (mailto always available, read access optional)
  email?: {
    mailto: true;  // Always available
    read?: {       // Optional OAuth for reading
      provider: 'gmail' | 'outlook';
      token: string;
    };
  };
}
```

### Skill Rendering Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  User/LLM requests: GET /api/skills/linkedin-lookup                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Load skill from DB                                               │
│     - Get metadata, instructions, requiredIntegrations              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. Check capability requirements                                    │
│     - skill.requiredIntegrations = ['ats', 'linkedin']              │
│     - Does user have these? If not → 400 error with clear message   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Build capability profile                                         │
│     - Fetch fresh OAuth tokens from Nango                           │
│     - Get org's LLM key, ATS config                                 │
│     - Get user's iCal URL, Calendly settings                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Render skill                                                     │
│     - Replace {{ATS_TOKEN}} → "ghp_abc123..."                       │
│     - Replace {{SKILLDEX_API_KEY}} → "sk_live_user123..."           │
│     - etc.                                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Return rendered skill                                            │
│     - Full instructions with embedded credentials                   │
│     - Ready to execute                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Capability Gating Example

```typescript
async function loadAndRenderSkill(slug: string, userId: string): Promise<string> {
  // 1. Load skill
  const skill = await getSkillBySlug(slug);
  if (!skill) throw new NotFoundError(`Skill '${slug}' not found`);

  // 2. Build capability profile
  const profile = await buildCapabilityProfile(userId);

  // 3. Check requirements
  const missing = checkRequirements(skill.requiredIntegrations, profile);
  if (missing.length > 0) {
    throw new BadRequestError(
      `This skill requires: ${missing.join(', ')}. ` +
      `Please connect these integrations in Settings.`
    );
  }

  // 4. Render and return
  return renderSkill(skill.instructions, profile);
}

function checkRequirements(required: string[], profile: CapabilityProfile): string[] {
  const missing: string[] = [];

  for (const req of required) {
    switch (req) {
      case 'ats':
        if (!profile.ats) missing.push('ATS (Greenhouse, Lever, etc.)');
        break;
      case 'calendly':
        if (!profile.calendar?.calendly) missing.push('Calendly');
        break;
      case 'calendar':
        if (!profile.calendar?.ical && !profile.calendar?.calendly)
          missing.push('Calendar (iCal or Calendly)');
        break;
      case 'email-read':
        if (!profile.email?.read) missing.push('Email (Gmail or Outlook)');
        break;
      // linkedin always available (extension-based)
    }
  }

  return missing;
}
```

### How It Works Across Interfaces

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Skilldex API                                      │
│                                                                      │
│  GET /api/skills/:slug                                              │
│  - Checks user has required integrations                            │
│  - Fetches fresh OAuth tokens from Nango                            │
│  - Renders skill with embedded credentials                          │
│  - Returns ready-to-use skill                                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Same endpoint, same behavior
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐                ┌──────────────┐
      │     Web      │                │   Desktop    │
      │  Interface   │                │ Claude Code  │
      │              │                │              │
      │ LLM calls    │                │ SKILL.md     │
      │ load_skill   │                │ calls API    │
      │ action       │                │ via curl     │
      └──────────────┘                └──────────────┘
```

### Desktop: Individual Skills

Each skill can be a thin wrapper that fetches from API:

**~/.claude/commands/linkedin-lookup.md:**
```markdown
---
name: linkedin-lookup
description: Find candidates on LinkedIn
---

# LinkedIn Lookup

Fetch your rendered skill:

\`\`\`bash
curl -s -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  "${SKILLDEX_API_URL:-https://app.skilldex.io}/api/skills/linkedin-lookup"
\`\`\`

Follow the instructions in the response.
```

Or a single generic skill that takes a slug:

**~/.claude/commands/skilldex.md:**
```markdown
---
name: skilldex
description: Load any Skilldex skill by name
---

# Skilldex

Usage: /skilldex <skill-name>

Fetch the requested skill:

\`\`\`bash
curl -s -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  "${SKILLDEX_API_URL:-https://app.skilldex.io}/api/skills/$1"
\`\`\`

If the skill requires integrations you haven't connected, you'll get an error
explaining what to set up.
```

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

## Email & Calendar Integration

Email and calendar integrations follow the ephemeral model using native protocols that require no server involvement.

### Calendar: Free/Busy iCal Feed (Read-Only)

Google Calendar and Outlook provide iCal feed URLs with **free/busy only** permission - shows availability without event details.

**Why free/busy only:**
- Full calendar feeds contain PII (attendee names, meeting titles, locations)
- Free/busy feeds only show "Busy" time blocks - no sensitive data
- Sufficient for scheduling: "Are you free Tuesday at 2pm?"

**How it works:**
1. User publishes calendar with **"free/busy only"** permission
2. User pastes iCal URL in Skilldex Integrations page
3. Server validates the feed contains no PII (see validation below)
4. Rendered skill includes the validated iCal URL
5. Client fetches calendar data directly - no OAuth needed

**User setup (Google Calendar):**
1. Go to calendar.google.com → Settings
2. Click on your calendar under "Settings for my calendars"
3. Under "Access permissions", click "Share with specific people" or "Make available to public"
4. Select **"See only free/busy (hide details)"**
5. Scroll to "Integrate calendar"
6. Copy "Secret address in iCal format"

**User setup (Outlook):**
1. Go to Outlook → Settings → Calendar → Shared calendars
2. Under "Publish a calendar", select your calendar
3. Set permission to **"Can view when I'm busy"** (availability only)
4. Click Publish and copy the ICS link

**Example free/busy iCal content:**
```ical
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260120T140000Z
DTEND:20260120T150000Z
SUMMARY:Busy
END:VEVENT
END:VCALENDAR
```

Note: Only "Busy" appears - no meeting title, attendees, or location.

**Validation on save:**

When user saves their iCal URL, server fetches and validates:

```typescript
async function validateFreeBusyOnly(icalUrl: string): Promise<{ valid: boolean; error?: string }> {
  const response = await fetch(icalUrl);
  const icalData = await response.text();

  // Red flags - indicates full details, not free/busy
  const piiPatterns = [
    { pattern: /ATTENDEE:/i, field: 'attendees' },
    { pattern: /LOCATION:.{3,}/i, field: 'locations' },  // Location with actual content
    { pattern: /DESCRIPTION:.{3,}/i, field: 'descriptions' },
    { pattern: /ORGANIZER:.*mailto:/i, field: 'organizer emails' },
    // Summary that's not just Busy/Free/Available/Unavailable
    { pattern: /SUMMARY:(?!Busy|Free|Available|Unavailable|No title).{3,}/i, field: 'event titles' },
  ];

  for (const { pattern, field } of piiPatterns) {
    if (pattern.test(icalData)) {
      return {
        valid: false,
        error: `Calendar contains ${field}. Please re-publish with "free/busy only" permission.`
      };
    }
  }

  return { valid: true };
}
```

**UI flow:**
```
User pastes iCal URL → Click "Save"
         ↓
Server fetches and validates
         ↓
┌─────────────────────────────────────────────────────┐
│ If PII detected:                                    │
│ "⚠️ This calendar contains event details (titles,  │
│ attendees). Please re-publish with 'free/busy      │
│ only' permission and try again."                   │
│                                                     │
│ [Instructions for Google] [Instructions for Outlook]│
└─────────────────────────────────────────────────────┘
         ↓
If valid: Save URL to integrations table
```

**Rendered in skill:**
```markdown
## Your Availability
To check your free/busy times:

GET {{CALENDAR_ICAL_URL}}

Parse the iCal response. Time blocks marked "Busy" are unavailable.
```

**Benefits:**
- No OAuth flow required
- No token refresh needed
- Direct browser fetch (CORS-friendly)
- No PII in feed (validated on save)
- Read-only by design

**Variables to add:**
```
{{CALENDAR_ICAL_URL}}    - User's validated free/busy iCal feed URL
{{CALENDAR_PROVIDER}}    - 'google' | 'outlook' | 'other'
```

### Calendar: Calendly Integration (Optional)

For users with Calendly, we can provide a better scheduling experience via Nango OAuth.

**Why Calendly:**
- Recruiters often use Calendly for interview scheduling
- Candidates book themselves - no calendar write access needed
- Claude can include booking links in outreach emails

**How it works:**
1. User connects Calendly via Nango OAuth in Integrations page
2. Rendered skill gets fresh access token via `{{CALENDLY_ACCESS_TOKEN}}`
3. Client calls Calendly API directly to fetch event types and scheduling links
4. Claude includes booking link in outreach: "Book a time: https://calendly.com/recruiter/interview"

**Calendly API capabilities:**
| Endpoint | Use Case |
|----------|----------|
| `GET /event_types` | List user's event types (30-min call, 1-hr interview) |
| `GET /scheduled_events` | See upcoming bookings |
| `GET /user` | Get user's Calendly profile and scheduling URL |

**Example rendered skill:**
```markdown
## Scheduling

To get your Calendly booking links:

```javascript
// Get event types
fetch('https://api.calendly.com/event_types?user={{CALENDLY_USER_URI}}', {
  headers: { 'Authorization': 'Bearer {{CALENDLY_ACCESS_TOKEN}}' }
})
```

Include the scheduling_url in your outreach emails.
```

**Example Claude output:**
```markdown
I've drafted an outreach email for Sarah Chen:

📧 [Send email](mailto:sarah@example.com?subject=Senior%20Engineer%20at%20Acme&body=Hi%20Sarah%2C%0A%0A...%0A%0ABook%20a%20time%20to%20chat%3A%20https%3A%2F%2Fcalendly.com%2Fyou%2F30min-interview)

The email includes your Calendly link for 30-minute interviews.
```

**Variables to add:**
```
{{CALENDLY_ACCESS_TOKEN}}  - Fresh OAuth token from Nango
{{CALENDLY_USER_URI}}      - User's Calendly URI (e.g., https://api.calendly.com/users/abc123)
{{CALENDLY_SCHEDULING_URL}} - User's base scheduling URL
```

**Benefits over iCal:**
- Can fetch actual booking links (not just free/busy)
- Candidate self-schedules - no back-and-forth
- See upcoming interviews
- Still ephemeral - token embedded, API called client-side

**When to use which:**

| User Has | Calendar Approach |
|----------|-------------------|
| Calendly | Use Calendly API for scheduling links |
| Google/Outlook only | Use free/busy iCal for availability checks |
| Both | Calendly for scheduling, iCal as fallback |

### Email: mailto: Links (Send-Only)

For sending emails, use `mailto:` links that open the user's default email client with pre-filled content.

**How it works:**
1. Claude drafts an email based on user request
2. Output includes a `mailto:` link with pre-filled fields
3. User clicks link → opens in their email client (Gmail, Outlook, Apple Mail)
4. User reviews, edits if needed, and sends

**Example skill output:**
```markdown
## Draft Email Ready

I've prepared an outreach email for Sarah Chen:

**To:** sarah.chen@example.com
**Subject:** Senior Engineer Role at Acme Corp

---

Hi Sarah,

I came across your profile and was impressed by your experience with distributed systems at Google. We have a Senior Engineer opening that might interest you...

Best regards,
[Your name]

---

📧 [Click to open in your email client](mailto:sarah.chen@example.com?subject=Senior%20Engineer%20Role%20at%20Acme%20Corp&body=Hi%20Sarah%2C%0A%0AI%20came%20across%20your%20profile...)
```

**mailto: format:**
```
mailto:recipient@example.com?subject=URL%20Encoded%20Subject&body=URL%20Encoded%20Body&cc=copy@example.com&bcc=blind@example.com
```

**Benefits:**
- No OAuth or API keys needed
- No server involvement
- User's own email client sends (audit trail in their Sent folder)
- User always reviews before sending (no accidental sends)
- Works with any email provider

**Limitations:**
- Plain text only (no HTML formatting)
- No attachments
- ~2000 character limit (varies by client)
- User must click to send (not automated)

### Email: Gmail/Outlook API (Read-Only, Optional)

For reading emails (e.g., checking for candidate replies), OAuth is required:

**How it works:**
1. User connects Gmail/Outlook via Nango OAuth
2. Rendered skill includes fresh access token
3. Client calls Gmail/Outlook API directly
4. Read-only scope: `gmail.readonly` or `Mail.Read`

**Variables to add:**
```
{{EMAIL_ACCESS_TOKEN}}   - Fresh OAuth token (from Nango)
{{EMAIL_PROVIDER}}       - 'gmail' | 'outlook'
```

**Example rendered skill:**
```markdown
## Check Email Replies

Search for candidate replies:

```javascript
fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:candidate@example.com', {
  headers: { 'Authorization': 'Bearer {{EMAIL_ACCESS_TOKEN}}' }
})
```
```

**Note:** This is optional and more complex than the mailto: approach. Recommended only if reading emails is a core requirement.

### Database Changes for Email/Calendar

```sql
-- Add to users table (or separate user_settings table)
ALTER TABLE users ADD COLUMN calendar_ical_url TEXT;      -- Private iCal feed URL
ALTER TABLE users ADD COLUMN calendar_provider TEXT;       -- 'google' | 'outlook'
ALTER TABLE users ADD COLUMN email_provider TEXT;          -- 'gmail' | 'outlook' (for read-only)
-- Email OAuth handled by Nango integrations table
```

### Summary: Email & Calendar Approach

| Feature | Method | OAuth Required | Server Involvement |
|---------|--------|----------------|-------------------|
| **Read calendar** | iCal feed URL | No | No |
| **Send email** | mailto: link | No | No |
| **Read email** | Gmail/Outlook API | Yes (Nango) | Token fetch only |

This approach keeps email and calendar fully ephemeral - no PII passes through Skilldex servers.
