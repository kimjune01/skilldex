# Deployment Guide

## Quick Reference

**For routine deployments, use Claude Code:**
- `/deploy` - Deploy to production
- `/rollback` - Revert to a previous version
- `/prod-status` - Check what's running

## Prerequisites

- **AWS account** with IAM user (AdministratorAccess or PowerUserAccess)
- **Turso account** (free tier works) for production database
- **Nango account** (optional) for OAuth integrations

## First-Time Setup

### 1. Set Up AWS Credentials

```bash
# Install AWS CLI if needed
brew install awscli

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-west-2), Output (json)
```

### 2. Set Up Turso Database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login to Turso
turso auth login

# Create database
turso db create skillomatic

# Get the database URL
turso db show skillomatic --url

# Create auth token
turso db tokens create skillomatic
```

### 3. Configure SST Secrets

```bash
# Set required secrets for production
pnpm sst secret set JwtSecret "$(openssl rand -hex 32)" --stage production
pnpm sst secret set TursoDatabaseUrl "libsql://skillomatic-xxx.turso.io" --stage production
pnpm sst secret set TursoAuthToken "your-turso-auth-token" --stage production
pnpm sst secret set NangoSecretKey "your-nango-secret-key" --stage production
pnpm sst secret set NangoPublicKey "" --stage production  # Deprecated, can be empty
pnpm sst secret set GoogleClientId "$GOOGLE_CLIENT_ID" --stage production
pnpm sst secret set GoogleClientSecret "$GOOGLE_CLIENT_SECRET" --stage production
```

### 4. Initial Deploy

```bash
GIT_HASH=$(git rev-parse --short HEAD) pnpm sst deploy --stage production
```

### 5. Seed Production Database

```bash
TURSO_DATABASE_URL=$(turso db show skillomatic --url) \
TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic) \
pnpm --filter @skillomatic/db seed:prod
```

**Important:** Always run `seed:prod` after initial deployment. This ensures:
- Test users have correctly hashed passwords
- All skills from `skills/` directory are synced to the database
- Super admin API key is created and active

## Custom Domain

To use a custom domain like `skillomatic.technology`:

**Option A: Use Route 53** (easier)
- Transfer your domain's nameservers to Route 53
- Set `useCustomDomain = true` in `sst.config.ts`
- Redeploy - SST handles SSL certificates automatically

**Option B: Use External DNS** (Namecheap, Cloudflare, etc.)
- Deploy first to get CloudFront URLs
- Add CNAME records pointing to the CloudFront distributions
- Configure SSL certificate in ACM manually

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Turso libsql URL | Yes (production) |
| `TURSO_AUTH_TOKEN` | Turso auth token | Yes (production) |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `NANGO_SECRET_KEY` | Nango API secret key | No |
| `NANGO_HOST` | Nango API host | No (defaults to api.nango.dev) |

## Services

| Service | Infrastructure | URL |
|---------|---------------|-----|
| API | Lambda + CloudFront | `api.skillomatic.technology` |
| Web | Static site + CloudFront | `skillomatic.technology` |
| MCP | ECS Fargate | `mcp.skillomatic.technology` |

## Health Endpoints

```bash
# API
curl -s "https://api.skillomatic.technology/health" | jq .

# MCP Server
curl -s "https://mcp.skillomatic.technology/health" | jq .

# Web (check git-hash meta tag)
curl -s "https://skillomatic.technology" | grep 'git-hash'
```

## Troubleshooting

**"Invalid email or password" on login:**
- Run `pnpm --filter @skillomatic/db seed:prod` to reset password hashes
- This is the most common issue after deployment

**Lambda 403 Forbidden:**
- Ensure Lambda URL has `authorization: "none"` in SST config
- Add `lambda:InvokeFunction` permission to resource policy

**libsql/better-sqlite3 errors:**
- Add native deps to SST config: `nodejs: { install: ["@libsql/linux-x64-gnu"] }`

**CORS errors:**
- Check `allowOrigins` in SST config matches your frontend URL

**MCP takes too long to deploy:**
- MCP runs on ECS which requires building/pushing Docker images (~2 min)
- Use `/deploy` which skips MCP when unchanged

**Stale secrets:**
- Run `pnpm sst secret set <SecretName> "<value>" --stage production`
- SST automatically restarts Lambda containers

## Manual Deployment (without Claude Code)

If you need to deploy manually:

```bash
# 1. Ensure clean git state
git diff --quiet && git diff --cached --quiet

# 2. Run typecheck
pnpm typecheck

# 3. Push schema changes (if any)
pnpm db:push:prod

# 4. Deploy with git hash
GIT_HASH=$(git rev-parse --short HEAD) pnpm sst deploy --stage production

# 5. Verify
curl -s "https://api.skillomatic.technology/health" | jq -r '.gitHash'

# 6. Tag the release
git tag <version> && git push origin <version>
```

See `.claude/commands/deploy.md` for the full deployment script with selective targeting.
