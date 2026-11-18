# Builds a Hebrew RTL document: node script -> hebrew_fix.py -> Word (update TOC, save docx, export PDF).
# Usage: powershell -File make.ps1 -Name book|guide|qa      (outputs go to out\<Name>_<tag>.*)
param([Parameter(Mandatory)][string]$Name)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $here 'out'; New-Item -ItemType Directory -Force $out | Out-Null
$tag = Get-Date -Format 'HHmmss'
$sp = 'C:\Users\HANANE~1\AppData\Local\Temp\claude\ff702e59207fa30d\3af859a5-959c-46e4-abd7-6117b301bf58\scratchpad'
$env:NODE_PATH = Join-Path $sp 'node_modules'
$py = 'C:\Users\Hananel & aviv\AppData\Local\Programs\Python\Python312\python.exe'
$fix = 'C:\Users\Hananel & aviv\AppData\Roaming\Claude\rpm\f3d24e3d\806a3537\plugin_01LqMiJqgPRUmEA5gJ8Dg63m\skills\docx-hebrew\scripts\hebrew_fix.py'
$raw = Join-Path $out "$($Name)_$($tag)_raw.docx"; $fixed = Join-Path $out "$($Name)_$($tag)_fixed.docx"
$final = Join-Path $out "$($Name)_$($tag).docx"; $pdf = Join-Path $out "$($Name)_$($tag).pdf"
& node (Join-Path $here "$Name.js") $raw
if ($LASTEXITCODE -ne 0) { throw 'node failed' }
& $py $fix $raw $fixed
$base = Join-Path $out "$($Name)_$($tag)"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here "wordtest.ps1") -In $fixed -OutBase $base
Get-Content "$base.log" | Where-Object { $_ -match "pages|ERR|end" }
"OUT $base.docx"; "OUT $base.pdf"
