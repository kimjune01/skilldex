# Skillomatic Architecture

> **Purpose**: Comprehensive architecture reference for Claude Code instances working on this codebase.
>
> **Last Updated**: January 2026

## Overview

Skillomatic is a **Claude Code skills platform for recruiters**. Instead of traditional dashboards, recruiters interact with recruiting workflows (ATS operations, LinkedIn lookup, email drafting, interview scheduling) via natural language through Claude Code skills.

**Core Concept**: Recruiters download markdown skill files to `~/.claude/commands/` that authenticate back to the Skillomatic API for ATS data, integration tokens, and usage tracking.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOW SKILLOMATIC WORKS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Recruiter installs skill file to ~/.claude/commands/                 │
│                                                                          │
│  2. Skill contains:                                                      │
│     - Instructions for Claude (natural language)                         │
│     - API endpoints to call (Skillomatic API)                            │
│     - Embedded credentials (rendered at download time)                   │
│                                                                          │
│  3. When recruiter says "find React developers in SF":                   │
│     - Claude reads skill instructions                                    │
│     - Calls Skillomatic API with embedded API key                        │
│     - API proxies to ATS (Greenhouse, Lever, etc.)                       │
│     - Results returned to Claude → shown to recruiter                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 19 + Vite + Tailwind + shadcn/ui | SPA at `apps/web/` |
| **API** | Hono (TypeScript) | `apps/api/`, runs on Node.js locally, Lambda in prod |
| **Database** | SQLite (local) / Turso libSQL (prod) | Drizzle ORM |
| **Auth** | JWT (web) + API Keys (skills) | `sk_live_xxx` format |
| **OAuth** | Nango Cloud | Manages ATS/Calendar/Email OAuth tokens |
| **LLM** | Anthropic > OpenAI > Groq | Priority fallback chain |
| **Deployment** | SST (AWS Lambda + CloudFront) | `sst.config.ts` |

---

## Directory Structure

```
skillomatic/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── pages/          # Route components
│   │   │   ├── components/     # Reusable UI
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   └── lib/            # Frontend utilities
│   │   │       ├── llm-client.ts      # Client-side LLM streaming
│   │   │       ├── action-executor.ts # Client-side action routing
│   │   │       └── scrape-cache.ts    # IndexedDB cache
│   │   └── index.html
│   │
│   ├── api/                    # Hono API backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts            # Login, signup, sessions
│   │   │   │   ├── integrations.ts    # OAuth flow management
│   │   │   │   ├── skills.ts          # Skill listing/downloading
│   │   │   │   └── v1/                # Skill API (API key auth)
│   │   │   │       ├── ats.ts         # ATS proxy operations
│   │   │   │       ├── email.ts       # Gmail/email operations
│   │   │   │       ├── scrape.ts      # Web scraping tasks
│   │   │   │       └── errors.ts      # Error reporting
│   │   │   ├── lib/
│   │   │   │   ├── llm.ts             # Multi-provider LLM client
│   │   │   │   ├── nango.ts           # Nango OAuth client
│   │   │   │   ├── gmail.ts           # Gmail API client
│   │   │   │   ├── google-oauth.ts    # Google OAuth (Calendar, Gmail)
│   │   │   │   └── skill-renderer.ts  # Template variable rendering
│   │   │   └── middleware/
│   │   │       ├── auth.ts            # JWT verification
│   │   │       └── api-key.ts         # API key verification
│   │   └── index.ts
│   │
│   ├── mock-ats/               # Development ATS mock (port 3001)
│   │
│   └── skillomatic-scraper/    # Chrome extension for LinkedIn
│       ├── manifest.json
│       └── background.js
│
├── packages/
│   ├── db/                     # Database package
│   │   └── src/
│   │       ├── schema.ts       # Drizzle schema (all tables)
│   │       ├── index.ts        # DB client export
│   │       └── seed.ts         # Seed data
│   │
│   ├── shared/                 # Shared TypeScript types
│   │   └── src/
│   │       └── types.ts        # Integration types, API responses
│   │
│   └── mcp/                    # MCP protocol support (desktop)
│       └── src/
│           └── providers/      # ATS provider manifests
│
├── skills/                     # Pre-built Claude Code skills
│   ├── linkedin-lookup/
│   ├── ats-candidate-search/
│   ├── ats-candidate-crud/
│   ├── daily-report/
│   ├── email-draft/
│   ├── interview-scheduler/
│   └── meeting-notes/          # Stub - not implemented
│
├── docs/                       # Documentation
│
└── sst.config.ts               # SST deployment config
```

