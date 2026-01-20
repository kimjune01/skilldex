# IT Deployment Guide

This guide covers enterprise deployment of Skilldex for IT administrators. It includes infrastructure setup, security configurations, and bulk deployment to recruiter workstations.

## Overview

Skilldex deployment consists of two parts:

1. **Server Infrastructure** - Skilldex platform (API, Web UI, Database)
2. **Client Deployment** - Skills, MCP server, and browser extension on recruiter machines

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
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ Claude       │  │ Linky MCP    │  │ Chrome +     │                 │ │
│  │  │ Desktop      │  │ Server       │  │ Extension    │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │         │                 │                  │                         │ │
│  │         └─────────────────┴──────────────────┘                         │ │
│  │                    Deployed via MDM                                    │ │
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
# Apply database schema
turso db shell skilldex-prod < packages/db/src/migrations/0000_initial.sql
```

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
# Run as: sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com --extension-id abc123

set -e

# ============================================================================
# Configuration
# ============================================================================

SKILLDEX_API_URL="${SKILLDEX_API_URL:-}"
EXTENSION_ID="${EXTENSION_ID:-}"
INSTALL_LINKY="${INSTALL_LINKY:-true}"
USER_HOME=""
CURRENT_USER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      SKILLDEX_API_URL="$2"
      shift 2
      ;;
    --extension-id)
      EXTENSION_ID="$2"
      shift 2
      ;;
    --no-linky)
      INSTALL_LINKY="false"
      shift
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
echo "Install Linky: $INSTALL_LINKY"
echo "=========================================="

# ============================================================================
# Validation
# ============================================================================

if [ -z "$SKILLDEX_API_URL" ]; then
  echo "ERROR: --api-url is required"
  exit 1
fi

if [ "$INSTALL_LINKY" = "true" ] && [ -z "$EXTENSION_ID" ]; then
  echo "WARNING: --extension-id not provided. Native host will need manual configuration."
fi

# ============================================================================
# Create directories
# ============================================================================

echo "[1/7] Creating directories..."

sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.skilldex"
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.linky"
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/Desktop/temp"
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.claude/commands/skilldex"

# ============================================================================
# Install Python (if needed for Linky)
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  echo "[2/7] Checking Python installation..."

  if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
      echo "ERROR: Homebrew required for Python installation"
      echo "Install Homebrew first: https://brew.sh"
      exit 1
    fi
    sudo -u "$CURRENT_USER" brew install python3
  fi

  # Install uv for Python package management
  if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sudo -u "$CURRENT_USER" sh
  fi
fi

# ============================================================================
# Install Linky MCP Server
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  echo "[3/7] Installing Linky MCP server..."

  sudo -u "$CURRENT_USER" "$USER_HOME/.cargo/bin/uv" tool install linky 2>/dev/null || \
  sudo -u "$CURRENT_USER" pip3 install --user linky
fi

# ============================================================================
# Configure Claude Desktop MCP
# ============================================================================

echo "[4/7] Configuring Claude Desktop..."

CLAUDE_CONFIG_DIR="$USER_HOME/Library/Application Support/Claude"
CLAUDE_CONFIG="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

sudo -u "$CURRENT_USER" mkdir -p "$CLAUDE_CONFIG_DIR"

# Create or merge config
if [ -f "$CLAUDE_CONFIG" ]; then
  # Merge with existing config
  EXISTING=$(cat "$CLAUDE_CONFIG")
  if echo "$EXISTING" | grep -q '"linky"'; then
    echo "Linky already configured in Claude Desktop"
  else
    # Add linky to mcpServers
    echo "$EXISTING" | python3 -c "
import json, sys
config = json.load(sys.stdin)
if 'mcpServers' not in config:
    config['mcpServers'] = {}
config['mcpServers']['linky'] = {'command': 'uvx', 'args': ['linky']}
print(json.dumps(config, indent=2))
" | sudo -u "$CURRENT_USER" tee "$CLAUDE_CONFIG" > /dev/null
  fi
else
  # Create new config
  cat > "$CLAUDE_CONFIG" << 'EOF'
{
  "mcpServers": {
    "linky": {
      "command": "uvx",
      "args": ["linky"]
    }
  }
}
EOF
  chown "$CURRENT_USER" "$CLAUDE_CONFIG"
fi

# ============================================================================
# Install Native Messaging Host
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  echo "[5/7] Installing native messaging host..."

  NATIVE_HOST="$USER_HOME/.linky/native-host.py"
  MANIFEST_DIR="$USER_HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  MANIFEST="$MANIFEST_DIR/com.linky.link.json"

  # Download native host script
  curl -sSL "https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py" \
    -o "$NATIVE_HOST"
  chmod +x "$NATIVE_HOST"
  chown "$CURRENT_USER" "$NATIVE_HOST"

  # Create manifest directory
  sudo -u "$CURRENT_USER" mkdir -p "$MANIFEST_DIR"

  # Create manifest
  if [ -n "$EXTENSION_ID" ]; then
    cat > "$MANIFEST" << EOF
{
  "name": "com.linky.link",
  "description": "Linky native messaging host",
  "path": "$NATIVE_HOST",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXTENSION_ID/"]
}
EOF
    chown "$CURRENT_USER" "$MANIFEST"
    echo "Native host registered for extension: $EXTENSION_ID"
  else
    echo "WARNING: Extension ID not provided. Run update-extension-id.sh after installing extension."
  fi
fi

# ============================================================================
# Create Skilldex configuration
# ============================================================================

echo "[6/7] Creating Skilldex configuration..."

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

echo "[7/7] Downloading skills..."

SKILLS_DIR="$USER_HOME/.claude/commands/skilldex"

# Download bundled health check skill
cat > "$SKILLS_DIR/skilldex-health-check.md" << 'SKILL_EOF'
---
name: skilldex-health-check
description: Verify your Skilldex installation is working correctly
intent: I want to check if Skilldex is set up correctly
capabilities:
  - Check API key configuration
  - Verify MCP server connection
  - Test ATS connectivity
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

## 3. Linky MCP Check

If Linky is configured, try: `mcp__linky__ping`

## 4. Native Host Check

```bash
ls -la ~/.linky/native-host.py
ls -la ~/Desktop/temp/
```

Report any issues to IT support.
SKILL_EOF

chown -R "$CURRENT_USER" "$SKILLS_DIR"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Installed components:"
echo "  ✓ Skilldex config: ~/.skilldex/"
echo "  ✓ Skills directory: ~/.claude/commands/skilldex/"
if [ "$INSTALL_LINKY" = "true" ]; then
  echo "  ✓ Linky MCP server"
  echo "  ✓ Native messaging host: ~/.linky/"
  echo "  ✓ Claude Desktop config updated"
fi
echo ""
echo "Next steps for the user:"
echo "  1. Log in to $SKILLDEX_API_URL"
echo "  2. Generate an API key"
echo "  3. Store it: security add-generic-password -a \$USER -s SKILLDEX_API_KEY -w 'sk_live_xxx'"
echo "  4. Restart terminal and Claude Desktop"
if [ "$INSTALL_LINKY" = "true" ]; then
  echo "  5. Install Linky browser extension"
fi
echo ""
echo "Verify with: /skilldex-health-check in Claude"
echo ""
```

