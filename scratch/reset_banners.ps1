$brainDir = "C:\Users\ARYAN\.gemini\antigravity\brain\02cef035-9ebf-44a1-b9aa-dbe2dda6a514"
$destDir = "c:\Users\ARYAN\OneDrive\Desktop\ai institute webapp\public\banners"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

Copy-Item "$brainDir\banner_data_science_1786181682953.jpg" "$destDir\data-science.png" -Force
Copy-Item "$brainDir\banner_generative_ai_1786181710397.jpg" "$destDir\generative-ai.png" -Force
Copy-Item "$brainDir\banner_full_stack_dev_1786181553029.jpg" "$destDir\full-stack-web-dev.png" -Force
Copy-Item "$brainDir\banner_business_analyst_1786181515893.jpg" "$destDir\business-analyst.png" -Force
Copy-Item "$brainDir\banner_digital_marketing_1786181532737.jpg" "$destDir\digital-marketing.png" -Force
Copy-Item "$brainDir\.user_uploaded\media_1786183179410.png" "$destDir\data-analyst.png" -Force

Write-Host "All banners successfully reset!"
