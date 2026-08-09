import re

# Update student login
with open("src/app/login/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"redirectTo: window\.location\.origin,"
replacement = r"redirectTo: `${window.location.origin}/auth/callback?role=student`,"
content = re.sub(pattern, replacement, content)

with open("src/app/login/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Update mentor login
with open("src/app/login/mentor/page.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

pattern2 = r"redirectTo: `\$\{window\.location\.origin\}/login/mentor`,"
replacement2 = r"redirectTo: `${window.location.origin}/auth/callback?role=mentor`,"
content2 = re.sub(pattern2, replacement2, content2)

with open("src/app/login/mentor/page.tsx", "w", encoding="utf-8") as f:
    f.write(content2)

print("Updated login pages")
