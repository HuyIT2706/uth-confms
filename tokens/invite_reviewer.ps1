$token = (Get-Content tokens/admin.json | ConvertFrom-Json).accessToken
$conf = (Get-Content tokens/conference_create.json | ConvertFrom-Json).id
$body = @{ conferenceId = $conf; userId = 3 }
$json = $body | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Uri 'http://localhost:3002/api/invitations/invite' -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/invitation.json'
  Write-Output 'Invitation created:'
  $resp
} catch {
  Write-Output 'Invite failed:'
  if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 6 } catch { $_.Exception.Response.ToString() } } else { $_ | Out-String }
}
