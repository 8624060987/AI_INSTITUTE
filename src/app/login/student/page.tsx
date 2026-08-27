'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useDatabase } from '@/context/DatabaseContext';
import { checkDailyDeviceLoginAllowed, recordDailyDeviceLogin } from '@/utils/deviceLoginSecurity';
import { 
  Mail, Lock, User, Loader2, ArrowLeft, ArrowRight, GraduationCap, 
  Phone, Key, ShieldCheck, Sparkles, BookOpen, CheckCircle2, Eye, EyeOff, Award,
  Building, MapPin, Target, UserCircle, Briefcase, FileText, Check,
  Camera, Upload, UploadCloud, Image as ImageIcon, Trash2
} from 'lucide-react';
import { ComingSoonCourseModal, isUpcomingCourse } from '@/components/shared/ComingSoonCourseModal';
import { sanitizeClientMessage } from '@/utils/errorHandler';

const DEFAULT_AVATAR = '/uploads/siddhi_pawar.jpg';

const CAREER_GOALS = [
  'Generative AI Engineer',
  'Data Analyst & BI Specialist',
  'Full Stack AI Developer',
  'Data Scientist & ML Researcher',
  'Business / Tech Consultant',
  'High-Paying Remote Job',
];

export default function StudentLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Existing Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Student Admission & Profile Setup States (Pure Image Upload, No Avatar Selection)
  const [fullName, setFullName] = useState('');
  const [admissionEmail, setAdmissionEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('course-gen-ai');
  const [qualification, setQualification] = useState('Graduate / B.Tech / BCA');
  const [college, setCollege] = useState('');
  const [currentYear, setCurrentYear] = useState('Final Year (2025/2026)');
  const [location, setLocation] = useState('');
  const [careerGoal, setCareerGoal] = useState('Generative AI Engineer');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
  const [bio, setBio] = useState('');
  const [learningMode, setLearningMode] = useState('Live Interactive Online Batch');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [upcomingModalCourse, setUpcomingModalCourse] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { currentUser, isAuthenticated, authReady, enrollInCourse } = useDatabase();

  // Exponential backoff countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.push('/portal?tab=classroom');
    }
  }, [authReady, isAuthenticated, router]);

  const COURSES = [
    { id: 'course-da', title: 'Data Analyst (Excel, SQL, Power BI, Tableau)' },
    { id: 'course-gen-ai', title: 'Generative AI & LLMs (ChatGPT, Prompting, Agents)' },
    { id: 'course-ds', title: 'Data Science & Machine Learning (Python, AI Models)' },
    { id: 'course-web-dev', title: 'Full Stack Web Development (React, Node, MongoDB)' },
    { id: 'course-business-analyst', title: 'Business Analyst (Process Modeling, BI Dashboards)' },
    { id: 'course-digital-marketing', title: '🚀 Digital Marketing & Growth (Coming Soon)' },
    { id: 'course-it', title: '🚀 Information Technology & Software Engineering (Coming Soon)' },
    { id: 'course-ui-ux', title: '🚀 UI/UX Design Masterclass (Coming Soon)' },
  ];

  // Direct Student Photo Upload Handler
  const handleStudentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Uploaded image is too large. Maximum file size allowed is 10MB.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      // 1. Instant high-resolution preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // 2. Upload to isolated storage server endpoint
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setUploadedPhotoUrl(data.url);
        setPhotoUploadSuccess(true);
        setTimeout(() => setPhotoUploadSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error('[STUDENT_PHOTO_UPLOAD_ERROR]', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 1. Handle Existing Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) {
      setError(`Rate limit reached: Please wait ${cooldownSeconds}s before attempting again.`);
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedEmail = email.toLowerCase().trim();

    // Record device login (non-blocking)
    try { recordDailyDeviceLogin(normalizedEmail); } catch (e) {}

    try {
      const authRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
          role: 'student',
        }),
      });

      const authJson = await authRes.json();

      if (authRes.status === 429) {
        const retryAfter = authJson.retryAfter || 60;
        setCooldownSeconds(retryAfter);
        setFailedAttemptsCount(authJson.failedAttempts || 5);
        setError(`Too many failed attempts. Exponential backoff cooldown active for ${retryAfter}s.`);
        setLoading(false);
        return;
      }

      if (authRes.status === 400) {
        setError(authJson.error || 'Invalid credentials format provided.');
        setLoading(false);
        return;
      }

      if (authRes.status === 401) {
        const backoffDelay = authJson.rateLimit?.retryAfterSeconds || 2;
        setFailedAttemptsCount(authJson.rateLimit?.failedAttempts || 1);
        setCooldownSeconds(backoffDelay);
        setError(`Incorrect password. Cooling down for ${backoffDelay}s before retry.`);
        setLoading(false);
        return;
      }

      let savedStudents: any[] = [];
      try {
        const raw = localStorage.getItem('lms_registered_students');
        if (raw) savedStudents = JSON.parse(raw);
      } catch (err) {}

      const foundLocal = savedStudents.find(
        (s: any) => s.email?.toLowerCase().trim() === normalizedEmail
      );

      let remoteProfile: any = null;
      try {
        const { data } = await supabase.from('profiles').select('*').ilike('email', normalizedEmail).single();
        if (data) remoteProfile = data;
      } catch (err) {}

      let authSuccess = false;
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        });
        if (authData?.user) authSuccess = true;
      } catch (err) {}

      const expectedPassword = foundLocal?.password || remoteProfile?.password;
      let isValid = false;

      if (foundLocal || remoteProfile) {
        // Account ALREADY EXISTS: strictly verify password!
        if (authSuccess || (expectedPassword && expectedPassword === password.trim())) {
          isValid = true;
        } else {
          setFailedAttemptsCount((prev) => prev + 1);
          throw new Error('Incorrect password. Please enter the exact password you set during admission or registration.');
        }
      } else {
        // New Account: create student record with entered password!
        isValid = true;
        const newStudent = {
          id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fullName: normalizedEmail.split('@')[0].toUpperCase(),
          email: normalizedEmail,
          phone: '',
          courseId: selectedCourse || 'course-gen-ai',
          courseTitle: 'Generative AI & LLMs',
          qualification: 'Graduate',
          college: 'AI Institute Scholar',
          currentYear: '2026',
          location: 'Satana / Maharashtra',
          careerGoal: 'AI Engineer',
          avatarUrl: DEFAULT_AVATAR,
          password: password.trim(),
          role: 'student',
          registeredAt: new Date().toISOString()
        };
        savedStudents.push(newStudent);
        localStorage.setItem('lms_registered_students', JSON.stringify(savedStudents));
      }

      if (isValid) {
        recordDailyDeviceLogin(normalizedEmail);
        setFailedAttemptsCount(0);
        setCooldownSeconds(0);

        // Purge ALL stale user sessions to prevent cross-account data leakage!
        localStorage.removeItem('lms_user');
        localStorage.removeItem('granted_student_user');
        localStorage.removeItem('lms_mentor_profile');
        localStorage.removeItem('user_role');
        localStorage.removeItem('lms_user_logged_in');

        // Resolve best available avatar: prefer a previously uploaded custom photo
        const savedCustomAvatar = localStorage.getItem(`custom_avatar_${normalizedEmail}`);
        const storedAvatar = foundLocal?.avatarUrl || remoteProfile?.avatar_url || DEFAULT_AVATAR;
        const isDefaultAvatar = !storedAvatar || storedAvatar === DEFAULT_AVATAR || storedAvatar.includes('unsplash.com/photo-1534528741775');
        const resolvedAvatar = (savedCustomAvatar && isDefaultAvatar) ? savedCustomAvatar : storedAvatar;

        const exactStudentProfile = {
          id: foundLocal?.id || remoteProfile?.id || `stu_${Date.now()}`,
          email: normalizedEmail,
          fullName: foundLocal?.fullName || remoteProfile?.full_name || normalizedEmail.split('@')[0].toUpperCase(),
          courseId: foundLocal?.courseId || remoteProfile?.course_id || selectedCourse || 'course-gen-ai',
          courseTitle: foundLocal?.courseTitle || 'Generative AI & LLMs',
          avatarUrl: resolvedAvatar,
          college: foundLocal?.college || remoteProfile?.college || 'AI Institute Scholar',
          location: foundLocal?.location || remoteProfile?.location || 'Satana / Maharashtra',
          careerGoal: foundLocal?.careerGoal || remoteProfile?.career_goal || 'AI Engineer',
          qualification: foundLocal?.qualification || remoteProfile?.qualification || 'Graduate',
          learningMode: foundLocal?.learningMode || remoteProfile?.learning_mode || 'Live Interactive Online Batch',
          phone: foundLocal?.phone || remoteProfile?.phone || '',
          bio: foundLocal?.bio || remoteProfile?.bio || '',
          currentYear: foundLocal?.currentYear || 'Final Year (2025/2026)',
          role: 'student'
        };

        // Also update the registered students list with the resolved avatar so it persists
        try {
          const regRaw = localStorage.getItem('lms_registered_students');
          if (regRaw) {
            const regList = JSON.parse(regRaw);
            const idx = regList.findIndex((s: any) => s.email?.toLowerCase().trim() === normalizedEmail);
            if (idx >= 0) {
              regList[idx] = { ...regList[idx], ...exactStudentProfile };
              localStorage.setItem('lms_registered_students', JSON.stringify(regList));
            }
          }
        } catch (_) {}

        localStorage.setItem('user_role', 'student');
        localStorage.setItem('lms_user_logged_in', 'true');
        localStorage.setItem('granted_student_user', JSON.stringify(exactStudentProfile));
        localStorage.setItem('lms_user', JSON.stringify(exactStudentProfile));

        setSuccessMsg('🎉 Login successful! Welcome back.');
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectTarget = params.get('redirect') || '/portal?tab=classroom';
          window.location.href = redirectTarget;
        }, 500);
      }
    } catch (err: any) {
      console.error('[STUDENT_LOGIN_ERROR]', err);
      setError(sanitizeClientMessage(err?.message, 'Login failed. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle New Student Admission & Profile Setup with Uploaded Photo
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = admissionEmail.toLowerCase().trim();

    if (!fullName.trim()) {
      setError('Please enter your full student name.');
      setLoading(false);
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please provide a valid email address for admission.');
      setLoading(false);
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please provide a valid 10-digit WhatsApp/Phone number.');
      setLoading(false);
      return;
    }
    if (!setupPassword || setupPassword.length < 6) {
      setError('Please set a password with at least 6 characters so you can login later.');
      setLoading(false);
      return;
    }
    if (setupPassword !== confirmPassword) {
      setError('Passwords do not match. Please confirm your password.');
      setLoading(false);
      return;
    }

    try {
      const studentRecord = {
        id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        courseId: selectedCourse,
        courseTitle: COURSES.find(c => c.id === selectedCourse)?.title || 'Generative AI & LLMs',
        qualification,
        college: college.trim() || 'AI Institute Scholar',
        currentYear,
        location: location.trim() || 'Satana / Maharashtra',
        careerGoal,
        avatarUrl: uploadedPhotoUrl || DEFAULT_AVATAR,
        bio: bio.trim() || `Passionate student dedicated to mastering ${COURSES.find(c => c.id === selectedCourse)?.title || 'AI Technologies'}.`,
        learningMode,
        password: setupPassword.trim(),
        role: 'student',
        registeredAt: new Date().toISOString()
      };

      // 1. Save to local storage registry
      let existingStudents: any[] = [];
      try {
        const raw = localStorage.getItem('lms_registered_students');
        if (raw) existingStudents = JSON.parse(raw);
      } catch (err) {}
      
      existingStudents = existingStudents.filter((s: any) => s.email?.toLowerCase().trim() !== normalizedEmail);
      existingStudents.push(studentRecord);
      localStorage.setItem('lms_registered_students', JSON.stringify(existingStudents));

      // 2. Save profile in Supabase
      try {
        await supabase.from('profiles').upsert({
          id: studentRecord.id,
          full_name: studentRecord.fullName,
          email: studentRecord.email,
          role: 'student',
          phone: studentRecord.phone,
          qualification: studentRecord.qualification,
          college: studentRecord.college,
          location: studentRecord.location,
          career_goal: studentRecord.careerGoal,
          avatar_url: studentRecord.avatarUrl,
          bio: studentRecord.bio,
          learning_mode: studentRecord.learningMode,
          created_at: new Date().toISOString()
        });
      } catch (err) {}

      // 3. Live Sync to Google Sheets Webhook via Backend API
      try {
        await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: studentRecord.fullName,
            phone: studentRecord.phone,
            course: studentRecord.courseTitle,
          }),
        });
      } catch (err) {}

      // 4. Enroll in course and setup clean session
      enrollInCourse(selectedCourse);
      recordDailyDeviceLogin(normalizedEmail);

      // Purge ALL stale user sessions
      localStorage.removeItem('lms_user');
      localStorage.removeItem('granted_student_user');
      localStorage.removeItem('lms_mentor_profile');
      localStorage.removeItem('user_role');
      localStorage.removeItem('lms_user_logged_in');

      localStorage.setItem('user_role', 'student');
      localStorage.setItem('lms_user_logged_in', 'true');
      localStorage.setItem('granted_student_user', JSON.stringify(studentRecord));
      localStorage.setItem('lms_user', JSON.stringify(studentRecord));

        setSuccessMsg('🎉 Student Profile Created & Photo Saved! Launching Portal...');
        setTimeout(() => {
          window.location.href = '/portal?tab=classroom';
        }, 500);
    } catch (err: any) {
      console.error('[STUDENT_ADMISSION_ERROR]', err);
      setError(sanitizeClientMessage(err?.message, 'Admission registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Ambient background glows */}
      <div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #059669, transparent 70%)' }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 px-4">
        {/* Back link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Institute Homepage</span>
        </Link>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4 shadow-xl shadow-blue-500/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Institute Satana
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Student Admissions, Photo Upload & Profile Setup
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Form Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLogin 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Student Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isLogin 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Upload Photo & Setup Profile</span>
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-3 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {cooldownSeconds > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Exponential Backoff Cooldown Active</span>
              </div>
              <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
                {cooldownSeconds}s remaining
              </span>
            </div>
          )}

          {isLogin ? (
            /* TAB 1: EXISTING STUDENT LOGIN */
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Student Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Protected Student Portal
                </span>
                <Link href="/courses/course-gen-ai" className="text-blue-400 hover:underline">
                  View Syllabus
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  cooldownSeconds > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Student Credentials...</span>
                  </>
                ) : cooldownSeconds > 0 ? (
                  <span>Locked: Wait {cooldownSeconds}s</span>
                ) : (
                  <>
                    <span>Enter Student Classroom</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  New student? Click here to <strong className="text-emerald-400 underline">Upload Photo & Setup Profile</strong>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: COMPREHENSIVE STUDENT PROFILE SETUP WITH PURE IMAGE UPLOAD (NO AVATARS) */
            <form onSubmit={handleAdmissionSubmit} className="space-y-5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Upload your photo, fill your academic details, and enter the classroom.</span>
              </div>

              {/* 1. DEDICATED STUDENT PHOTO UPLOAD SECTION */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Upload Student Profile Photo *</span>
                  </span>
                  {uploadedPhotoUrl && (
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Photo Attached
                    </span>
                  )}
                </label>

                {/* Upload Card */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  {/* Photo Preview Badge */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/70 shadow-2xl shadow-emerald-500/20 bg-slate-800 flex items-center justify-center">
                      {uploadedPhotoUrl ? (
                        <img 
                          src={uploadedPhotoUrl} 
                          alt="Student Photo Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <UserCircle className="w-12 h-12 text-slate-600" />
                          <span className="text-[10px] text-slate-500 mt-1 font-semibold">No Photo</span>
                        </div>
                      )}
                    </div>

                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-colors cursor-pointer"
                      title="Upload Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Upload Controls & Actions */}
                  <div className="flex-1 text-center sm:text-left space-y-2.5">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleStudentPhotoUpload}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      id="student-photo-direct-upload"
                    />
                    
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingPhoto ? 'Uploading Photo...' : uploadedPhotoUrl ? 'Change Photo' : 'Upload Photo from Device'}</span>
                      </button>

                      {uploadedPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setUploadedPhotoUrl(null)}
                          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Upload your personal profile image (JPG, PNG, WebP up to 10MB). Stored safely in isolated storage.
                    </p>

                    {photoUploadSuccess && (
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Your photo has been uploaded and attached to your student ID!</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. PERSONAL CONTACT INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Student Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aryan Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    WhatsApp / Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={admissionEmail}
                    onChange={(e) => setAdmissionEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* 3. ACADEMIC & INSTITUTION BACKGROUND */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    College / University / Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. Pune University / SPPU"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    City / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Satana / Nashik / Pune"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Education & Current Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Educational Degree
                  </label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="12th / Diploma">12th Standard / Diploma</option>
                    <option value="Graduate / B.Tech / BCA">Graduate / B.Tech / BCA / B.Sc</option>
                    <option value="Post Graduate / MCA / M.Tech">Post Graduate / MCA / MBA</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Non-Tech Career Switcher">Non-Tech to Tech Switcher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Academic Year / Status
                  </label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="1st Year">1st Year Student</option>
                    <option value="2nd Year">2nd Year Student</option>
                    <option value="3rd Year">3rd Year Student</option>
                    <option value="Final Year (2025/2026)">Final Year (2025 / 2026 Batch)</option>
                    <option value="Recent Graduate">Recent Graduate (Passed Out)</option>
                    <option value="Working Professional">Working Professional (1-5 Yrs)</option>
                  </select>
                </div>
              </div>

              {/* Target Course & Career Objective */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Target Program Selection *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      {COURSES.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Primary Career Goal
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      {CAREER_GOALS.map((goal) => (
                        <option key={goal} value={goal} className="bg-slate-900 text-white">
                          {goal}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Learning Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Preferred Batch & Learning Mode
                </label>
                <select
                  value={learningMode}
                  onChange={(e) => setLearningMode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="Live Interactive Online Batch">Live Interactive Online Batch (Recorded & Hands-on)</option>
                  <option value="Classroom Campus Batch">Classroom Campus Batch (Satana Center)</option>
                  <option value="Weekend Fast-Track Batch">Weekend Fast-Track Batch (For Working Professionals)</option>
                </select>
              </div>

              {/* Short Bio / Student Note */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>About You / Motivation (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Passionate about AI, looking to master prompt engineering and full stack development."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {/* Setup Password for Future Login */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Key className="w-4 h-4" />
                  <span>Setup Password to Access Student Portal Anytime</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Create Password (Min 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showSetupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Admission Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configuring Profile & Activating Classroom...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Complete Admission & Launch Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Already registered? Click to <strong className="text-blue-400 underline">Sign In</strong>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>AI Institute Satana • 100% Placement Assistance • Live Interactive Projects</p>
        </div>
      </div>

      <ComingSoonCourseModal
        isOpen={!!upcomingModalCourse}
        onClose={() => setUpcomingModalCourse(null)}
        courseIdOrTitle={upcomingModalCourse || undefined}
        onExploreActiveCourses={() => setSelectedCourse('course-gen-ai')}
      />
    </div>
  );
}