---

## Database Schema (Key Tables)

Located in `packages/db/src/schema.ts`:

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts, password hashes, org membership |
| `organizations` | Multi-tenant orgs, LLM/ATS config, integration permissions |
| `sessions` | JWT sessions with expiration |
| `apiKeys` | API keys for skills (`sk_live_xxx`), soft-deleted via `revokedAt` |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `integrations` | OAuth connections (provider, status, Nango connection ID) |
| `systemSettings` | Key-value config (LLM API keys, default provider) |

### Skill Tables

| Table | Purpose |
|-------|---------|
| `skills` | Skill definitions (slug, name, description, instructions) |
| `skillUsageLogs` | Usage tracking per skill/user |
| `skillProposals` | Community skill requests |

### RBAC Tables (Phase 2 - Ready but not enforced)

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions (admin, recruiter, viewer) |
| `permissions` | Permission definitions (skills:read, candidates:write) |
| `rolePermissions` | Role → Permission mapping |
| `userRoles` | User → Role assignment |
| `roleSkills` | Role → Skill access control |

---

## API Endpoint Structure

### Public Routes (No Auth)
```
POST /auth/login              # Email/password login
POST /auth/signup             # Create account
POST /auth/refresh            # Refresh JWT
GET  /docs/*                  # OpenAPI spec
POST /webhooks/nango          # Nango OAuth callback
```

### Protected Routes (JWT Auth)
```
GET  /integrations            # List connected integrations
POST /integrations/connect    # Start OAuth flow
POST /integrations/disconnect # Remove integration
GET  /skills                  # List available skills
GET  /skills/:slug            # Get skill metadata
GET  /skills/:slug/download   # Download rendered SKILL.md
GET  /api-keys                # List user's API keys
POST /api-keys                # Create new API key
GET  /organizations/*         # Org management (admin)
GET  /analytics/*             # Usage analytics (admin)
```

### Skill API Routes (API Key Auth - `sk_live_xxx`)
```
GET  /v1/ats/candidates       # Search candidates
POST /v1/ats/candidates       # Create candidate
GET  /v1/ats/candidates/:id   # Get candidate
PUT  /v1/ats/candidates/:id   # Update candidate
POST /v1/ats/proxy            # Generic ATS proxy
POST /v1/email/send           # Send email via Gmail
POST /v1/email/draft          # Create Gmail draft
POST /v1/scrape/tasks         # Create scrape task
GET  /v1/scrape/tasks/:id     # Get scrape result
POST /v1/errors               # Report client error
```

### WebSocket Routes
```
WS   /ws/scrape               # Real-time scrape task updates
```

---

## Current Integrations

### ATS Providers (via Nango)
| Provider | Status | Auth Type |
|----------|--------|-----------|
| Greenhouse | Supported | Basic Auth |
| Lever | Supported | Bearer Token |
| Ashby | Supported | Basic Auth |
| Workable | Supported | Bearer Token |
| Zoho Recruit | Supported | OAuth 2.0 |

### Email/Calendar (via Nango + Direct OAuth)
| Provider | Status | Notes |
|----------|--------|-------|
| Gmail | Supported | Direct OAuth, send/draft/search |
| Google Calendar | Supported | Direct OAuth, event management |
| Outlook/365 | Planned | Via Nango |
| Calendly | Planned | Via Nango |

