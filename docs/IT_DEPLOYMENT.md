# IT Deployment Guide

This guide covers enterprise deployment of Skilldex for IT administrators. It includes infrastructure setup, security configurations, and bulk deployment to recruiter workstations.

## Overview

Skilldex deployment consists of two parts:

1. **Server Infrastructure** - Skilldex platform (API, Web UI, Database)
2. **Client Deployment** - Skills and API key configuration on recruiter machines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE DEPLOYMENT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  IT-MANAGED INFRASTRUCTURE                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ Skilldex API │  │ Skilldex Web │  │ Database     │                 │ │
│  │  │ (Lambda/ECS) │  │ (CloudFront) │  │ (Turso/RDS)  │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │                           │                                            │ │
│  │  ┌──────────────┐        │         ┌──────────────┐                   │ │
│  │  │ SSO Provider │◄───────┴────────►│ Nango OAuth  │                   │ │
│  │  │ (Okta/Azure) │                  │ (Optional)   │                   │ │
│  │  └──────────────┘                  └──────────────┘                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ HTTPS                                   │
│                                    ▼                                         │
│  RECRUITER WORKSTATIONS (MDM-Managed)                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐                                   │ │
│  │  │ Claude Code  │  │ Skills       │                                   │ │
│  │  │ or Desktop   │  │ (.md files)  │                                   │ │
│  │  └──────────────┘  └──────────────┘                                   │ │
│  │         │                 │                                            │ │
│  │         └─────────────────┘                                            │ │
│  │              API Key Auth                                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Part 1: Infrastructure Deployment

### Option A: AWS Deployment (Recommended)

Skilldex uses SST (Serverless Stack) for AWS deployment.

#### Prerequisites

- AWS Account with admin access
- AWS CLI configured (`aws configure`)
- Node.js 20+, pnpm 9+
- Turso account (or self-hosted libSQL)

#### Tech Stack Overview

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | React 18 + Vite | Served via CloudFront |
| Backend | Hono (Node.js) | Runs on Lambda |
| Database | SQLite (dev) / Turso (prod) | libSQL compatible |
| ORM | Drizzle ORM | Type-safe queries |
| Auth | JWT + API Keys | 7-day token expiry |
| Deployment | SST 3.x | Infrastructure as code |

#### Step 1: Clone and Configure

```bash
git clone https://github.com/your-org/skilldex.git
cd skilldex
pnpm install
```

#### Step 2: Set Up Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create production database
turso db create skilldex-prod --group default

# Get connection URL
turso db show skilldex-prod --url

# Create auth token
turso db tokens create skilldex-prod
```

#### Step 3: Configure SST Secrets

```bash
# Required secrets
npx sst secret set JwtSecret "$(openssl rand -base64 32)"
npx sst secret set TursoDatabaseUrl "libsql://skilldex-prod-xxx.turso.io"
npx sst secret set TursoAuthToken "your-turso-token"

# Optional: Nango for OAuth integrations
npx sst secret set NangoSecretKey "your-nango-secret"

# Optional: Custom domain
npx sst secret set CustomDomain "skilldex.yourcompany.com"
```

#### Step 4: Deploy

```bash
# Deploy to production
npx sst deploy --stage prod

# Note the outputs:
# ApiUrl: https://xxx.execute-api.region.amazonaws.com
# WebUrl: https://xxx.cloudfront.net
```

#### Step 5: Run Migrations

```bash
# Apply database schema using Drizzle
pnpm db:migrate

# Or manually via Turso CLI
turso db shell skilldex-prod < packages/db/src/migrations/0000_initial.sql
```

**Note:** The schema is defined in `packages/db/src/schema.ts` using Drizzle ORM. Key tables:
- `users` - User accounts with `isAdmin` flag
- `api_keys` - API keys for skill authentication (full key stored, not hashed)
- `skills` - Skill metadata (frontmatter parsed from SKILL.md files)
- `integrations` - OAuth connections via Nango
- `skill_usage_logs` - Audit trail of skill executions
- `scrape_tasks` - Web scraping task queue with caching
- `skill_proposals` - User-submitted skill ideas
- `system_settings` - Key-value config (LLM keys, etc.)

#### Step 6: Create Admin User

```bash
# Connect to database
turso db shell skilldex-prod

