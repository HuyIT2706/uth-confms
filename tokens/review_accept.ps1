$token = (Get-Content tokens/reviewer1.json | ConvertFrom-Json).accessToken
$id = (Get-Content tokens/invitation.json | ConvertFrom-Json).invitationId
try {
  $resp = Invoke-RestMethod -Method Patch -Uri "http://localhost:3004/api/invitations/$id/accept" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body '{}' 
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/invitation_accept.json'
  Write-Output 'Accept response:'
  $resp
} catch {
  Write-Output 'Accept failed:'
  if ($_.Exception.Response) { try { $_.Exception.Response | ConvertTo-Json -Depth 6 } catch { $_.Exception.Response.ToString() } } else { $_ | Out-String }
}
