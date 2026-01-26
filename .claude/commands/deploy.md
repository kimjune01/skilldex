Deploy Skillomatic to production using SST.

## Quick Deploy

Run these commands in sequence. Stop if any fails.

1. Check git is clean and get hash:
```bash
git diff --quiet && git diff --cached --quiet || echo "ERROR: Uncommitted changes"
```

2. Run typecheck:
```bash
pnpm typecheck
```

3. Push schema to prod:
```bash
pnpm db:push:prod
```

4. Deploy with git hash:
```bash
GIT_HASH=$(git rev-parse --short HEAD) pnpm sst deploy --stage production
```

5. Verify API, MCP, and web are responding (call all curl commands in parallel):
```bash
curl -s "https://api.skillomatic.technology/health"
```
```bash
curl -s "https://mcp.skillomatic.technology/health"
```
```bash
curl -s "https://skillomatic.technology" | grep -o 'git-hash" content="[^"]*'
```
Retry web check with exponential backoff (2-64s) if CDN hasn't propagated yet. MCP server may take up to 2 minutes to update (ECS rolling deployment).

6. Create and push incremented version tag:
```bash
LAST_TAG=$(git tag --list '[0-9]*' --sort=-v:refname | head -1)
```
```bash
NEW_TAG=$((LAST_TAG + 1))
git tag "$NEW_TAG" && git push origin "$NEW_TAG"
```

7. Report success with both hashes and the new version tag.

Stops on first failure. Verifies both API and web git hashes match local commit. Uses exponential backoff (2-64s) for CDN propagation. Uses `drizzle-kit push` to sync schema to Turso.

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
