import re

def update_context():
    with open('src/context/DatabaseContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update UserProfile interface
    old_interface = """export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
}"""
    new_interface = """export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  bio?: string;
  expertise?: string;
  experienceYears?: number;
  company?: string;
}"""
    content = content.replace(old_interface, new_interface)

    # 2. Update fetching profile to map these fields
    old_fetch = """setCurrentUser({
            id: profile.id,
            email: profile.email || session.user.email || '',
            fullName: profile.full_name || 'User',
            avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            role: profile.role as UserRole,
          });"""
    new_fetch = """setCurrentUser({
            id: profile.id,
            email: profile.email || session.user.email || '',
            fullName: profile.full_name || 'User',
            avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            role: profile.role as UserRole,
            bio: profile.bio || '',
            expertise: profile.expertise || '',
            experienceYears: profile.experience_years || 0,
            company: profile.company || '',
          });"""
    content = content.replace(old_fetch, new_fetch)

    with open('src/context/DatabaseContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add states for edit
    old_states = """  const [editFullName, setEditFullName] = useState(currentUser?.fullName || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);"""
    new_states = """  const [editFullName, setEditFullName] = useState(currentUser?.fullName || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editExpertise, setEditExpertise] = useState(currentUser?.expertise || '');
  const [editExperience, setEditExperience] = useState(currentUser?.experienceYears || 0);
  const [editCompany, setEditCompany] = useState(currentUser?.company || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);"""
    content = content.replace(old_states, new_states)

    # 2. Update reset effect
    old_effect = """  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName);
      setEditAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser]);"""
    new_effect = """  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName);
      setEditAvatarUrl(currentUser.avatarUrl);
      setEditBio(currentUser.bio || '');
      setEditExpertise(currentUser.expertise || '');
      setEditExperience(currentUser.experienceYears || 0);
      setEditCompany(currentUser.company || '');
    }
  }, [currentUser]);"""
    content = content.replace(old_effect, new_effect)

    # 3. Update saveSettings
    old_save = """    const { error } = await supabase.from('profiles').update({
      full_name: editFullName,
      avatar_url: editAvatarUrl
    }).eq('id', currentUser.id);"""
    new_save = """    const updates: any = {
      full_name: editFullName,
      avatar_url: editAvatarUrl
    };
    if (currentUser.role === 'mentor') {
      updates.bio = editBio;
      updates.expertise = editExpertise;
      updates.experience_years = editExperience;
      updates.company = editCompany;
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);"""
    content = content.replace(old_save, new_save)

    # 4. Update the settings tab JSX
    old_jsx = """                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Profile Photo</label>
                        <div className="flex items-center gap-4">
                          <img 
                            src={editAvatarUrl} 
                            alt="Profile Preview" 
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800" 
                          />
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              disabled={isSavingSettings}
                              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50 transition-all cursor-pointer"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Recommended size: 256x256px. Max size: 2MB.</p>
                          </div>
                        </div>
                      </div>"""
    new_jsx = old_jsx + """
                      
                      {currentUser?.role === 'mentor' && (
                        <>
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Mentor Details</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Bio</label>
                                <textarea
                                  value={editBio}
                                  onChange={(e) => setEditBio(e.target.value)}
                                  className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white min-h-[80px]"
                                  placeholder="Tell students about yourself..."
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Expertise</label>
                                  <input
                                    type="text"
                                    value={editExpertise}
                                    onChange={(e) => setEditExpertise(e.target.value)}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                    placeholder="e.g. AI, React, Python"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Company / Org</label>
                                  <input
                                    type="text"
                                    value={editCompany}
                                    onChange={(e) => setEditCompany(e.target.value)}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                    placeholder="Google, DeepMind, etc."
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Years of Experience</label>
                                <input
                                  type="number"
                                  value={editExperience}
                                  onChange={(e) => setEditExperience(Number(e.target.value))}
                                  className="w-full sm:w-1/2 bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}"""
    content = content.replace(old_jsx, new_jsx)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_context()
update_page()
print("Mentor profile edit fields injected!")