### Other
| Integration | Status | Notes |
|-------------|--------|-------|
| LinkedIn | Supported | Via browser extension (user's session) |
| AWS SES | Supported | Transactional emails (invites, verification) |

---

## Ephemeral Architecture

Skillomatic uses an "ephemeral" architecture where **no PII passes through or is stored on the server**:

1. **Client-side LLM calls** - Chat runs in browser, calls Anthropic/OpenAI directly
2. **Stateless ATS proxy** - API proxies ATS calls but doesn't store request/response bodies
3. **Client-side scrape cache** - LinkedIn scrape results stored in IndexedDB, not server DB
4. **Skill rendering** - OAuth tokens embedded at download time, not stored long-term

See `docs/EPHEMERAL_ARCHITECTURE.md` for full details.

---

## Skill System

### Skill Structure
Skills are markdown files in `/skills/<slug>/SKILL.md` with YAML frontmatter:

```markdown
---
name: linkedin-lookup
description: Find candidates on LinkedIn
intent: User wants to find people on LinkedIn
capabilities:
  - Search LinkedIn profiles
  - Extract candidate information
requires:
  ats: read-write
  linkedin: enabled
allowed-tools:
  - Bash
  - Read
  - WebFetch
---

# LinkedIn Candidate Lookup

You are a recruiting assistant that helps find candidates on LinkedIn.

## API Endpoints

Use your API key: {{SKILLOMATIC_API_KEY}}

### Search Candidates
POST {{SKILLOMATIC_API_URL}}/v1/scrape/tasks
...
```

### Template Variables
Skills use `{{VAR}}` placeholders that are rendered at download time:

| Variable | Source |
|----------|--------|
| `{{SKILLOMATIC_API_KEY}}` | User's API key |
| `{{SKILLOMATIC_API_URL}}` | API base URL |
| `{{ATS_TOKEN}}` | Fresh OAuth token from Nango |
| `{{ATS_PROVIDER}}` | greenhouse, lever, etc. |
| `{{LLM_API_KEY}}` | Org's LLM API key |
| `{{CALENDAR_ICAL_URL}}` | User's calendar feed |

### Capability Gating
Skills specify required integrations in frontmatter. The skill renderer checks user has these before rendering:

```yaml
requires:
  ats: read-write    # Must have ATS connected with write access
  linkedin: enabled  # Must have extension installed
  calendar: any      # Must have some calendar integration
```

---

## LLM Configuration

### Provider Priority
The system selects LLM provider in this order:
1. Explicit request (`options.provider`)
2. Database setting (`llm.default_provider`)
3. Environment variable availability (`ANTHROPIC_API_KEY` > `OPENAI_API_KEY` > `GROQ_API_KEY`)

### Settings Storage
LLM API keys stored in `systemSettings` table:
- `llm.default_provider` - anthropic | openai | groq
- `llm.anthropic_api_key`
- `llm.openai_api_key`
- `llm.groq_api_key`

---

## Adding New Features

### Adding a New Skill
1. Create `/skills/<slug>/SKILL.md` with frontmatter
2. Add skill record to database via seed or admin UI
3. Test with `GET /skills/<slug>/download`

### Adding a New Integration Provider
1. Add OAuth config in Nango dashboard
2. Add provider to `packages/shared/src/types.ts`
3. Add provider config to `apps/api/src/routes/v1/ats.ts` (if ATS)
4. Add provider manifest to `packages/mcp/src/providers/manifests/` (if dynamic tools)

### Adding a New API Endpoint
1. Create route file in `apps/api/src/routes/` (or `routes/v1/` for skill API)
2. Add middleware (JWT or API key auth)
3. Register in `apps/api/src/app.ts`

---

## Development Commands

```bash
# Start all services
pnpm dev

# Start specific service
pnpm --filter @skillomatic/web dev      # Frontend on :5173
pnpm --filter @skillomatic/api dev      # API on :3000
pnpm --filter @skillomatic/mock-ats dev # Mock ATS on :3001

# Database
pnpm db:push      # Apply schema changes
pnpm db:generate  # Generate migrations
pnpm db:studio    # Open Drizzle Studio

# Build
pnpm build        # Build all packages
pnpm typecheck    # Run TypeScript check

# Deploy
pnpm sst deploy --stage prod
```

---

## Environment Variables

### Required
```env
JWT_SECRET=           # JWT signing key
NANGO_SECRET_KEY=     # Nango API authentication
GOOGLE_CLIENT_ID=     # Google OAuth
GOOGLE_CLIENT_SECRET= # Google OAuth
```

### Optional (Production)
```env
TURSO_DATABASE_URL=   # Turso database URL
TURSO_AUTH_TOKEN=     # Turso auth token
ANTHROPIC_API_KEY=    # Anthropic API key (fallback)
OPENAI_API_KEY=       # OpenAI API key (fallback)
GROQ_API_KEY=         # Groq API key (free tier fallback)
```

---

## Common Patterns

### API Key Authentication
```typescript
// Middleware extracts user from API key
app.use('/v1/*', apiKeyMiddleware);

// Route handler has access to user context
app.get('/v1/ats/candidates', async (c) => {
  const user = c.get('user');
  const org = c.get('organization');
  // ...
});
```

### OAuth Token Retrieval
```typescript
// Get fresh token from Nango
const token = await nango.getToken(connectionId);
```

### Skill Rendering
```typescript
// Render skill with user's credentials
const rendered = await renderSkill(skillContent, {
  SKILLOMATIC_API_KEY: user.apiKey,
  ATS_TOKEN: await nango.getToken(atsConnectionId),
  // ...
});
```

---

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest run apps/api/src/__tests__/auth.test.ts

# Run tests in watch mode
pnpm vitest
```

### Manual Testing
```bash
# Test API with curl
curl -H "Authorization: Bearer sk_live_xxx" \
  http://localhost:3000/v1/ats/candidates

# Test OAuth flow
open http://localhost:5173/integrations
```

---

## Troubleshooting

### "Unsupported provider"
- Provider not in `PROVIDER_CONFIG` in `apps/api/src/routes/v1/ats.ts`
- User's `atsProvider` doesn't match connected integration

### "No ATS integration connected"
- No integration record with `status='connected'`
- No Nango connection ID stored

### "Skill requires integration X"
- User hasn't connected required integration
- Check `requires:` in skill frontmatter

### Port already in use
```bash
lsof -ti:3000 | xargs kill  # Kill process on port 3000
lsof -ti:5173 | xargs kill  # Kill process on port 5173
```

---

## What's NOT Implemented

The following features are stubbed or planned but not yet built:

| Feature | Status | Location |
|---------|--------|----------|
| **Meeting transcription** | Stub | `skills/meeting-notes/SKILL.md` |
| **Audio file upload** | Not started | - |
| **Whisper API integration** | Not started | - |
| **Meeting platform OAuth** (Zoom, Fireflies) | Not started | - |
| **Admin query skills** | Not started | See `docs/EPHEMERAL_ARCHITECTURE.md` Phase 4 |
| **RBAC enforcement** | Tables ready | `packages/db/src/schema.ts` |
| **Calendly integration** | Planned | - |
| **Outlook/365 integration** | Planned | - |

---

## Call Transcription Integration (Future)

When implementing call transcription, consider these options:

### Option 1: Meeting Platform Integrations (via Nango OAuth)
- Zoom (native transcripts, requires paid plan)
- Google Meet (free tier available)
- Microsoft Teams (enterprise)
- Fireflies.ai (automatic meeting joins)
- Otter.ai (high quality)
- Granola (AI-enhanced notes)

### Option 2: Direct Audio Transcription APIs
- **OpenAI Whisper** - $0.006/min, already have OpenAI integration
- **Deepgram** - $0.0043/min, real-time streaming
- **AssemblyAI** - $0.0037/min, speaker diarization
- **Google Speech-to-Text** - $0.006/min, Google OAuth already set up

### Implementation Path
```
1. Add transcription endpoint
   └── apps/api/src/routes/v1/transcription.ts

2. Extend meeting-notes skill
   └── skills/meeting-notes/SKILL.md

3. Add meeting platform OAuth providers via Nango
   └── packages/shared/src/types.ts

4. Add database tables for transcripts
   └── packages/db/src/schema.ts
```

### Recommended Approach
Hybrid: Import from meeting platforms (Zoom, Meet, Teams) for scheduled meetings + Whisper API fallback for uploaded audio files.
