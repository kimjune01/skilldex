# ============================================================================
# Skilldex IT Deployment Script for Windows
# ============================================================================
# Deploys Skilldex client components to recruiter workstations.
# Run with Administrator privileges.
#
# Usage:
#   .\Deploy-Skilldex.ps1 -ApiUrl "https://skilldex.company.com"
#   .\Deploy-Skilldex.ps1 -ApiUrl "https://skilldex.company.com" -ExtensionId "abc123"
#   .\Deploy-Skilldex.ps1 -ApiUrl "https://skilldex.company.com" -NoLinky
#
# Parameters:
#   -ApiUrl         Skilldex API URL (required)
#   -ExtensionId    Chrome extension ID for native host registration
#   -NoLinky        Skip Linky installation (ATS-only skills)
#   -UserName       Deploy for specific user (default: current user)
#
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl,

    [Parameter(Mandatory=$false)]
    [string]$ExtensionId,

    [Parameter(Mandatory=$false)]
    [switch]$NoLinky,

    [Parameter(Mandatory=$false)]
    [string]$UserName
)

$Version = "1.0.0"
$ErrorActionPreference = "Stop"

# ============================================================================
# Helper Functions
# ============================================================================

function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ============================================================================
# Validation
# ============================================================================

if (-not (Test-Administrator)) {
    Write-LogError "This script must be run as Administrator"
    Write-Host "Right-click PowerShell and select 'Run as Administrator'"
    exit 1
}

# Determine user
if ([string]::IsNullOrEmpty($UserName)) {
    $UserName = $env:USERNAME
}

$UserProfile = "C:\Users\$UserName"
if (-not (Test-Path $UserProfile)) {
    Write-LogError "User profile not found: $UserProfile"
    exit 1
}

$InstallLinky = -not $NoLinky

# ============================================================================
# Display Configuration
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Skilldex IT Deployment Script v$Version" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Configuration:"
Write-Host "    API URL:       $ApiUrl"
Write-Host "    User:          $UserName"
Write-Host "    Profile:       $UserProfile"
Write-Host "    Install Linky: $InstallLinky"
if ($ExtensionId) {
    Write-Host "    Extension ID:  $ExtensionId"
}
Write-Host ""
Write-Host "============================================"
Write-Host ""

# ============================================================================
# Step 1: Create Directories
# ============================================================================

Write-LogInfo "[1/7] Creating directories..."

$Directories = @(
    "$UserProfile\.skilldex",
    "$UserProfile\.claude\commands\skilldex"
)

if ($InstallLinky) {
    $Directories += @(
        "$UserProfile\.linky",
        "$UserProfile\Desktop\temp"
    )
}

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    }
}

# ============================================================================
# Step 2: Check/Install Python
# ============================================================================

if ($InstallLinky) {
    Write-LogInfo "[2/7] Checking Python installation..."

    $PythonPath = $null

    # Check common Python locations
    $PythonPaths = @(
        "python",
        "python3",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python39\python.exe",
        "C:\Python311\python.exe",
        "C:\Python310\python.exe"
    )

    foreach ($path in $PythonPaths) {
        try {
            $version = & $path --version 2>&1
            if ($version -match "Python 3") {
                $PythonPath = $path
                Write-LogInfo "Found: $version"
                break
            }
        } catch {
            continue
        }
    }

    if (-not $PythonPath) {
        Write-LogError "Python 3 not found"
        Write-Host "Download from: https://python.org/downloads/" -ForegroundColor Yellow
        Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
        exit 1
    }

    # Check for uv
    $UvPath = "$UserProfile\.cargo\bin\uv.exe"
    if (-not (Test-Path $UvPath)) {
        Write-LogInfo "Installing uv package manager..."
        Invoke-WebRequest -Uri "https://astral.sh/uv/install.ps1" -OutFile "$env:TEMP\install-uv.ps1"
        & powershell -ExecutionPolicy Bypass -File "$env:TEMP\install-uv.ps1"
    }
} else {
    Write-LogInfo "[2/7] Skipping Python check (-NoLinky)"
}

# ============================================================================
# Step 3: Install Linky MCP Server
# ============================================================================

if ($InstallLinky) {
    Write-LogInfo "[3/7] Installing Linky MCP server..."

    try {
        $UvPath = "$UserProfile\.cargo\bin\uv.exe"
        if (Test-Path $UvPath) {
            & $UvPath tool install linky 2>&1 | Out-Null
            Write-LogInfo "Linky installed via uv"
        } else {
            & pip install --user linky 2>&1 | Out-Null
            Write-LogInfo "Linky installed via pip"
        }
    } catch {
        Write-LogWarn "Linky installation may have failed: $_"
    }
} else {
    Write-LogInfo "[3/7] Skipping Linky installation (-NoLinky)"
}

