import re

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    old_save = """  const saveSettings = async () => {
    if (!currentUser) return;
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: editFullName,
          avatar_url: editAvatarUrl,
          profile_photo_url: editAvatarUrl
        });"""
        
    new_save = """  const saveSettings = async () => {
    if (!currentUser) return;
    setIsSavingSettings(true);
    try {
      const updates: any = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: editFullName,
        avatar_url: editAvatarUrl,
        profile_photo_url: editAvatarUrl
      };
      if (currentUser.role === 'mentor') {
        updates.bio = editBio;
        updates.expertise = editExpertise;
        updates.experience_years = editExperience;
        updates.company = editCompany;
      }
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);"""

    if "updates.bio" not in content:
        content = content.replace(old_save, new_save)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("saveSettings fixed!")
