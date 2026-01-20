#!/bin/bash
# ============================================================================
# Skilldex IT Deployment Script
# ============================================================================
# Deploys Skilldex client components to recruiter workstations.
# Run with sudo for system-wide installation.
#
# Usage:
#   sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com
#   sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com --extension-id abc123
#   sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com --no-linky
#
# Options:
#   --api-url URL       Skilldex API URL (required)
#   --extension-id ID   Chrome extension ID for native host registration
#   --no-linky          Skip Linky installation (ATS-only skills)
#   --user USERNAME     Deploy for specific user (default: console user)
#   --help              Show this help message
#
# ============================================================================

set -e

VERSION="1.0.0"

# ============================================================================
# Configuration
# ============================================================================

SKILLDEX_API_URL=""
EXTENSION_ID=""
INSTALL_LINKY="true"
USER_HOME=""
CURRENT_USER=""
VERBOSE="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
  head -30 "$0" | tail -25
  exit 0
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run with sudo"
    exit 1
  fi
}

detect_os() {
  case "$(uname -s)" in
    Darwin*)  echo "macos" ;;
    Linux*)   echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *)        echo "unknown" ;;
  esac
}

# ============================================================================
# Parse Arguments
# ============================================================================

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
    --verbose|-v)
      VERBOSE="true"
      shift
      ;;
    --help|-h)
      show_help
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# ============================================================================
# Validation
# ============================================================================

if [ -z "$SKILLDEX_API_URL" ]; then
  log_error "--api-url is required"
  echo "Example: sudo ./skilldex-deploy.sh --api-url https://skilldex.company.com"
  exit 1
fi

OS=$(detect_os)
if [ "$OS" = "unknown" ]; then
  log_error "Unsupported operating system"
  exit 1
fi

# Detect current user
if [ -z "$CURRENT_USER" ]; then
  if [ "$OS" = "macos" ]; then
    CURRENT_USER=$(stat -f "%Su" /dev/console 2>/dev/null || echo "$SUDO_USER")
  else
    CURRENT_USER="$SUDO_USER"
  fi
fi

if [ -z "$CURRENT_USER" ] || [ "$CURRENT_USER" = "root" ]; then
  log_error "Could not detect user. Use --user to specify."
  exit 1
fi

USER_HOME=$(eval echo "~$CURRENT_USER")

# ============================================================================
# Display Configuration
# ============================================================================

echo ""
echo "============================================"
echo "  Skilldex IT Deployment Script v$VERSION"
echo "============================================"
echo ""
echo "  Configuration:"
echo "    API URL:      $SKILLDEX_API_URL"
echo "    User:         $CURRENT_USER"
echo "    Home:         $USER_HOME"
echo "    OS:           $OS"
echo "    Install Linky: $INSTALL_LINKY"
if [ -n "$EXTENSION_ID" ]; then
  echo "    Extension ID: $EXTENSION_ID"
fi
echo ""
echo "============================================"
echo ""

# ============================================================================
# Step 1: Create Directories
# ============================================================================

log_info "[1/7] Creating directories..."

sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.skilldex"
sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.claude/commands/skilldex"

if [ "$INSTALL_LINKY" = "true" ]; then
  sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/.linky"
  sudo -u "$CURRENT_USER" mkdir -p "$USER_HOME/Desktop/temp"
fi

# ============================================================================
# Step 2: Check/Install Python (for Linky)
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  log_info "[2/7] Checking Python installation..."

  if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    log_info "Found: $PYTHON_VERSION"
  else
    log_warn "Python3 not found"

    if [ "$OS" = "macos" ]; then
      if command -v brew &> /dev/null; then
        log_info "Installing Python via Homebrew..."
        sudo -u "$CURRENT_USER" brew install python3
      else
        log_error "Homebrew required for Python installation"
        log_error "Install from: https://brew.sh"
        exit 1
      fi
    elif [ "$OS" = "linux" ]; then
      if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y python3 python3-pip
      elif command -v yum &> /dev/null; then
        yum install -y python3 python3-pip
      else
        log_error "Could not install Python. Install manually."
        exit 1
      fi
    fi
  fi

  # Install uv for Python package management
  if ! command -v uv &> /dev/null; then
    log_info "Installing uv package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sudo -u "$CURRENT_USER" sh

    # Add to PATH for this session
    export PATH="$USER_HOME/.cargo/bin:$PATH"
  fi
else
  log_info "[2/7] Skipping Python check (--no-linky)"
fi

# ============================================================================
# Step 3: Install Linky MCP Server
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  log_info "[3/7] Installing Linky MCP server..."

  # Try uv first
  if command -v uv &> /dev/null; then
    sudo -u "$CURRENT_USER" uv tool install linky 2>/dev/null || true

    # Verify installation
    if sudo -u "$CURRENT_USER" "$USER_HOME/.local/bin/uvx" linky --help &> /dev/null; then
      log_info "Linky installed via uv"
    else
      log_warn "uv install may have failed, trying pip..."
      sudo -u "$CURRENT_USER" pip3 install --user linky
    fi
  else
    sudo -u "$CURRENT_USER" pip3 install --user linky
  fi
