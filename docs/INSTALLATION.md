# Installation Guide

This guide covers installing Skilldex skills for recruiters. Skilldex works with any MCP-compatible client, including Claude Desktop, Claude Code, and other AI assistants that support the Model Context Protocol.

## Overview

Skilldex skills require several components to work together:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SKILLDEX ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                      ┌──────────────────────────────┐ │
│  │  MCP Client      │    MCP Protocol      │  Linky MCP Server            │ │
│  │  ───────────     │ ◄─────────────────► │  (LinkedIn scraping)         │ │
│  │  • Claude Desktop│                      │                              │ │
│  │  • Claude Code   │                      │  Polls ~/Desktop/temp/       │ │
│  │  • Cursor        │                      │  for scraped profiles        │ │
│  │  • Other clients │                      └──────────────┬───────────────┘ │
│  └────────┬─────────┘                                     │                 │
│           │                                               │ webbrowser.open │
│           │ Skills (slash commands)                       ▼                 │
│           │                                  ┌────────────────────────────┐ │
│           ▼                                  │  Chrome + Linky Extension  │ │
│  ┌──────────────────┐                        │  ────────────────────────  │ │
│  │  Skilldex API    │                        │  Content script extracts   │ │
│  │  ──────────────  │                        │  LinkedIn data on page load│ │
│  │  • ATS CRUD      │                        │           │                │ │
│  │  • Usage logging │                        │           ▼ Native Messaging│
│  │  • Auth          │                        │  ┌────────────────────────┐│ │
│  └──────────────────┘                        │  │  Native Host (Python)  ││ │
│                                              │  │  Writes to filesystem  ││ │
│                                              │  └────────────────────────┘│ │
│                                              └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start (Automated)

The fastest way to get started:

```bash
# 1. Sign up at your Skilldex instance and generate an API key
#    https://skilldex.yourcompany.com/keys

# 2. Run the setup CLI
npx skilldex-setup
```

The setup wizard will:
- Prompt for your API key and validate it
- Store the key securely (macOS Keychain, Windows Credential Manager, or Linux secret-tool)
- Install the Linky MCP server
- Configure your MCP client (Claude Desktop, etc.)
- Install the native messaging host for browser integration
- Download all available skills

## Manual Installation

If you prefer manual setup or the automated installer doesn't support your platform:

### Step 1: Skilldex Account Setup

1. Navigate to your Skilldex instance (e.g., `https://skilldex.yourcompany.com`)
2. Create an account or log in
3. Go to **API Keys** in the sidebar
4. Click **Generate Key**
5. Copy the key (starts with `sk_live_`) - you'll only see it once

### Step 2: Store API Key Securely

Choose one method based on your OS and security requirements:

#### Option A: macOS Keychain (Recommended for Mac)

```bash
# Store in Keychain
security add-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w "sk_live_your_key_here"

# Add to ~/.zshrc to auto-load
echo 'export SKILLDEX_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w 2>/dev/null)' >> ~/.zshrc
source ~/.zshrc
```

#### Option B: 1Password CLI

```bash
# Store in 1Password, then add to ~/.zshrc:
export SKILLDEX_API_KEY=$(op read "op://Private/Skilldex/api-key")
```

#### Option C: Environment File (Simple but less secure)

```bash
# Create secure credentials file
mkdir -p ~/.skilldex
echo 'SKILLDEX_API_KEY=sk_live_your_key_here' > ~/.skilldex/credentials
chmod 600 ~/.skilldex/credentials

# Add to ~/.zshrc
echo 'source ~/.skilldex/credentials' >> ~/.zshrc
source ~/.zshrc
```

#### Option D: Direct Export (Development only)

```bash
# Add directly to ~/.zshrc (key visible in plaintext)
echo 'export SKILLDEX_API_KEY="sk_live_your_key_here"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Install Linky MCP Server

The Linky MCP server enables LinkedIn profile scraping through your browser.

```bash
# Option A: Using uv (recommended)
uv tool install linky

# Option B: Using pip
pip install linky