# Create admin user (hash password first)
INSERT INTO users (id, email, password_hash, name, is_admin, created_at)
VALUES (
  'admin-001',
  'admin@yourcompany.com',
  '$2b$10$...', -- Use bcrypt hash
  'Admin',
  1,
  unixepoch()
);
```

### Option B: Docker Self-Hosted

For on-premises deployment:

```bash
# Clone repository
git clone https://github.com/your-org/skilldex.git
cd skilldex

# Configure environment
cp .env.example .env.production
# Edit .env.production with your values

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

See `docker-compose.prod.yml` for production configuration.

### Option C: Kubernetes

Helm charts available at `deploy/helm/skilldex/`. See `deploy/helm/README.md`.

---

## Part 2: SSO Integration (Optional)

### Azure AD / Entra ID

1. Register application in Azure Portal
2. Configure redirect URI: `https://skilldex.yourcompany.com/api/auth/callback`
3. Add secrets to SST:

```bash
npx sst secret set AzureAdClientId "your-client-id"
npx sst secret set AzureAdClientSecret "your-client-secret"
npx sst secret set AzureAdTenantId "your-tenant-id"
```

### Okta

1. Create OIDC application in Okta admin
2. Configure redirect URI
3. Add secrets:

```bash
npx sst secret set OktaDomain "your-org.okta.com"
npx sst secret set OktaClientId "your-client-id"
npx sst secret set OktaClientSecret "your-client-secret"
```

---

## Part 3: Client Deployment

### Deployment Script

Create this script for MDM deployment (Jamf, Intune, etc.):

```bash
#!/bin/bash
# skilldex-deploy.sh
# IT deployment script for Skilldex client components
# Run as: sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com

set -e

# ============================================================================
# Configuration
# ============================================================================

SKILLDEX_API_URL="${SKILLDEX_API_URL:-}"
USER_HOME=""
CURRENT_USER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      SKILLDEX_API_URL="$2"
      shift 2
      ;;
    --user)
      CURRENT_USER="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Detect current user if not specified
if [ -z "$CURRENT_USER" ]; then
  CURRENT_USER=$(stat -f "%Su" /dev/console 2>/dev/null || echo "$SUDO_USER")
fi
USER_HOME=$(eval echo "~$CURRENT_USER")

echo "=========================================="
echo "Skilldex IT Deployment Script"
echo "=========================================="
echo "API URL: $SKILLDEX_API_URL"
echo "User: $CURRENT_USER"
echo "Home: $USER_HOME"
echo "=========================================="

# ============================================================================
# Validation
# ============================================================================

if [ -z "$SKILLDEX_API_URL" ]; then
  echo "ERROR: --api-url is required"
  exit 1
fi

# ============================================================================
# Create directories
# ============================================================================

echo "[1/4] Creating directories..."

sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.skilldex"
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.claude/commands"

# ============================================================================
# Create Skilldex configuration
# ============================================================================

echo "[2/4] Creating Skilldex configuration..."

# Create config with API URL (API key added by user later)
cat > "$USER_HOME/.skilldex/config.json" << EOF
{
  "apiUrl": "$SKILLDEX_API_URL",
  "installed": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0"
}
EOF
chown "$CURRENT_USER" "$USER_HOME/.skilldex/config.json"

# Create shell profile additions
SHELL_ADDITIONS="$USER_HOME/.skilldex/shell-init.sh"
cat > "$SHELL_ADDITIONS" << 'EOF'
# Skilldex configuration
export SKILLDEX_API_URL="__API_URL__"

# Load API key from Keychain if available
if command -v security &> /dev/null; then
  _skilldex_key=$(security find-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w 2>/dev/null)
  if [ -n "$_skilldex_key" ]; then
    export SKILLDEX_API_KEY="$_skilldex_key"
  fi
  unset _skilldex_key
fi
EOF
sed -i '' "s|__API_URL__|$SKILLDEX_API_URL|g" "$SHELL_ADDITIONS"
chown "$CURRENT_USER" "$SHELL_ADDITIONS"

# Add to shell profile if not already present
for profile in "$USER_HOME/.zshrc" "$USER_HOME/.bashrc"; do
  if [ -f "$profile" ]; then
    if ! grep -q "skilldex/shell-init.sh" "$profile"; then
      echo "" >> "$profile"
      echo "# Skilldex" >> "$profile"
      echo "[ -f ~/.skilldex/shell-init.sh ] && source ~/.skilldex/shell-init.sh" >> "$profile"
    fi
  fi
done

# ============================================================================
# Download skills
# ============================================================================

echo "[3/4] Downloading skills..."

SKILLS_DIR="$USER_HOME/.claude/commands"

# Download bundled health check skill
cat > "$SKILLS_DIR/skilldex-health-check.md" << 'SKILL_EOF'
---
name: skilldex-health-check
description: Verify your Skilldex installation is working correctly
intent: I want to check if Skilldex is set up correctly
capabilities:
  - Check API key configuration
  - Test API connectivity
allowed-tools:
  - Bash
  - Read
---

# Skilldex Health Check

Verify your Skilldex installation by running these checks:

## 1. API Key Check

```bash
if [ -n "$SKILLDEX_API_KEY" ]; then
  echo "✓ API key is set"
