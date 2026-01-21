# IT Deployment Guide

This guide covers enterprise onboarding for Skillomatic SaaS. Skillomatic is a fully hosted platform - no infrastructure to deploy.

## Overview

Skillomatic deployment consists of:

1. **Organization Setup** - Configure your org in Skillomatic
2. **User Provisioning** - Add users via admin panel or SSO
3. **Client Setup** - Install browser extension on recruiter workstations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE DEPLOYMENT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SKILLOMATIC CLOUD (Hosted)                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  • API & Web App (fully managed)                                       │ │
│  │  • Skills library (rendered with your keys)                            │ │
│  │  • Scrape task coordination                                            │ │
│  │  • No PII stored - ephemeral architecture                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ HTTPS                                   │
│                                    ▼                                         │
│  RECRUITER WORKSTATIONS                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ Claude Code  │  │ Chrome with  │  │ LLM calls    │                 │ │
│  │  │ / Desktop    │  │ Skillomatic Ext │  │ (direct)     │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │         │                 │                   │                        │ │
│  │         └─────────────────┴───────────────────┘                        │ │
│  │                    All PII stays client-side                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Part 1: Organization Setup

### 1. Create Organization

Contact Skillomatic sales or sign up at skillomatic.app to create your organization.

You'll receive:
- Organization ID
- Admin account credentials
- API endpoint URL

### 2. Configure LLM Provider

In **Admin > Settings**, add your organization's LLM API key:

- **Anthropic** (recommended) - Claude for chat/analysis
- **OpenAI** - GPT-4 alternative
- **Groq** - Fast, free tier available

This key is used client-side - it never touches Skillomatic servers.

### 3. Configure ATS Integration (Optional)

If using ATS features, connect via **Admin > Integrations**:

- OAuth connection to Greenhouse, Lever, etc.
- Tokens are fetched fresh and passed to client
- No credentials stored on Skillomatic servers

---

## Part 2: User Provisioning

### Option A: Manual (Admin Panel)

1. Go to **Admin > Users**
2. Click **Add User**
3. Enter name, email, password
4. User receives credentials and logs in

### Option B: SSO (Enterprise)

Contact Skillomatic support to configure:

- **Azure AD / Entra ID** - OIDC integration
- **Okta** - OIDC integration
- **SAML** - Available on Enterprise plan

SSO users are auto-provisioned on first login.

### Option C: Invite Links

1. Go to **Admin > Invites**
2. Generate invite link
3. Share with users
4. They create their own accounts

---

## Part 3: Client Deployment

### Browser Extension (Required for LinkedIn)

The Skillomatic Scraper extension enables LinkedIn lookup using the user's authenticated session.

#### Enterprise Distribution (Chrome)

**Option A: Chrome Web Store (Recommended)**

1. Publish extension to Chrome Web Store (unlisted)
2. Force-install via Group Policy:

```
Software\Policies\Google\Chrome\ExtensionInstallForcelist
1 = "extension_id;https://clients2.google.com/service/update2/crx"
```

**Option B: Self-Hosted CRX**

1. Package the extension from `apps/skillomatic-scraper`
2. Host CRX and update manifest internally
3. Configure Group Policy to force-install

#### Manual Installation (Development)

1. Open Chrome > `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/skillomatic-scraper` folder

### Extension Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Store API URL and key |
| `tabs` | Open new tabs for scraping |
| `scripting` | Extract page content |
| `host_permissions` | Access LinkedIn pages |

### MDM Deployment Script (Optional)

For automated workstation setup:

```bash
#!/bin/bash
# skillomatic-deploy.sh
# Deploy Skillomatic client configuration via MDM

SKILLOMATIC_API_URL="${1:-https://app.skillomatic.io}"

# Detect current user
CURRENT_USER=$(stat -f "%Su" /dev/console 2>/dev/null || echo "$SUDO_USER")
USER_HOME=$(eval echo "~$CURRENT_USER")

echo "Setting up Skillomatic for $CURRENT_USER..."

# Create config directory
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.skillomatic"

# Create config file
cat > "$USER_HOME/.skillomatic/config.json" << EOF
{
  "apiUrl": "$SKILLOMATIC_API_URL",
  "installed": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
chown "$CURRENT_USER" "$USER_HOME/.skillomatic/config.json"

echo "Done. User should:"
echo "  1. Log in at $SKILLOMATIC_API_URL"
echo "  2. Generate an API key"
echo "  3. Configure the browser extension"
```

