$env:Path = "$env:LOCALAPPDATA\MinGit\cmd;" + $env:Path
$repoUrl = "https://github.com/aryanbagul57-sys/aiinstitute.git"

Write-Host "Initializing Git Repository..."
git init

Write-Host "Configuring Git User Details..."
git config user.name "aryanbagul57-sys"
git config user.email "aryanbagul57@gmail.com"

Write-Host "Configuring Remote Origin..."
git remote remove origin 2>$null
git remote add origin $repoUrl

Write-Host "Renaming branch to main..."
git branch -M main

Write-Host "Staging all project files..."
git add .

Write-Host "Committing project files..."
git commit -m "Initial commit: Complete AI Institute Web Application codebase"

Write-Host "Pushing code to GitHub repository ($repoUrl)..."
git push -u origin main --force

Write-Host "Git Push execution completed."
