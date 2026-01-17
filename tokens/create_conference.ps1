$token = (Get-Content tokens/admin.json | ConvertFrom-Json).accessToken
$body = @{
  name = "Hội nghị Công nghệ 2026"
  acronym = "CONF2026"
  description = "Hội nghị về AI và Machine Learning"
  startDate = "2026-05-15"
  endDate = "2026-05-17"
  topics = @("AI", "ML")
  deadlines = @{ submission = "2026-01-15"; review = "2026-02-28"; cameraReady = "2026-03-20" }
}
$json = $body | ConvertTo-Json -Depth 6
try {
  $resp = Invoke-RestMethod -Uri 'http://localhost:3002/api/conferences' -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/conference_create.json'
  Write-Output 'Created conference:'
  $resp
} catch {
  Write-Output 'Create failed:'
  if ($_.Exception.Response) {
    try { $_.Exception.Response | ConvertTo-Json -Depth 6 } catch { $_.Exception.Response.ToString() }
  } else {
    $_ | Out-String
  }
}
