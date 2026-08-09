'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Award, ArrowRight, Search, User, Sun, Moon, BookOpen, Users, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
      className="fixed top-0 left-0 right-0 z-30 bg-white/70 dark:bg-[#080d1a]/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-900/50 transition-all"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-transparent.png" alt="AI Institute Logo" className="h-14 scale-110 ml-2 w-auto object-contain drop-shadow-md mix-blend-multiply dark:mix-blend-normal" />
        </div>

        {/* Menu Links */}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Live Search Results Overlay Dropdown */}
          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] flex flex-col">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" /> {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </span>
                <span>Press Esc to close</span>
              </div>

              <div className="overflow-y-auto p-2 space-y-3">
                {totalResults === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No results found for "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>"
                  </div>
                ) : (
                  <>
                    {/* Matching Mentors */}
                    {matchedMentors.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Mentors ({matchedMentors.length})
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchedMentors.map((m, idx) => (
                            <a
                              key={idx}
                              href="#mentors"
                              onClick={() => setIsSearchFocused(false)}
                              className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5">
                                <img src={m.image} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.name}</h4>
                                  <p className="text-[10px] text-slate-500 truncate">{m.role}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">View Profile</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Courses */}
                    {matchedCourses.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Courses ({matchedCourses.length})
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchedCourses.map((c) => (
                            <div
                              key={c.id}
                              onClick={(e) => {
                                setIsSearchFocused(false);
                                onAccessPortal(e, c.id);
                              }}
                              className="p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all flex items-center justify-between cursor-pointer group"
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
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5 text-blue-600" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
          </button>

          <button
            onClick={onAccessPortal}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/15 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentUser={currentUser} 
      />
    </motion.header>
  );
};

