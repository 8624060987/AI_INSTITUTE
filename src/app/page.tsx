'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ArrowRight, Play, Sparkles, CheckCircle, BookOpen, Users, 
  Trophy, Briefcase, ChevronDown, Star, Lock, MonitorPlay, 
  FileText, Download, UserCheck, Calendar, ShieldCheck, Mail, Phone, User, Loader2,
  TrendingUp, Target, DollarSign, Zap, CheckCircle2, Award, GraduationCap, X
} from 'lucide-react';
import { LandingNavbar } from '@/components/shared/LandingNavbar';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { AIAssistant } from '@/components/shared/AIAssistant';
import { DemoLectureModal } from '@/components/shared/DemoLectureModal';
import { HeroBannerSlider } from '@/components/shared/HeroBannerSlider';
import { ComingSoonCourseModal, isUpcomingCourse } from '@/components/shared/ComingSoonCourseModal';
import { useDatabase, dedupeCourses } from '@/context/DatabaseContext';

function CompanyLogoBadge({ company }: { company: { name: string; logo: string } }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="h-9 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-center min-w-[70px] max-w-[110px] shrink-0">
      {!logoFailed ? (
        <img
          src={company.logo}
          alt={company.name}
          className="h-4 sm:h-5 w-auto max-w-[80px] object-contain filter grayscale dark:invert hover:grayscale-0 transition-all duration-200"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="font-extrabold text-[11px] tracking-wide text-slate-700 dark:text-slate-300 uppercase">
          {company.name}
        </span>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { courses, currentUser, isAuthenticated, authReady, enrolledCourseIds, addLead } = useDatabase();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [upcomingModalCourse, setUpcomingModalCourse] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial Popup Modal State (Show ONLY for NEW visitors who haven't filled form or logged in)
  const [showCareerModal, setShowCareerModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadySubmittedOrLogged = Boolean(
        localStorage.getItem('user_contact_lead') ||
        localStorage.getItem('lms_user_logged_in') === 'true' ||
        localStorage.getItem('granted_student_user') ||
        localStorage.getItem('lms_user') ||
        sessionStorage.getItem('has_seen_career_modal')
      );
      if (!alreadySubmittedOrLogged) {
        setShowCareerModal(true);
      }
    }
  }, []);

  // Interactive Career Estimator & Title Animation State
  const [calcBackground, setCalcBackground] = useState<'12th' | 'college' | 'non_tech' | 'pro'>('college');
  const [calcGoal, setCalcGoal] = useState<'genai' | 'datascience' | 'analyst' | 'wfh'>('genai');
  const [titleIndex, setTitleIndex] = useState(0);

  // Quick Contact & Enrollment Form State (Before Login)
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleModalEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      alert('Please enter your Name and Mobile Number to continue.');
      return;
    }
    setIsSubmittingContact(true);

    const trackNameMap = {
      genai: 'Generative AI Master Class',
      datascience: 'AI & Machine Learning Complete Guide',
      analyst: 'Data Analytics & BI Professional',
      wfh: 'Cyber Security & Cloud Infrastructure'
    };

    try {
      await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          course: trackNameMap[calcGoal],
        }),
      });
    } catch (apiErr) {}

    if (addLead) {
      addLead({
        name: contactName,
        phone: contactPhone,
        email: '',
        courseInterest: trackNameMap[calcGoal],
        message: `Submitted via Initial Career Engine Modal — Connected to Google Sheet`
      });
    }

    try {
      localStorage.setItem('user_contact_lead', JSON.stringify({ name: contactName, phone: contactPhone, course: trackNameMap[calcGoal] }));
      sessionStorage.setItem('has_seen_career_modal', 'true');
    } catch (err) {}

    setContactSubmitted(true);
    setTimeout(() => {
      setShowCareerModal(false);
      setIsSubmittingContact(false);
    }, 1200);
  };

  const handleCloseCareerModal = () => {
    try {
      sessionStorage.setItem('has_seen_career_modal', 'true');
    } catch (e) {}
    setShowCareerModal(false);
  };

  const handleEnrollFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      alert('Please enter your Name and Mobile Number to continue.');
      return;
    }
    setIsSubmittingContact(true);

    const trackNameMap = {
      genai: 'Generative AI Master Class',
      datascience: 'AI & Machine Learning Complete Guide',
      analyst: 'Data Analytics & BI Professional',
      wfh: 'Cyber Security & Cloud Infrastructure'
    };
    const targetCourseId = calcGoal === 'genai' ? 'course-gen-ai' : calcGoal === 'datascience' ? 'course-ai-ml' : calcGoal === 'analyst' ? 'course-da' : 'course-cyber-sec';

    // 1. Submit lead to API endpoint connected to Google Sheet ID 1To5TqLF8yyPZBKX1eTYZZh8vv2o3aivJLDOgGN0pmwU
    try {
      await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          course: trackNameMap[calcGoal],
        }),
      });
    } catch (apiErr) {
      console.error('API submission error:', apiErr);
    }

    // 2. Add lead to DatabaseContext (Admin Portal Leads)
    if (addLead) {
      addLead({
        name: contactName,
        phone: contactPhone,
        email: '',
        courseInterest: trackNameMap[calcGoal],
        message: `Submitted via Homepage Form — Connected to Google Sheet (1To5TqLF8yyPZBKX1eTYZZh8vv2o3aivJLDOgGN0pmwU)`
      });
    }

    // 3. Save locally to persist user info
    try {
      localStorage.setItem('user_contact_lead', JSON.stringify({ name: contactName, phone: contactPhone, course: trackNameMap[calcGoal] }));
    } catch (err) {}

    setContactSubmitted(true);
    setTimeout(() => {
      handlePremiumClick(e, targetCourseId);
    }, 1500);
  };

  const ROTATING_TITLES = [
    'Generative AI Track',
    'Machine Learning Architect',
    'Data & BI Analytics Track',
    'Cyber Security Track',
    'Global Remote WFH Career'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % ROTATING_TITLES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Intro landing page stays open for users to explore. Clicking buttons will trigger login or portal access.
  
  const handlePremiumClick = (e: React.MouseEvent | React.FormEvent, courseId?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    if (courseId && isUpcomingCourse(courseId)) {
      setUpcomingModalCourse(courseId);
      return;
    }
    const isLogged = isAuthenticated || (typeof window !== 'undefined' && (
      localStorage.getItem('lms_user_logged_in') === 'true' ||
      Boolean(localStorage.getItem('user_role')) ||
      Boolean(localStorage.getItem('granted_student_user'))
    ));

    if (isLogged) {
      // User is already logged in: give direct 100% free classroom access
      if (courseId) {
        window.location.href = `/portal?tab=classroom&courseId=${courseId}`;
      } else {
        window.location.href = '/portal?tab=classroom';
      }
    } else {
      // User is NEW / not logged in: show them student login page
      if (courseId) {
        window.location.href = `/login/student?redirect=/portal?tab=classroom&courseId=${courseId}`;
      } else {
        window.location.href = '/login/student';
      }
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a] transition-colors duration-300 selection:bg-blue-500/30">
      {/* 1. FIRST POPUP: INTERACTIVE AI CAREER ENGINE MODAL AT FIRST VISIT */}
      <AnimatePresence>
        {showCareerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-4xl bg-white dark:bg-[#0f1524] border-2 border-blue-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden my-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseCareerModal}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer z-10"
                title="Explore Intro Page Directly"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center mb-8 space-y-2.5 pr-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-blue-500" /> Interactive AI Career Engine
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Find Your Ideal <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 font-black">Generative AI Track</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Select your background &amp; desired career goal to unlock your custom AI Institute learning roadmap.
                </p>
              </div>

              {/* Interactive Engine Box Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                {/* Left Controls */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Step 1: Background */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                      1. Select Your Current Background
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: '12th', label: '10th / 12th Completed', icon: GraduationCap },
                        { id: 'college', label: 'College Student (B.Sc/B.Tech)', icon: BookOpen },
                        { id: 'non_tech', label: 'Non-Tech Graduate', icon: Users },
                        { id: 'pro', label: 'Working Professional', icon: Briefcase },
                      ].map((bg) => {
                        const Icon = bg.icon;
                        const isSelected = calcBackground === bg.id;
                        return (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => setCalcBackground(bg.id as any)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                            <span className="truncate">{bg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Desired Goal */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                      2. Select Your Desired Career Goal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'genai', label: '🤖 Generative AI Specialist', tag: 'High Demand' },
                        { id: 'datascience', label: '🧠 AI & ML Architect', tag: 'Core Engineering' },
                        { id: 'analyst', label: '📊 Data & BI Specialist', tag: 'Analytics Track' },
                        { id: 'wfh', label: '🌐 Overseas WFH (Remote)', tag: 'Global Placement' },
                      ].map((goal) => {
                        const isSelected = calcGoal === goal.id;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => setCalcGoal(goal.id as any)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-start gap-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                            }`}
                          >
                            <span className="truncate">{goal.label}</span>
                            <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                              Track: {goal.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Form Column */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-7 rounded-2xl border border-blue-500/30 shadow-xl flex flex-col justify-center space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {calcGoal === 'genai' && 'Generative AI & Agent Developer'}
                      {calcGoal === 'datascience' && 'AI & Machine Learning Specialist'}
                      {calcGoal === 'analyst' && 'Business Intelligence & Data Analyst'}
                      {calcGoal === 'wfh' && 'Global Remote Security Specialist'}
                    </h3>
                    <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {calcGoal === 'genai' && 'Generative AI Master Class'}
                      {calcGoal === 'datascience' && 'AI & Machine Learning Complete Guide'}
                      {calcGoal === 'analyst' && 'Data Analytics & BI Professional'}
                      {calcGoal === 'wfh' && 'Cyber Security & Cloud Infrastructure'}
                    </p>
                  </div>

                  <form onSubmit={handleModalEnrollSubmit} className="space-y-3.5">
                    {contactSubmitted ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-center space-y-1 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          Details Received!
                        </p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                          Opening Intro Page &amp; Courses...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          <div className="relative">
                            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              required
                              placeholder="Your Full Name"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="relative">
                            <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="tel"
                              required
                              placeholder="10-Digit Mobile Number"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingContact}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
                        >
                          {isSubmittingContact ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <span>Show Intro Page &amp; Course</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </form>

                  <button
                    type="button"
                    onClick={handleCloseCareerModal}
                    className="text-xs text-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-semibold cursor-pointer pt-1"
                  >
                    Skip &amp; Explore Intro Page Directly
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LandingNavbar currentUser={currentUser} isAuthenticated={isAuthenticated} onAccessPortal={(e) => handlePremiumClick(e)} />

      {/* TOP SLIDING PROGRAM BANNERS (Sliding from Right to Left) */}
      <div className="pt-24 sm:pt-28">
        <HeroBannerSlider onSelectCourse={(courseId) => handlePremiumClick({ preventDefault: () => {} } as any, courseId)} />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-24 px-6 overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/15 to-purple-500/15 blur-3xl opacity-70" />
          <div className="absolute -bottom-[10%] -left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 blur-3xl opacity-70" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 w-full">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/60 dark:bg-slate-900/60 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
              <Sparkles className="w-4 h-4" /> Premium AI Institute
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Master Future Skills &amp; Build Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Dream Career
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
              Learn from industry experts through live classes, real-world projects, internships, and guaranteed placement preparation.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a 
                href="#courses" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all"
              >
                Explore Courses
                <ArrowRight className="w-5 h-5" />
              </a>
              <button 
                onClick={() => setIsDemoModalOpen(true)} 
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                Watch Demo Lecture (10 Min)
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200/60 dark:border-slate-800/60">
              {[
                { label: 'Students', val: '20,000+' },
                { label: 'Courses', val: '30+' },
                { label: 'Mentors', val: '50+' },
                { label: 'Hiring Partners', val: '100+' }
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Section Right: High Performance Student Container */}
          <div className="relative lg:ml-auto flex justify-center lg:justify-end z-10 w-full max-w-[540px]">
            <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">

              {/* Main Student Portrait Container */}
              <div className="relative w-[340px] sm:w-[420px] h-[340px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 dark:border-blue-500/30 bg-slate-950 group z-10">
                <img 
                  src="/uploads/ai_student_learning.png" 
                  alt="Student Learning AI" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                />
              </div>

              {/* STATIC HIGH PERFORMANCE BADGES */}

              {/* Badge Top Left: Placement Guarantee */}
              <div className="absolute top-2 left-[-15px] sm:left-[-30px] z-30 bg-slate-900 border border-blue-500/40 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400">Placement Record</div>
                  <div className="text-xs font-black text-white">100% Career Assistance</div>
                </div>
              </div>

              {/* Badge Top Right: Certified Track */}
              <div className="absolute top-10 right-[-10px] sm:right-[-25px] z-30 bg-slate-900 border border-emerald-500/40 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">ISO Certified</div>
                  <div className="text-xs font-black text-white">GenAI & ML Specialist</div>
                </div>
              </div>

              {/* Badge Bottom Right: Hiring Partners */}
              <div className="absolute -bottom-4 right-2 sm:right-4 z-30 bg-slate-900 border border-indigo-500/40 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-300">Top Hiring Partners</div>
                  <div className="text-xs font-bold text-slate-200">HCLTech • Deloitte • Samsung</div>
                </div>
              </div>

              {/* Tech Stack Chips */}
              {[
                'Python ⚡', 
                'Generative AI ⚡', 
                'Deep Learning ⚡', 
                'AGENTIC AI ⚡', 
                'SQL & PowerBI ⚡'
              ].map((chip, idx) => (
                <span
                  key={chip}
                  className="absolute z-20 text-[11px] font-black tracking-wider uppercase bg-white border border-cyan-400 text-black px-2.5 py-1 rounded-xl shadow-lg hidden sm:inline-flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    top: `${15 + (idx * 17)}%`,
                    left: idx % 2 === 0 ? '-6%' : '86%',
                  }}
                >
                  <strong className="font-black text-black">{chip}</strong>
                </span>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COURSES */}
      <section id="courses" className="py-24 px-6 bg-white dark:bg-[#0a0f1c] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">Premium Featured Courses</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              Our flagship programs designed to take you from beginner to industry-ready professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dedupeCourses(courses).map((course, idx) => {
              const isUpcoming = isUpcomingCourse(course.id) || isUpcomingCourse(course.title);
              return (
                <div 
                  key={course.id} 
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer relative"
                  onClick={(e) => handlePremiumClick(e, course.id)}
                >
                  <div className="relative h-52 overflow-hidden bg-slate-950 rounded-t-3xl">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title} 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/banners/generative-ai.png'; }}
                      className="w-full h-full object-fill object-center transition-transform duration-300 group-hover:scale-105" 
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${
                        isUpcoming ? 'bg-amber-500 text-slate-950 font-black' : 'bg-blue-600 text-white'
                      }`}>
                        {isUpcoming ? '🚀 Coming Soon' : course.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                      {isUpcoming ? (
                        <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Waitlist Open
                        </span>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{course.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5"><MonitorPlay className="w-4 h-4 text-blue-500" /> Live + Recorded</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {course.duration}</div>
                      <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-500" /> Real Projects</div>
                      <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-500" /> Certificate</div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        {isUpcoming ? (
                          <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black px-2.5 py-1 rounded-full border border-amber-500/30">
                            ⏳ 30% Early Bird
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">
                            ⚡ 100% Free Access
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => handlePremiumClick(e, course.id)} 
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isUpcoming 
                            ? 'bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-white' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        }`}
                      >
                        <span>{isUpcoming ? 'Join Waitlist' : 'Start Learning Free'}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <button onClick={handlePremiumClick} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline">
              View All Courses <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section id="why-choose" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">Why Choose AI Institute?</h2>
          </div>
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: MonitorPlay, title: 'Live Classes', desc: 'Interactive sessions with mentors.' },
              { icon: FileText, title: 'Industry Projects', desc: 'Build real-world AI applications.' },
              { icon: UserCheck, title: 'Mock Interviews', desc: 'Prepare with industry veterans.' },
              { icon: Briefcase, title: 'Placement Assistance', desc: 'Guaranteed referral programs.' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={fadeIn}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* 3.5. TOP MENTORS */}
      <section id="mentors" className="py-24 px-6 bg-slate-50 relative z-10 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Learn From Industry Experts</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              Our mentors bring years of real-world experience from top companies to help you build a successful career.
            </p>
          </div>
          
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                name: "Vaibhav Ahire",
                role: "Python, AI & Machine Learning",
                image: "/uploads/vaibhav_ahire.jpg",
              },
              {
                name: "Jay Koche",
                role: "Data Analytics, Data Science, Business Analyst",
                image: "https://ui-avatars.com/api/?name=Jay+Koche&background=eff6ff&color=2563eb&size=150",
              },
              {
                name: "Siddhi Pawar",
                role: "Business Communication & Soft Skills",
                image: "/uploads/siddhi_pawar.jpg",
              },
              {
                name: "Vishwadeep Chavan",
                role: "Cyber Security & Information Technology",
                image: "/uploads/vishwadeep_chavan.jpg",
              }
            ].map((mentor, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                whileHover={{ y: -8 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all text-center group"
              >
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-50 shadow-inner">
                  <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{mentor.name}</h3>
                <p className="text-sm text-blue-600 font-semibold mb-4 min-h-[40px] flex items-center justify-center">
                  {mentor.role}
                </p>

              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. SUCCESS STORIES */}
      <section id="testimonials" className="py-24 px-6 bg-blue-600 dark:bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Proud Moments & Placement Success Stories</h2>
          <p className="text-blue-100 font-medium max-w-2xl mx-auto mb-16">
            Congratulations to our talented students from AI Institute Satana on securing high-package international & remote placements!
          </p>

          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                name: "Pratik Wagh",
                qualification: "12th Completed",
                location: "Placed in UAE 🇦🇪",
                package: "12 LPA Package",
                image: "/uploads/pratik_wagh.jpg",
                review: "AI Institute Satana helped me get placed in UAE right after 12th! The practical project-based AI training and 100% placement support transformed my career path."
              },
              {
                name: "Khushal Pandit",
                qualification: "B.Sc Student",
                location: "Placed in UAE 🇦🇪",
                package: "12 LPA Package",
                image: "/uploads/khushal_pandit.jpg",
                review: "As a B.Sc student, gaining practical AI & Data skills at AI Institute Satana opened international opportunities in UAE with a 12 LPA package!"
              },
              {
                name: "Saksham Pathade",
                qualification: "Philippines (WFH)",
                location: "Placed in Philippines 🇵🇭",
                package: "12 LPA Package",
                image: "/uploads/saksham_pathade.jpg",
                review: "I secured a 12 LPA Work From Home position in the Philippines thanks to AI Institute Satana's industry-expert trainers and interview prep."
              },
              {
                name: "Chetan Ghorpade",
                qualification: "Philippines (WFH)",
                location: "Placed in Philippines 🇵🇭",
                package: "5 LPA Package",
                image: "/uploads/chetan_ghorpade.jpg",
                review: "The hands-on practical training and personality development modules prepared me to clear international technical rounds and get placed comfortably."
              }
            ].map((student, i) => (
              <motion.div key={i} variants={fadeIn} whileHover={{ y: -8 }} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-left flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex gap-4 items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 overflow-hidden border-2 border-white/50 shadow-md shrink-0">
                      <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{student.name}</h4>
                      <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {student.package}
                      </span>
                      <p className="text-blue-200 text-xs font-medium mt-1">{student.location}</p>
                    </div>
                  </div>
                  <p className="text-blue-50 text-xs leading-relaxed italic border-t border-white/10 pt-3">
                    "{student.review}"
                  </p>
                </div>
                <div className="mt-4 pt-2 text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                  {student.qualification}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. TIE-UPS / PLACEMENT PARTNERS (PREMIUM SMOOTH SLIDER) */}
      <section className="py-12 sm:py-16 bg-white dark:bg-[#0a0f1c] border-y border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.25em] mb-1 block">
            Placement Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            OUR OFFICIAL INDUSTRY TIE-UPS
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Top global tech companies & enterprises where our graduates get hired
          </p>

          <div className="inline-flex flex-wrap justify-center items-center gap-3 py-2 px-5 mt-4 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] font-extrabold mr-1">Hiring Partners:</span>
            <span className="text-blue-700 dark:text-blue-300 font-extrabold">HCLTech</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Deloitte</span>
            <span className="text-slate-400">•</span>
            <span className="text-indigo-700 dark:text-indigo-300 font-extrabold">Samsung</span>
            <span className="text-slate-400">•</span>
            <span className="text-sky-700 dark:text-sky-300 font-extrabold">Intel</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-700 dark:text-amber-300 font-extrabold">Flipkart</span>
          </div>
        </div>

        {/* Marquee wrapper with edge fade */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white dark:from-[#0a0f1c] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white dark:from-[#0a0f1c] to-transparent pointer-events-none" />

          <div className="flex overflow-hidden py-2">
            <div className="flex gap-8 sm:gap-12 animate-marquee whitespace-nowrap items-center">
              {[...Array(2)].map((_, idx) => (
                <div key={idx} className="flex gap-8 sm:gap-12 items-center shrink-0">
                  {[
                    { name: 'HCLTech', logo: 'https://cdn.simpleicons.org/hcl' },
                    { name: 'Deloitte', logo: 'https://cdn.simpleicons.org/deloitte' },
                    { name: 'Samsung', logo: 'https://cdn.simpleicons.org/samsung' },
                    { name: 'Intel', logo: 'https://cdn.simpleicons.org/intel' },
                    { name: 'Flipkart', logo: 'https://cdn.simpleicons.org/flipkart' },
                    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
                    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
                    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
                    { name: 'TCS', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg' },
                    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' },
                    { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg' },
                    { name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
                    { name: 'Wipro', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg' },
                    { name: 'Cognizant', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Cognizant_logo_2022.svg' },
                    { name: 'Capgemini', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg' },
                    { name: 'Razorpay', logo: 'https://cdn.simpleicons.org/razorpay/0C2340' },
                    { name: 'PhonePe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg' },
                    { name: 'Paytm', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg' },
                  ].map((company) => (
                    <CompanyLogoBadge key={company.name} company={company} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* 7. INTERACTIVE AI CAREER PATH FINDER */}
      <section className="py-20 px-6 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#0a0f1c] dark:via-[#080d1a] dark:to-[#050811] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-blue-500" /> Interactive AI Career Engine
            </div>
            <div className="flex flex-col items-center justify-center min-h-[90px]">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center justify-center gap-2 text-center">
                <span>Find Your Ideal</span>
                <div className="relative inline-flex items-center h-12 px-2 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_TITLES[titleIndex]}
                      initial={{ y: 35, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -35, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 font-black text-3xl sm:text-4xl inline-block drop-shadow-sm"
                    >
                      {ROTATING_TITLES[titleIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Select your current background and target career goal to match with your optimal AI Institute learning track and industry skills.
            </p>
          </div>

          {/* Interactive Engine Box */}
          <div className="bg-white dark:bg-[#0f1524] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Background Selector */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                  1. Select Your Current Background
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: '12th', label: '10th / 12th Completed', icon: GraduationCap },
                    { id: 'college', label: 'College Student (B.Sc/B.Tech)', icon: BookOpen },
                    { id: 'non_tech', label: 'Non-Tech Graduate', icon: Users },
                    { id: 'pro', label: 'Working Professional', icon: Briefcase },
                  ].map((bg) => {
                    const Icon = bg.icon;
                    const isSelected = calcBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setCalcBackground(bg.id as any)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                        <span className="truncate">{bg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Goal Selector */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                  2. Select Your Desired Career Goal
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'genai', label: '🤖 Generative AI Specialist', tag: 'High Demand' },
                    { id: 'datascience', label: '🧠 AI & ML Architect', tag: 'Core Engineering' },
                    { id: 'analyst', label: '📊 Data & BI Specialist', tag: 'Analytics Track' },
                    { id: 'wfh', label: '🌐 Overseas WFH (Remote)', tag: 'Global Placement' },
                  ].map((goal) => {
                    const isSelected = calcGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setCalcGoal(goal.id as any)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-start gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                        }`}
                      >
                        <span className="truncate">{goal.label}</span>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                          Track: {goal.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Panel — HUGE Enrollment Form, Minimal Text, Light Theme */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8 sm:p-10 rounded-3xl border-2 border-blue-500/30 dark:border-blue-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-center space-y-6">

              {/* Clean Minimal Title */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {calcGoal === 'genai' && 'Generative AI & Agent Developer'}
                  {calcGoal === 'datascience' && 'AI & Machine Learning Specialist'}
                  {calcGoal === 'analyst' && 'Business Intelligence & Data Analyst'}
                  {calcGoal === 'wfh' && 'Global Remote Security Specialist'}
                </h3>
                <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                  {calcGoal === 'genai' && 'Generative AI Master Class'}
                  {calcGoal === 'datascience' && 'AI & Machine Learning Complete Guide'}
                  {calcGoal === 'analyst' && 'Data Analytics & BI Professional'}
                  {calcGoal === 'wfh' && 'Cyber Security & Cloud Infrastructure'}
                </p>
              </div>

              {/* HUGE FORM */}
              <form onSubmit={handleEnrollFormSubmit} className="space-y-5">
                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/40 rounded-3xl text-center space-y-2 shadow-lg">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      Details Received!
                    </p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      Redirecting to course enrollment...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {/* HUGE Input 1: Full Name */}
                      <div className="relative">
                        <User className="w-6 h-6 text-slate-400 absolute left-4 top-4.5" />
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                      </div>

                      {/* HUGE Input 2: Phone Number */}
                      <div className="relative">
                        <Phone className="w-6 h-6 text-slate-400 absolute left-4 top-4.5" />
                        <input
                          type="tel"
                          required
                          placeholder="10-Digit Mobile / Phone Number"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* HUGE Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-base shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 cursor-pointer transition-all uppercase tracking-wider group"
                    >
                      {isSubmittingContact ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                          <span>Saving Details...</span>
                        </>
                      ) : (
                        <>
                          <span>Enroll in Recommended Track</span>
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>

            </div>

          </div>
        </div>
      </section>

      <LandingFooter />
      <AIAssistant />
      <DemoLectureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onEnrollClick={() => {
          setIsDemoModalOpen(false);
          router.push('/portal?tab=classroom');
        }}
      />
      <ComingSoonCourseModal
        isOpen={!!upcomingModalCourse}
        onClose={() => setUpcomingModalCourse(null)}
        courseIdOrTitle={upcomingModalCourse || undefined}
        onExploreActiveCourses={() => {
          const el = document.getElementById('courses');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}

