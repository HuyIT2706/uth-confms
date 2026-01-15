$token = (Get-Content tokens/reviewer1.json | ConvertFrom-Json).accessToken
$id = (Get-Content tokens/invitation.json | ConvertFrom-Json).invitationId
try {
  $resp = Invoke-RestMethod -Method Patch -Uri "http://localhost:3004/api/invitations/$id/decline" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body '{}'
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/invitation_decline.json'
  Write-Output 'Decline response:'
  $resp
} catch {
  Write-Output 'Decline failed:'
  if ($_.Exception.Response) {
    $resp = $_.Exception.Response
    try {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $reader.ReadToEnd()
      Write-Output $body
    } catch {
      try { $_.Exception.Response | ConvertTo-Json -Depth 6 } catch { $_.Exception.Response.ToString() }
    }
  } else { $_ | Out-String }
}