---

## Part 4: Security Considerations

### Data Flow

Skillomatic uses an ephemeral architecture:

1. **No PII on server** - Chat, ATS data, and scrape results stay client-side
2. **Skills rendered with keys** - Your API keys are embedded in skill context
3. **Direct LLM calls** - Browser calls Anthropic/OpenAI directly
4. **No conversation storage** - Chat history exists only in browser memory

### What Skillomatic Stores

| Data | Stored | Notes |
|------|--------|-------|
| User accounts | Yes | Email, name, hashed password |
| API keys | Yes | For authentication only |
| Skill metadata | Yes | Names, descriptions, categories |
| Skill usage logs | Yes | Anonymized - skill name + timestamp |
| Chat content | No | Client-side only |
| ATS data | No | Client-side only |
| Scrape results | No | Client-side only |

### Network Requirements

Allow outbound HTTPS to:

| Domain | Purpose |
|--------|---------|
| `app.skillomatic.io` | Skillomatic API |
| `api.anthropic.com` | Claude API (if using Anthropic) |
| `api.openai.com` | OpenAI API (if using OpenAI) |
| Your ATS domain | ATS API calls |
| `linkedin.com` | LinkedIn scraping (via extension) |

### API Key Management

- Keys are scoped per user
- View/revoke keys in **Admin > Users** or user's **API Keys** page
- Keys can be set to auto-expire
- All key usage is logged

---

## Part 5: User Onboarding

### Self-Service Onboarding Email

```
Subject: Your Skillomatic Access is Ready

Hi {NAME},

Your Skillomatic account has been set up. Here's how to get started:

1. LOG IN
   Go to {SKILLOMATIC_URL} and sign in with your credentials.

2. INSTALL BROWSER EXTENSION
   - Go to chrome://extensions
   - Enable Developer mode
   - Load the extension provided by IT

3. CONFIGURE EXTENSION
   - Click the Skillomatic icon in Chrome
   - Enter the API URL: {SKILLOMATIC_URL}
   - Enter your API key (from Settings > API Keys)

4. START USING
   - Open Claude Desktop or Claude Code
   - Type /linkedin-lookup with a job description

Need help? Contact IT at {SUPPORT_EMAIL}

- IT Team
```

---

## Part 6: Monitoring

### Health Check

```bash
curl -s https://app.skillomatic.io/api/health
# Returns: {"status":"ok","timestamp":"..."}
```

### Usage Analytics

Admins can view usage in **Admin > Analytics**:

- Skill invocations by user
- Most popular skills
- Error rates

### Audit Logs

All skill executions are logged (anonymized):
- Which skill was invoked
- By which user
- When and duration
- Success/failure status

---

## Troubleshooting

### "API key not working"

1. User should verify key in **Settings > API Keys**
2. Check key hasn't been revoked
3. Generate new key if needed

### "LinkedIn lookup not working"

1. Verify extension is installed and shows green "Polling" status
2. Ensure user is logged into LinkedIn in Chrome
3. Check extension has correct API URL and key
4. Chrome must be open for extension to work

### "Skills not loading"

1. Verify API connection: `curl -H "Authorization: Bearer $KEY" https://app.skillomatic.io/api/skills`
2. Check user has access to the skill (role-based)
3. Ensure browser extension is configured

### Support Escalation

1. **Level 1 (Help Desk)**: API key issues, login problems
2. **Level 2 (IT)**: Extension deployment, network/firewall
3. **Level 3 (Skillomatic Support)**: Platform issues, feature requests

---

## FAQ

**Q: Do we need to run any servers?**
A: No. Skillomatic is fully hosted SaaS.

**Q: Where is our data stored?**
A: Chat content and ATS data stay in the browser. Only user accounts and anonymized usage logs are stored on Skillomatic servers.

**Q: Can we use our own LLM API keys?**
A: Yes, required. Your org provides Anthropic/OpenAI keys which are used client-side.

**Q: Is there an on-premises option?**
A: Not currently. The ephemeral architecture means minimal data touches our servers anyway.

**Q: How do we handle compliance (SOC2, HIPAA)?**
A: Because PII doesn't pass through Skillomatic servers, compliance burden is significantly reduced. Contact sales for our security documentation.
