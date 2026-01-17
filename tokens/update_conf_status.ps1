$token = (Get-Content tokens/admin.json | ConvertFrom-Json).accessToken
$id = (Get-Content tokens/conference_create.json | ConvertFrom-Json).id
$body = @{ status = 'open' }
$json = $body | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Method Patch -Uri "http://localhost:3002/api/conferences/$id/status" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/conference_status.json'
  Write-Output 'Updated status:'
  $resp
} catch {
  Write-Output 'Update failed:'
  if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 6 } catch { $_.Exception.Response.ToString() } } else { $_ | Out-String }
}
