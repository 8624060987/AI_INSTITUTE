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
        <Link 
          href="/login/mentor"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all shadow-md backdrop-blur-md"
          title="Switch to Mentor Portal Login"
        >
          <span>👨‍🏫 Mentor Login</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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

        {/* Student Login Card (Mentor Login accessible via top-right button) */}
        <div className="flex justify-center pt-4">
          
          {/* Student Card (HIGHLIGHTED PRIMARY) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onClick={() => router.push('/login/student')}
            className="group relative rounded-3xl p-8 w-full max-w-lg bg-gradient-to-b from-blue-900/20 via-blue-950/10 to-slate-950/80 border-2 border-blue-500/80 backdrop-blur-xl transition-all duration-300 shadow-2xl shadow-blue-500/20 flex flex-col justify-between items-start text-left overflow-hidden cursor-pointer ring-4 ring-blue-500/10"
          >
            {/* Recommended Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border border-blue-400/40">
              ⭐ Recommended Student Portal
            </div>

            {/* Card internal background glow */}
            <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-blue-500/20 blur-[60px] group-hover:bg-blue-500/30 transition-all duration-500" />
            
            <div className="space-y-6 z-10 w-full">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                  Student Portal Login
                </h2>
                <p className="text-xs text-blue-100/70 leading-relaxed">
                  Enter your student workspace. Access active lectures, download study notes, submit projects, write tests, and interact with the student community.
                </p>
              </div>
              
              <ul className="space-y-2 text-[11px] text-gray-400 font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Watch Lectures & mark progress
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Submit Assignments & Quizzes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Earn XP & track Leaderboard rank
                </li>
              </ul>
            </div>

            <div className="w-full pt-8 z-10">
              <Link 
                href="/login/student"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group-hover:gap-3 transition-all duration-200"
              >
                Access Student Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
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
