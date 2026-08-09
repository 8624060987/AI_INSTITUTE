import re

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    old_banner = """                    {/* Greeting */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Welcome back, {currentUser.fullName.split(" ")[0]}! ??</h2>
                        <p className="text-xs text-slate-400 mt-1">Here is what is happening in your classrooms today.</p>
                      </div>
                    </div>"""
    
    new_banner = """                    {/* Greeting */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-800" />
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Welcome back, {currentUser.fullName.split(" ")[0]}! ??</h2>
                          <p className="text-[11px] text-slate-400 mt-0.5">Here is what is happening in your classrooms today.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> Edit Profile
                      </button>
                    </div>"""
    
    content = content.replace(old_banner, new_banner)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Added Edit Profile button to Mentor Dashboard!")