else
  log_info "[3/7] Skipping Linky installation (--no-linky)"
fi

# ============================================================================
# Step 4: Configure Claude Desktop MCP
# ============================================================================

log_info "[4/7] Configuring Claude Desktop..."

if [ "$OS" = "macos" ]; then
  CLAUDE_CONFIG_DIR="$USER_HOME/Library/Application Support/Claude"
elif [ "$OS" = "linux" ]; then
  CLAUDE_CONFIG_DIR="$USER_HOME/.config/Claude"
fi

CLAUDE_CONFIG="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

sudo -u "$CURRENT_USER" mkdir -p "$CLAUDE_CONFIG_DIR"

if [ "$INSTALL_LINKY" = "true" ]; then
  if [ -f "$CLAUDE_CONFIG" ]; then
    # Check if already configured
    if grep -q '"linky"' "$CLAUDE_CONFIG"; then
      log_info "Linky already configured in Claude Desktop"
    else
      # Merge with existing config using Python
      python3 << EOF
import json
import sys

config_path = "$CLAUDE_CONFIG"
try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['linky'] = {
    'command': 'uvx',
    'args': ['linky']
}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Updated Claude Desktop config")
EOF
    fi
  else
    # Create new config
    cat > "$CLAUDE_CONFIG" << 'CONFIGEOF'
{
  "mcpServers": {
    "linky": {
      "command": "uvx",
      "args": ["linky"]
    }
  }
}
CONFIGEOF
  fi
  chown "$CURRENT_USER" "$CLAUDE_CONFIG"
else
  log_info "Skipping Claude Desktop MCP config (--no-linky)"
fi

# ============================================================================
# Step 5: Install Native Messaging Host
# ============================================================================

if [ "$INSTALL_LINKY" = "true" ]; then
  log_info "[5/7] Installing native messaging host..."

  NATIVE_HOST="$USER_HOME/.linky/native-host.py"

  # Set manifest directory based on OS
  if [ "$OS" = "macos" ]; then
    MANIFEST_DIR="$USER_HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  elif [ "$OS" = "linux" ]; then
    MANIFEST_DIR="$USER_HOME/.config/google-chrome/NativeMessagingHosts"
  fi

  MANIFEST="$MANIFEST_DIR/com.linky.link.json"

  # Download native host script
  curl -sSL "https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py" \
    -o "$NATIVE_HOST"
  chmod +x "$NATIVE_HOST"
  chown "$CURRENT_USER" "$NATIVE_HOST"

  # Create manifest directory
  sudo -u "$CURRENT_USER" mkdir -p "$MANIFEST_DIR"

  # Create manifest if extension ID provided
  if [ -n "$EXTENSION_ID" ]; then
    cat > "$MANIFEST" << EOF
{
  "name": "com.linky.link",
  "description": "Linky native messaging host for LinkedIn scraping",
  "path": "$NATIVE_HOST",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXTENSION_ID/"]
}
EOF
    chown "$CURRENT_USER" "$MANIFEST"
    log_info "Native host registered for extension: $EXTENSION_ID"
  else
    log_warn "Extension ID not provided"
    log_warn "Run with --extension-id after installing browser extension"

    # Create template manifest
    cat > "$MANIFEST.template" << EOF
{
  "name": "com.linky.link",
  "description": "Linky native messaging host for LinkedIn scraping",
  "path": "$NATIVE_HOST",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID_HERE/"]
}
EOF
    chown "$CURRENT_USER" "$MANIFEST.template"
  fi
else
  log_info "[5/7] Skipping native host installation (--no-linky)"
fi

# ============================================================================
# Step 6: Create Skilldex Configuration
# ============================================================================

log_info "[6/7] Creating Skilldex configuration..."

# Create config file
cat > "$USER_HOME/.skilldex/config.json" << EOF
{
  "apiUrl": "$SKILLDEX_API_URL",
  "installed": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$VERSION",
  "linkyInstalled": $INSTALL_LINKY
}
EOF
chown "$CURRENT_USER" "$USER_HOME/.skilldex/config.json"

# Create shell initialization script
cat > "$USER_HOME/.skilldex/shell-init.sh" << EOF
# Skilldex environment configuration
# Generated by skilldex-deploy.sh on $(date)

export SKILLDEX_API_URL="$SKILLDEX_API_URL"

# Load API key from Keychain (macOS) or secret-tool (Linux)
if [ "\$(uname)" = "Darwin" ]; then
  _skilldex_key=\$(security find-generic-password -a "\$USER" -s "SKILLDEX_API_KEY" -w 2>/dev/null)
elif command -v secret-tool &> /dev/null; then
  _skilldex_key=\$(secret-tool lookup service skilldex username "\$USER" 2>/dev/null)
fi

