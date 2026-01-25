Deploy Skillomatic to production using SST.

## Quick Deploy

```bash
pnpm typecheck && \
TURSO_DATABASE_URL=$(turso db show skillomatic --url) \
TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic) \
pnpm --filter @skillomatic/db push && \
pnpm sst deploy --stage production && \
curl -sf "$(cat .sst/outputs.json | jq -r .api)/health" && \
echo "✓ Deploy complete"
```

Stops on first failure. Uses `drizzle-kit push` to sync schema (non-interactive).

## First-Time Setup

Set Turso credentials as SST secrets (one-time):

```bash
pnpm sst secret set TURSO_DATABASE_URL "$(turso db show skillomatic --url)" --stage production
pnpm sst secret set TURSO_AUTH_TOKEN "$(turso db tokens create skillomatic)" --stage production
```

## Manual Schema Sync

If schema gets out of sync, push directly to Turso:

```bash
TURSO_DATABASE_URL=$(turso db show skillomatic --url) \
TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic) \
pnpm --filter @skillomatic/db push
```

For complex migrations requiring data transforms, use turso db shell directly.

## Debugging

```bash
API_URL=$(cat .sst/outputs.json | jq -r .api)

# Health
curl -s "$API_URL/health" | jq .

# Login
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@skillomatic.technology","password":"Skillomatic2024"}' | jq .

# API key
curl -s -H "Authorization: Bearer sk_live_prod_super_admin_debug_key_2024" \
  "$API_URL/v1/me" | jq .
```

Test credentials: `superadmin@skillomatic.technology` / `Skillomatic2024`

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Invalid email or password" | `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm --filter @skillomatic/db seed:prod` |
| User not found | Same as above |
| Skills missing | Same as above |
| Schema out of sync / Failed query | Run manual schema sync (see above) |
| Column not found | Run `turso db shell skillomatic "PRAGMA table_info(TABLE_NAME);"` to check |
