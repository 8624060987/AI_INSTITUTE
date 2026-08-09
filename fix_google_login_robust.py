import re

# Update student login
with open("src/app/login/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"localStorage\.setItem\('just_logged_in', 'true'\);"
replacement = r"localStorage.setItem('just_logged_in', 'true');\n        localStorage.setItem('oauth_role', 'student');"
content = re.sub(pattern, replacement, content)

content = content.replace(
    "redirectTo: `${window.location.origin}/auth/callback?role=student`,",
    "redirectTo: window.location.origin,"
)

with open("src/app/login/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Update mentor login
with open("src/app/login/mentor/page.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

pattern2 = r"localStorage\.setItem\('just_logged_in', 'true'\);"
replacement2 = r"localStorage.setItem('just_logged_in', 'true');\n        localStorage.setItem('oauth_role', 'mentor');"
content2 = re.sub(pattern2, replacement2, content2)

content2 = content2.replace(
    "redirectTo: `${window.location.origin}/auth/callback?role=mentor`,",
    "redirectTo: window.location.origin,"
)

with open("src/app/login/mentor/page.tsx", "w", encoding="utf-8") as f:
    f.write(content2)

print("Updated login pages to use localStorage for role and origin for redirectTo")