### Usage

Save the script and run:

```bash
# Basic deployment (ATS skills only)
sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com --no-linky

# Full deployment with Linky
sudo ./skilldex-deploy.sh \
  --api-url https://skilldex.company.com \
  --extension-id jmfenlienpocfphpkeccphjfdoepioee

# Deploy for specific user
sudo ./skilldex-deploy.sh \
  --api-url https://skilldex.company.com \
  --user jsmith
```

---

## Part 4: Browser Extension Deployment

### Option A: Chrome Web Store (Preferred)

Once Linky is published to Chrome Web Store:

1. Get the extension ID from the store listing
2. Add to Chrome policy for force-install:

**macOS (MDM Profile):**
```xml
<key>ExtensionInstallForcelist</key>
<array>
  <string>EXTENSION_ID;https://clients2.google.com/service/update2/crx</string>
</array>
```

**Windows (Group Policy):**
```
Computer Configuration > Administrative Templates > Google Chrome > Extensions
> Configure the list of force-installed apps and extensions

Value: EXTENSION_ID;https://clients2.google.com/service/update2/crx
```

### Option B: Self-Hosted Extension

For pre-Web Store deployment or private distribution:

1. Build the extension:
```bash
git clone https://github.com/kimjune01/linky-browser-addon
cd linky-browser-addon
pnpm install
pnpm build
```

