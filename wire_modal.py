import re

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Import EditProfileModal
    if "EditProfileModal" not in content:
        content = content.replace("import { AIAssistant } from '@/components/shared/AIAssistant';", "import { AIAssistant } from '@/components/shared/AIAssistant';\nimport { EditProfileModal } from '@/components/shared/EditProfileModal';")

    # Add State
    if "isProfileModalOpen" not in content:
        old_state = "const [activeTab, setActiveTab] = useState('dashboard');"
        new_state = "const [activeTab, setActiveTab] = useState('dashboard');\n  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);"
        content = content.replace(old_state, new_state)

    # Replace Header's onEditProfile
    content = content.replace("<Header onEditProfile={() => setActiveTab('settings')} />", "<Header onEditProfile={() => setIsProfileModalOpen(true)} />")

    # Replace Dashboard's button action
    content = content.replace("onClick={() => setActiveTab('settings')}", "onClick={() => setIsProfileModalOpen(true)}")

    # Add the Modal Component at the bottom
    old_end = "      </div>\n    </div>\n  );\n}"
    new_end = "      </div>\n      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} />\n    </div>\n  );\n}"
    content = content.replace(old_end, new_end)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Wired EditProfileModal in page.tsx!")
