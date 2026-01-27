Deploy Skillomatic to production using SST.

<!-- RELATED: This command is paired with /rollback. Keep deployment logic in sync. -->
<!-- When updating: check /rollback for health endpoints, verification steps -->

## Quick Deploy

Run these commands in sequence. Stop if any fails.

1. Check git is clean and get hash:
```bash
git diff --quiet && git diff --cached --quiet || echo "ERROR: Uncommitted changes"
```

2. Check extension zip version matches manifest, rebuild if needed:
```bash
MANIFEST_VERSION=$(grep '"version"' apps/skillomatic-scraper/manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
ZIP_VERSION=$(unzip -p apps/web/public/skillomatic-scraper.zip manifest.json 2>/dev/null | grep '"version"' | sed 's/.*"\([0-9.]*\)".*/\1/')
if [ "$MANIFEST_VERSION" != "$ZIP_VERSION" ]; then
  echo "Extension zip version ($ZIP_VERSION) doesn't match manifest ($MANIFEST_VERSION). Rebuilding..."
  cd apps/skillomatic-scraper && rm -f ../web/public/skillomatic-scraper.zip && zip -r ../web/public/skillomatic-scraper.zip . -x 'node_modules/*' -x '*.git*' -x '*.DS_Store' && cd ../..
  echo "Rebuilt extension zip with version $MANIFEST_VERSION"
else
  echo "OK: Extension zip version matches ($MANIFEST_VERSION)"
fi
```

3. Check what changed since last deploy:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -1
```
Use the tag number from above:
```bash
git diff --name-only <TAG>..HEAD
```

Analyze the changed files to determine if deployment is needed:

| Changed Path | Affects |
|-------------|---------|
| `apps/api/` | API (Lambda) |
| `apps/web/` | Web (CloudFront) |
| `apps/mcp-server/` | MCP (ECS) |
| `packages/db/` | API, MCP (both use DB) |
| `packages/shared/` | API, Web, MCP (all use shared) |
| `packages/mcp/` | API (MCP tools in API) |
| `sst.config.ts` | All services |
| `skills/` | None (runtime data) |

If NO changes affect deployable services (e.g., only docs, .claude/, skills/), skip to step 9 and report "No deployment needed."

4. Run typecheck:
```bash
pnpm typecheck
```

5. Push schema to prod (skip if no `packages/db/` changes):
```bash
pnpm db:push:prod
```

6. Bump Docker cache bust if MCP-related changes (packages/mcp/, apps/mcp-server/, packages/db/):
```bash
# Check current cache bust version
grep 'CACHEBUST=v' apps/mcp-server/Dockerfile
```
If MCP-related files changed, increment the version number (e.g., v6 → v7):
```bash
sed -i '' 's/CACHEBUST=v[0-9]*/CACHEBUST=v<NEW_VERSION>/' apps/mcp-server/Dockerfile
git add apps/mcp-server/Dockerfile && git commit -m "Bump Docker cache bust" && git push
```

7. Deploy with git hash:

```bash
SKILLOMATIC_DEPLOY=1 GIT_HASH="$(git rev-parse --short HEAD)" pnpm sst deploy --stage production
```

> **Note:** Always run a full deploy (no `--target` flag). SST v3's `--target` flag has known issues where Lambda code may not update reliably. The MCP Docker build is cached when unchanged, so full deploys are fast.

8. Verify services are responding and git hashes match (call in parallel):
```bash
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://mcp.skillomatic.technology/health" | jq -r '.gitHash'
```
```bash
curl -s "https://skillomatic.technology" | grep 'git-hash' | sed 's/.*content="\([^"]*\)".*/\1/'
```

All three hashes must match the local commit. Retry with exponential backoff (2-64s) if CDN hasn't propagated or MCP hasn't rolled over (ECS rolling deployment can take up to 2 minutes).

9. Create and push incremented version tag:
```bash
git tag --list '[0-9]*' --sort=-v:refname | head -1
```
Increment the tag number manually (e.g., if output is `17`, use `18`):
```bash
git tag <NEW_TAG> && git push origin <NEW_TAG>
```

10. Report success with deployed services, git hashes, and the new version tag.

Stops on first failure. Always runs full deploy (MCP Docker is cached when unchanged). Uses exponential backoff (2-64s) for CDN propagation. Uses `drizzle-kit push` to sync schema to Turso.

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
