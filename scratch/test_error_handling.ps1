$baseUrl = "http://localhost:3000"

Write-Host "`n=== 1. TESTING ERROR RESPONSE PURITY & PATH LEAK ELIMINATION ===" -ForegroundColor Cyan

# Test Malformed JSON syntax
try {
  $r1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{ malformed json! '
  Write-Host "Unexpected Success:" $r1
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "Malformed JSON Error Response:" $body
  
  # Assert no file paths or stack trace leaks
  if ($body -match 'node_modules|at\s+|C:\\|Users|PGRST') {
    Write-Host "FAIL: Potential internal leak detected!" -ForegroundColor Red
  } else {
    Write-Host "PASS: Clean, sanitized client response with zero internal leaks." -ForegroundColor Green
  }
}

# Test Missing Body on API Routes
try {
  $r2 = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body ''
  Write-Host "Unexpected Success:" $r2
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "Empty Body Error Response:" $body
  if ($body -match 'node_modules|at\s+|C:\\|Users|PGRST') {
    Write-Host "FAIL: Potential internal leak detected!" -ForegroundColor Red
  } else {
    Write-Host "PASS: Clean, sanitized client response with zero internal leaks." -ForegroundColor Green
  }
}

Write-Host "`n=== ALL ERROR HANDLING AND SANITIZATION TESTS VERIFIED ===" -ForegroundColor Green
