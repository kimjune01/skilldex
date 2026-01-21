# ============================================================================
# Skillomatic IT Deployment Script for Windows
# ============================================================================
# Deploys Skillomatic client components to recruiter workstations.
# Run with Administrator privileges.
#
# Usage:
#   .\Deploy-Skillomatic.ps1 -ApiUrl "https://skillomatic.company.com"
#   .\Deploy-Skillomatic.ps1 -ApiUrl "https://skillomatic.company.com" -UserName "jsmith"
#
# Parameters:
#   -ApiUrl         Skillomatic API URL (required)
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
Write-Host "  Skillomatic IT Deployment Script v$Version" -ForegroundColor Cyan
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
    "$UserProfile\.skillomatic",
    "$UserProfile\.claude\commands"
)

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    }
}

# ============================================================================
# Step 2: Create Skillomatic Configuration
# ============================================================================

Write-LogInfo "[2/4] Creating Skillomatic configuration..."

$Config = @{
    apiUrl = $ApiUrl
    installed = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = $Version
}
$Config | ConvertTo-Json | Set-Content "$UserProfile\.skillomatic\config.json"

# Create PowerShell profile additions
$ProfileContent = @"
# Skillomatic environment configuration
`$env:SKILLOMATIC_API_URL = "$ApiUrl"

# Load API key from credential store if available
try {
    `$cred = Import-Clixml -Path "`$env:USERPROFILE\.skillomatic\credential.xml" -ErrorAction SilentlyContinue
    if (`$cred) {
        `$env:SKILLOMATIC_API_KEY = `$cred.GetNetworkCredential().Password
    }
} catch {}
"@

$ProfileContent | Set-Content "$UserProfile\.skillomatic\profile-init.ps1"

# Add to PowerShell profile
$PSProfilePath = "$UserProfile\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
$PSProfileDir = Split-Path $PSProfilePath -Parent

if (-not (Test-Path $PSProfileDir)) {
    New-Item -ItemType Directory -Force -Path $PSProfileDir | Out-Null
}

if (Test-Path $PSProfilePath) {
    $ProfileText = Get-Content $PSProfilePath -Raw
    if ($ProfileText -notmatch "skillomatic") {
        Add-Content $PSProfilePath "`n# Skillomatic`n. `"`$env:USERPROFILE\.skillomatic\profile-init.ps1`""
    }
} else {
    Set-Content $PSProfilePath "# Skillomatic`n. `"`$env:USERPROFILE\.skillomatic\profile-init.ps1`""
}

# ============================================================================
# Step 3: Install Health Check Skill
# ============================================================================

Write-LogInfo "[3/4] Installing health check skill..."

$SkillsDir = "$UserProfile\.claude\commands"

$HealthCheckSkill = @"
---
name: skillomatic-health-check
description: Verify your Skillomatic installation is working correctly
intent: I want to check if Skillomatic is set up correctly
capabilities:
  - Check API key configuration
  - Test API connectivity
allowed-tools:
  - Bash
  - Read
---

# Skillomatic Health Check

Run these PowerShell commands to verify your installation:

``````powershell
Write-Host "=== Skillomatic Health Check ===" -ForegroundColor Cyan

# Check API URL
if (`$env:SKILLOMATIC_API_URL) {
    Write-Host "OK API URL: `$env:SKILLOMATIC_API_URL" -ForegroundColor Green
} else {
    Write-Host "FAIL SKILLOMATIC_API_URL not set" -ForegroundColor Red
}

# Check API key
if (`$env:SKILLOMATIC_API_KEY) {
    Write-Host "OK API key configured" -ForegroundColor Green
} else {
    Write-Host "FAIL SKILLOMATIC_API_KEY not set" -ForegroundColor Red
    Write-Host "  To fix: Run the credential setup script" -ForegroundColor Yellow
}
``````

## API Connectivity Test

``````powershell
if (`$env:SKILLOMATIC_API_KEY) {
    try {
        `$response = Invoke-RestMethod -Uri "`$env:SKILLOMATIC_API_URL/api/v1/me" ``
            -Headers @{ Authorization = "Bearer `$env:SKILLOMATIC_API_KEY" }
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

$HealthCheckSkill | Set-Content "$SkillsDir\skillomatic-health-check.md"

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
Write-Host "    OK Skillomatic config: ~\.skillomatic\" -ForegroundColor Green
Write-Host "    OK PowerShell profile updated" -ForegroundColor Green
Write-Host "    OK Health check skill: ~\.claude\commands\" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps for the user:" -ForegroundColor Cyan
Write-Host "    1. Log in to $ApiUrl"
Write-Host "    2. Generate an API key from the dashboard"
Write-Host "    3. Store it securely (PowerShell as Admin):"
Write-Host ""
Write-Host "       `$cred = Get-Credential -UserName 'SKILLOMATIC_API_KEY' -Message 'Enter API Key as password'" -ForegroundColor Gray
Write-Host "       `$cred | Export-Clixml -Path `"`$env:USERPROFILE\.skillomatic\credential.xml`"" -ForegroundColor Gray
Write-Host ""
Write-Host "    4. Download skills from the Skillomatic web UI"
Write-Host "    5. Move skills to ~\.claude\commands\"
Write-Host "    6. Restart PowerShell"
Write-Host ""
Write-Host "  Verify with: /skillomatic-health-check in Claude"
Write-Host ""
Write-Host "============================================"
