'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Sparkles, X, CheckCircle2, Bell, Phone, Mail, 
  User, ArrowRight, Clock, Star, Gift, ShieldCheck, BookOpen 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@/utils/supabase/client';

export interface ComingSoonCourseInfo {
  id: string;
  title: string;
  category: string;
  launchDate?: string;
  highlights?: string[];
}

export const UPCOMING_COURSES: Record<string, ComingSoonCourseInfo> = {
  'course-dm': {
    id: 'course-dm',
    title: 'Digital Marketing & Growth Mastery',
    category: 'Digital Marketing',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['SEO & Organic Search', 'Google Ads & Meta Ads PPC', 'Email Marketing Funnels', 'Performance Analytics'],
  },
  'course-digital-marketing': {
    id: 'course-digital-marketing',
    title: 'Digital Marketing & Growth Mastery',
    category: 'Digital Marketing',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['SEO & Organic Search', 'Google Ads & Meta Ads PPC', 'Email Marketing Funnels', 'Performance Analytics'],
  },
  'course-it': {
    id: 'course-it',
    title: 'Information Technology & Software Engineering',
    category: 'Information Technology',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['Computer Networks & Protocols', 'Cloud Computing (AWS & Azure)', 'Linux Administration', 'DevOps & CI/CD Pipelines'],
  },
  'course-software-eng': {
    id: 'course-software-eng',
    title: 'Information Technology & Software Engineering',
    category: 'Information Technology',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['Computer Networks & Protocols', 'Cloud Computing (AWS & Azure)', 'Linux Administration', 'DevOps & CI/CD Pipelines'],
  },
  'course-ui-ux': {
    id: 'course-ui-ux',
    title: 'UI/UX Design Masterclass',
    category: 'Design & Experience',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['Figma Prototyping & Design Systems', 'User Research & Personas', 'Wireframing & Usability Testing', 'Design to Code Handoff'],
  },
  'course-design': {
    id: 'course-design',
    title: 'UI/UX Design Masterclass',
    category: 'Design & Experience',
    launchDate: 'Launching Next Cohort • Admissions Opening Shortly',
    highlights: ['Figma Prototyping & Design Systems', 'User Research & Personas', 'Wireframing & Usability Testing', 'Design to Code Handoff'],
  },
};

export function isUpcomingCourse(courseIdOrTitle?: string): boolean {
  if (!courseIdOrTitle) return false;
  const key = courseIdOrTitle.toLowerCase().trim();
  
  if (UPCOMING_COURSES[key]) return true;
  if (key.includes('digital marketing') || key.includes('course-dm') || key.includes('growth mastery')) return true;
  if (key.includes('information technology') || key.includes('software engineering') || key.includes('course-it')) return true;
  if (key.includes('ui/ux') || key.includes('ui-ux') || key.includes('design masterclass') || key.includes('course-ui-ux') || key.includes('course-design')) return true;
  
  return false;
}

export function getUpcomingCourseInfo(courseIdOrTitle?: string): ComingSoonCourseInfo {
  if (!courseIdOrTitle) return UPCOMING_COURSES['course-dm'];
  const key = courseIdOrTitle.toLowerCase().trim();

  if (key.includes('ui/ux') || key.includes('ui-ux') || key.includes('design masterclass') || key.includes('course-ui-ux') || key.includes('course-design')) {
    return UPCOMING_COURSES['course-ui-ux'];
  }
  if (key.includes('information technology') || key.includes('software engineering') || key.includes('course-it')) {
    return UPCOMING_COURSES['course-it'];
  }
  return UPCOMING_COURSES['course-dm'];
}

interface ComingSoonCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseIdOrTitle?: string;
  onExploreActiveCourses?: () => void;
}

export function ComingSoonCourseModal({
  isOpen,
  onClose,
  courseIdOrTitle,
  onExploreActiveCourses,
}: ComingSoonCourseModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const courseInfo = getUpcomingCourseInfo(courseIdOrTitle);
  const supabase = createClient();

  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit WhatsApp/phone number.');
      setLoading(false);
      return;
    }

    try {
      const waitlistEntry = {
        id: `waitlist_${Date.now()}`,
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@waitlist.aiinstitute.in`,
        courseInterest: courseInfo.title,
        message: `Priority Waitlist Registration for Upcoming Cohort: ${courseInfo.title}`,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      // 1. Save to local storage registry
      let existingLeads: any[] = [];
      try {
        const raw = localStorage.getItem('lms_leads');
        if (raw) existingLeads = JSON.parse(raw);
      } catch (err) {}
      existingLeads.unshift(waitlistEntry);
      localStorage.setItem('lms_leads', JSON.stringify(existingLeads));

      // 2. Push to Supabase if available
      try {
        await supabase.from('leads').insert([{
          name: waitlistEntry.name,
          phone: waitlistEntry.phone,
          email: waitlistEntry.email,
          course_interest: waitlistEntry.courseInterest,
          message: waitlistEntry.message,
          status: 'new'
        }]);
      } catch (err) {}

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b']
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-100 backdrop-blur-2xl"
        >
          {/* Top Decorative Header Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-teal-400 to-blue-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Rocket className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                🚀 Coming Soon • Admissions Opening Shortly
              </span>
            </div>

            {/* Course Title & Category */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {courseInfo.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Curriculum is being finalized with industry mentors. The next batch opens soon!
            </p>

            {/* Highlighted Curriculum Tags */}
            {courseInfo.highlights && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {courseInfo.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{h}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Early Bird Perks Box */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 to-teal-900/20 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-black">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Priority Waitlist Early Bird Benefits:</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>30% Early Bird Scholarship Voucher</strong> on launch day</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Guaranteed Seat Reservation</strong> in the 1st live batch</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant notification on WhatsApp when admissions go live</span>
                </li>
              </ul>
            </div>

            {/* Form or Submitted State */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmitWaitlist} className="mt-6 space-y-3.5">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Anand Patel"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      WhatsApp / Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-teal-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  <Bell className="w-4 h-4 text-amber-200 animate-bounce" />
                  <span>{loading ? 'Registering on Waitlist...' : 'Join Priority Waitlist & Get 30% Off'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onExploreActiveCourses) onExploreActiveCourses();
                    }}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Or explore active live programs like <strong className="text-cyan-300 underline">Generative AI & Data Science →</strong>
                  </button>
                </div>
              </form>
            ) : (
              /* Success State */
              <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-extrabold text-white">
                  You are on the Priority Waitlist!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thank you, <strong className="text-emerald-300">{fullName}</strong>. We have registered your phone <strong className="text-white">{phone}</strong> for <strong className="text-white">{courseInfo.title}</strong>. You will receive first-priority launch access and the 30% early bird code.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      onClose();
                      if (onExploreActiveCourses) onExploreActiveCourses();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore Live Courses</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
