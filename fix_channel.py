import re

with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"channel_id: 'a306273a-1c7a-47a4-a848-40574c22d229', // using general channel UUID or activeChannel if it matches"
replacement = "channel_id: activeChannel,"

new_content = content.replace(pattern, replacement)

with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)
print("Replaced channel_id hardcode!")
