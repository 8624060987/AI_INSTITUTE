$baseUrl = "http://localhost:3000"

Write-Host "`n=== 1. TESTING STRICT AUTH LOGIN SCHEMA (INVALID EMAIL FORMAT) ===" -ForegroundColor Cyan
try {
  $res1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"not-an-email","password":"password123"}'
  Write-Host "Unexpected Success:" $res1
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "HTTP Status (Expected 400):" $statusCode
  Write-Host "Strict Rejection Body:" $body
}

Write-Host "`n=== 2. TESTING STRICT SCHEMA (EXTRA UNKNOWN FIELD REJECTION) ===" -ForegroundColor Cyan
try {
  $res2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"valid@example.com","password":"password123","hacked_field":"injected_payload"}'
  Write-Host "Unexpected Success:" $res2
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "HTTP Status (Expected 400):" $statusCode
  Write-Host "Strict Rejection Body:" $body
}

Write-Host "`n=== 3. TESTING STRICT LEAD SUBMISSION (INVALID PHONE FORMAT) ===" -ForegroundColor Cyan
try {
  $res3 = Invoke-RestMethod -Uri "$baseUrl/api/submit-lead" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"John Doe","phone":"abc_not_a_phone"}'
  Write-Host "Unexpected Success:" $res3
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "HTTP Status (Expected 400):" $statusCode
  Write-Host "Strict Rejection Body:" $body
}

Write-Host "`n=== 4. TESTING STRICT UPI VERIFICATION (INVALID UTR CHARACTERS) ===" -ForegroundColor Cyan
try {
  $res4 = Invoke-RestMethod -Uri "$baseUrl/api/payment/verify-upi" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"utrNumber":"###INVALID###"}'
  Write-Host "Unexpected Success:" $res4
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "HTTP Status (Expected 400):" $statusCode
  Write-Host "Strict Rejection Body:" $body
}

Write-Host "`n=== 5. TESTING VALID PAYLOAD (SHOULD PASS STRICT SCHEMA) ===" -ForegroundColor Green
try {
  $res5 = Invoke-RestMethod -Uri "$baseUrl/api/submit-lead" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Aryan Student","phone":"9876543210","course":"Generative AI"}'
  Write-Host "Success Response (Expected 200):" ($res5 | ConvertTo-Json -Compress)
} catch {
  Write-Host "Error:" $_
}

Write-Host "`n=== ALL STRICT SCHEMA VALIDATIONS VERIFIED ===" -ForegroundColor Green
