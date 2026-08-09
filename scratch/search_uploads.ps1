Get-ChildItem -Path .\src -Recurse -File -Include *.ts,*.tsx | Select-String -Pattern 'type\s*=\s*["'']file["'']|/api/upload|new FormData' | ForEach-Object {
    "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
}
