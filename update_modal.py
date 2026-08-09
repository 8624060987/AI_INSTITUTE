import re

def update_modal():
    with open('src/components/shared/EditProfileModal.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add states
    old_states = """  const [editFullName, setEditFullName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);"""
    
    new_states = """  const [editFullName, setEditFullName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editExpertise, setEditExpertise] = useState('');
  const [editExperience, setEditExperience] = useState(0);
  const [editCompany, setEditCompany] = useState('');
  const [isSaving, setIsSaving] = useState(false);"""
    
    if "editBio" not in content:
        content = content.replace(old_states, new_states)

    # Update useEffect
    old_effect = """  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser, isOpen]);"""

    new_effect = """  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditBio(currentUser.bio || '');
      setEditExpertise(currentUser.expertise || '');
      setEditExperience(currentUser.experienceYears || 0);
      setEditCompany(currentUser.company || '');
    }
  }, [currentUser, isOpen]);"""
    
    content = content.replace(old_effect, new_effect)

    # Update saveSettings
    old_save = """  const saveSettings = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          avatar_url: editAvatarUrl
        })
        .eq('id', currentUser.id);"""

    new_save = """  const saveSettings = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const updates: any = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: editFullName,
        avatar_url: editAvatarUrl
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
    
    content = content.replace(old_save, new_save)

    # Update UI (JSX)
    old_jsx = """              {/* Name Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white font-medium disabled:opacity-50"
                  placeholder="Enter your full name"
                />
              </div>
            </div>"""

    new_jsx = """              {/* Name Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white font-medium disabled:opacity-50"
                  placeholder="Enter your full name"
                />
              </div>
              
              {/* Mentor specific inputs */}
              {currentUser?.role === 'mentor' && (
                <div className="space-y-6 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white min-h-[60px]"
                      placeholder="Tell students about yourself..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Subject / Expertise</label>
                      <input
                        type="text"
                        value={editExpertise}
                        onChange={(e) => setEditExpertise(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                        placeholder="e.g. AI, Math"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Company</label>
                      <input
                        type="text"
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                        placeholder="Google, XYZ Inc."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>"""
    
    content = content.replace(old_jsx, new_jsx)

    # Allow scrolling for the modal content if it gets too tall
    content = content.replace('className="p-6 space-y-6"', 'className="p-6 space-y-6 max-h-[60vh] overflow-y-auto"')

    with open('src/components/shared/EditProfileModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_modal()
print("Updated modal!")
