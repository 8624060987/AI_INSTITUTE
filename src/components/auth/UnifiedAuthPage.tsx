'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useDatabase } from '@/context/DatabaseContext';
import { recordDailyDeviceLogin } from '@/utils/deviceLoginSecurity';
import { sanitizeClientMessage } from '@/utils/errorHandler';

interface UnifiedAuthPageProps {
  initialMode?: 'login' | 'register';
}

export function UnifiedAuthPage({ initialMode = 'login' }: UnifiedAuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  // Registration Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Shared & Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const router = useRouter();
  const supabase = createClient();
  const { currentUser, isAuthenticated, authReady, enrollInCourse } = useDatabase();

  // Handle URL parameters (e.g. ?mode=register or ?error=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'register') {
        setIsLogin(false);
      } else if (mode === 'login') {
        setIsLogin(true);
      }

      const err = params.get('error');
      const errEmail = params.get('email');
      if (err === 'unregistered_google_account') {
        const emailMsg = errEmail ? ` (${errEmail})` : '';
        setError(`Access Denied: Your Google Account${emailMsg} is not registered. Please create your account first.`);
        setIsLogin(false);
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (authReady && isAuthenticated && currentUser?.role === 'student') {
      router.push('/portal?tab=classroom');
    }
  }, [authReady, isAuthenticated, currentUser, router]);

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Google authentication encountered an issue. Please sign in with your email and password.');
    }
  };

  // Student Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) {
      setError(`Rate limit reached: Please wait ${cooldownSeconds}s before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();

    try { recordDailyDeviceLogin(normalizedEmail); } catch (_) {}

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
        setError(`Too many failed attempts. Cooldown active for ${retryAfter}s.`);
        setLoading(false);
        return;
      }

      if (authRes.status === 401 || !authRes.ok) {
        setError(authJson.error || 'Invalid credentials. If you do not have an account yet, please click "Create Account".');
        setLoading(false);
        return;
      }

      // Check local storage records
      let savedStudents: any[] = [];
      try {
        const raw = localStorage.getItem('lms_registered_students');
        if (raw) savedStudents = JSON.parse(raw);
      } catch (_) {}

      const foundLocal = savedStudents.find(
        (s: any) => s.email?.toLowerCase().trim() === normalizedEmail
      );

      // Check remote Supabase profile
      let remoteProfile: any = null;
      try {
        const { data } = await supabase.from('profiles').select('*').ilike('email', normalizedEmail).single();
        if (data) remoteProfile = data;
      } catch (_) {}

      // Supabase direct authentication attempt
      let authSuccess = false;
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        });
        if (authData?.user) authSuccess = true;
      } catch (_) {}

      const expectedPassword = foundLocal?.password || remoteProfile?.password;
      let isValid = false;

      if (foundLocal || remoteProfile || authSuccess) {
        if (authSuccess || (expectedPassword && expectedPassword === password.trim())) {
          isValid = true;
        } else {
          throw new Error('Incorrect password. Please enter the password you registered with.');
        }
      } else {
        throw new Error('No account found for this email. Please click "Create Account" below to register.');
      }

      if (isValid) {
        recordDailyDeviceLogin(normalizedEmail);

        // Purge stale sessions
        localStorage.removeItem('lms_user');
        localStorage.removeItem('granted_student_user');
        localStorage.removeItem('lms_mentor_profile');
        localStorage.removeItem('user_role');
        localStorage.removeItem('lms_user_logged_in');

        const studentProfile = {
          id: foundLocal?.id || remoteProfile?.id || `stu_${Date.now()}`,
          email: normalizedEmail,
          fullName: foundLocal?.fullName || remoteProfile?.full_name || normalizedEmail.split('@')[0].toUpperCase(),
          courseId: foundLocal?.courseId || remoteProfile?.course_id || 'course-gen-ai',
          courseTitle: foundLocal?.courseTitle || 'Generative AI & LLMs',
          avatarUrl: foundLocal?.avatarUrl || remoteProfile?.avatar_url || '/uploads/siddhi_pawar.jpg',
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

        localStorage.setItem('user_role', 'student');
        localStorage.setItem('lms_user_logged_in', 'true');
        localStorage.setItem('granted_student_user', JSON.stringify(studentProfile));
        localStorage.setItem('lms_user', JSON.stringify(studentProfile));

        setSuccessMsg('🎉 Logged in successfully! Launching your classroom...');
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectTarget = params.get('redirect') || '/portal?tab=classroom';
          window.location.href = redirectTarget;
        }, 400);
      }
    } catch (err: any) {
      setError(sanitizeClientMessage(err?.message, 'Login failed. Please check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  // Student Account Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.toLowerCase().trim();

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      setLoading(false);
      return;
    }

    try {
      const studentRecord = {
        id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        courseId: 'course-gen-ai',
        courseTitle: 'Generative AI & LLMs',
        qualification: 'Student / Graduate',
        college: 'AI Institute Scholar',
        currentYear: 'Final Year (2025/2026)',
        location: 'Satana / Maharashtra',
        careerGoal: 'Generative AI Engineer',
        avatarUrl: '/uploads/siddhi_pawar.jpg',
        bio: 'Passionate student mastering AI technologies.',
        learningMode: 'Live Interactive Online Batch',
        password: password.trim(),
        role: 'student',
        registeredAt: new Date().toISOString()
      };

      // 1. Save to local storage registry
      let existingStudents: any[] = [];
      try {
        const raw = localStorage.getItem('lms_registered_students');
        if (raw) existingStudents = JSON.parse(raw);
      } catch (_) {}
      
      existingStudents = existingStudents.filter((s: any) => s.email?.toLowerCase().trim() !== normalizedEmail);
      existingStudents.push(studentRecord);
      localStorage.setItem('lms_registered_students', JSON.stringify(existingStudents));

      // 2. Save credentials in Supabase Auth & 'profiles' table
      try {
        await supabase.auth.signUp({
          email: normalizedEmail,
          password: password.trim(),
          options: {
            data: {
              full_name: studentRecord.fullName,
              role: 'student',
            },
          },
        });
      } catch (_) {}

      try {
        await supabase.from('profiles').upsert({
          id: studentRecord.id,
          full_name: studentRecord.fullName,
          email: studentRecord.email,
          password: password.trim(),
          role: 'student',
          phone: studentRecord.phone,
          qualification: studentRecord.qualification,
          college: studentRecord.college,
          location: studentRecord.location,
          career_goal: studentRecord.careerGoal,
          avatar_url: studentRecord.avatarUrl,
          bio: studentRecord.bio,
          learning_mode: studentRecord.learningMode,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (_) {}

      // 3. Sync lead to old sheet (backward compat)
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
      } catch (_) {}

      // 4. Save full registration data to new Google Sheet
      try {
        await fetch('/api/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: studentRecord.fullName,
            email: studentRecord.email,
            phone: studentRecord.phone,
            course: studentRecord.courseTitle,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          }),
        });
      } catch (_) {}

      enrollInCourse('course-gen-ai');
      recordDailyDeviceLogin(normalizedEmail);

      // Session setup
      localStorage.removeItem('lms_user');
      localStorage.removeItem('granted_student_user');
      localStorage.removeItem('lms_mentor_profile');
      localStorage.removeItem('user_role');
      localStorage.removeItem('lms_user_logged_in');

      localStorage.setItem('user_role', 'student');
      localStorage.setItem('lms_user_logged_in', 'true');
      localStorage.setItem('granted_student_user', JSON.stringify(studentRecord));
      localStorage.setItem('lms_user', JSON.stringify(studentRecord));

      setSuccessMsg('🎉 Account created successfully! Launching your learning portal...');
      setTimeout(() => {
        window.location.href = '/portal?tab=classroom';
      }, 500);
    } catch (err: any) {
      setError(sanitizeClientMessage(err?.message, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* ─────────────────────────────────────────────────────────────
          LEFT COLUMN: DARK SLATE BRANDING (Exact Layout from Photo)
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 bg-[#141d2b] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Top Branding: Logo + Name */}
        <div className="flex items-center gap-3 z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo-transparent.png" 
              alt="AI Institute Logo" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => { 
                (e.currentTarget as HTMLImageElement).src = '/logo-icon.png'; 
              }}
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white leading-tight tracking-tight">AI Institute</span>
              <span className="text-xs text-slate-400 font-semibold tracking-wide">Satana</span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Section */}
        <div className="my-12 lg:my-auto py-6 z-10 max-w-md">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-slate-400 mb-5">
            LEARN. GROW. EARN.
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white tracking-tight leading-[1.14]">
            Your next skill<br />
            starts with one<br />
            clear step.
          </h1>
        </div>

        {/* Bottom Footer Label */}
        <div className="z-10 text-xs text-slate-400 font-medium">
          AI Institute Satana
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT COLUMN: CLEAN WHITE CARD (Exact Layout from Photo)
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 bg-[#f8fafc] flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-[540px] bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-10">
          
          {/* Header Title & Subtitle */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Log in to your account' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {isLogin 
                ? 'Welcome back! Enter your details to continue.' 
                : 'One account for Student and Affiliate modes.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {cooldownSeconds > 0 && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Rate Limit Cooldown: Please wait {cooldownSeconds}s before attempting again.
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              MODE 1: CREATE ACCOUNT FORM (MATCHES SCREENSHOT EXACTLY)
          ───────────────────────────────────────────────────────── */}
          {!isLogin ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>

              {/* Email Address and Mobile Number in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Password and Confirm Password in 2 Columns with Eye Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirement Hint */}
              <p className="text-xs text-slate-500">
                Use 8+ characters with uppercase, lowercase, and a number.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#1a68ff] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>

              {/* Footer Switch to Log in */}
              <div className="pt-4 text-center text-sm text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setIsLogin(true);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </form>
          ) : (
            /* ─────────────────────────────────────────────────────────
                MODE 2: LOG IN FORM (MATCHING CLEAN DESIGN)
            ───────────────────────────────────────────────────────── */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email Address Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>

              {/* Password Field with Eye Toggle & Forgot Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      setError('To reset your password, please contact support at contact@aiinstitutesatana.in or WhatsApp +91 8390576960.');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#1a68ff] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-medium transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Footer Switch to Create Account */}
              <div className="pt-4 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setIsLogin(false);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Discreet Mentor Portal Switch at Bottom */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Are you a faculty member?</span>
            <Link 
              href="/login/mentor" 
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Mentor Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

