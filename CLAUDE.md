# Skillomatic - Claude Code Instructions

## Quick Start

**Read these docs first:**
- `docs/ARCHITECTURE.md` - Full architecture reference (tech stack, directory structure, API endpoints, database schema)
- `docs/EPHEMERAL_ARCHITECTURE.md` - PII-free design, skill rendering, OAuth flow
- `docs/DYNAMIC_TOOLS_ARCHITECTURE.md` - MCP provider manifests, ATS proxy

## What This Project Is

Skillomatic is a Claude Code skills platform for recruiters. Recruiters download markdown skill files that authenticate back to this API for ATS data, integration tokens, and usage tracking.

## Tech Stack Summary

- **Frontend**: React 19 + Vite + Tailwind (`apps/web/`)
- **API**: Hono on Node.js/Lambda (`apps/api/`)
- **Database**: SQLite (local) / Turso libSQL (prod), Drizzle ORM (`packages/db/`)
- **OAuth**: Nango Cloud for ATS/Calendar/Email tokens
- **LLM**: Anthropic > OpenAI > Groq (priority fallback)

## Key Files

| Purpose | Location |
|---------|----------|
| Database schema | `packages/db/src/schema.ts` |
| API routes | `apps/api/src/routes/` |
| Skill API (API key auth) | `apps/api/src/routes/v1/` |
| Skills | `skills/<slug>/SKILL.md` |
| Shared types | `packages/shared/src/types.ts` |
| LLM client | `apps/api/src/lib/llm.ts` |
| Nango OAuth | `apps/api/src/lib/nango.ts` |

## Development

```bash
pnpm dev          # Start all services (web:5173, api:3000, mock-ats:3001)
pnpm db:push      # Apply schema changes
pnpm db:studio    # Open Drizzle Studio
pnpm typecheck    # Run TypeScript check
```

## Not Yet Implemented

- Meeting/call transcription (stub at `skills/meeting-notes/`)
- Audio file upload / Whisper API
- Meeting platform OAuth (Zoom, Fireflies, Otter.ai)
- RBAC enforcement (tables ready, not enforced)
- Admin query skills

## Critical Guardrails

| Don't | Do Instead |
|-------|------------|
| Log `error.message` to DB | Use `ErrorCode` enum (PII risk) |
| Store LLM conversations server-side | Client-side only (ephemeral architecture) |
| Cache ATS response bodies | Stateless proxy, log only metadata |
| Use `apiKeyAuth` on `/v1/*` routes | Use `combinedAuth` (supports JWT + API key) |
| Add ATS endpoints as new routes | Add to provider manifest in `packages/mcp/` |

See `docs/BEST_PRACTICES.md` for full context.

## Testing

Always verify changes work before completing:
- Run `pnpm typecheck` for type errors
- Test API endpoints with `curl`
- Check browser console for frontend errors
