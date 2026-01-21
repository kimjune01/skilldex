# Installation Guide

This guide covers installing Skilldex skills for recruiters. Skilldex works with Claude Desktop, Claude Code, and other AI assistants.

## Quick Start

```bash
# 1. Sign up at your Skilldex instance and generate an API key
#    https://skilldex.yourcompany.com/keys

# 2. Set your API key
export SKILLDEX_API_KEY="sk_live_your_key_here"

# 3. Download skills from the web UI and place in:
mkdir -p ~/.claude/commands
```

That's it for basic ATS skills. LinkedIn lookup requires the **Skilldex Scraper** browser extension (included).

## Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SKILLDEX ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐                                                │
│  │  Claude Code /   │                                                │
│  │  Claude Desktop  │◄────── Skills call API ──────┐                 │
│  └────────┬─────────┘                              │                 │
│           │                                         │                 │
│           │ /linkedin-lookup                        ▼                 │
│           │ creates scrape task           ┌──────────────────┐       │
│           └──────────────────────────────►│  Skilldex API    │       │
│                                           │  ──────────────  │       │
│  ┌──────────────────────────────────┐     │  • ATS CRUD      │       │
│  │  Skilldex Scraper Extension      │     │  • Scrape tasks  │       │
│  │  ────────────────────────────    │     │  • Usage logging │       │
│  │  Polls API for pending tasks     │◄────│  • Auth          │       │
│  │  Opens URLs in YOUR browser      │     └──────────────────┘       │
│  │  (uses your LinkedIn session)    │                                │
│  │  Returns extracted content       │                                │
│  └──────────────────────────────────┘                                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Why a browser extension?** Unlike generic browser automation tools, the Skilldex Scraper extension opens pages in your actual browser session. This means LinkedIn pages load with your logged-in credentials - no need to handle OAuth or session management.

## Step 1: Create Your Account

1. Navigate to your Skilldex instance (e.g., `https://skilldex.yourcompany.com`)
2. Create an account or log in
3. Go to **API Keys** in the sidebar
4. Click **Generate Key**
5. Copy the key (starts with `sk_live_`)

**Note:** You can view your API key anytime from the dashboard - it's not hidden after creation.

## Step 2: Store Your API Key

Choose one method based on your OS and security requirements:

### Option A: macOS Keychain (Recommended)

```bash
# Store in Keychain
security add-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w "sk_live_your_key_here"

# Add to ~/.zshrc to auto-load
echo 'export SKILLDEX_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w 2>/dev/null)' >> ~/.zshrc
source ~/.zshrc
```

### Option B: 1Password CLI

```bash
# Store in 1Password, then add to ~/.zshrc:
export SKILLDEX_API_KEY=$(op read "op://Private/Skilldex/api-key")
```

### Option C: Environment File

```bash
# Create secure credentials file
mkdir -p ~/.skilldex
echo 'export SKILLDEX_API_KEY=sk_live_your_key_here' > ~/.skilldex/credentials
chmod 600 ~/.skilldex/credentials

# Add to ~/.zshrc
echo '[ -f ~/.skilldex/credentials ] && source ~/.skilldex/credentials' >> ~/.zshrc
source ~/.zshrc
```

### Option D: Direct Export (Development only)

```bash
# Add directly to ~/.zshrc (key visible in plaintext)
echo 'export SKILLDEX_API_KEY="sk_live_your_key_here"' >> ~/.zshrc
source ~/.zshrc
```

## Step 3: Download Skills

### From the Web UI (Recommended)

1. Go to **Skills** in the Skilldex sidebar
2. Click on a skill to view details
3. Click **Download**
4. Move to your commands directory:

```bash
mkdir -p ~/.claude/commands
mv ~/Downloads/ats-candidate-search.md ~/.claude/commands/
```

### Via API

```bash
# Create skills directory
mkdir -p ~/.claude/commands

# Download a skill
curl -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  https://skilldex.yourcompany.com/api/skills/ats-candidate-search/download \
  -o ~/.claude/commands/ats-candidate-search.md

# Download all skills (bulk)
curl -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  https://skilldex.yourcompany.com/api/skills/install.sh | bash
```

## Step 4: Verify Installation

```bash
# Check API key is set
echo $SKILLDEX_API_KEY | head -c 10  # Should show "sk_live_..."

# Check skills are installed
ls ~/.claude/commands/

# Test API connection
curl -s -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  https://skilldex.yourcompany.com/api/v1/me
```

