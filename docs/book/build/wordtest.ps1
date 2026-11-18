param([string]$In, [string]$OutBase)
$log = "$OutBase.log"; "start $(Get-Date -f T)" | Out-File $log
$w = New-Object -ComObject Word.Application; $w.Visible = $false; $w.DisplayAlerts = 0
try {
  "open" | Out-File $log -Append
  $d = $w.Documents.Open($In, $false, $true)   # read-only copy
  "opened $(Get-Date -f T)" | Out-File $log -Append
  $d.Fields.Update() | Out-Null; "fields $(Get-Date -f T)" | Out-File $log -Append
  foreach ($t in $d.TablesOfContents) { $t.Update() }; "toc $(Get-Date -f T)" | Out-File $log -Append
  "pages $($d.ComputeStatistics(2)) $(Get-Date -f T)" | Out-File $log -Append
  $d.SaveAs2("$OutBase.docx", 16); "saved $(Get-Date -f T)" | Out-File $log -Append
  $d.ExportAsFixedFormat("$OutBase.pdf", 17); "pdf $(Get-Date -f T)" | Out-File $log -Append
  $d.Close($false)
} catch { "ERR $($_.Exception.Message)" | Out-File $log -Append } finally { $w.Quit() }
"end $(Get-Date -f T)" | Out-File $log -Append