# ============================================================================
# Step 4: Configure Claude Desktop MCP
# ============================================================================

Write-LogInfo "[4/7] Configuring Claude Desktop..."

$ClaudeConfigDir = "$UserProfile\AppData\Roaming\Claude"
$ClaudeConfig = "$ClaudeConfigDir\claude_desktop_config.json"

if (-not (Test-Path $ClaudeConfigDir)) {
    New-Item -ItemType Directory -Force -Path $ClaudeConfigDir | Out-Null
}

if ($InstallLinky) {
    $ConfigContent = @{
        mcpServers = @{
            linky = @{
                command = "uvx"
                args = @("linky")
            }
        }
    }

    if (Test-Path $ClaudeConfig) {
        try {
            $ExistingConfig = Get-Content $ClaudeConfig -Raw | ConvertFrom-Json -AsHashtable
            if (-not $ExistingConfig.mcpServers) {
                $ExistingConfig.mcpServers = @{}
            }
            $ExistingConfig.mcpServers.linky = $ConfigContent.mcpServers.linky
            $ExistingConfig | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfig
        } catch {
            $ConfigContent | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfig
        }
    } else {
        $ConfigContent | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfig
    }
    Write-LogInfo "Claude Desktop config updated"
} else {
    Write-LogInfo "Skipping Claude Desktop config (-NoLinky)"
}

# ============================================================================
# Step 5: Install Native Messaging Host
# ============================================================================

if ($InstallLinky) {
    Write-LogInfo "[5/7] Installing native messaging host..."

    $NativeHost = "$UserProfile\.linky\native-host.py"
    $ManifestPath = "$UserProfile\.linky\com.linky.link.json"

    # Download native host script
    try {
        Invoke-WebRequest `
            -Uri "https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py" `
            -OutFile $NativeHost
        Write-Host "  Downloaded native host script" -ForegroundColor Gray
    } catch {
        Write-LogError "Failed to download native host: $_"
    }

    # Create manifest
    if ($ExtensionId) {
        $Manifest = @{
            name = "com.linky.link"
            description = "Linky native messaging host for LinkedIn scraping"
            path = $NativeHost
            type = "stdio"
            allowed_origins = @("chrome-extension://$ExtensionId/")
        }
        $Manifest | ConvertTo-Json | Set-Content $ManifestPath

        # Register in Windows Registry
        $RegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.linky.link"
        New-Item -Path $RegPath -Force | Out-Null
        Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath

        Write-LogInfo "Native host registered for extension: $ExtensionId"
    } else {
        Write-LogWarn "Extension ID not provided"
        Write-LogWarn "Run again with -ExtensionId after installing browser extension"

        # Create template
        $ManifestTemplate = @{
            name = "com.linky.link"
            description = "Linky native messaging host"
            path = $NativeHost
            type = "stdio"
            allowed_origins = @("chrome-extension://YOUR_EXTENSION_ID_HERE/")
        }
        $ManifestTemplate | ConvertTo-Json | Set-Content "$ManifestPath.template"
    }
} else {
    Write-LogInfo "[5/7] Skipping native host (-NoLinky)"
}

# ============================================================================
# Step 6: Create Skilldex Configuration
# ============================================================================

Write-LogInfo "[6/7] Creating Skilldex configuration..."

$Config = @{
    apiUrl = $ApiUrl
    installed = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = $Version
    linkyInstalled = $InstallLinky
}
$Config | ConvertTo-Json | Set-Content "$UserProfile\.skilldex\config.json"

# Create PowerShell profile additions
$ProfileContent = @"
# Skilldex environment configuration
`$env:SKILLDEX_API_URL = "$ApiUrl"

# Load API key from credential store if available
try {
    `$cred = Import-Clixml -Path "`$env:USERPROFILE\.skilldex\credential.xml" -ErrorAction SilentlyContinue
    if (`$cred) {
        `$env:SKILLDEX_API_KEY = `$cred.GetNetworkCredential().Password
    }
} catch {}
"@

$ProfileContent | Set-Content "$UserProfile\.skilldex\profile-init.ps1"

# Add to PowerShell profile
$PSProfilePath = "$UserProfile\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
$PSProfileDir = Split-Path $PSProfilePath -Parent

if (-not (Test-Path $PSProfileDir)) {
    New-Item -ItemType Directory -Force -Path $PSProfileDir | Out-Null
}

if (Test-Path $PSProfilePath) {
    $ProfileText = Get-Content $PSProfilePath -Raw
    if ($ProfileText -notmatch "skilldex") {
        Add-Content $PSProfilePath "`n# Skilldex`n. `"`$env:USERPROFILE\.skilldex\profile-init.ps1`""
    }
} else {
    Set-Content $PSProfilePath "# Skilldex`n. `"`$env:USERPROFILE\.skilldex\profile-init.ps1`""
}

