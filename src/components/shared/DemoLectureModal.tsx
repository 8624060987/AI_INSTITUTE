'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  RotateCw, Sparkles, CheckCircle, BookOpen, User, 
  ChevronRight, Award, Shield, X, Code, Monitor, GraduationCap, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollClick?: () => void;
}

const CHAPTERS = [
  { start: 0, end: 120, title: '1. Welcome to AI Institute & Core Mission', duration: '00:00 - 02:00', badge: 'MISSION OVERVIEW' },
  { start: 120, end: 270, title: '2. Website Console & Student Portal Walkthrough', duration: '02:00 - 04:30', badge: 'PORTAL DEMO' },
  { start: 270, end: 420, title: '3. Generative AI & Agentic AI Masterclass', duration: '04:30 - 07:00', badge: 'LLM ARCHITECTURE' },
  { start: 420, end: 540, title: '4. Live Hands-on Coding Lab Demo', duration: '07:00 - 09:00', badge: 'PYTHON CLOUD LAB' },
  { start: 540, end: 600, title: '5. Career Roadmap & Placement Assistance', duration: '09:00 - 10:00', badge: 'CAREER ROADMAP' },
];

const CAPTIONS = [
  { start: 0, text: "Welcome to AI Institute! I am Vaibhav Ahire, Lead AI Scientist and Mentor." },
  { start: 10, text: "Our mission is to empower students with cutting-edge AI, Deep Learning, and Software Engineering skills." },
  { start: 25, text: "Here at AI Institute, you don't just learn theory — you build real-world AI applications from Day 1." },
  { start: 45, text: "We offer hands-on training in Python, PyTorch, Generative AI, Data Science, and Cyber Security." },
  { start: 70, text: "With 1,250+ active live students and 50+ hiring partners, our graduates work at top tech companies." },
  
  { start: 120, text: "Let's explore our state-of-the-art Website Learning Console." },
  { start: 140, text: "Our portal features real-time live DRM video streaming, handwritten class notes, and instant code execution." },
  { start: 175, text: "You can track your weekly XP leaderboard, take AI-evaluated quizzes, and submit assignments seamlessly." },
  { start: 210, text: "Integrated 24/7 AI Assistant provides instant code debugging whenever you hit an error." },
  
  { start: 270, text: "Now let's dive into our flagship curriculum: Generative AI & Agentic AI Masterclass." },
  { start: 300, text: "You will master Transformer models, Attention Mechanisms, LangChain, and LlamaIndex." },
  { start: 340, text: "We teach you how to build Autonomous AI Agents that can plan, execute tools, and solve complex workflows." },
  { start: 380, text: "Fine-tune open-source models like Llama 3 and DeepSeek on custom domain datasets." },

  { start: 420, text: "Here is a live demonstration inside our Python GPU Cloud Sandbox." },
  { start: 450, text: "Watch as we initialize an Agentic AI workflow using PyTorch and OpenAI embeddings." },
  { start: 490, text: "Model inference completed in 42ms with 99.4% accuracy across test benchmarks!" },

  { start: 540, text: "Finally, let's review your 100% Career Placement Roadmap." },
  { start: 565, text: "We provide resume building, 1-on-1 mock interviews with industry mentors, and referral drives." },
  { start: 585, text: "Click 'Enroll Now' below to secure your seat and launch your high-pay AI career today!" }
];

