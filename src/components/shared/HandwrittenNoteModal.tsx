'use client';

import React from 'react';
import { X, Sparkles, Download, Printer, CheckCircle2, BookOpen, PenTool, Lightbulb } from 'lucide-react';
import { Note } from '@/context/DatabaseContext';

interface HandwrittenNoteModalProps {
  note: Note | null;
  onClose: () => void;
}

export const HandwrittenNoteModal: React.FC<HandwrittenNoteModalProps> = ({ note, onClose }) => {
  if (!note) return null;

  const content = note.handwrittenContent || {
    topicSummary: note.description || 'AI-generated summary of the live lecture.',
    keyPoints: [
      'Core architecture principles & implementation overview',
      'Step-by-step code walkthrough & model optimization',
      'Production deployment best practices & safety checks',
      'Interactive Q&A & student practice exercise walkthrough'
    ],
    formulasOrKeyConcepts: [
      'Loss Function = Σ (y_real - y_pred)^2',
      'Optimal Learning Rate α ∈ [0.001, 0.01]',
      'Model Accuracy & Cross-Validation Matrix'
    ],
    teacherTips: 'Review the live lab codebase before attempting tomorrow\'s assignment!',
    date: new Date().toLocaleDateString()
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#fcf8f0] text-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border-2 border-[#e6decb] flex flex-col max-h-[90vh] relative">
        
        {/* Header Bar */}
        <div className="bg-[#2c3e50] text-white p-4 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>AI Handwritten Notebook</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Live Class Notes
                </span>
              </h3>
              <p className="text-[10px] text-slate-300 opacity-80">Auto-Generated from Lecture Recording & Audio Summary</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notebook Paper Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative bg-[#fdfbf7] selection:bg-amber-200">
          {/* Lined notebook paper margin line */}
          <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-0.5 bg-rose-300/60 pointer-events-none" />

          <div className="pl-8 sm:pl-12 space-y-6">
            
            {/* Title & Date */}
            <div className="border-b-2 border-slate-800/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md mb-2">
                  <Sparkles className="w-3 h-3 text-amber-600" /> AI Classroom Note #04
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
                  {note.title.replace('✍️ AI Handwritten Notes:', '').trim()}
                </h1>
              </div>
              <div className="text-right text-xs font-bold text-slate-500 font-mono">
                Date: {content.date}
              </div>
            </div>

            {/* AI Summary Overview */}
            <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl space-y-2">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-700" /> Lecture Summary Briefing
              </h4>
              <p className="text-sm text-slate-800 font-serif leading-relaxed italic">
                "{content.topicSummary}"
              </p>
            </div>

            {/* Key Handwritten Blackboard Points */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Core Concepts & Board Notes
              </h4>
              <ul className="space-y-2.5">
                {content.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-900 font-serif">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formula / Code Sticky Note Box */}
            <div className="bg-[#1e293b] text-emerald-300 p-5 rounded-2xl border-2 border-slate-700 shadow-lg space-y-2 font-mono text-xs">
              <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                ⚡ Formulas & Technical Code Blocks
              </div>
              <div className="space-y-1.5 pt-1">
                {content.formulasOrKeyConcepts.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 text-slate-100">
                    <code>{item}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor Advice Callout */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-950 font-serif">
              <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold uppercase text-[10px] text-blue-800 block mb-0.5">Mentor Note & Advice</span>
                <p className="italic">{content.teacherTips}</p>
              </div>
            </div>

            {/* Footer Verification Stamp */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Verified AI Institute Note Engine</span>
              <span>Web Only Recorded & Notes Auto-Sync Active</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
