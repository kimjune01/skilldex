Deploy Skillomatic to production using SST.

## Quick Deploy (All Steps)

Run all steps in sequence:

```bash
# 1. Set Turso credentials
export TURSO_DATABASE_URL=$(turso db show skillomatic --url)
export TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic)

# 2. Run database migrations
pnpm --filter @skillomatic/db migrate

# 3. Deploy infrastructure
pnpm sst deploy --stage production

# 4. CRITICAL: Run seed to ensure users/skills are properly configured
pnpm --filter @skillomatic/db seed:prod

# 5. Verify login works
curl -s -X POST "$(cat .sst/outputs.json | jq -r .api)/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@skillomatic.technology","password":"Skillomatic2024!"}'
```

## Important Notes

**CRITICAL**: Always run `seed:prod` AFTER deployment. The seed script:
- Creates/updates test users with properly hashed passwords
- Ensures all skills from `skills/` directory are in the database
- Creates the super admin API key for debugging
- Is idempotent - safe to run multiple times

Without running seed, users may exist in the database but have incorrect password hashes, causing "Invalid email or password" errors on login.

## Database Schema Management

**Use migrations, not push, for production:**

```bash
# Generate a new migration after schema changes
pnpm --filter @skillomatic/db generate

# Apply migrations to production
pnpm --filter @skillomatic/db migrate
```

- `generate` - Creates SQL migration files from schema.ts changes (review before applying)
- `migrate` - Applies pending migrations to the database (safe, tracks what's applied)
- `push` - Direct schema sync (dev only, can lose data, doesn't track changes)

Migration files are in `packages/db/drizzle/` and should be committed to git.

## Detailed Steps

### Step 1: Set Turso credentials

```bash
export TURSO_DATABASE_URL=$(turso db show skillomatic --url)
export TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic)
```

### Step 2: Validate current state (optional)

Check what's currently in production:

```bash
# Check current users
turso db shell skillomatic "SELECT email, is_admin, is_super_admin FROM users ORDER BY is_super_admin DESC, is_admin DESC"

# Check current skills
turso db shell skillomatic "SELECT slug, name, is_enabled FROM skills ORDER BY slug"
```

**Expected users:**
- superadmin@skillomatic.technology (super admin)
- orgadmin@skillomatic.technology (org admin)
- member@skillomatic.technology (member)

**All users share password:** `Skillomatic2024!`

### Step 3: Run database migrations

```bash
pnpm --filter @skillomatic/db migrate
```

This applies any pending migrations from `packages/db/drizzle/`.

### Step 4: Deploy infrastructure

```bash
pnpm sst deploy --stage production
```

Wait for the deployment to complete.

### Step 5: Run seed (REQUIRED)

```bash
pnpm --filter @skillomatic/db seed:prod
```

This ensures:
- Test users have correct password hashes
- All skills from `skills/` directory are synced
- Super admin API key is active

### Step 6: Verify deployment

```bash
# Get API URL
API_URL=$(cat .sst/outputs.json | jq -r .api)

# Test health endpoint
curl -s "$API_URL/api/health"

# Test login
curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@skillomatic.technology","password":"Skillomatic2024!"}'

# Test with super admin API key
export SKILLOMATIC_API_KEY=sk_live_prod_super_admin_debug_key_2024
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" "$API_URL/api/v1/me"
```

## Troubleshooting

**"Invalid email or password" error:**
- Run `pnpm --filter @skillomatic/db seed:prod` to reset password hashes

**"Not Found" error on login:**
- User doesn't exist. Run seed:prod to create test users

**Skills not showing:**
- Run seed:prod to sync skills from `skills/` directory

**Schema out of sync:**
1. Generate migration: `pnpm --filter @skillomatic/db generate`
2. Review the generated SQL in `packages/db/drizzle/`
3. Apply: `pnpm --filter @skillomatic/db migrate`
