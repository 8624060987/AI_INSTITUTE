import re

with open("src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Replace any corrupted Hello string with the proper emoji
content = re.sub(r"Hello, \{currentUser\.fullName\}.*", "Hello, {currentUser.fullName} ??", content)

with open("src/app/portal/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed Hello string")
