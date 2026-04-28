param(
  [switch]$InstallMissing,
  [switch]$Start,
  [switch]$SkipMongoCheck
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "OK: $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "WARN: $Message" -ForegroundColor Yellow
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-Path {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Install-WingetPackage {
  param(
    [string]$Id,
    [string]$DisplayName
  )

  if (-not (Test-Command "winget")) {
    throw "winget is not available. Install $DisplayName manually, then rerun this script."
  }

  Write-Step "Installing $DisplayName with winget"
  winget install --id $Id -e --accept-source-agreements --accept-package-agreements
  Refresh-Path
}

function Get-NodeMajorVersion {
  if (-not (Test-Command "node")) {
    return 0
  }

  $versionText = (& node -v).Trim()
  if ($versionText -match "^v(\d+)\.") {
    return [int]$Matches[1]
  }

  return 0
}

function Ensure-Node {
  Write-Step "Checking Node.js"
  $nodeMajor = Get-NodeMajorVersion

  if ($nodeMajor -ge 20) {
    Write-Ok "Node.js $(& node -v) found"
    return
  }

  if ($InstallMissing) {
    Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -DisplayName "Node.js LTS"
    $nodeMajor = Get-NodeMajorVersion
  }

  if ($nodeMajor -lt 20) {
    throw "Node.js 20+ is required. Install Node.js LTS from https://nodejs.org/ and rerun this script."
  }

  Write-Ok "Node.js $(& node -v) found"
}

function Ensure-Mongo {
  if ($SkipMongoCheck) {
    Write-Warn "MongoDB check skipped"
    return
  }

  Write-Step "Checking MongoDB"
  $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

  if (-not $service -and $InstallMissing) {
    Install-WingetPackage -Id "MongoDB.Server" -DisplayName "MongoDB Community Server"
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
  }

  if (-not $service) {
    Write-Warn "MongoDB service was not found."
    Write-Warn "Install MongoDB Community Server from https://www.mongodb.com/try/download/community"
    Write-Warn "During installation, enable 'Install MongoDB as a Service'."
    return
  }

  if ($service.Status -ne "Running") {
    Write-Step "Starting MongoDB service"
    Start-Service -Name "MongoDB"
    $service.WaitForStatus("Running", "00:00:20")
  }

  Write-Ok "MongoDB service is running"
}

function Ensure-EnvFile {
  Write-Step "Checking .env"

  $envPath = Join-Path $ProjectRoot ".env"
  $envExamplePath = Join-Path $ProjectRoot ".env-example"

  if (Test-Path $envPath) {
    Write-Ok ".env already exists"
    return
  }

  if (-not (Test-Path $envExamplePath)) {
    throw ".env-example was not found."
  }

  Copy-Item $envExamplePath $envPath

  $jwtSecret = [Convert]::ToBase64String([Guid]::NewGuid().ToByteArray()) + [Convert]::ToBase64String([Guid]::NewGuid().ToByteArray())
  $staffKey = "staff_" + ([Guid]::NewGuid().ToString("N"))

  $content = Get-Content $envPath -Raw
  $content = $content -replace "JWT_SECRET=replace_with_long_random_secret", "JWT_SECRET=$jwtSecret"
  $content = $content -replace "STAFF_PRIVILEGE_KEY=replace_with_staff_key", "STAFF_PRIVILEGE_KEY=$staffKey"
  Set-Content -Path $envPath -Value $content -Encoding UTF8

  Write-Ok ".env created with generated JWT_SECRET and STAFF_PRIVILEGE_KEY"
}

function Install-Dependencies {
  Write-Step "Installing frontend dependencies"
  npm install

  Write-Step "Installing backend dependencies"
  npm run server:install
}

function Show-NextSteps {
  Write-Host ""
  Write-Host "Setup complete." -ForegroundColor Green
  Write-Host ""
  Write-Host "Run the app:"
  Write-Host "  npm run dev"
  Write-Host ""
  Write-Host "Open in browser:"
  Write-Host "  http://localhost:8080"
  Write-Host ""
  Write-Host "Backend health:"
  Write-Host "  http://localhost:5001/health"
  Write-Host ""
  Write-Host "If email, FACEIT, or Robokassa are needed, edit .env manually."
}

Ensure-Node
Ensure-Mongo
Ensure-EnvFile
Install-Dependencies

if ($Start) {
  Write-Step "Starting development servers"
  npm run dev
} else {
  Show-NextSteps
}
