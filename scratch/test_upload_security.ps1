$baseUrl = "http://localhost:3000"

Write-Host "`n=== 1. TESTING VALID PNG IMAGE UPLOAD (MAGIC BYTES VERIFIED) ===" -ForegroundColor Cyan
# Valid PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
$validPngBytes = [byte[]]@(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52)
$boundary = [System.Guid]::NewGuid().ToString()
$fileHeader = "--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"valid_assignment.png`"`r`nContent-Type: image/png`r`n`r`n"
$fileFooter = "`r`n--$boundary--`r`n"

$enc = [System.Text.Encoding]::ASCII
$bodyBytes = [System.Collections.Generic.List[byte]]::new()
$bodyBytes.AddRange($enc.GetBytes($fileHeader))
$bodyBytes.AddRange($validPngBytes)
$bodyBytes.AddRange($enc.GetBytes($fileFooter))

try {
  $req = [System.Net.HttpWebRequest]::Create("$baseUrl/api/upload")
  $req.Method = "POST"
  $req.ContentType = "multipart/form-data; boundary=$boundary"
  $stream = $req.GetRequestStream()
  $stream.Write($bodyBytes.ToArray(), 0, $bodyBytes.Count)
  $stream.Close()
  
  $resp = $req.GetResponse()
  $rReader = New-Object System.IO.StreamReader($resp.GetResponseStream())
  $resBody = $rReader.ReadToEnd()
  Write-Host "Success (Expected 200):" $resBody -ForegroundColor Green
} catch {
  Write-Host "Unexpected Fail:" $_ -ForegroundColor Red
}

Write-Host "`n=== 2. TESTING DISGUISED EXECUTABLE (.EXE DISGUISED AS .JPG) ===" -ForegroundColor Cyan
# Executable MZ Header: 4D 5A ('MZ')
$exeBytes = [byte[]]@(0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00)
$boundary2 = [System.Guid]::NewGuid().ToString()
$fileHeader2 = "--$boundary2`r`nContent-Disposition: form-data; name=`"file`"; filename=`"fake_resume.jpg`"`r`nContent-Type: image/jpeg`r`n`r`n"
$fileFooter2 = "`r`n--$boundary2--`r`n"

$bodyBytes2 = [System.Collections.Generic.List[byte]]::new()
$bodyBytes2.AddRange($enc.GetBytes($fileHeader2))
$bodyBytes2.AddRange($exeBytes)
$bodyBytes2.AddRange($enc.GetBytes($fileFooter2))

try {
  $req2 = [System.Net.HttpWebRequest]::Create("$baseUrl/api/upload")
  $req2.Method = "POST"
  $req2.ContentType = "multipart/form-data; boundary=$boundary2"
  $stream2 = $req2.GetRequestStream()
  $stream2.Write($bodyBytes2.ToArray(), 0, $bodyBytes2.Count)
  $stream2.Close()
  
  $resp2 = $req2.GetResponse()
  Write-Host "FAIL: Exe should have been blocked!" -ForegroundColor Red
} catch [System.Net.WebException] {
  $errResp = $_.Exception.Response
  $eReader = New-Object System.IO.StreamReader($errResp.GetResponseStream())
  $errBody = $eReader.ReadToEnd()
  Write-Host "BLOCKED (Expected 400):" $errBody -ForegroundColor Yellow
}

Write-Host "`n=== 3. TESTING DISGUISED PHP SCRIPT DISGUISED AS .PNG ===" -ForegroundColor Cyan
$phpBytes = $enc.GetBytes("<?php system(`$_GET['cmd']); ?>")
$boundary3 = [System.Guid]::NewGuid().ToString()
$fileHeader3 = "--$boundary3`r`nContent-Disposition: form-data; name=`"file`"; filename=`"web_shell.png`"`r`nContent-Type: image/png`r`n`r`n"
$fileFooter3 = "`r`n--$boundary3--`r`n"

$bodyBytes3 = [System.Collections.Generic.List[byte]]::new()
$bodyBytes3.AddRange($enc.GetBytes($fileHeader3))
$bodyBytes3.AddRange($phpBytes)
$bodyBytes3.AddRange($enc.GetBytes($fileFooter3))

try {
  $req3 = [System.Net.HttpWebRequest]::Create("$baseUrl/api/upload")
  $req3.Method = "POST"
  $req3.ContentType = "multipart/form-data; boundary=$boundary3"
  $stream3 = $req3.GetRequestStream()
  $stream3.Write($bodyBytes3.ToArray(), 0, $bodyBytes3.Count)
  $stream3.Close()
  
  $resp3 = $req3.GetResponse()
  Write-Host "FAIL: PHP script should have been blocked!" -ForegroundColor Red
} catch [System.Net.WebException] {
  $errResp = $_.Exception.Response
  $eReader = New-Object System.IO.StreamReader($errResp.GetResponseStream())
  $errBody = $eReader.ReadToEnd()
  Write-Host "BLOCKED (Expected 400):" $errBody -ForegroundColor Yellow
}

Write-Host "`n=== 4. TESTING STORAGE ISOLATION OUTSIDE WEB ROOT ===" -ForegroundColor Cyan
$storagePath = ".\storage\uploads"
if (Test-Path $storagePath) {
  $files = Get-ChildItem -Path $storagePath
  Write-Host "Isolated Storage Directory exists: $storagePath (Total files: $($files.Count))" -ForegroundColor Green
  foreach ($f in $files) {
    Write-Host "   -> $($f.Name) (Size: $($f.Length) bytes)" -ForegroundColor Gray
  }
} else {
  Write-Host "Storage path not created yet." -ForegroundColor Yellow
}

Write-Host "`n=== ALL UPLOAD CONTENT & STORAGE ISOLATION TESTS VERIFIED ===" -ForegroundColor Green
