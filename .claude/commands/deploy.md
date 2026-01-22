Deploy Skillomatic to production using SST.

## Pre-deploy: Validate and run database migrations

First, get the Turso credentials:

```bash
export TURSO_DATABASE_URL=$(turso db show skillomatic --url)
export TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic)
```

### Step 1: Validate current state

Check what's currently in production and compare with expected seed data:

```bash
# Check current users
turso db shell skillomatic "SELECT email, is_admin, is_super_admin FROM users ORDER BY is_super_admin DESC, is_admin DESC"

# Check current skills
turso db shell skillomatic "SELECT slug, name, is_enabled FROM skills ORDER BY slug"

# Check current roles
turso db shell skillomatic "SELECT name, description FROM roles"
```

**Expected users:**
- superadmin@skillomatic.technology (super admin)
- orgadmin@skillomatic.technology (org admin)
- member@skillomatic.technology (member)

**Expected skills (from `skills/` directory):**
- linkedin-lookup, ats-candidate-search, ats-candidate-crud (enabled)
- candidate-pipeline-builder, daily-report (enabled)
- email-draft, interview-scheduler, meeting-notes (disabled)

**Expected roles:**
- admin, recruiter, viewer

If any are missing or outdated, run the seed script.

### Step 2: Run migrations and seed

```bash
# Run migrations (idempotent - safe to run multiple times)
pnpm --filter @skillomatic/db migrate:prod

# Seed essential data (idempotent)
pnpm --filter @skillomatic/db seed:prod
```

### Step 3: Verify seed applied correctly

```bash
# Verify user count
turso db shell skillomatic "SELECT COUNT(*) as user_count FROM users"

# Verify skill count
turso db shell skillomatic "SELECT COUNT(*) as skill_count FROM skills"

# Verify API key exists and is active
turso db shell skillomatic "SELECT key, revoked_at FROM api_keys WHERE id = 'apikey-super-admin'"
```

## Deploy

```bash
pnpm sst deploy --stage production
```

Wait for the deployment to complete and report the URLs when done.

## Post-deploy verification

Test the API is working:
```bash
curl -s https://api.skillomatic.technology/health
```

Test database access with super admin key:
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/stats"
```