if [ -n "\$_skilldex_key" ]; then
  export SKILLDEX_API_KEY="\$_skilldex_key"
fi
unset _skilldex_key
EOF
chown "$CURRENT_USER" "$USER_HOME/.skilldex/shell-init.sh"

# Add to shell profiles
for profile in "$USER_HOME/.zshrc" "$USER_HOME/.bashrc" "$USER_HOME/.bash_profile"; do
  if [ -f "$profile" ] || [ "$profile" = "$USER_HOME/.zshrc" ]; then
    if ! grep -q "skilldex/shell-init.sh" "$profile" 2>/dev/null; then
      echo "" >> "$profile"
      echo "# Skilldex" >> "$profile"
      echo "[ -f ~/.skilldex/shell-init.sh ] && source ~/.skilldex/shell-init.sh" >> "$profile"
      chown "$CURRENT_USER" "$profile"
    fi
  fi
done

# ============================================================================
# Step 7: Install Skills
# ============================================================================

log_info "[7/7] Installing skills..."

SKILLS_DIR="$USER_HOME/.claude/commands/skilldex"

# Create health check skill
cat > "$SKILLS_DIR/skilldex-health-check.md" << 'SKILLEOF'
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

Run these checks to verify your installation:

## 1. Environment Check

```bash
echo "=== Skilldex Health Check ==="
echo ""

# Check API URL
if [ -n "$SKILLDEX_API_URL" ]; then
  echo "✓ API URL: $SKILLDEX_API_URL"
else
  echo "✗ SKILLDEX_API_URL not set"
fi

# Check API key
if [ -n "$SKILLDEX_API_KEY" ]; then
  echo "✓ API key is configured (${SKILLDEX_API_KEY:0:10}...)"
else
  echo "✗ SKILLDEX_API_KEY not set"
  echo "  To fix: security add-generic-password -a $USER -s SKILLDEX_API_KEY -w 'your-key'"
fi
```

## 2. API Connectivity

```bash
if [ -n "$SKILLDEX_API_KEY" ]; then
  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $SKILLDEX_API_KEY" \
    "$SKILLDEX_API_URL/api/v1/me")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "200" ]; then
    echo "✓ API connection successful"
    echo "  User: $(echo $body | grep -o '"email":"[^"]*"' | cut -d'"' -f4)"
  else
    echo "✗ API connection failed (HTTP $http_code)"
  fi
else
  echo "⊘ Skipping API check (no API key)"
fi
```

## 3. Linky MCP Check

Try running: `mcp__linky__ping`

If Linky is configured, it should return "hello Pong!!!"

## 4. File System Check

```bash
echo ""
echo "=== File System ==="

# Check directories
for dir in ~/.skilldex ~/.linky ~/Desktop/temp ~/.claude/commands/skilldex; do
  if [ -d "$dir" ]; then
    echo "✓ $dir exists"
  else
    echo "✗ $dir missing"
  fi
done

# Check native host
if [ -f ~/.linky/native-host.py ]; then
  echo "✓ Native host script installed"
else
  echo "⊘ Native host not installed (Linky not configured)"
fi
```

## Summary

If any checks failed, contact IT support with the output above.
SKILLEOF

chown -R "$CURRENT_USER" "$SKILLS_DIR"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  Installed components:"
echo "    ✓ Skilldex config: ~/.skilldex/"
echo "    ✓ Shell initialization: ~/.skilldex/shell-init.sh"
echo "    ✓ Skills: ~/.claude/commands/skilldex/"

if [ "$INSTALL_LINKY" = "true" ]; then
  echo "    ✓ Linky MCP server"
  echo "    ✓ Native host: ~/.linky/native-host.py"
  echo "    ✓ Claude Desktop config"
  if [ -n "$EXTENSION_ID" ]; then
    echo "    ✓ Native host manifest (extension: $EXTENSION_ID)"
  else
    echo "    ⚠ Native host manifest template (needs extension ID)"
  fi
fi

echo ""
echo "  Next steps for the user:"
echo "    1. Log in to $SKILLDEX_API_URL"
echo "    2. Generate an API key from the dashboard"
echo "    3. Store it securely:"

if [ "$OS" = "macos" ]; then
  echo "       security add-generic-password -a \$USER -s SKILLDEX_API_KEY -w 'sk_live_xxx'"
elif [ "$OS" = "linux" ]; then
  echo "       secret-tool store --label='Skilldex API Key' service skilldex username \$USER"
fi

echo "    4. Restart terminal and Claude Desktop"

if [ "$INSTALL_LINKY" = "true" ] && [ -z "$EXTENSION_ID" ]; then
  echo "    5. Install Linky browser extension"
  echo "    6. Get extension ID and re-run:"
  echo "       sudo ./skilldex-deploy.sh --api-url $SKILLDEX_API_URL --extension-id YOUR_ID"
fi

echo ""
echo "  Verify installation:"
echo "    Type /skilldex-health-check in Claude Desktop"
echo ""
echo "============================================"