# Option C: Using pipx
pipx install linky
```

### Step 4: Configure Your MCP Client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "linky": {
      "command": "uvx",
      "args": ["linky"]
    }
  }
}
```

#### Claude Code

Claude Code automatically discovers MCP servers. Add to your project's `.mcp.json` or global config:

```json
{
  "mcpServers": {
    "linky": {
      "command": "uvx",
      "args": ["linky"]
    }
  }
}
```

#### Other MCP Clients (Cursor, Continue, etc.)

Consult your client's documentation for MCP server configuration. The server command is:

```bash
uvx linky
# or: python -m linky
```

### Step 5: Install Browser Extension

The Linky browser extension captures LinkedIn page content and sends it to the native host.

#### Option A: Chrome Web Store (When Available)

Install from: `https://chrome.google.com/webstore/detail/linky/[extension-id]`

#### Option B: Load Unpacked (Developer Mode)

```bash
# Clone and build
git clone https://github.com/kimjune01/linky-browser-addon.git
cd linky-browser-addon
pnpm install
pnpm build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode" (toggle in top-right)
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

### Step 6: Install Native Messaging Host

The native host bridges the browser extension to the filesystem.

#### macOS

```bash
# Create directories
mkdir -p ~/.linky
mkdir -p ~/Desktop/temp
mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts

# Download native host script
curl -o ~/.linky/native-host.py \
  https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py
chmod +x ~/.linky/native-host.py

# Create manifest (replace EXTENSION_ID with actual ID from chrome://extensions)
cat > ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.linky.link.json << 'EOF'
{
  "name": "com.linky.link",
  "description": "Linky native messaging host",
  "path": "/Users/YOUR_USERNAME/.linky/native-host.py",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://EXTENSION_ID/"]
}
EOF

# Update path and extension ID in the manifest
sed -i '' "s|YOUR_USERNAME|$USER|g" ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.linky.link.json
```

#### Windows

```powershell
# Create directories
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.linky"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Desktop\temp"

# Download native host script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py" -OutFile "$env:USERPROFILE\.linky\native-host.py"

# Create manifest
$manifest = @{
    name = "com.linky.link"
    description = "Linky native messaging host"
    path = "$env:USERPROFILE\.linky\native-host.py"
    type = "stdio"
    allowed_origins = @("chrome-extension://EXTENSION_ID/")
} | ConvertTo-Json

$manifest | Out-File -FilePath "$env:USERPROFILE\.linky\com.linky.link.json" -Encoding UTF8

# Register in Windows Registry
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.linky.link" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.linky.link" -Name "(Default)" -Value "$env:USERPROFILE\.linky\com.linky.link.json"
```

#### Linux

```bash
# Create directories
mkdir -p ~/.linky
mkdir -p ~/Desktop/temp
mkdir -p ~/.config/google-chrome/NativeMessagingHosts

# Download native host script
curl -o ~/.linky/native-host.py \
  https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py
chmod +x ~/.linky/native-host.py

# Create manifest
cat > ~/.config/google-chrome/NativeMessagingHosts/com.linky.link.json << EOF
{
  "name": "com.linky.link",
  "description": "Linky native messaging host",
  "path": "$HOME/.linky/native-host.py",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://EXTENSION_ID/"]
}
EOF
```

### Step 7: Download Skills

Download skills from your Skilldex dashboard and place them in your commands directory:

```bash
# Create skills directory
mkdir -p ~/.claude/commands/skilldex

# Download from Skilldex web UI, or use API:
curl -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  https://skilldex.yourcompany.com/api/skills/linkedin-lookup/download \
  -o ~/.claude/commands/skilldex/linkedin-lookup.md

# Repeat for other skills...
```

### Step 8: Verify Installation

Restart your MCP client (Claude Desktop, etc.) and Chrome, then run the health check:

```
/skilldex-health-check
```

Or manually verify:

```bash
# Check API key
echo $SKILLDEX_API_KEY | head -c 10  # Should show "sk_live_..."

# Check MCP server
uvx linky --help  # Should show help text

# Check native host
python ~/.linky/native-host.py < /dev/null  # Should exit cleanly