export const DemoLectureModal: React.FC<DemoLectureModalProps> = ({ isOpen, onClose, onEnrollClick }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const TOTAL_DURATION = 600; // 10 minutes (600 seconds)

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Timer ticker
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
          return prev + 1 * playbackRate;
        });
      }, 1000 / playbackRate);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackRate]);

  // Reset timer on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  // Advanced High-Tech Motion Graphics Canvas Engine
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Background floating particle nodes
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#3b82f6' : '#10b981'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Dark futuristic gradient
      const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width / 1.1);
      grad.addColorStop(0, '#0b1329');
      grad.addColorStop(0.6, '#030712');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render floating particle constellation
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 90 * 0.8})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      angle += 0.03;

      // Chapter-specific motion graphics
      if (currentTime < 120) {
        // CHAPTER 1: AI Holographic Core & Mentor Presentation
        ctx.save();
        ctx.translate(width / 2, height / 2 - 30);

        // Orbiting neon rings
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 95 + Math.sin(angle) * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 115 + Math.cos(angle) * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Main Title Graphic
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 26px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ AI INSTITUTE OFFICIAL ORIENTATION ⚡', width / 2, height / 2 - 35);

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText('Lead Mentor: Vaibhav Ahire (AI Research Specialist)', width / 2, height / 2 + 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('1,250+ Students Enrolled • 100% Placement Guarantee • Live Interactive Labs', width / 2, height / 2 + 40);

      } else if (currentTime < 270) {
        // CHAPTER 2: Interactive Website & Student Portal Graphics
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(70, 45, width - 140, height - 110);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(70, 45, width - 140, height - 110);

        // Portal navbar simulation
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(70, 45, width - 140, 35);
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🚀 AI INSTITUTE LEARNING CONSOLE (DRM PROTECTED)', 90, 68);

        // Simulated features grid
        const items = ['📹 Live HD Streaming', '📝 AI Handwritten Notes', '🤖 24/7 AI Code Debugger', '🏆 Weekly Leaderboard'];
        items.forEach((item, idx) => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(90 + (idx % 2) * 200, 100 + Math.floor(idx / 2) * 80, 180, 65);
          ctx.strokeStyle = '#10b981';
          ctx.strokeRect(90 + (idx % 2) * 200, 100 + Math.floor(idx / 2) * 80, 180, 65);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(item, 105 + (idx % 2) * 200, 135 + Math.floor(idx / 2) * 80);
        });

      } else if (currentTime < 420) {
        // CHAPTER 3: Generative AI Neural Architecture Graphic
        ctx.save();
        ctx.translate(width / 2, height / 2 - 30);

        const nodes = 7;
        for (let i = 0; i < nodes; i++) {
          const a = (i / nodes) * Math.PI * 2 + angle * 0.4;
          const x = Math.cos(a) * 130;
          const y = Math.sin(a) * 85;

          ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#10b981';
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧠 Transformers, LLM Architecture & Agentic Workflows', width / 2, height / 2 + 75);

      } else if (currentTime < 540) {
        // CHAPTER 4: Python GPU Cloud Code Execution Screen
        ctx.fillStyle = '#050811';
        ctx.fillRect(80, 45, width - 160, height - 110);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 45, width - 160, height - 110);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('>>> import torch, langchain, openai', 100, 80);
        ctx.fillText('>>> agent = AgenticEngine(model="gpt-4o", tools=[CodeRunner()])', 100, 110);
        ctx.fillText('>>> response = agent.run("Optimize neural network pipeline")', 100, 140);
        
        ctx.fillStyle = '#60a5fa';
        ctx.fillText('⚡ Execution Output: [STATUS 200 OK] | GPU Memory: 8.2 GB / 24 GB', 100, 180);
        ctx.fillText('🎯 Agent Model Inference Time: 42ms | Code Accuracy: 99.4%', 100, 210);

      } else {
        // CHAPTER 5: Career Roadmap & Placement Graphic
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎓 100% Guaranteed Career & Placement Program', width / 2, height / 2 - 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Target Salary Package: ₹12 LPA - ₹35 LPA | Verified ISO Certificate', width / 2, height / 2);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Click "Enroll Now" below to claim your seat!', width / 2, height / 2 + 50);
      }

      // Voice frequency equalizer animation
      if (isPlaying) {
        for (let b = 0; b < 28; b++) {
          const bh = Math.sin(angle * 3.5 + b) * 16 + 20;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(50 + b * 24, 18, 10, bh);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, currentTime, isPlaying]);

  if (!isOpen) return null;

  const currentCaption = CAPTIONS.reduce((acc, cap) => (currentTime >= cap.start ? cap.text : acc), CAPTIONS[0].text);
  const activeChapterIndex = CHAPTERS.findIndex(c => currentTime >= c.start && currentTime < c.end);
  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-6 overflow-y-auto">
      <motion.div 
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-850 bg-slate-900/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">AI Institute Official Demo Lecture</h3>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                  10-Min HD Preview
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete Platform & AI Masterclass Orientation by Lead Mentor Vaibhav Ahire</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onEnrollClick && (
              <button
                onClick={onEnrollClick}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Enroll Now
              </button>
            )}

            {/* Prominent Header Close (X) Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-600 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700 hover:border-rose-500 flex items-center gap-1.5 text-xs font-bold"
              title="Close Video (Esc)"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
          <canvas 
            ref={canvasRef} 
            width={960} 
            height={540} 
            className="w-full h-full object-contain" 
          />

          {/* Floating Top Right Video Close Overlay Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 px-3.5 py-2 rounded-2xl bg-black/80 hover:bg-rose-600 border border-slate-700/80 hover:border-rose-500 text-slate-300 hover:text-white transition-all shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-extrabold cursor-pointer"
            title="Close Video (Esc)"
          >
            <X className="w-4 h-4" />
            <span>CLOSE LECTURE (ESC)</span>
          </button>

          {/* Top Left Live Badge & Chapter Tag */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              LIVE DEMO
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-blue-400 font-extrabold text-[10px] uppercase tracking-wider backdrop-blur-md">
              {currentChapter.badge}
            </span>
          </div>

          {/* Modern Animated Glassmorphism Captions */}
          <div className="absolute bottom-12 left-4 right-4 text-center pointer-events-none z-20">
            <motion.div 
              key={currentCaption}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-950/85 border border-slate-700/80 text-white text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-xl max-w-3xl text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider block">👨‍🏫 Lead Mentor Vaibhav Ahire</span>
                <span className="text-slate-100 font-medium leading-relaxed">{currentCaption}</span>
              </div>
            </motion.div>
          </div>

          {/* Center Play/Pause Touch Overlay */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform scale-90 hover:scale-100 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </div>
          </button>
        </div>

        {/* Custom Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-850 space-y-3 z-20">
          {/* Seeking Timeline */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={TOTAL_DURATION}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span className="font-bold text-blue-400">{formatTime(currentTime)}</span>
              <span>Total Duration: 10:00 (600s)</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
                <span>-10s</span>
              </button>

              <button
                onClick={() => setCurrentTime(Math.min(TOTAL_DURATION, currentTime + 10))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
                <span>+10s</span>
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 bg-slate-800 rounded accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Playback Speeds */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Speed:</span>
              {[1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackRate(spd)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                    playbackRate === spd
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 ml-2 cursor-pointer"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chapter Selector Grid */}
          <div className="pt-2 border-t border-slate-850">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Lecture Chapters (Click to Jump):</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {CHAPTERS.map((ch, idx) => {
                const isActive = activeChapterIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentTime(ch.start)}
                    className={`p-2 rounded-xl text-left border transition-all text-[11px] cursor-pointer ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="truncate font-semibold">{ch.title}</div>
                    <div className="text-[9px] text-slate-500">{ch.duration}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