else
  echo "✗ SKILLDEX_API_KEY not set"
  echo "  Run: security add-generic-password -a $USER -s SKILLDEX_API_KEY -w 'your-key'"
fi
```

## 2. API Connectivity

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  "${SKILLDEX_API_URL:-http://localhost:3000}/api/v1/me"
```

## 3. Skills Check

```bash
ls -la ~/.claude/commands/
```

Report any issues to IT support.
SKILL_EOF

chown -R "$CURRENT_USER" "$SKILLS_DIR"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "[4/4] Deployment Complete!"
echo "=========================================="
echo ""
echo "Installed components:"
echo "  ✓ Skilldex config: ~/.skilldex/"
echo "  ✓ Skills directory: ~/.claude/commands/"
echo "  ✓ Shell profile updated"
echo ""
echo "Next steps for the user:"
echo "  1. Log in to $SKILLDEX_API_URL"
echo "  2. Generate an API key"
echo "  3. Store it: security add-generic-password -a \$USER -s SKILLDEX_API_KEY -w 'sk_live_xxx'"
echo "  4. Download skills from the web UI"
echo "  5. Restart terminal"
echo ""
echo "Verify with: /skilldex-health-check in Claude"
echo ""
```

### Usage

Save the script and run:

```bash
# Deploy for current user
sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com

# Deploy for specific user
sudo ./skilldex-deploy.sh \
  --api-url https://skilldex.company.com \
  --user jsmith
```

---

## Part 4: LinkedIn Lookup Setup (Optional)

LinkedIn lookup uses the **Skilldex Scraper** browser extension to access LinkedIn using the user's authenticated session. The extension runs in the user's Chrome browser and opens LinkedIn pages in their logged-in session.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LINKEDIN SCRAPING FLOW                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐        1. Create task         ┌──────────────┐        │
│  │ Claude Code  │ ────────────────────────────► │ Skilldex API │        │
│  │ /linkedin-   │                               │              │        │
│  │   lookup     │ ◄──────────────────────────── │  scrape_     │        │
│  └──────────────┘        5. Return content      │  tasks table │        │
│                                                 └──────────────┘        │
│                                                        ▲                │
│                                                        │                │
│                                           2. Poll for  │  4. Return     │
│                                              tasks     │     result     │
│                                                        │                │
│  ┌─────────────────────────────────────────────────────┴──────────────┐ │
│  │  USER'S BROWSER (Chrome)                                           │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  Skilldex Scraper Extension                                   │  │ │
│  │  │  • Polls API every 5 seconds for pending tasks               │  │ │
│  │  │  • Opens LinkedIn URLs in new tabs                           │  │ │
│  │  │  • Uses user's LinkedIn session (already logged in)          │  │ │
│  │  │  • Extracts page content, converts to markdown               │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  LinkedIn Tab (opened by extension)                          │  │ │
│  │  │  • Page loads with user's session cookies                    │  │ │
│  │  │  • Full access to profiles, search results                   │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Requirements

1. **Skilldex Scraper Extension** - Chrome extension from `apps/skilldex-scraper/`
2. **LinkedIn account** - User must be logged into LinkedIn in Chrome

### User Self-Installation

Users can install the extension themselves in developer mode:

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `apps/skilldex-scraper` folder
5. Configure the extension with their API URL and API key

### Enterprise Distribution

For managed Chrome deployments, you can distribute the extension via:

#### Option A: Chrome Web Store (Recommended)

1. Publish the extension to Chrome Web Store (unlisted or private)
2. Use Group Policy to force-install:

```
Software\Policies\Google\Chrome\ExtensionInstallForcelist
1 = "extension_id;https://clients2.google.com/service/update2/crx"
```

#### Option B: Self-Hosted CRX

1. Package the extension: Chrome > Extensions > Pack Extension
2. Host the CRX file and update manifest on internal server
3. Configure Group Policy:

```
Software\Policies\Google\Chrome\ExtensionInstallForcelist
1 = "extension_id;https://internal.company.com/chrome/update.xml"
```

#### Extension Permissions Required

The extension requests these permissions (review before deploying):

| Permission | Purpose |
|------------|---------|
| `storage` | Store API URL and key |
| `tabs` | Open new tabs for scraping |
| `scripting` | Extract page content |
| `<all_urls>` | Access LinkedIn pages |

### Extension Configuration

After installation, users configure via the extension popup:

1. **API URL** - Skilldex server URL (e.g., `https://skilldex.company.com`)
2. **API Key** - User's `sk_live_...` API key

