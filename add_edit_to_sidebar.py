import re

def update_page():
    with open('src/components/shared/Sidebar.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Import Edit2 if not imported
    if "Edit2" not in content and "lucide-react" in content:
        content = content.replace("Settings,", "Settings, Edit2,")

    old_user_info = """        {/* User Info */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.fullName} 
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
              {currentUser.fullName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>"""
    
    new_user_info = """        {/* User Info */}
        <div className="flex items-center gap-3 px-2 pt-2 group relative">
          <div className="relative">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.fullName} 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
              {currentUser.fullName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {currentUser.email}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>"""
    
    content = content.replace(old_user_info, new_user_info)

    with open('src/components/shared/Sidebar.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Added Edit button to Sidebar Profile Photo!")
