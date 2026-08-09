import re

with open("src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Pattern to find community post triggers
pattern = r"(addCommunityPost\(activeCourseId, chatInput, selectedImage \|\| undefined\);\s*setChatInput\(''\);\s*setSelectedImage\(null\);\s*)triggerConfetti\(\);"
replacement = r"\1"

new_content = re.sub(pattern, replacement, content)

with open("src/app/portal/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Removed confetti from community chat")
