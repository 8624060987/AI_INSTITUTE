'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, School, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { useDatabase } from '@/context/DatabaseContext';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, authReady, currentUser } = useDatabase();

  React.useEffect(() => {
    // Only auto-redirect authenticated STUDENTS — mentors/admins stay on login page
    if (authReady && isAuthenticated && currentUser?.role === 'student') {
      router.push('/portal?tab=classroom');
    }
  }, [authReady, isAuthenticated, currentUser, router]);
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Small discrete Mentor Login button at Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <a 
          href="/login/mentor"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all shadow-md backdrop-blur-md"
          title="Switch to Mentor Portal Login"
        >
          <span>👨‍🏫 Mentor Login</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Background ambient glows (GPU Optimized) */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl rounded-full" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/20 to-transparent blur-2xl rounded-full" />
      </div>

      <div className="z-10 w-full max-w-4xl space-y-8 text-center px-4">
        {/* Header Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-md">
            <School className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">AI Institute Student Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-400">
            Student & Learning Portal
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            Sign in to access your student classroom, lectures, assignments, and study materials.
          </p>
        </motion.div>

        {/* Two Prominent Cards: Student Login & Mentor Login */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 max-w-3xl mx-auto">
          
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { window.location.href = '/login/student'; }}
            className="group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-blue-900/20 via-blue-950/10 to-slate-950/80 border-2 border-blue-500/80 backdrop-blur-xl transition-all duration-300 shadow-2xl shadow-blue-500/20 flex flex-col justify-between items-start text-left overflow-hidden cursor-pointer ring-4 ring-blue-500/10 hover:border-blue-400"
          >
            <div className="space-y-4 z-10 w-full">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                  🎓 Student Login
                </h2>
                <p className="text-xs text-blue-100/70 leading-relaxed">
                  Enter student workspace, watch live lectures, submit projects, write tests, and download materials.
                </p>
              </div>
            </div>

            <div className="w-full pt-6 z-10">
              <a 
                href="/login/student"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <span>Access Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Mentor Card */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { window.location.href = '/login/mentor'; }}
            className="group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-emerald-900/20 via-emerald-950/10 to-slate-950/80 border-2 border-emerald-500/80 backdrop-blur-xl transition-all duration-300 shadow-2xl shadow-emerald-500/20 flex flex-col justify-between items-start text-left overflow-hidden cursor-pointer ring-4 ring-emerald-500/10 hover:border-emerald-400"
          >
            <div className="space-y-4 z-10 w-full">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <School className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                  👨‍🏫 Mentor &amp; Faculty Login
                </h2>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  Instructor dashboard to create courses, grade student assignments, schedule live batches, and mentor students.
                </p>
              </div>
            </div>

            <div className="w-full pt-6 z-10">
              <a 
                href="/login/mentor"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <span>Access Mentor Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

        </div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-6"
        >
          <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Back to Home Landing Page
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
