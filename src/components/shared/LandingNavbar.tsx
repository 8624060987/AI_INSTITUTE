'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Award, ArrowRight, Search, User, Sun, Moon, BookOpen, Users, X, Sparkles, Menu, GraduationCap, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditProfileModal } from './EditProfileModal';
import { UserProfile, useDatabase } from '@/context/DatabaseContext';
import { useTheme } from '@/context/ThemeContext';

interface LandingNavbarProps {
  onAccessPortal: (e: React.MouseEvent, courseId?: string) => void;
  currentUser: UserProfile;
  isAuthenticated: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onAccessPortal, currentUser, isAuthenticated }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { courses } = useDatabase();

  const MENTORS_LIST = [
    {
      name: "Vaibhav Ahire",
      role: "Python, AI & Machine Learning",
      image: "/uploads/vaibhav_ahire.png",
      courses: "AI & ML, Data Science, GenAI"
    },
    {
      name: "Jay Koche",
      role: "Data Analytics, Data Science, Business Analyst",
      image: "https://ui-avatars.com/api/?name=Jay+Koche&background=eff6ff&color=2563eb&size=150",
      courses: "Data Analytics, Business Analyst"
    },
    {
      name: "Siddhi Pawar",
      role: "Business Communication & Soft Skills",
      image: "https://ui-avatars.com/api/?name=Siddhi+Pawar&background=eff6ff&color=2563eb&size=150",
      courses: "Business Communication, Soft Skills"
    },
    {
      name: "Vishwadeep Chavan",
      role: "Cyber Security & Information Technology",
      image: "/uploads/vishwadeep_chavan.jpg",
      courses: "Cyber Security, IT & Software"
    }
  ];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = searchQuery.trim().toLowerCase();
  
  const matchedMentors = query ? MENTORS_LIST.filter(m => 
    m.name.toLowerCase().includes(query) || 
    m.role.toLowerCase().includes(query) ||
    m.courses.toLowerCase().includes(query)
  ) : [];

  const matchedCourses = query ? courses.filter(c => 
    c.title.toLowerCase().includes(query) || 
    c.category.toLowerCase().includes(query) ||
    c.mentorName.toLowerCase().includes(query)
  ) : [];

  const totalResults = matchedMentors.length + matchedCourses.length;

  return (
    <motion.header 
      initial={{ y: -100 }} 
      animate={{ y: 0 }} 
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#080d1a]/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-transparent.png" 
            alt="AI Institute Logo" 
            height="48"
            width="180"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo-icon.png'; }}
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md mix-blend-multiply dark:mix-blend-normal" 
            style={{ maxHeight: '48px', maxWidth: '200px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'inline-block' }}
          />
        </div>

        {/* Desktop Menu Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a href="#courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courses</a>
          <a href="#why-choose" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Why AI Institute</a>
          <a href="#mentors" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Top Mentors</a>
          <a href="#testimonials" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Testimonials</a>
        </nav>

        {/* Interactive Search Bar for Mentors & Courses */}
        <div ref={searchRef} className="hidden lg:flex relative mx-4 flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search mentors & courses (e.g. Vaibhav, AI, IT)..." 
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Modal */}
          {isSearchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">Search Results ({totalResults})</span>
                <button onClick={() => setIsSearchFocused(false)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>

              {totalResults === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No mentors or courses found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="space-y-4">
                  {matchedMentors.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Mentors</span>
                      </div>
                      <div className="space-y-1.5">
                        {matchedMentors.map((m, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setIsSearchFocused(false);
                              const el = document.getElementById('mentors');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center gap-3 transition-colors group"
                          >
                            <img src={m.image} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-500/20" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">{m.name}</h4>
                              <p className="text-[10px] text-slate-500 truncate">{m.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Courses</span>
                      </div>
                      <div className="space-y-1.5">
                        {matchedCourses.map((c) => (
                          <div 
                            key={c.id}
                            onClick={(e) => {
                              setIsSearchFocused(false);
                              onAccessPortal(e, c.id);
                            }}
                            className="p-2 rounded-xl hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={c.imageUrl} alt={c.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{c.title}</h4>
                                <p className="text-[10px] text-slate-500">
                                  {isAuthenticated ? `₹${c.price} • ` : ''}{c.category}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">Enroll Now</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop & Mobile Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-blue-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Unified Login / My Classroom button */}
          <a
            href={isAuthenticated ? "/portal" : "/login/student"}
            onClick={(e) => {
              if (onAccessPortal) onAccessPortal(e);
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/15 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>{isAuthenticated ? 'My Workspace' : 'Login / Enroll'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>


          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-[#0a101f]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-5 shadow-2xl"
          >
            <div className="space-y-4">
              {/* Mobile Quick Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses or mentors..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Mobile Menu Links */}
              <nav className="flex flex-col space-y-3 font-semibold text-sm text-slate-700 dark:text-slate-200 pt-2">
                <a 
                  href="#courses" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Courses</span>
                </a>
                <a 
                  href="#why-choose" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Why AI Institute</span>
                </a>
                <a 
                  href="#mentors" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Top Mentors</span>
                </a>
                <a 
                  href="#testimonials" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Testimonials</span>
                </a>
              </nav>

              {/* Mobile Action Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <a
                  href="/login/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                >
                  <span>Login / Enroll</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentUser={currentUser} 
      />
    </motion.header>
  );
};
