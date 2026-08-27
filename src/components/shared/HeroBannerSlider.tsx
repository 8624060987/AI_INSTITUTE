'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Flame, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export interface UploadedBanner {
  id: string;
  name: string;
  imageSrc: string;
  courseId: string;
  badge: string;
  glowColor: string;
}

export const UPLOADED_BANNERS: UploadedBanner[] = [
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    imageSrc: '/banners/data-analyst.webp',
    courseId: 'course-da',
    badge: 'Turn Data into Insights',
    glowColor: 'rgba(30, 58, 138, 0.45)',
  },
  {
    id: 'generative-ai',
    name: 'Generative AI',
    imageSrc: '/banners/generative-ai.webp',
    courseId: 'course-gen-ai',
    badge: 'Imagine The Future',
    glowColor: 'rgba(13, 148, 136, 0.45)',
  },
  {
    id: 'data-science',
    name: 'Data Science',
    imageSrc: '/banners/data-science.webp',
    courseId: 'course-ds',
    badge: 'Build Models & Predict Future',
    glowColor: 'rgba(124, 58, 237, 0.45)',
  },
  {
    id: 'full-stack',
    name: 'Full Stack Web Development',
    imageSrc: '/banners/full-stack-web-dev.webp',
    courseId: 'course-web-dev',
    badge: 'Design • Develop • Deploy',
    glowColor: 'rgba(37, 99, 235, 0.45)',
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    imageSrc: '/banners/business-analyst.webp',
    courseId: 'course-business-analyst',
    badge: 'Analyze • Strategies • Deliver Value',
    glowColor: 'rgba(234, 88, 12, 0.45)',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    imageSrc: '/banners/digital-marketing.webp',
    courseId: 'course-digital-marketing',
    badge: 'Digital Skills • Real Results',
    glowColor: 'rgba(22, 163, 74, 0.45)',
  },
];

export function HeroBannerSlider({ onSelectCourse }: { onSelectCourse: (courseId: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Preload all banner images immediately into browser cache
  useEffect(() => {
    UPLOADED_BANNERS.forEach((banner) => {
      const img = new Image();
      img.src = banner.imageSrc;
    });
  }, []);

  // Auto-slide every 3.5 seconds from right to left
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % UPLOADED_BANNERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? UPLOADED_BANNERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % UPLOADED_BANNERS.length);
  };

  const currentBanner = UPLOADED_BANNERS[currentIndex];

  return (
    <div 
      className="w-full relative z-20 overflow-hidden select-none mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Ambient Color Glow matched to active banner */}
        <div 
          className="absolute -inset-2 rounded-3xl opacity-30 blur-2xl transition-all duration-700 pointer-events-none -z-10"
          style={{ background: currentBanner.glowColor }}
        />

        {/* Top Infinite Floating Announcement Bar */}
        <div className="mb-3 overflow-hidden rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/50 py-1.5 px-4 backdrop-blur-md shadow-inner flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[11px] shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 animate-bounce text-amber-400" /> ADMISSIONS OPEN:
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8 whitespace-nowrap text-[11px] text-slate-300 font-medium animate-marquee">
              <span>📊 <strong>Data Analyst:</strong> Excel, SQL, Power BI & Data Visualization</span>
              <span>•</span>
              <span>🚀 <strong>Generative AI:</strong> ChatGPT, LLMs & AI Agents</span>
              <span>•</span>
              <span>🧠 <strong>Data Science:</strong> Python, Machine Learning & Neural Networks</span>
              <span>•</span>
              <span>💻 <strong>Full Stack Web Dev:</strong> HTML, CSS, JavaScript, React, Node & MongoDB</span>
              <span>•</span>
              <span>📈 <strong>Business Analyst:</strong> Requirements Gathering, Process Modeling & Analytics</span>
              <span>•</span>
              <span>📱 <strong>Digital Marketing:</strong> SEO, Google Ads, Meta Ads & Social Media</span>
              <span>•</span>
              <span>🎯 <strong>100% Placement Assistance</strong> Across Top Tech Companies</span>
            </div>
          </div>
        </div>

        {/* Single Ultra Clear Banner Frame - Enhanced Clarity & High Definition */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-2xl bg-black group">
            <div
              key={currentBanner.id}
              className="w-full relative cursor-pointer overflow-hidden h-[180px] sm:h-[260px] md:h-[320px] lg:h-[360px] flex items-center justify-center bg-slate-950 transition-opacity duration-150 rounded-2xl sm:rounded-3xl"
              onClick={() => onSelectCourse(currentBanner.courseId)}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current !== null) {
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  if (diff > 50) handleNext();
                  if (diff < -50) handlePrev();
                  touchStartX.current = null;
                }
              }}
            >
              {/* Ultra Crisp High Definition Banner Image - Premium Fit */}
              <img
                src={currentBanner.imageSrc}
                alt={currentBanner.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/banners/generative-ai.webp'; }}
                className="w-full h-full object-cover object-center rounded-2xl sm:rounded-3xl block shadow-inner"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />

              {/* Top HD Quality Badge */}
              <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-[10px] font-black shadow-lg">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span className="tracking-wider uppercase">Official Program • Certified Curriculum</span>
              </div>

              {/* Floating Action Pill on hover/mobile */}
              <div className="absolute bottom-3 right-3 z-20 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/25 text-white shadow-xl group-hover:bg-blue-600 transition-all text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
                <span>Explore Program Details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          {/* Nav Controls (Left & Right Arrow Buttons) */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 border border-white/40 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all cursor-pointer z-30 hover:scale-110 active:scale-95"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 border border-white/40 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all cursor-pointer z-30 hover:scale-110 active:scale-95"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Slide Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 bg-black/75 px-3 py-1 rounded-full backdrop-blur-md border border-white/25 shadow-lg">
            {UPLOADED_BANNERS.map((b, idx) => (
              <button
                key={b.id}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx 
                    ? 'w-6 bg-gradient-to-r from-blue-400 to-cyan-400 shadow-sm' 
                    : 'w-1.5 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 6-Program Thumbnail Selector Pills Below Slider */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {UPLOADED_BANNERS.map((b, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                className={`p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  isActive 
                    ? 'bg-slate-900 text-white border-blue-500 shadow-md ring-1 ring-blue-500/40' 
                    : 'bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-black">
                  <img 
                    src={b.imageSrc} 
                    alt={b.name} 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                  />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-black truncate">{b.name}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{b.badge}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}



