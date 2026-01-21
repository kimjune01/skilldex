# ============================================================================
# Skilldex IT Deployment Script for Windows
# ============================================================================
# Deploys Skilldex client components to recruiter workstations.
# Run with Administrator privileges.
#
# Usage:
#   .\Deploy-Skilldex.ps1 -ApiUrl "https://skilldex.company.com"
#   .\Deploy-Skilldex.ps1 -ApiUrl "https://skilldex.company.com" -UserName "jsmith"
#
# Parameters:
#   -ApiUrl         Skilldex API URL (required)
#   -UserName       Deploy for specific user (default: current user)
#
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl,

    [Parameter(Mandatory=$false)]
    [string]$UserName
)

$Version = "2.0.0"
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
Write-Host ""
Write-Host "============================================"
Write-Host ""

# ============================================================================
# Step 1: Create Directories
# ============================================================================

Write-LogInfo "[1/4] Creating directories..."

$Directories = @(
    "$UserProfile\.skilldex",
    "$UserProfile\.claude\commands"
)

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    }
}

# ============================================================================
# Step 2: Create Skilldex Configuration
# ============================================================================

Write-LogInfo "[2/4] Creating Skilldex configuration..."

$Config = @{
    apiUrl = $ApiUrl
    installed = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = $Version
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
# Step 3: Install Health Check Skill
# ============================================================================

Write-LogInfo "[3/4] Installing health check skill..."

$SkillsDir = "$UserProfile\.claude\commands"

$HealthCheckSkill = @"
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

## Skills Check

``````powershell
Write-Host ""
Write-Host "=== Installed Skills ==="
Get-ChildItem -Path "`$env:USERPROFILE\.claude\commands" -Filter "*.md"
``````

If any checks failed, contact IT support.
"@

$HealthCheckSkill | Set-Content "$SkillsDir\skilldex-health-check.md"

# ============================================================================
# Step 4: Summary
# ============================================================================

Write-LogInfo "[4/4] Deployment complete!"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Installed components:"
Write-Host "    OK Skilldex config: ~\.skilldex\" -ForegroundColor Green
Write-Host "    OK PowerShell profile updated" -ForegroundColor Green
Write-Host "    OK Health check skill: ~\.claude\commands\" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps for the user:" -ForegroundColor Cyan
Write-Host "    1. Log in to $ApiUrl"
Write-Host "    2. Generate an API key from the dashboard"
Write-Host "    3. Store it securely (PowerShell as Admin):"
Write-Host ""
Write-Host "       `$cred = Get-Credential -UserName 'SKILLDEX_API_KEY' -Message 'Enter API Key as password'" -ForegroundColor Gray
Write-Host "       `$cred | Export-Clixml -Path `"`$env:USERPROFILE\.skilldex\credential.xml`"" -ForegroundColor Gray
Write-Host ""
Write-Host "    4. Download skills from the Skilldex web UI"
Write-Host "    5. Move skills to ~\.claude\commands\"
Write-Host "    6. Restart PowerShell"
Write-Host ""
Write-Host "  Verify with: /skilldex-health-check in Claude"
Write-Host ""
Write-Host "============================================"
