import re

# 1. Update DatabaseContext.tsx: Change price 4999 -> 4599 for Data Science Mastery and replace any corrupted currency symbols
with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Fix price for course-ds
content = content.replace("price: 4999,", "price: 4599,")
# Replace any corrupted currency characters if present
content = content.replace("₹", "?")

with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# 2. Update src/app/portal/page.tsx: Replace all corrupted currency characters with ?
with open("src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    portal_content = f.read()

portal_content = portal_content.replace("₹", "?")

with open("src/app/portal/page.tsx", "w", encoding="utf-8") as f:
    f.write(portal_content)

# 3. Update src/app/page.tsx: Replace any corrupted symbols
with open("src/app/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    landing_content = f.read()

landing_content = landing_content.replace("₹", "?")

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(landing_content)

print("Price & Rupee symbol fixes completed successfully.")
