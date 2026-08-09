'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDatabase } from '@/context/DatabaseContext';
import { LandingNavbar } from '@/components/shared/LandingNavbar';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { AIAssistant } from '@/components/shared/AIAssistant';
import { ComingSoonCourseModal, isUpcomingCourse } from '@/components/shared/ComingSoonCourseModal';
import { Award, CheckCircle, Clock, Star, Users, ArrowRight, Sparkles, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { courses, enrolledCourseIds, currentUser, isAuthenticated } = useDatabase();
  
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  const courseId = params?.id as string;
  const course = courses.find((c) => c.id === courseId) || courses[0] || {
    id: courseId || 'course-gen-ai',
    title: 'Advanced AI Program',
    description: 'Master industry-ready AI tools, real-world case studies, and enterprise applications.',
    category: 'Artificial Intelligence',
    price: 4599,
    originalPrice: 12999,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    mentorName: 'Vaibhav Ahire',
    duration: '180+ Hours',
    rating: 4.9,
    studentsCount: 1200,
    curriculum: ['Core Foundations', 'Practical Projects', 'Industry Capstone', 'Certification'],
  };
  const isAlreadyEnrolled = course ? enrolledCourseIds.includes(course.id) : false;
  const isUpcoming = isUpcomingCourse(courseId) || (course ? (isUpcomingCourse(course.id) || isUpcomingCourse(course.title)) : false);

  const handleEnroll = () => {
    if (isUpcoming) {
      setIsComingSoonOpen(true);
      return;
    }
    if (isAuthenticated) {
      router.push(`/portal?checkout=${course.id}`);
    } else {
      router.push(`/login/student?redirect=/portal?checkout=${course.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] transition-colors duration-300">
      <LandingNavbar currentUser={currentUser} isAuthenticated={isAuthenticated} onAccessPortal={() => { router.push('/portal'); }} />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-12">
        {/* Header Hero Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${
              isUpcoming 
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 font-black' 
                : 'text-blue-500 bg-blue-500/10'
            }`}>
              {isUpcoming ? '🚀 Coming Soon • Admissions Opening Shortly' : course.category}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              {course.description}
            </p>

            <div className="flex gap-6 items-center flex-wrap pt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{course.rating} Rating</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="w-4 h-4" />
                <span>{isUpcoming ? '340+ on Waitlist' : `${course.studentsCount} Students enrolled`}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{course.duration}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Action Card */}
          <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105" 
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-slate-400 line-through">Original Price: ₹{course.originalPrice}</span>
                <p className="text-xl font-extrabold text-slate-800 dark:text-white">₹{course.price}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">
                {isUpcoming ? '30% Early Bird' : 'Save 60%'}
              </span>
            </div>

            {isAlreadyEnrolled && !isUpcoming ? (
              <button
                onClick={() => { router.push('/portal'); }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Enter Classroom
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                className={`w-full py-3 rounded-xl text-white font-black text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  isUpcoming 
                    ? 'bg-gradient-to-r from-amber-500 via-teal-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 shadow-teal-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpcoming ? (
                  <>
                    <Bell className="w-4 h-4 text-amber-200 animate-bounce" />
                    <span>Join Priority Waitlist (30% Off)</span>
                  </>
                ) : (
                  <span>Enroll in Program</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Syllabus / Curriculum */}
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Curriculum Overview</h2>
            <p className="text-xs text-slate-400 mt-1">Modules and concept sheets covered in this program.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.curriculum.map((item, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-[#0f1420] border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex items-start gap-3 text-xs shadow-sm">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-850 dark:text-white">Module {idx + 1}: {item}</h4>
                  <p className="text-[10px] text-slate-450 mt-1">Detailed lectures, code notebooks, and assignments included.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
      <AIAssistant />

      <ComingSoonCourseModal
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
        courseIdOrTitle={course.id}
        onExploreActiveCourses={() => router.push('/#courses')}
      />
    </div>
  );
}
