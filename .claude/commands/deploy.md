Deploy Skillomatic to production using SST.

<!-- RELATED: This command is paired with /rollback. Keep deployment logic in sync. -->
<!-- When updating: check /rollback for health endpoints, verification steps -->

## Quick Deploy

Run these commands in sequence. Stop if any fails.

1. Check git is clean and get hash:
```bash
git diff --quiet && git diff --cached --quiet || echo "ERROR: Uncommitted changes"
```

2. Check what changed since last deploy:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -1
```
Use the tag number from above:
```bash
git diff --name-only <TAG>..HEAD
```

Analyze the changed files to determine which services need deployment:

| Changed Path | Affects |
|-------------|---------|
| `apps/api/` | API (Lambda) |
| `apps/web/` | Web (CloudFront) |
| `apps/mcp-server/` | MCP (ECS - slow, ~2min) |
| `packages/db/` | API, MCP (both use DB) |
| `packages/shared/` | API, Web, MCP (all use shared) |
| `packages/mcp/` | API (MCP tools in API) |
| `sst.config.ts` | All services |
| `skills/` | None (runtime data) |

If NO changes affect deployable services (e.g., only docs, .claude/, skills/), skip to step 8 and report "No deployment needed."

If MCP server has no changes (no `apps/mcp-server/`, `packages/db/`, `packages/shared/`, or `sst.config.ts` changes), note that MCP won't be redeployed and verification can skip MCP hash check.

3. Run typecheck:
```bash
pnpm typecheck
```

4. Push schema to prod (skip if no `packages/db/` changes):
```bash
pnpm db:push:prod
```

5. Deploy with git hash using selective targeting:

Based on the changed files from step 2, use `--target` to deploy only affected services:

```bash
# If ALL services need deployment (sst.config.ts changed, or first deploy):
GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production

# If only API needs deployment (apps/api/, packages/mcp/ changes):
GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production --target Api --target ApiRouter

# If only Web needs deployment (apps/web/ changes):
GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production --target Web

# If only MCP needs deployment (apps/mcp-server/ changes):
GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production --target McpService

# Combine targets as needed, e.g., API + Web (no MCP):
GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production --target Api --target ApiRouter --target Web
```

**Target mapping:**
| Service | SST Targets |
|---------|-------------|
| API | `--target Api --target ApiRouter` |
| Web | `--target Web` |
| MCP | `--target McpService` (slow ~2min, skip when possible) |

**Decision logic:**
- `sst.config.ts` changed → deploy all (no --target)
- `packages/db/` or `packages/shared/` changed → deploy all affected services
- Only `apps/api/` or `packages/mcp/` → target Api + ApiRouter
- Only `apps/web/` → target Web
- Only `apps/mcp-server/` → target McpService

6. Verify services are responding and git hashes match (call in parallel):
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://mcp.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://skillomatic.technology" | grep 'git-hash' | sed 's/.*content="\([^"]*\)".*/\1/'
```

**Hash verification rules:**
- API and Web hashes must always match the local commit
- MCP hash must match local commit ONLY if MCP was deployed (see step 2)
- If MCP wasn't deployed, its hash will still show the previous deploy's hash - this is expected

Retry with exponential backoff (2-64s) if CDN hasn't propagated or MCP hasn't rolled over (ECS rolling deployment can take up to 2 minutes).

7. Create and push incremented version tag:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -1
```
Increment the tag number manually (e.g., if output is `17`, use `18`):
```bash
git tag <NEW_TAG> && git push origin <NEW_TAG>
```

8. Report success with deployed services, git hashes, and the new version tag.

Stops on first failure. **Uses `--target` flag for selective deployment to skip slow MCP builds when possible.** Uses exponential backoff (2-64s) for CDN propagation. Uses `drizzle-kit push` to sync schema to Turso.

Note: Schema changes should deprecate columns before removing them to support rollbacks. See `/rollback` command.

## First-Time Setup

Set secrets as SST secrets (one-time). Note: names must match `sst.config.ts`:

```bash
pnpm sst secret set TursoDatabaseUrl "$(turso db show skillomatic --url)" --stage production
pnpm sst secret set TursoAuthToken "$(turso db tokens create skillomatic)" --stage production
pnpm sst secret set JwtSecret "$(openssl rand -hex 32)" --stage production
pnpm sst secret set GoogleClientId "$GOOGLE_CLIENT_ID" --stage production
pnpm sst secret set GoogleClientSecret "$GOOGLE_CLIENT_SECRET" --stage production
```

## Seed Production Database

After schema push or DB recreation:

```bash
TURSO_DATABASE_URL=$(turso db show skillomatic --url) \
TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic) \
pnpm --filter @skillomatic/db seed:prod
```

## Debugging

```bash
# API Health
curl -s "https://api.skillomatic.technology/health" | jq .

# MCP Server Health
curl -s "https://mcp.skillomatic.technology/health" | jq .

# Login
curl -s -X POST "https://api.skillomatic.technology/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@skillomatic.technology","password":"Skillomatic2024"}' | jq .

# API key auth
curl -s -H "Authorization: Bearer sk_live_prod_super_admin_debug_key_2024" \
  "https://api.skillomatic.technology/v1/me" | jq .
```

Test credentials: `superadmin@skillomatic.technology` / `Skillomatic2024`

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Invalid email or password" | Seed prod database (see above) |
| "Failed query" with SQL | Schema out of sync - run `pnpm db:push:prod` |
| Lambda using stale secrets | Run `pnpm sst secret set TursoAuthToken "$(turso db tokens create skillomatic)" --stage production` |
| Recreate database from scratch | `turso db destroy skillomatic --yes && turso db create skillomatic`, then push schema + seed + update SST secrets |

## SST Secrets Note

Secrets are accessed at runtime via `Resource` import (not env vars). When you run `sst secret set`, SST automatically restarts Lambda containers to pick up new values. Secret names must match exactly:

- `TursoDatabaseUrl` (not TURSO_DATABASE_URL)
- `TursoAuthToken` (not TURSO_AUTH_TOKEN)
- `JwtSecret`, `NangoSecretKey`, `NangoPublicKey`, `GoogleClientId`, `GoogleClientSecret`
