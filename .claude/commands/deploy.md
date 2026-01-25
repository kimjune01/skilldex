Deploy Skillomatic to production using SST.

## Quick Deploy

```bash
pnpm typecheck && \
pnpm db:push:prod && \
pnpm sst deploy --stage production && \
curl -sf "https://api.skillomatic.technology/health" && \
echo "✓ Deploy complete"
```

Stops on first failure. Uses `drizzle-kit push` to sync schema to Turso.

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
# Health
curl -s "https://api.skillomatic.technology/health" | jq .

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