The extension stores these in Chrome's sync storage.

### Limitations

- Extension must be running (Chrome open) for scraping to work
- LinkedIn may rate-limit automated page loads
- Some profile data may be restricted based on user's LinkedIn account type
- Best results with LinkedIn Recruiter accounts
- Scrape tasks timeout after 2 minutes if extension doesn't respond

---

## Part 5: User Onboarding

### Automated API Key Provisioning

For enterprises that want to pre-provision API keys:

```bash
#!/bin/bash
# provision-user.sh
# Creates user account and provisions API key

USER_EMAIL="$1"
USER_NAME="$2"

if [ -z "$USER_EMAIL" ] || [ -z "$USER_NAME" ]; then
  echo "Usage: ./provision-user.sh email@company.com 'Full Name'"
  exit 1
fi

# Create user via API (requires admin token)
RESPONSE=$(curl -s -X POST "$SKILLDEX_API_URL/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"name\": \"$USER_NAME\",
    \"generateApiKey\": true
  }")

API_KEY=$(echo "$RESPONSE" | jq -r '.apiKey')

if [ "$API_KEY" != "null" ] && [ -n "$API_KEY" ]; then
  echo "User created: $USER_EMAIL"
  echo "API Key: $API_KEY"
  echo ""
  echo "Send this to the user (one-time only):"
  echo "  security add-generic-password -a \$USER -s SKILLDEX_API_KEY -w '$API_KEY'"
else
  echo "Failed to create user"
  echo "$RESPONSE"
  exit 1
fi
```

### Self-Service Onboarding Email Template

```
Subject: Your Skilldex Access is Ready

Hi {NAME},

Your Skilldex account has been set up. Here's how to get started:

1. LOG IN
   Go to {SKILLDEX_URL} and sign in with your company credentials.

2. GENERATE API KEY
   Navigate to API Keys and click "Generate Key".
   Copy the key - you'll only see it once!

3. STORE YOUR KEY
   Open Terminal and run:
   security add-generic-password -a $USER -s SKILLDEX_API_KEY -w 'YOUR_KEY_HERE'

4. RESTART
   - Close and reopen Terminal
   - Quit and reopen Claude Desktop

5. VERIFY
   In Claude Desktop, type: /skilldex-health-check

Need help? Contact IT at {SUPPORT_EMAIL}

- IT Team
```

---

## Part 6: Security Hardening

### Network Security

```bash
# Firewall rules - only allow Skilldex API
# Add to corporate firewall/proxy allowlist:
skilldex.company.com:443
api.skilldex.company.com:443

# Block if using demo mode in production
# Add to denylist for production networks:
X-Demo-Mode header should be stripped at proxy
```

### API Key Policies

```sql
-- Set API key expiration (run on Turso)
-- Keys expire after 90 days
UPDATE api_keys
SET expires_at = created_at + (90 * 24 * 60 * 60)
WHERE expires_at IS NULL;

-- Audit query: Find unused keys
SELECT u.email, ak.name, ak.created_at, ak.last_used_at
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
WHERE ak.last_used_at < unixepoch() - (30 * 24 * 60 * 60)
  AND ak.revoked_at IS NULL;
```

### Audit Logging

All skill executions are logged. Export for SIEM:

