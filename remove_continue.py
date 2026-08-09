import re

with open("src/app/portal/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# The grid wrap is: <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
# We want to change it to lg:grid-cols-1 so the remaining panel takes full width, OR just remove the grid entirely if we want it to be normal width.
# Actually, the user just said "remove section Continue Learning".

pattern = r'\{\/\* Continue Learning Course Player Area \*\/\}.*?\{\/\* Upcoming Live Class Panel \*\/\}'
replacement = '{/* Upcoming Live Class Panel */}'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Let's also change lg:grid-cols-3 to lg:grid-cols-1 if it exists right above
new_content = new_content.replace('className="grid grid-cols-1 lg:grid-cols-3 gap-6"', 'className="grid grid-cols-1 lg:grid-cols-1 gap-6"')

with open("src/app/portal/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Removed Continue Learning")
