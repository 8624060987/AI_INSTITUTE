'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 mb-2">
        404
      </h1>
      
      <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mb-3">
        Page Not Found
      </h2>

      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The requested URL was not found on our server. Don't worry, you can easily return to the home page or student portal.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Home className="w-4 h-4" /> Go To Home Page
        </Link>
        <Link
          href="/portal"
          className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Open Student Portal
        </Link>
      </div>
    </div>
  );
}
