$src = "C:\Users\ARYAN\.gemini\antigravity\brain\02cef035-9ebf-44a1-b9aa-dbe2dda6a514\.user_uploaded\media_1786209564952.png"
$destImg = "c:\Users\ARYAN\OneDrive\Desktop\ai institute webapp\public\images"
$destBanners = "c:\Users\ARYAN\OneDrive\Desktop\ai institute webapp\public\banners"

if (!(Test-Path $destImg)) { New-Item -ItemType Directory -Force -Path $destImg }
if (!(Test-Path $destBanners)) { New-Item -ItemType Directory -Force -Path $destBanners }

Copy-Item $src "$destImg\banner_cyber_sec.png" -Force
Copy-Item $src "$destImg\banner_cyber_sec.jpg" -Force
Copy-Item $src "$destBanners\cyber-security.png" -Force

Write-Host "Cyber Security image saved successfully!"
