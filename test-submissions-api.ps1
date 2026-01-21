# Test script for submission functionality
# This script tests the new submission sync and review submission API

$baseUrl = "http://localhost:3000/api"
$reviewerToken = "" # You need to provide a valid JWT token

# 1. Get submissions for a conference (should sync and return from DB)
Write-Host "=== Testing GET /reviewer/assignments/{conferenceId}/submissions ===" -ForegroundColor Cyan
$conferenceId = "2ff64814-76e3-4de8-8c4f-41aaddf2fd7f"

$response = Invoke-WebRequest -Uri "$baseUrl/reviewer/assignments/$conferenceId/submissions" `
  -Headers @{"Authorization" = "Bearer $reviewerToken"} `
  -Method Get

Write-Host "Response:" 
$response.Content | ConvertFrom-Json | Format-List

# 2. Submit a review with submission_id
Write-Host "`n=== Testing POST /reviewer/assignments/{id}/review ===" -ForegroundColor Cyan
$assignmentId = "your-assignment-id-here" # Replace with actual assignment ID
$reviewPayload = @{
    submissionId = 1  # This is the submission ID from the submissions list
    score = 8
    content = "This is a great paper with some minor issues."
    internalContent = "I recommend acceptance with minor revisions."
} | ConvertTo-Json

$reviewResponse = Invoke-WebRequest -Uri "$baseUrl/reviewer/assignments/$assignmentId/review" `
  -Headers @{"Authorization" = "Bearer $reviewerToken"} `
  -Method Post `
  -ContentType "application/json" `
  -Body $reviewPayload

Write-Host "Review submitted:"
$reviewResponse.Content | ConvertFrom-Json | Format-List

Write-Host "`nDone!" -ForegroundColor Green
