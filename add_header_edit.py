import re

def update_header():
    with open('src/components/shared/Header.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the right area
    pattern = r'({\s*/\*\s*Right Area: Notifications & User Avatar\s*\*/\s*}\s*<div className="flex items-center gap-4">)'
    replacement = r'\1\n          {/* Edit Profile Button */}\n          {onEditProfile && (\n            <button \n              onClick={onEditProfile}\n              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"\n              title="Edit Profile"\n            >\n              <Settings className="w-4 h-4" />\n              <span className="hidden sm:inline">Edit Profile</span>\n            </button>\n          )}\n'
    
    if "Edit Profile Button" not in content:
        content = re.sub(pattern, replacement, content)

    with open('src/components/shared/Header.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_header()
print("Header fixed!")