# ============================================================================
# Step 7: Install Skills
# ============================================================================

Write-LogInfo "[7/7] Installing skills..."

$SkillsDir = "$UserProfile\.claude\commands\skilldex"

$HealthCheckSkill = @"
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

Run these PowerShell commands to verify your installation:

``````powershell
Write-Host "=== Skilldex Health Check ===" -ForegroundColor Cyan

# Check API URL
if (`$env:SKILLDEX_API_URL) {
    Write-Host "OK API URL: `$env:SKILLDEX_API_URL" -ForegroundColor Green
} else {
    Write-Host "FAIL SKILLDEX_API_URL not set" -ForegroundColor Red
}

# Check API key
if (`$env:SKILLDEX_API_KEY) {
    Write-Host "OK API key configured" -ForegroundColor Green
} else {
    Write-Host "FAIL SKILLDEX_API_KEY not set" -ForegroundColor Red
    Write-Host "  To fix: Run the credential setup script" -ForegroundColor Yellow
}
``````

## API Connectivity Test

``````powershell
if (`$env:SKILLDEX_API_KEY) {
    try {
        `$response = Invoke-RestMethod -Uri "`$env:SKILLDEX_API_URL/api/v1/me" ``
            -Headers @{ Authorization = "Bearer `$env:SKILLDEX_API_KEY" }
        Write-Host "OK API connection successful" -ForegroundColor Green
        Write-Host "  User: `$(`$response.email)" -ForegroundColor Gray
    } catch {
        Write-Host "FAIL API connection failed" -ForegroundColor Red
    }
}
``````

## File System Check

``````powershell
`$paths = @(
    "`$env:USERPROFILE\.skilldex",
    "`$env:USERPROFILE\.linky",
    "`$env:USERPROFILE\Desktop\temp",
    "`$env:USERPROFILE\.claude\commands\skilldex"
)

foreach (`$path in `$paths) {
    if (Test-Path `$path) {
        Write-Host "OK `$path" -ForegroundColor Green
    } else {
        Write-Host "MISSING `$path" -ForegroundColor Yellow
    }
}
``````

If any checks failed, contact IT support.
"@

$HealthCheckSkill | Set-Content "$SkillsDir\skilldex-health-check.md"

# ============================================================================
# Summary
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Installed components:"
Write-Host "    OK Skilldex config: ~\.skilldex\" -ForegroundColor Green
Write-Host "    OK PowerShell profile updated" -ForegroundColor Green
Write-Host "    OK Skills: ~\.claude\commands\skilldex\" -ForegroundColor Green

if ($InstallLinky) {
    Write-Host "    OK Linky MCP server" -ForegroundColor Green
    Write-Host "    OK Native host: ~\.linky\" -ForegroundColor Green
    Write-Host "    OK Claude Desktop config" -ForegroundColor Green
    if ($ExtensionId) {
        Write-Host "    OK Native host registered" -ForegroundColor Green
    } else {
        Write-Host "    WARN Native host needs extension ID" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  Next steps for the user:" -ForegroundColor Cyan
Write-Host "    1. Log in to $ApiUrl"
Write-Host "    2. Generate an API key from the dashboard"
Write-Host "    3. Store it securely (PowerShell as Admin):"
Write-Host ""
Write-Host "       `$cred = Get-Credential -UserName 'SKILLDEX_API_KEY' -Message 'Enter API Key as password'" -ForegroundColor Gray
Write-Host "       `$cred | Export-Clixml -Path `"`$env:USERPROFILE\.skilldex\credential.xml`"" -ForegroundColor Gray
Write-Host ""
Write-Host "    4. Restart PowerShell and Claude Desktop"

if ($InstallLinky -and -not $ExtensionId) {
    Write-Host "    5. Install Linky browser extension"
    Write-Host "    6. Get extension ID from chrome://extensions"
    Write-Host "    7. Re-run with: -ExtensionId YOUR_ID"
}

Write-Host ""
Write-Host "  Verify with: /skilldex-health-check in Claude"
Write-Host ""
Write-Host "============================================"