```bash
# Export logs to JSON
turso db shell skilldex-prod <<EOF
.mode json
SELECT
  sul.id,
  u.email as user_email,
  s.slug as skill,
  sul.status,
  sul.duration_ms,
  datetime(sul.created_at, 'unixepoch') as timestamp
FROM skill_usage_logs sul
JOIN users u ON sul.user_id = u.id
JOIN skills s ON sul.skill_id = s.id
WHERE sul.created_at > unixepoch() - 86400
ORDER BY sul.created_at DESC;
EOF
```

### Data Retention

```sql
-- Delete logs older than 1 year
DELETE FROM skill_usage_logs
WHERE created_at < unixepoch() - (365 * 24 * 60 * 60);

-- Delete revoked API keys older than 30 days
DELETE FROM api_keys
WHERE revoked_at IS NOT NULL
  AND revoked_at < unixepoch() - (30 * 24 * 60 * 60);
```

---

## Part 7: Monitoring

### Health Check Endpoint

```bash
# Add to monitoring system (Datadog, New Relic, etc.)
curl -s https://skilldex.company.com/api/health | jq .

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

**Available endpoints:**
- `GET /health` - Basic health check
- `GET /api/health` - API health check (same response)

### Alerts to Configure

| Alert | Condition | Severity |
|-------|-----------|----------|
| API Down | Health check fails 3x | Critical |
| High Error Rate | >5% skill executions fail | Warning |
| Database Connection | Connection pool exhausted | Critical |
| API Key Abuse | >1000 requests/hour per key | Warning |
| Failed Logins | >10 failures per user/hour | Warning |

---

## Part 8: Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-skilldex.sh
# Run daily via cron

BACKUP_DIR="/backups/skilldex"
DATE=$(date +%Y%m%d)

# Turso backup
turso db shell skilldex-prod .dump > "$BACKUP_DIR/skilldex-$DATE.sql"

# Compress and encrypt
gzip "$BACKUP_DIR/skilldex-$DATE.sql"
gpg --encrypt --recipient backup@company.com "$BACKUP_DIR/skilldex-$DATE.sql.gz"
rm "$BACKUP_DIR/skilldex-$DATE.sql.gz"

# Retain 30 days
find "$BACKUP_DIR" -name "*.gpg" -mtime +30 -delete
```

### Disaster Recovery

1. **Database**: Restore from Turso backup or replica
2. **API**: Redeploy via `npx sst deploy --stage prod`
3. **Client configs**: Re-run deployment script on affected machines

---

## Troubleshooting

### Common Issues

**"API key not working"**
```bash
# Check key exists and is not revoked
turso db shell skilldex-prod <<EOF
SELECT id, name, created_at, last_used_at, revoked_at
FROM api_keys
WHERE key_prefix = 'sk_live_xxx';  -- First 10 chars
EOF
```

**"LinkedIn lookup not working"**

LinkedIn lookup requires the Skilldex Scraper browser extension:
1. Verify the extension is installed and shows a green "Polling" status
2. Check the extension has the correct API URL and API key configured
3. Ensure Chrome is open (extension can't work if browser is closed)
4. Make sure the user is logged into LinkedIn in Chrome
5. Check for popup blockers that might prevent new tabs
6. LinkedIn may rate-limit searches - wait a few minutes and try again

### Support Escalation

1. **Level 1 (Help Desk)**: API key issues, login problems
2. **Level 2 (IT)**: Deployment issues, network/firewall
3. **Level 3 (Platform Team)**: Infrastructure, database, code issues

---

## Appendix: MDM Scripts

### Microsoft Intune PowerShell Script

```powershell
# Deploy-Skilldex.ps1
# Run as System via Intune

$ApiUrl = "https://skilldex.company.com"

# Get current user
$CurrentUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName.Split('\')[1]
$UserProfile = "C:\Users\$CurrentUser"

# Create directories
New-Item -ItemType Directory -Force -Path "$UserProfile\.skilldex"
New-Item -ItemType Directory -Force -Path "$UserProfile\.claude\commands"

# Create config
$Config = @{
    apiUrl = $ApiUrl
    installed = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    version = "1.0.0"
} | ConvertTo-Json

$Config | Out-File -FilePath "$UserProfile\.skilldex\config.json" -Encoding UTF8

Write-Host "Skilldex deployment complete"
Write-Host "User must generate API key at $ApiUrl and download skills"
```
