$baseUrl = "http://localhost:3000"

# Attempt 1: Failed credentials -> initiates tracking
try {
  $r1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"cooldown_test@gmail.com","password":"1"}'
} catch {
  Write-Host "Attempt 1 failed as expected (Password too short)."
}

# Attempt 2: Failed credentials -> escalates backoff
try {
  $r2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"cooldown_test@gmail.com","password":"1"}'
} catch {
  Write-Host "Attempt 2 failed -> Backoff cooldown set."
}

# Attempt 3: Immediate attempt while in cooldown -> MUST return 429
try {
  $r3 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"cooldown_test@gmail.com","password":"1"}'
  Write-Host "Unexpected Success:" $r3
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $body = $reader.ReadToEnd()
  Write-Host "Attempt 3 Status Code (Expected 429):" $statusCode
  Write-Host "Attempt 3 Body:" $body
}