2. Package as .crx:
```bash
# Generate key if needed
openssl genrsa -out extension.pem 2048

# Package
google-chrome --pack-extension=dist --pack-extension-key=extension.pem
```

3. Host on internal server and configure policy:
```
EXTENSION_ID;https://internal.company.com/extensions/linky.crx
```

### Option C: Developer Mode (Not Recommended for Production)

For testing only. Requires users to enable Developer Mode.

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
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

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

**"MCP server not connecting"**
```bash
# Test MCP server directly
uvx linky --help

# Check Claude Desktop config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**"LinkedIn scraping not working"**
```bash
# Verify native host
ls -la ~/.linky/native-host.py
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.linky.link.json

# Check extension is installed
# Open chrome://extensions and verify Linky is enabled
```

### Support Escalation

1. **Level 1 (Help Desk)**: API key issues, login problems
2. **Level 2 (IT)**: Deployment issues, network/firewall
3. **Level 3 (Platform Team)**: Infrastructure, database, code issues

---

## Appendix: MDM Profiles

### Jamf Pro Configuration Profile

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.google.Chrome</string>
            <key>PayloadIdentifier</key>
            <string>com.company.skilldex.chrome</string>
            <key>ExtensionInstallForcelist</key>
            <array>
                <string>EXTENSION_ID;https://clients2.google.com/service/update2/crx</string>
            </array>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Skilldex Chrome Extension</string>
    <key>PayloadIdentifier</key>
    <string>com.company.skilldex</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
```

### Microsoft Intune PowerShell Script

```powershell
# Deploy-Skilldex.ps1
# Run as System via Intune

$ApiUrl = "https://skilldex.company.com"
$ExtensionId = "jmfenlienpocfphpkeccphjfdoepioee"

# Get current user
$CurrentUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName.Split('\')[1]
$UserProfile = "C:\Users\$CurrentUser"

# Create directories
New-Item -ItemType Directory -Force -Path "$UserProfile\.skilldex"
New-Item -ItemType Directory -Force -Path "$UserProfile\.linky"
New-Item -ItemType Directory -Force -Path "$UserProfile\Desktop\temp"
New-Item -ItemType Directory -Force -Path "$UserProfile\.claude\commands\skilldex"

# Download native host
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py" `
    -OutFile "$UserProfile\.linky\native-host.py"

# Create manifest
$Manifest = @{
    name = "com.linky.link"
    description = "Linky native messaging host"
    path = "$UserProfile\.linky\native-host.py"
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json

$Manifest | Out-File -FilePath "$UserProfile\.linky\com.linky.link.json" -Encoding UTF8

# Register native host
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.linky.link" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.linky.link" `
    -Name "(Default)" -Value "$UserProfile\.linky\com.linky.link.json"

# Configure Chrome extension force-install
$ExtensionPolicy = "HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist"
New-Item -Path $ExtensionPolicy -Force
Set-ItemProperty -Path $ExtensionPolicy -Name "1" -Value "$ExtensionId;https://clients2.google.com/service/update2/crx"

Write-Host "Skilldex deployment complete"
```
