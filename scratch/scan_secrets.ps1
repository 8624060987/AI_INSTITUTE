$targetDir = ".\src"
$patterns = @(
    'AIza[0-9A-Za-z-_]{35}',
    'sk-[a-zA-Z0-9]{20,}',
    'rzp_(test|live)_[a-zA-Z0-9]+',
    'secret_[a-zA-Z0-9]+',
    'AKfycb[a-zA-Z0-9_\-]+',
    'eyJh[a-zA-Z0-9_\-\.]+',
    'postgres://',
    'mongodb(\+srv)?://',
    'https://script\.google\.com/macros/s/',
    'RAZORPAY_KEY_SECRET\s*=\s*[''"][^''"]+[''"]',
    'GEMINI_API_KEY\s*=\s*[''"][^''"]+[''"]'
)

$results = @()
$files = Get-ChildItem -Path $targetDir -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.env*

foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        foreach ($p in $patterns) {
            if ($line -match $p) {
                $results += [PSCustomObject]@{
                    File = $file.FullName.Replace((Get-Location).Path, ".")
                    LineNumber = $i + 1
                    MatchedPattern = $p
                    Snippet = $line.Trim()
                }
            }
        }
    }
}

Write-Host "=== SENSITIVE KEY & TOKEN SCAN RESULTS ===" -ForegroundColor Cyan
Write-Host "Total findings: $($results.Count)"

foreach ($r in $results) {
    Write-Host "$($r.File):$($r.LineNumber) [$($r.MatchedPattern)]" -ForegroundColor Yellow
    Write-Host "   $($r.Snippet)" -ForegroundColor Gray
}
