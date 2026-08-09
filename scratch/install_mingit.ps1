$dest = "$env:LOCALAPPDATA\MinGit"
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest
}
$zip = "$env:TEMP\MinGit.zip"
Write-Host "Downloading MinGit Portable..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/MinGit-2.48.1-64-bit.zip" -OutFile $zip
Write-Host "Extracting MinGit..."
Expand-Archive -Path $zip -DestinationPath $dest -Force
Write-Host "Testing Git path..."
if (Test-Path "$dest\cmd\git.exe") {
    Write-Host "MinGit successfully installed at $dest\cmd\git.exe"
} else {
    Write-Host "MinGit installation failed."
}
