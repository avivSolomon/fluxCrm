# Smoke test against a running FluxCRM (backend 8888, frontend 3000).
# Exit code 0 = all checks passed. Does not change data (the language check restores the value).
param([int]$WaitSeconds = 30)
$ErrorActionPreference = 'Stop'
$api = 'http://localhost:8888/api'
$script:failed = 0
function Check($name, [scriptblock]$test) {
    try { & $test | Out-Null; Write-Host "  PASS  $name" -ForegroundColor Green }
    catch { Write-Host "  FAIL  $name -> $($_.Exception.Message)" -ForegroundColor Red; $script:failed++ }
}
function StatusOf($ex) { try { $ex.Exception.Response.StatusCode.value__ } catch { 0 } }

# wait for the frontend
$deadline = (Get-Date).AddSeconds($WaitSeconds)
do {
    try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3 | Out-Null; $up = $true } catch { $up = $false; Start-Sleep 2 }
} while (-not $up -and (Get-Date) -lt $deadline)

Check 'frontend serves the app (3000)' {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" }
}

# wait for the backend and log in
$login = $null
$deadline = (Get-Date).AddSeconds($WaitSeconds)
do {
    try {
        $login = Invoke-RestMethod -Method Post -Uri "$api/login" -ContentType 'application/json' -Body '{"email":"admin@admin.com","password":"admin123"}' -TimeoutSec 5
    } catch { Start-Sleep 2 }
} while (-not $login -and (Get-Date) -lt $deadline)

Check 'login returns a token' {
    if (-not $login -or -not $login.success -or -not $login.result.token) { throw 'no token' }
}
if (-not $login) { Write-Host 'Backend did not answer' -ForegroundColor Red; exit 1 }
$h = @{ Authorization = "Bearer $($login.result.token)" }

Check 'request without token is rejected (401)' {
    $code = 200
    try { Invoke-RestMethod -Uri "$api/client/list" -TimeoutSec 5 | Out-Null } catch { $code = StatusOf $_ }
    if ($code -ne 401) { throw "got $code" }
}
Check 'client list has demo clients' {
    $r = Invoke-RestMethod -Uri "$api/client/list" -Headers $h -TimeoutSec 10
    if (@($r.result).Count -lt 1) { throw 'empty' }
}
Check 'analytics returns 12 months and top clients' {
    $r = Invoke-RestMethod -Uri "$api/invoice/analytics" -Headers $h -TimeoutSec 10
    if (@($r.result.monthlyRevenue).Count -ne 12) { throw 'not 12 months' }
    if (@($r.result.topClients).Count -lt 1) { throw 'no top clients' }
}
Check 'analytics CSV export' {
    $r = Invoke-WebRequest -Uri "$api/invoice/analytics/export" -Headers $h -UseBasicParsing -TimeoutSec 10
    if ($r.Headers['Content-Type'] -notmatch 'text/csv') { throw 'not csv' }
}
Check 'invalid analytics range is rejected (400)' {
    $code = 200
    try { Invoke-RestMethod -Uri "$api/invoice/analytics?from=banana" -Headers $h -TimeoutSec 5 | Out-Null } catch { $code = StatusOf $_ }
    if ($code -ne 400) { throw "got $code" }
}
Check 'language preference saves and restores' {
    $orig = $login.result.language
    if (-not $orig) { $orig = 'en_us' }
    $r = Invoke-RestMethod -Method Patch -Uri "$api/admin/profile/language" -Headers $h -ContentType 'application/json' -Body '{"language":"he_il"}' -TimeoutSec 5
    if ($r.result.language -ne 'he_il') { throw 'not saved' }
    Invoke-RestMethod -Method Patch -Uri "$api/admin/profile/language" -Headers $h -ContentType 'application/json' -Body (@{ language = $orig } | ConvertTo-Json) -TimeoutSec 5 | Out-Null
}

if ($script:failed -gt 0) { Write-Host "$($script:failed) check(s) failed" -ForegroundColor Red; exit 1 }
Write-Host 'Smoke test passed' -ForegroundColor Green
exit 0
