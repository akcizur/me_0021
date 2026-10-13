$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    throw "Bun is not on PATH. Install Bun 1.4.3, open a new PowerShell window, then rerun this script."
}

$bunVersion = (& bun --version).Trim()
Write-Host "Cinematic Edge Motion verification" -ForegroundColor Cyan
Write-Host "Project: $projectRoot"
Write-Host "Bun: $bunVersion"

if ($bunVersion -ne "1.4.3") {
    Write-Warning "This release is locked to Bun 1.4.3. You are running $bunVersion."
}

Write-Host ""
Write-Host "[1/3] Installing exact dependencies from bun.lock..." -ForegroundColor Cyan
& bun install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    throw "bun install --frozen-lockfile failed. Ensure package.json and bun.lock are both up to date."
}

Write-Host ""
Write-Host "[2/3] Checking blocked dependency lifecycle scripts..." -ForegroundColor Cyan
& bun pm untrusted
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Bun's lifecycle-script diagnostic returned a non-zero exit code. Review its output before trusting any package."
}

Write-Host ""
Write-Host "[3/3] Running source validation, ESLint, TypeScript and production build..." -ForegroundColor Cyan
& bun run verify
if ($LASTEXITCODE -ne 0) {
    throw "Verification failed. Review the first failing validation, lint, typecheck or Vite build step above."
}

Write-Host ""
Write-Host "SUCCESS: all project verification steps passed." -ForegroundColor Green
