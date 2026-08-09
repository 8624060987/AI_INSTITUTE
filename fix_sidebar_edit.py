import re

def update_sidebar():
    with open('src/components/shared/Sidebar.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Update interface
    old_interface = """interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}"""
    new_interface = """interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEditProfile?: () => void;
}"""
    content = content.replace(old_interface, new_interface)

    # Update component signature
    old_sig = "export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {"
    new_sig = "export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onEditProfile }) => {"
    content = content.replace(old_sig, new_sig)

    # Update onClick
    old_onclick = "onClick={() => setActiveTab('settings')}"
    new_onclick = "onClick={() => onEditProfile ? onEditProfile() : setActiveTab('settings')}"
    
    # We only want to replace the last occurrence which is the edit button in the user info section
    parts = content.rsplit(old_onclick, 1)
    if len(parts) == 2:
        content = parts[0] + new_onclick + parts[1]

    with open('src/components/shared/Sidebar.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />", "<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onEditProfile={() => setIsProfileModalOpen(true)} />")

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_sidebar()
update_page()
print("Fixed Sidebar Edit button!")
