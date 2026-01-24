Deploy Skillomatic to production using SST.

## Quick Deploy

```bash
pnpm typecheck && \
pnpm sst deploy --stage production && \
TURSO_DATABASE_URL=$(turso db show skillomatic --url) \
TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic) \
pnpm --filter @skillomatic/db seed:prod && \
curl -sf "$(cat .sst/outputs.json | jq -r .api)/health" && \
echo "✓ Deploy complete"
```

Stops on first failure. If health check fails, investigate manually.

## First-Time Setup

Set Turso credentials as SST secrets (one-time):

```bash
pnpm sst secret set TURSO_DATABASE_URL "$(turso db show skillomatic --url)" --stage production
pnpm sst secret set TURSO_AUTH_TOKEN "$(turso db tokens create skillomatic)" --stage production
```

## Schema Changes

If you changed `packages/db/src/schema.ts`:

```bash
pnpm --filter @skillomatic/db generate  # Create migration
pnpm --filter @skillomatic/db migrate   # Apply to prod (needs TURSO_* env vars)
```

## Debugging

```bash
API_URL=$(cat .sst/outputs.json | jq -r .api)

# Health
curl -s "$API_URL/health" | jq .

# Login
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@skillomatic.technology","password":"Skillomatic2024!"}' | jq .

# API key
curl -s -H "Authorization: Bearer sk_live_prod_super_admin_debug_key_2024" \
  "$API_URL/v1/me" | jq .
```

Test credentials: `superadmin@skillomatic.technology` / `Skillomatic2024!`

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Invalid email or password" | `pnpm --filter @skillomatic/db seed:prod` |
| User not found | `pnpm --filter @skillomatic/db seed:prod` |
| Skills missing | `pnpm --filter @skillomatic/db seed:prod` |
| Schema out of sync | `pnpm --filter @skillomatic/db generate && migrate` |
