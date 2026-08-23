'use client';

import React from 'react';
import { useDatabase, UserRole } from '@/context/DatabaseContext';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/utils/supabase/client';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Award, 
  Users, 
  Trophy, 
  Download, 
  HelpCircle, 
  Settings, Edit2, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Shield,
  Layers,
  LayoutGrid,
  ChevronDown,
  Briefcase,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEditProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onEditProfile }) => {
  const { currentUser } = useDatabase();
  const { theme, toggleTheme } = useTheme();

  const studentNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Layers },
    { id: 'courses', name: 'All Courses', icon: LayoutGrid },
    { id: 'live', name: 'Live Classes', icon: Video },
    { id: 'jobs', name: 'AI Job Matcher', icon: Briefcase },
    { id: 'assignments', name: 'Assignments', icon: FileText },
    { id: 'tests', name: 'Tests', icon: FileText },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'notes', name: 'Notes & PDFs', icon: FileText },
    { id: 'downloads', name: 'Downloads', icon: Download },
    { id: 'certificates', name: 'Certificates', icon: Award },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const mentorNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Layers },
    { id: 'courses', name: 'My Courses', icon: BookOpen },
    { id: 'grant-access', name: 'Grant Free Access', icon: Shield },
    { id: 'live', name: 'Live Sessions', icon: Video },
    { id: 'assignments', name: 'Assignments', icon: FileText },
    { id: 'students', name: 'Students', icon: User },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Layers },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'grant-access', name: 'Grant Free Access', icon: Shield },
    { id: 'mentors', name: 'Mentors', icon: User },
    { id: 'payments', name: 'Payments', icon: FileText },
    { id: 'leads', name: 'Lead Mgmt', icon: Users },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'admin': return adminNavItems;
      case 'mentor': return mentorNavItems;
      default: return studentNavItems;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 glass-panel border-r border-[#e2e8f0] dark:border-[#1e293b] flex flex-col h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#e2e8f0] dark:border-[#1e293b] flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <img src="/logo-full.png" alt="AI Institute Logo" className="h-16 scale-110 ml-2 w-auto object-contain drop-shadow-md" />
          <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-500">
            {currentUser.role} portal
          </span>
        </div>
      </div>

      {/* Navigation Links — vertical stack (standing line) */}
      <nav className="flex-1 flex flex-col px-4 py-6 overflow-y-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex flex-row items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span className="truncate text-left">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings / Actions Footer */}
      <div className="p-4 border-t border-[#e2e8f0] dark:border-[#1e293b] space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/40"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-blue-500" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </>
            )}
          </div>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
            Toggle
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            // Clear ALL session keys — prevents stale phantom sessions from being restored
            const sessionKeys = [
              'user_role',
              'granted_student_user',
              'just_logged_in',
              'lms_user_logged_in',
              'lms_user',
              'lms_mentor_profile',
              'lms_enrolled',
              'my_active_session_token',
            ];
            sessionKeys.forEach(k => localStorage.removeItem(k));
            // Also clear any per-user session tokens
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('lms_active_session_')) localStorage.removeItem(k);
            });
            window.location.href = '/';
          }}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </div>
        </button>

        {/* User Info */}
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
            onClick={() => onEditProfile ? onEditProfile() : setActiveTab('settings')}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
