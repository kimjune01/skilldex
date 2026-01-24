# Skillomatic - Claude Code Instructions

## What This Project Is

Skillomatic is a Claude Code skills platform for recruiters. Recruiters download markdown skill files that authenticate back to this API for ATS data, integration tokens, and usage tracking.

## Documentation Index

**Start here:**
- `docs/ARCHITECTURE.md` - Tech stack, directory structure, API endpoints, database schema
- `docs/BEST_PRACTICES.md` - Critical guardrails, common mistakes to avoid

**Then read based on your task:**

| Task | Doc |
|------|-----|
| Working with integrations | `docs/INTEGRATION_GUIDE.md` |
| Modifying ATS/MCP tools | `docs/DYNAMIC_TOOLS_ARCHITECTURE.md` |
| Security/privacy changes | `docs/EPHEMERAL_ARCHITECTURE.md` |
| Adding/modifying skills | `docs/SKILLS_AND_CAPABILITIES.md` |
| Testing MCP server | `docs/MCP_MANUAL_TESTS.md` |

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
| Provider registry (single source of truth) | `packages/shared/src/providers.ts` |
| API routes | `apps/api/src/routes/` |
| Skill API (API key auth) | `apps/api/src/routes/v1/` |
| Provider manifests (MCP tools) | `packages/mcp/src/providers/manifests/` |
| Skills | `skills/<slug>/SKILL.md` |
| Shared types | `packages/shared/src/types.ts` |
| LLM client | `apps/api/src/lib/llm.ts` |
| Nango OAuth | `apps/api/src/lib/nango.ts` |
| Integration permissions | `apps/api/src/lib/integration-permissions.ts` |

## Development

```bash
pnpm dev          # Start all services (web:5173, api:3000, mock-ats:3001)
pnpm db:push      # Apply schema changes
pnpm db:studio    # Open Drizzle Studio
pnpm db:seed      # Reset and seed database with test data
pnpm typecheck    # Run TypeScript check
pnpm test         # Run tests
```

## Test Accounts

After `pnpm db:seed`: **demo@skillomatic.technology / demopassword123** (or any `@example.com` user with password `changeme`)

## Not Yet Implemented

- Meeting/call transcription (stub at `skills/meeting-notes/`)
- Audio file upload / Whisper API
- Meeting platform OAuth (Zoom, Fireflies, Otter.ai)
- RBAC enforcement (tables ready, not enforced)
- Admin query skills

## Testing

Always verify changes work before completing:
- Run `pnpm typecheck` for type errors
- Test API endpoints with `curl`
- Check browser console for frontend errors
- See `docs/MCP_MANUAL_TESTS.md` for MCP testing scenarios
