'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { 
  Bell, Search, Calendar, CheckCheck, Menu, Settings, Sun, Moon, 
  BookOpen, Video, FileText, Award, X, ArrowRight, Sparkles 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
  onEditProfile?: () => void;
  onSelectCourse?: (courseId: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onEditProfile, onSelectCourse, onSelectTab }) => {
  const { courses, videos, notes, assignments, currentUser, notifications, markNotificationsAsRead } = useDatabase();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard hotkey (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'live': return 'bg-rose-500/10 text-rose-500';
      case 'success': return 'bg-emerald-500/10 text-emerald-500';
      case 'warning': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  // Filter items based on search query
  const query = searchQuery.trim().toLowerCase();
  const matchedCourses = query ? courses.filter(c => 
    c.title.toLowerCase().includes(query) || 
    c.category.toLowerCase().includes(query) ||
    c.mentorName.toLowerCase().includes(query)
  ) : [];

  const matchedVideos = query ? videos.filter(v => 
    v.title.toLowerCase().includes(query) || 
    v.description?.toLowerCase().includes(query)
  ) : [];

  const matchedNotes = query ? notes.filter(n => 
    n.title.toLowerCase().includes(query) || 
    n.description?.toLowerCase().includes(query)
  ) : [];

  const matchedAssignments = query ? assignments.filter(a => 
    a.title.toLowerCase().includes(query) || 
    a.description?.toLowerCase().includes(query)
  ) : [];

  const totalResults = matchedCourses.length + matchedVideos.length + matchedNotes.length + matchedAssignments.length;

  const handleResultClick = (type: 'course' | 'video' | 'note' | 'assignment', id: string, courseId?: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    if (type === 'course') {
      if (onSelectCourse) onSelectCourse(id);
      else router.push(`/portal?courseId=${id}`);
    } else {
      if (courseId && onSelectCourse) onSelectCourse(courseId);
      if (onSelectTab) {
        if (type === 'video') onSelectTab('classroom');
        if (type === 'note') onSelectTab('notes');
        if (type === 'assignment') onSelectTab('assignments');
      } else {
        router.push(`/portal?tab=${type === 'video' ? 'classroom' : type}`);
      }
    }
  };

  return (
    <header className="h-16 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white/80 dark:bg-[#0f1420]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left Area: Mobile Menu Toggle & Greetings */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-full">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>{formatDate()}</span>
        </div>
      </div>

      {/* Middle Area: UPGRADED LIVE SEARCH BAR */}
      <div ref={searchContainerRef} className="flex-1 max-w-md mx-6 relative">
        <div className="relative flex items-center">
          <Search className="w-4.5 h-4.5 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search courses, lessons, notes, mentors... (Ctrl + K)"
            className="w-full bg-[#f8fafc] dark:bg-[#080d1a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl pl-10 pr-16 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery ? (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-300/40 dark:border-slate-700/40 pointer-events-none">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Live Search Results Dropdown Modal */}
        {isSearchFocused && searchQuery.trim() !== '' && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#0f1420] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-[#e2e8f0] dark:border-[#1e293b] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Found {totalResults} matching item{totalResults !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-slate-400">Esc to close</span>
            </div>

            <div className="overflow-y-auto p-2 space-y-3">
              {totalResults === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matches found for "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>". Try searching for "Python", "Data Science", "AI", or "Vaibhav".
                </div>
              ) : (
                <>
                  {/* Matching Courses */}
                  {matchedCourses.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Courses ({matchedCourses.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedCourses.map(course => (
                          <div
                            key={course.id}
                            onClick={() => handleResultClick('course', course.id)}
                            className="p-2.5 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-all flex items-center justify-between cursor-pointer group border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={course.imageUrl} alt={course.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {course.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {course.category} • Instructor: {course.mentorName}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0 ml-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Open <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Video Lessons */}
                  {matchedVideos.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video Lessons ({matchedVideos.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedVideos.map(video => (
                          <div
                            key={video.id}
                            onClick={() => handleResultClick('video', video.id, video.courseId)}
                            className="p-2.5 rounded-xl hover:bg-purple-50/70 dark:hover:bg-purple-950/40 transition-all flex items-center justify-between cursor-pointer group border border-transparent hover:border-purple-200 dark:hover:border-purple-800/40"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Video className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                  {video.title}
                                </h4>
                                <span className="text-[10px] text-slate-400">{video.duration}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                              Play Lesson
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Notes */}
                  {matchedNotes.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Notes & PDFs ({matchedNotes.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedNotes.map(note => (
                          <div
                            key={note.id}
                            onClick={() => handleResultClick('note', note.id, note.courseId)}
                            className="p-2.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-all flex items-center justify-between cursor-pointer group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                  {note.title}
                                </h4>
                                <span className="text-[10px] text-slate-400">{note.fileSize}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                              Read PDF
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Assignments */}
                  {matchedAssignments.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Assignments ({matchedAssignments.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedAssignments.map(ass => (
                          <div
                            key={ass.id}
                            onClick={() => handleResultClick('assignment', ass.id, ass.courseId)}
                            className="p-2.5 rounded-xl hover:bg-amber-50/70 dark:hover:bg-amber-950/40 transition-all flex items-center justify-between cursor-pointer group border border-transparent hover:border-amber-200 dark:hover:border-amber-800/40"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Award className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                  {ass.title}
                                </h4>
                                <span className="text-[10px] text-slate-400">Points: {ass.points}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                              View Task
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Notifications & User Avatar */}
      <div className="flex items-center gap-4">
          {/* Edit Profile Button */}
          {onEditProfile && (
            <button 
              onClick={onEditProfile}
              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-blue-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* Notifications Icon Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f1420]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0f1420] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-xl z-30 py-2">
              <div className="px-4 py-2 border-b border-[#e2e8f0] dark:border-[#1e293b] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      markNotificationsAsRead();
                      setShowNotifications(false);
                    }}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <div
                      key={`${notif.id}_${idx}`}
                      className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all flex gap-3 border-b border-slate-100 dark:border-slate-900 last:border-b-0 ${
                        !notif.read ? 'bg-blue-50/10 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotificationIconColor(notif.type)}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${!notif.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.content}
                        </p>
                        <span className="text-[9px] text-slate-400/80 dark:text-slate-500/80 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentUser.fullName}
            </p>
            <p className="text-[9px] uppercase tracking-wider font-bold text-blue-500 mt-0.5">
              {currentUser.role}
            </p>
          </div>
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
          />
        </div>
      </div>
    </header>
  );
};