Then in Claude Code or Claude Desktop:
```
/ats-candidate-search

Senior Python developer with AWS experience
```

## Step 5: LinkedIn Lookup (Optional)

The `/linkedin-lookup` skill requires the **Skilldex Scraper** browser extension to access LinkedIn with your authenticated session.

### Install the Browser Extension

#### Option A: Load Unpacked (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `apps/skilldex-scraper` folder from your Skilldex installation
5. The extension icon should appear in your toolbar

#### Option B: Install from CRX (Enterprise)

If your IT department provides a packaged extension:

```bash
# IT will provide a .crx file or Chrome Web Store link
# See IT_DEPLOYMENT.md for enterprise distribution
```

### Configure the Extension

1. Click the **Skilldex Scraper** extension icon in your toolbar
2. Enter your **API URL** (e.g., `https://skilldex.yourcompany.com`)
3. Enter your **API Key** (same `sk_live_...` key from Step 2)
4. Click **Save & Connect**

The status should show a green dot indicating "Polling" when connected.

### How It Works

1. You run `/linkedin-lookup` in Claude with a job description
2. The skill creates a "scrape task" via the Skilldex API
3. The browser extension polls for pending tasks (every 5 seconds)
4. When it claims a task, it opens the LinkedIn URL **in your browser**
5. Because you're logged into LinkedIn, the page loads with full access
6. The extension extracts the page content and sends it back to the API
7. Claude receives the profile data and presents matching candidates

**Key benefit:** Your LinkedIn session is used, so no separate authentication is needed.

## Skill Tiers

Not all skills require the same setup:

| Tier | Skills | Requirements |
|------|--------|--------------|
| **Tier 1: ATS Only** | ats-candidate-search, ats-candidate-crud, daily-report | API key only |
| **Tier 2: + Email** | email-draft | + Email integration (via Integrations page) |
| **Tier 3: + LinkedIn** | linkedin-lookup, candidate-pipeline-builder | + Skilldex Scraper extension |
| **Tier 4: Full Suite** | All skills | + Calendar integration |

## Skill Format

Skills are markdown files with YAML frontmatter:

```markdown
---
name: skill-name
description: What the skill does
intent: User's goal (e.g., "I want to find candidates")
capabilities:
  - List of capabilities
allowed-tools:
  - Skill
  - Read
  - Bash
---

# Skill Title

Instructions for Claude...
```

## Troubleshooting

### "SKILLDEX_API_KEY not set"

```bash
# Verify the key is in your environment
echo $SKILLDEX_API_KEY

# If empty, check your shell profile
grep SKILLDEX ~/.zshrc ~/.bashrc

# Re-source your profile
source ~/.zshrc
```

### "401 Unauthorized" from API

1. Check your API key is correct (not revoked)
2. Go to **API Keys** in Skilldex dashboard to verify
3. Generate a new key if needed

### "Skills not appearing" in Claude

```bash
# Verify skills are in the correct location
ls -la ~/.claude/commands/

# Check file has .md extension
file ~/.claude/commands/ats-candidate-search.md
```

### LinkedIn lookup not working

1. **Check extension is running**: Click the Skilldex Scraper icon - status should show green "Polling"
2. **Verify API key in extension**: The extension needs its own API key configured
3. **Log into LinkedIn**: Open LinkedIn in your browser and make sure you're signed in
4. **Check for rate limiting**: LinkedIn may block rapid requests - wait a few minutes
5. **Check browser tab**: The extension opens a new tab - make sure it's not blocked by a popup blocker

## Security Considerations

### API Key Protection

- Never commit API keys to git
- Use Keychain/Credential Manager when possible
- Rotate keys periodically via Skilldex dashboard
- Revoke keys immediately if compromised

### Skills

- Skills run locally in your Claude environment
- They call the Skilldex API with your credentials
- Review skill content before installing (click "View Raw" in the UI)

## Uninstallation

```bash
# Remove skills
rm ~/.claude/commands/ats-*.md
rm ~/.claude/commands/linkedin-*.md
rm ~/.claude/commands/email-*.md

# Remove API key from shell profile
# Edit ~/.zshrc and remove SKILLDEX_API_KEY lines

# Remove from Keychain (if used)
security delete-generic-password -s "SKILLDEX_API_KEY"
```

## Getting Help

- **Technical issues**: Contact your Skilldex administrator
- **Feature requests**: Use the Chat feature to suggest new skills
- **Bug reports**: Report to your admin
