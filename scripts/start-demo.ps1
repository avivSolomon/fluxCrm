# FluxCRM - one-command demo start for Windows (PowerShell 5.1+).
# Usage: double-click start-demo.cmd  (or: powershell -File scripts\start-demo.ps1 [-Rebuild] [-NoBrowser])
# Ports are fixed: backend 8888, frontend 3000.
param([switch]$Rebuild, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function Step($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }
function PortBusy($p) { [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) }

# 1) Node
Step 'Checking Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js not found. Install Node 20 or 22 LTS from https://nodejs.org' }
$nodeVer = [int](((& node -v) -replace '^v', '').Split('.')[0])
if ($nodeVer -lt 20) { Fail "Node $nodeVer is too old. Install Node 20 or 22 LTS." }

# 2) MongoDB (local Windows service, or anything already listening on 27017)
Step 'Checking MongoDB'
if (-not (PortBusy 27017)) {
    $svc = Get-Service -Name 'MongoDB*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($svc) {
        try { Start-Service $svc.Name } catch { Fail "Could not start service '$($svc.Name)'. Run this script as Administrator once." }
        Start-Sleep -Seconds 3
    }
}
if (-not (PortBusy 27017)) {
    Fail 'MongoDB is not running on 127.0.0.1:27017. Install: winget install MongoDB.Server   (or: docker run -d -p 27017:27017 mongo:7)'
}

# 3) Fixed ports must be free
foreach ($p in 8888, 3000) {
    if (PortBusy $p) { Fail "Port $p is already in use. Run scripts\stop-demo.ps1 first." }
}

# 4) backend\.env (created once, never overwritten)
$envFile = Join-Path $backend '.env'
if (-not (Test-Path $envFile)) {
    Step 'Creating backend\.env'
    $bytes = New-Object byte[] 48
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    $lines = @(
        'DATABASE = "mongodb://127.0.0.1:27017/fluxcrm"',
        ('JWT_SECRET = "' + $secret + '"'),
        'NODE_ENV = "development"',
        'PUBLIC_SERVER_FILE = "http://localhost:8888/"'
    )
    [IO.File]::WriteAllLines($envFile, $lines, (New-Object Text.UTF8Encoding($false)))
}

# 5) Dependencies (only when missing)
foreach ($dir in $backend, $frontend) {
    if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
        Step ('npm install in ' + (Split-Path -Leaf $dir))
        Push-Location $dir
        & npm install --no-audit --no-fund
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { Fail "npm install failed in $dir" }
    }
}

# 6) Demo data (admin + settings + sample invoices; skipped when already there)
Step 'Preparing demo data'
Push-Location $backend
& node src/setup/ensureDemo.js
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Fail 'Demo data preparation failed' }

# 7) Frontend production build (cached in frontend\dist; -Rebuild forces it)
if ($Rebuild -or -not (Test-Path (Join-Path $frontend 'dist\index.html'))) {
    Step 'Building frontend (about a minute)'
    Push-Location $frontend
    $env:VITE_BACKEND_SERVER = 'http://localhost:8888/'
    & node node_modules/vite/bin/vite.js build
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { Fail 'Frontend build failed' }
}

# 8) Start both servers (minimized windows; stop with scripts\stop-demo.ps1)
Step 'Starting backend (8888) and frontend (3000)'
Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory $backend -WindowStyle Minimized
Start-Process -FilePath 'node' -ArgumentList 'node_modules/vite/bin/vite.js preview --port 3000 --strictPort' -WorkingDirectory $frontend -WindowStyle Minimized

# 9) Smoke test
Step 'Smoke test'
& (Join-Path $PSScriptRoot 'smoke-test.ps1') -WaitSeconds 40
if ($LASTEXITCODE -ne 0) { Fail 'Smoke test failed - see messages above' }

Write-Host ''
Write-Host 'FluxCRM is running:  http://localhost:3000' -ForegroundColor Green
Write-Host 'Login: admin@admin.com / admin123          Stop: scripts\stop-demo.ps1'
if (-not $NoBrowser) { Start-Process 'http://localhost:3000' }
