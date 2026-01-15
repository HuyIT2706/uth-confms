$token = (Get-Content tokens/chair1.json | ConvertFrom-Json).accessToken
$confId = (Get-Content tokens/conference_create.json | ConvertFrom-Json).id
$body = @{ conferenceId = $confId; topic = 'AI'; reviewerIds = @(3) }
$json = $body | ConvertTo-Json -Depth 6
try {
  $resp = Invoke-RestMethod -Uri 'http://localhost:3002/api/assignments/assign' -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/assign_response.json'
  Write-Output 'Assign response:'
  $resp
} catch {
  Write-Output 'Assign failed:'
  if ($_.Exception.Response) { try { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $body = $reader.ReadToEnd(); Write-Output $body } catch { $_ | Out-String } } else { $_ | Out-String }
}
