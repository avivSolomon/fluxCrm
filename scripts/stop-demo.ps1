# Stops the FluxCRM demo servers (ports 8888 and 3000). MongoDB is left running.
foreach ($p in 8888, 3000) {
    Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Write-Host 'FluxCRM stopped.'
