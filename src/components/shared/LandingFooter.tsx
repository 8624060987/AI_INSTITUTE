'use client';

import React, { useState } from 'react';
import { Award, Send, Check } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="bg-white text-slate-500 py-16 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand section */}
        <div className="space-y-4">
          <div className="inline-block w-fit">
            <img src="/logo-full.png" alt="AI Institute Logo" className="h-14 scale-110 w-auto object-contain drop-shadow-md" />
          </div>
          <p className="text-xs leading-relaxed">
            India's premier learning platform for Data Science, Machine Learning, and Generative AI. Empowering students with industry-grade roadmaps and mentorship.
          </p>
        </div>

        {/* Courses section */}
        <div>
          <h4 className="text-xs uppercase font-bold text-slate-800 tracking-wider mb-4">Programs</h4>
          <ul className="space-y-2.5 text-xs">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Generative AI Masterclass</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Data Science Mastery Program</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">AI & ML Complete Guide</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Data Analyst Professional</a></li>
          </ul>
        </div>

        {/* Resources section */}
        <div>
          <h4 className="text-xs uppercase font-bold text-slate-800 tracking-wider mb-4">Resources</h4>
          <ul className="space-y-2.5 text-xs">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Placement Portal</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">AI Concept Blogs</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Discord Community</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">FAQs</a></li>
          </ul>
        </div>

        {/* Newsletter section */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-bold text-slate-800 tracking-wider">Stay Updated</h4>
          <p className="text-xs leading-relaxed">
            Subscribe to receive AI concept sheets, tutorial releases, and placement updates.
          </p>
          <form onSubmit={handleSubscribe} className="relative flex">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 pr-10"
              required
            />
            <button
              type="submit"
              className="absolute right-1 top-1 p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              {subscribed ? <Check className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px]">
        <p>© 2026 AI Institute. All rights reserved. Created for premium education.</p>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-slate-800">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800">Terms of Service</a>
          <a href="#" className="hover:text-slate-800">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};