# Check temp directory
ls ~/Desktop/temp  # Should exist
```

## Client-Specific Notes

### Claude Desktop

- MCP config location: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Skills location: `~/.claude/commands/`
- Requires restart after config changes

### Claude Code (CLI)

- MCP config: `.mcp.json` in project root or `~/.claude/mcp.json` globally
- Skills location: `~/.claude/commands/` or project's `.claude/commands/`
- Skills also work as slash commands in the REPL

### Cursor

- MCP support via settings
- Consult Cursor documentation for MCP server configuration

### Other MCP Clients

Any client implementing the Model Context Protocol can use Skilldex:

1. Configure the Linky MCP server (`uvx linky`)
2. Ensure `SKILLDEX_API_KEY` is in the environment
3. Skills can be invoked as prompts or converted to client-specific format

## Skill Tiers

Not all skills require the full Linky setup:

| Tier | Skills | Requirements |
|------|--------|--------------|
| **Tier 1: ATS Only** | ats-candidate-search, ats-candidate-crud, daily-report | API key only |
| **Tier 2: + Email** | email-draft | + Email integration |
| **Tier 3: + LinkedIn** | linkedin-lookup, candidate-pipeline-builder | + Linky MCP + Extension + Native Host |
| **Tier 4: Full Suite** | All skills | + Calendar, Granola integrations |

If you only need ATS skills, you can skip Steps 3-6 (Linky installation).

## Troubleshooting

### "SKILLDEX_API_KEY not set"

```bash
# Verify the key is in your environment
echo $SKILLDEX_API_KEY

# If empty, check your shell profile
cat ~/.zshrc | grep SKILLDEX

# Re-source your profile
source ~/.zshrc
```

### "MCP server not responding"

```bash
# Test the server directly
uvx linky

# Check if it's in Claude Desktop config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restart Claude Desktop after config changes
```

### "LinkedIn scraping not working"

1. Verify you're logged into LinkedIn in Chrome
2. Check the Linky extension is enabled in chrome://extensions/
3. Verify native host is registered:
   ```bash
   cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.linky.link.json
   ```
4. Check the extension ID in the manifest matches the installed extension
5. Verify ~/Desktop/temp/ exists and is writable

### "Native host not receiving messages"

```bash
# Test native host directly
echo '{"type": "ping"}' | python ~/.linky/native-host.py

# Check Python is available
which python3
python3 --version
```

### "Skills not appearing"

```bash
# Verify skills are in the correct location
ls ~/.claude/commands/

# Check file permissions
ls -la ~/.claude/commands/*.md
```

## Security Considerations

### API Key Protection

- Never commit API keys to git
- Use Keychain/Credential Manager when possible
- Rotate keys periodically via Skilldex dashboard
- Revoke keys immediately if compromised

### Browser Extension

- The extension only activates on linkedin.com
- Data is processed locally, not sent to external servers
- Extension source code is auditable on GitHub
- Consider IT approval before installing in enterprise environments

### Native Host

- Sandboxed to ~/Desktop/temp/ directory
- No network access - only filesystem writes
- Python script is auditable

### MCP Server

- Runs locally, no external connections
- Only accessible by configured MCP clients
- Does not store credentials

## Uninstallation

```bash
# Remove skills
rm -rf ~/.claude/commands/skilldex/

# Remove native host
rm ~/.linky/native-host.py
rm ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.linky.link.json

# Remove MCP server
uv tool uninstall linky
# or: pip uninstall linky

# Remove API key from shell profile
# Edit ~/.zshrc and remove SKILLDEX_API_KEY lines

# Remove from Keychain (if used)
security delete-generic-password -s "SKILLDEX_API_KEY"

# Remove browser extension
# Go to chrome://extensions/ and remove Linky

# Remove Claude Desktop MCP config
# Edit claude_desktop_config.json and remove "linky" entry
```

## Getting Help

- **Technical issues**: Contact your Skilldex administrator
- **Bug reports**: https://github.com/your-org/skilldex/issues
- **Feature requests**: Use `/propose-new-skill` in your MCP client
