param([string]$In, [string]$Out)
$p = New-Object -ComObject PowerPoint.Application
try {
  $d = $p.Presentations.Open($In, $true, $false, $false)   # read-only, no window
  $d.SaveAs($Out, 32)   # ppSaveAsPDF
  $d.Close()
} finally { $p.Quit() }
"done"
