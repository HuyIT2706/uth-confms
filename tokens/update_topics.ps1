$token = (Get-Content tokens/reviewer1.json | ConvertFrom-Json).accessToken
$id = (Get-Content tokens/invitation.json | ConvertFrom-Json).invitationId
$body = @{ topics = @('AI','NLP') }
$json = $body | ConvertTo-Json -Depth 6
try {
  Write-Output "Using token: $($token.Substring(0,20))..."
  Write-Output "Request body: $json"
  $resp = Invoke-RestMethod -Method Patch -Uri "http://localhost:3004/api/invitations/$id/topics" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json
  $resp | ConvertTo-Json -Depth 6 | Out-File 'tokens/invitation_topics.json'
  Write-Output 'Update topics response:'
  $resp
} catch {
  Write-Output 'Update topics failed:'
  if ($_.Exception.Response) { try { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $body = $reader.ReadToEnd(); Write-Output $body } catch { $_ | Out-String } } else { $_ | Out-String }
}
