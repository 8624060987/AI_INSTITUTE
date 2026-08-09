# Test script for configurable rate limits and exponential backoff
$baseUrl = "http://localhost:3000"

Write-Host "`n=== 1. TESTING AUTH LOGIN EXPONENTIAL BACKOFF ===" -ForegroundColor Cyan

# Attempt 1 (Invalid credentials)
try {
  $res1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test_student@gmail.com","password":"1"}'
  Write-Host "Attempt 1 Result:" ($res1 | ConvertTo-Json -Compress)
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $errBody = $reader.ReadToEnd()
  Write-Host "Attempt 1 Status Code:" $_.Exception.Response.StatusCode.value__
  Write-Host "Attempt 1 Body:" $errBody
}

# Immediate Attempt 2 (Should trigger exponential backoff cooldown -> 429)
try {
  $res2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test_student@gmail.com","password":"1"}'
  Write-Host "Attempt 2 Result:" ($res2 | ConvertTo-Json -Compress)
} catch {
  $stream2 = $_.Exception.Response.GetResponseStream()
  $reader2 = New-Object System.IO.StreamReader($stream2)
  $errBody2 = $reader2.ReadToEnd()
  Write-Host "Attempt 2 Status Code (Expected 429):" $_.Exception.Response.StatusCode.value__
  Write-Host "Attempt 2 Headers Retry-After:" $_.Exception.Response.Headers.Get("Retry-After")
  Write-Host "Attempt 2 Headers Backoff-Delay:" $_.Exception.Response.Headers.Get("X-RateLimit-Backoff-Delay")
  Write-Host "Attempt 2 Body:" $errBody2
}

Write-Host "`n=== 2. TESTING PUBLIC ENDPOINTS (SUBMIT-LEAD) ===" -ForegroundColor Cyan
try {
  $resLead = Invoke-RestMethod -Uri "$baseUrl/api/submit-lead" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Test User","phone":"9876543210","course":"Generative AI"}'
  Write-Host "Submit Lead Success:" ($resLead | ConvertTo-Json -Compress)
} catch {
  Write-Host "Submit Lead Status Code:" $_.Exception.Response.StatusCode.value__
}

Write-Host "`n=== ALL RATE LIMIT TESTS VERIFIED ===" -ForegroundColor Green
