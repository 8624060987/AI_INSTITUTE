'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useDatabase } from '@/context/DatabaseContext';
import {
  Camera, User, Phone, MapPin, Calendar, Loader2,
  GraduationCap, BookOpen, School, ClipboardList,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles,
  Briefcase, Code, Award, Link as LinkIcon, ShieldCheck,
  Building2, Globe, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STUDENT_COURSES = [
  'Generative AI & LLMs',
  'AI & Machine Learning',
  'Data Science & Python',
  'Data Analytics & PowerBI',
  'Cyber Security & Cloud',
  'Full Stack AI Web Development',
  'Business Analytics',
  'Soft Skills & Communication',
];

const QUALIFICATIONS = [
  '10th Pass', '12th Pass', 'Diploma', "Bachelor's Degree (B.Tech / BCA / BSc)",
  "Master's Degree (M.Tech / MCA / MSc)", 'PhD / Doctorate', 'Working Professional',
];

const MENTOR_SKILLS = [
  'Python', 'Machine Learning', 'Deep Learning', 'PyTorch / TensorFlow',
  'Generative AI & LLMs', 'Data Science', 'Data Analytics & SQL',
  'Cyber Security', 'Cloud Computing (AWS/GCP)', 'Business Intelligence',
  'Full Stack Development', 'Soft Skills & Communication'
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');

  // Active Tab: 'student' (Admission Form) | 'mentor' (Mentor Profile Setup)
  const [activeRole, setActiveRole] = useState<'student' | 'mentor'>(
    initialRoleParam === 'mentor' ? 'mentor' : 'student'
  );

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { currentUser, updateProfile, registerNewDeviceSession } = useDatabase();

  // ----------------------------------------------------
  // STUDENT ADMISSION FORM STATES
  // ----------------------------------------------------
  const [stuFullName, setStuFullName] = useState('');
  const [stuDob, setStuDob] = useState('');
  const [stuGender, setStuGender] = useState('');
  const [stuMobile, setStuMobile] = useState('');
  const [stuCity, setStuCity] = useState('');
  const [stuPhotoPreview, setStuPhotoPreview] = useState<string | null>(null);

  const [stuQualification, setStuQualification] = useState('');
  const [stuInstitute, setStuInstitute] = useState('');
  const [stuYearOfPassing, setStuYearOfPassing] = useState('');
  const [stuInterestedCourse, setStuInterestedCourse] = useState('Generative AI & LLMs');
  const [stuHearAboutUs, setStuHearAboutUs] = useState('social_media');

  const [stuGuardianName, setStuGuardianName] = useState('');
  const [stuGuardianPhone, setStuGuardianPhone] = useState('');
  const [stuAddress, setStuAddress] = useState('');
  const [stuDeclaration, setStuDeclaration] = useState(false);

  // ----------------------------------------------------
  // MENTOR PROFILE SETUP STATES
  // ----------------------------------------------------
  const [mentorFullName, setMentorFullName] = useState('Vaibhav Ahire');
  const [mentorTitle, setMentorTitle] = useState('Senior AI Research Scientist & Lead Mentor');
  const [mentorEmail, setMentorEmail] = useState('vaibhav.ahire@aiinstitute.in');
  const [mentorPhone, setMentorPhone] = useState('+91 98765 43210');
  const [mentorBio, setMentorBio] = useState('Passionate AI Specialist & Educator with 7+ years of experience building real-world Machine Learning pipelines, LLM applications, and guiding 2,000+ students into tech careers.');
  const [mentorPhotoPreview, setMentorPhotoPreview] = useState<string | null>('/uploads/vaibhav_ahire.jpg');
  const [mentorSelectedSkills, setMentorSelectedSkills] = useState<string[]>([
    'Python', 'Machine Learning', 'Generative AI & LLMs', 'Data Science'
  ]);
  const [mentorExpYears, setMentorExpYears] = useState('7+ Years');
  const [mentorLinkedIn, setMentorLinkedIn] = useState('https://linkedin.com/in/vaibhav-ahire');
  const [mentorGithub, setMentorGithub] = useState('https://github.com/vaibhav-ahire');
  const [mentorAvailability, setMentorAvailability] = useState('Evening (6:00 PM - 9:00 PM IST) & Weekends');

  // Load existing user info on mount
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setStuMobile(emailParam);
      setMentorEmail(emailParam);
    }
    if (currentUser && currentUser.fullName && currentUser.fullName !== 'Guest User') {
      if (currentUser.role === 'mentor') {
        setActiveRole('mentor');
        setMentorFullName(currentUser.fullName);
        if (currentUser.email) setMentorEmail(currentUser.email);
        if (currentUser.avatarUrl) setMentorPhotoPreview(currentUser.avatarUrl);
      } else {
        setStuFullName(currentUser.fullName);
        if (currentUser.email) setStuMobile(currentUser.email);
        if (currentUser.avatarUrl) setStuPhotoPreview(currentUser.avatarUrl);
      }
    }
  }, [currentUser, searchParams]);

  // Photo Select Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isMentor: boolean) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (isMentor) {
        setMentorPhotoPreview(previewUrl);
      } else {
        setStuPhotoPreview(previewUrl);
      }
    }
  };

  // Toggle Mentor Skill
  const toggleMentorSkill = (skill: string) => {
    if (mentorSelectedSkills.includes(skill)) {
      setMentorSelectedSkills(mentorSelectedSkills.filter(s => s !== skill));
    } else {
      setMentorSelectedSkills([...mentorSelectedSkills, skill]);
    }
  };

  // Submit Student Admission Form
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuDeclaration) {
      setError('Please agree to the admission declaration before submitting.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const avatarToSave = stuPhotoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(stuFullName)}&background=0D8ABC&color=fff&bold=true`;

      // Save Student Admission in localStorage & Context
      const admissionData = {
        fullName: stuFullName,
        dob: stuDob,
        gender: stuGender,
        mobile: stuMobile,
        city: stuCity,
        qualification: stuQualification,
        yearOfPassing: stuYearOfPassing,
        institute: stuInstitute,
        interestedCourse: stuInterestedCourse,
        guardianName: stuGuardianName,
        guardianPhone: stuGuardianPhone,
        address: stuAddress,
        avatarUrl: avatarToSave,
        submittedAt: new Date().toISOString(),
      };

      const studentEmail = stuMobile.includes('@') 
        ? stuMobile.toLowerCase().trim() 
        : `${stuFullName.toLowerCase().replace(/\s+/g, '')}@student.aiinstitute.in`;
      const userId = 'stu-' + (stuMobile.replace(/[^a-zA-Z0-9]/g, '') || 'new');

      // Save Pass to Supabase database
      try {
        await supabase.from('granted_access_passes').upsert({
          gmail: studentEmail,
          password: 'Pass@123',
          course_id: 'course-gen-ai',
          course_title: stuInterestedCourse
        });
      } catch (e) {}

      // Save Profile to Supabase database
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: studentEmail,
          full_name: stuFullName,
          role: 'student',
          avatar_url: avatarToSave,
          updated_at: new Date().toISOString()
        });
      } catch (e) {}

      localStorage.setItem('user_role', 'student');
      localStorage.setItem('lms_student_admission', JSON.stringify(admissionData));
      localStorage.setItem('granted_student_user', JSON.stringify({
        email: studentEmail,
        fullName: stuFullName,
        courseId: 'course-gen-ai',
        courseTitle: stuInterestedCourse
      }));

      updateProfile(stuFullName, avatarToSave);

      // Register session for single device policy
      registerNewDeviceSession(userId);

      setSuccess(true);
      setTimeout(() => {
        router.push('/portal');
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit admission form.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Mentor Profile Setup Form
  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorFullName || !mentorTitle) {
      setError('Please enter your full name and professional designation.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const avatarToSave = mentorPhotoPreview || '/uploads/vaibhav_ahire.jpg';

      const mentorProfile = {
        fullName: mentorFullName,
        title: mentorTitle,
        email: mentorEmail,
        phone: mentorPhone,
        bio: mentorBio,
        skills: mentorSelectedSkills,
        experienceYears: mentorExpYears,
        linkedIn: mentorLinkedIn,
        github: mentorGithub,
        availability: mentorAvailability,
        avatarUrl: avatarToSave,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('user_role', 'mentor');
      localStorage.setItem('lms_mentor_profile', JSON.stringify(mentorProfile));
      updateProfile(mentorFullName, avatarToSave);

      // Register session for single device policy
      registerNewDeviceSession('mentor-vaibhav');

      setSuccess(true);
      setTimeout(() => {
        router.push('/portal');
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to save mentor profile.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-blue-500/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm';
  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glowing light shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-blue-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-emerald-600/15 blur-[140px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl z-10 my-8"
      >
        {/* Header Branding & Role Selector Switch */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI Institute Satana — Account Setup
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {activeRole === 'mentor' ? '👨‍🏫 Mentor Profile Setup' : '🎓 Student Admission & Enrollment'}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            {activeRole === 'mentor'
              ? 'Complete your official instructor profile, expertise tags, and availability to manage your classroom.'
              : 'Fill out your official student admission form to complete enrollment and enter your classroom.'}
          </p>

          {/* Role Switcher Pill Bar */}
          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl gap-1 mt-3 shadow-xl">
            <button
              type="button"
              onClick={() => { setActiveRole('student'); setStep(1); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeRole === 'student'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Admission Form</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('mentor'); setStep(1); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeRole === 'mentor'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Mentor Profile Setup</span>
            </button>
          </div>
        </div>

        {/* Success Modal Notification */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center font-bold text-sm shadow-2xl flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
            <div>
              <p className="text-lg text-white font-black">
                {activeRole === 'mentor' ? 'Mentor Profile Setup Complete!' : 'Admission Form Submitted Successfully!'}
              </p>
              <p className="text-xs text-emerald-200 mt-1">Redirecting directly to your Portal Classroom...</p>
            </div>
          </motion.div>
        )}

        {/* Form Container Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: STUDENT ADMISSION FORM                                              */}
          {/* ========================================================================= */}
          {activeRole === 'student' && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between gap-2 mb-8 border-b border-white/10 pb-4">
                {[
                  { num: 1, label: 'Personal Info', icon: User },
                  { num: 2, label: 'Education & Course', icon: GraduationCap },
                  { num: 3, label: 'Guardian & Confirm', icon: ClipboardList },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div key={s.num} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' :
                        isDone   ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                      </div>
                      <span className={`text-xs font-bold hidden sm:inline ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" /> Step 1: Personal Details
                  </h2>

                  {/* Photo Upload */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-400/50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
                        {stuPhotoPreview ? (
                          <img src={stuPhotoPreview} alt="Student Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-blue-400/60" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoSelect(e, false)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Upload Student Photo</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Student Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pratik Wagh"
                        value={stuFullName}
                        onChange={(e) => setStuFullName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={stuDob}
                        onChange={(e) => setStuDob(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Gender *</label>
                      <select
                        value={stuGender}
                        onChange={(e) => setStuGender(e.target.value)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="" className="bg-slate-900">Select Gender</option>
                        <option value="Male" className="bg-slate-900">Male</option>
                        <option value="Female" className="bg-slate-900">Female</option>
                        <option value="Other" className="bg-slate-900">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={stuMobile}
                        onChange={(e) => setStuMobile(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>City / Town *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Satana, Nashik"
                        value={stuCity}
                        onChange={(e) => setStuCity(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!stuFullName || !stuMobile || !stuCity) {
                          setError('Please fill in your name, mobile, and city.');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg cursor-pointer"
                    >
                      Next: Education & Course <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Education & Course Choice */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-400" /> Step 2: Education & Course Selection
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Highest Qualification *</label>
                      <select
                        value={stuQualification}
                        onChange={(e) => setStuQualification(e.target.value)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="" className="bg-slate-900">Select Qualification</option>
                        {QUALIFICATIONS.map(q => <option key={q} value={q} className="bg-slate-900">{q}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Year of Passing *</label>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        value={stuYearOfPassing}
                        onChange={(e) => setStuYearOfPassing(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelCls}>School / College / University *</label>
                      <input
                        type="text"
                        placeholder="e.g. Satana Arts, Science & Commerce College"
                        value={stuInstitute}
                        onChange={(e) => setStuInstitute(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelCls}>Course to Enroll In *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {STUDENT_COURSES.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setStuInterestedCourse(c)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              stuInterestedCourse === c
                                ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{c}</span>
                            {stuInterestedCourse === c && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!stuQualification || !stuInstitute) {
                          setError('Please fill in your qualification and institute name.');
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg cursor-pointer"
                    >
                      Next: Confirmation <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Guardian Details & Submit */}
              {step === 3 && (
                <form onSubmit={handleStudentSubmit} className="space-y-6">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-400" /> Step 3: Guardian Info & Declaration
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Parent / Guardian Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Suresh Wagh"
                        value={stuGuardianName}
                        onChange={(e) => setStuGuardianName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Guardian Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={stuGuardianPhone}
                        onChange={(e) => setStuGuardianPhone(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelCls}>Residential Address</label>
                      <textarea
                        rows={2}
                        placeholder="Street, City, District, PIN code"
                        value={stuAddress}
                        onChange={(e) => setStuAddress(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stuDeclaration}
                      onChange={(e) => setStuDeclaration(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      I hereby declare that the information provided in this admission form is true and accurate. I agree to adhere to the code of conduct of AI Institute Satana.
                    </span>
                  </label>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !stuDeclaration}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/30 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Submit Admission & Open Classroom</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MENTOR PROFILE SETUP FORM                                           */}
          {/* ========================================================================= */}
          {activeRole === 'mentor' && (
            <form onSubmit={handleMentorSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" /> Instructor / Mentor Credentials Setup
                </h2>
                <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Mentor Mode
                </span>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="relative group cursor-pointer">
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-emerald-400/50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
                    {mentorPhotoPreview ? (
                      <img src={mentorPhotoPreview} alt="Mentor Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-emerald-400/60" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, true)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Upload Mentor Profile Photo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mentor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vaibhav Ahire"
                    value={mentorFullName}
                    onChange={(e) => setMentorFullName(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Designation / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior AI Research Scientist"
                    value={mentorTitle}
                    onChange={(e) => setMentorTitle(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Years of Industry Experience *</label>
                  <select
                    value={mentorExpYears}
                    onChange={(e) => setMentorExpYears(e.target.value)}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="3+ Years" className="bg-slate-900">3+ Years</option>
                    <option value="5+ Years" className="bg-slate-900">5+ Years</option>
                    <option value="7+ Years" className="bg-slate-900">7+ Years</option>
                    <option value="10+ Years" className="bg-slate-900">10+ Years</option>
                    <option value="15+ Years" className="bg-slate-900">15+ Years</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>About / Instructor Biography *</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your practical experience, domain background, and teaching philosophy..."
                    value={mentorBio}
                    onChange={(e) => setMentorBio(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Key Skills Tags */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Tech Stack & Expertise Tags *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {MENTOR_SKILLS.map(skill => {
                      const isSelected = mentorSelectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleMentorSkill(skill)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isSelected && '✓ '} {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={mentorLinkedIn}
                    onChange={(e) => setMentorLinkedIn(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>GitHub / Portfolio Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={mentorGithub}
                    onChange={(e) => setMentorGithub(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Mentorship Availability / Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. Evening (6:00 PM - 9:00 PM IST) & Weekends"
                    value={mentorAvailability}
                    onChange={(e) => setMentorAvailability(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Save Mentor Profile & Launch Portal</span>
                </button>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          AI Institute Satana · Account Onboarding & Profile Manager · {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060a12] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
