# ========== ENV CHECK + DEV SERVER STARTER ==========

Write-Host "[*] Checking .env files..." -ForegroundColor Cyan

# Check ROOT .env
if (Test-Path ".env") {
    Write-Host "[OK] Root .env found." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Root .env missing. Create it first!" -ForegroundColor Red
    exit 1
}

# Check Blockchain .env
if (Test-Path "blockchain\.env") {
    Write-Host "[OK] blockchain\.env found." -ForegroundColor Green
} else {
    Write-Host "[ERROR] blockchain\.env missing!" -ForegroundColor Red
    Write-Host "Please create blockchain\.env before continuing." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[*] Checking required variables..." -ForegroundColor Cyan

# REQUIRED root env variables
$REQUIRED_VARS = @("VITE_RPC_URL", "VITE_NOP_TOKEN_ADDRESS", "VITE_NOP_POOL_ADDRESS")

$envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue

if (-not $envContent) {
    Write-Host "[ERROR] Could not read root .env file" -ForegroundColor Red
    exit 1
}

$missingVars = @()
foreach ($VAR in $REQUIRED_VARS) {
    if ($envContent -match [regex]::Escape($VAR)) {
        Write-Host "[OK] $VAR OK" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] $VAR is missing in root .env" -ForegroundColor Red
        $missingVars += $VAR
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing required variables: $($missingVars -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[*] Installing missing dependencies if any..." -ForegroundColor Cyan

npm install --legacy-peer-deps --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[*] Starting Vite dev server..." -ForegroundColor Cyan

npm run dev

