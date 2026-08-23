'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase, dedupeCourses, Course, Video, Note, Assignment, LiveSession, UserRole, Test, Question, TestSubmission } from '@/context/DatabaseContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { AIAssistant } from '@/components/shared/AIAssistant';
import { EditProfileModal } from '@/components/shared/EditProfileModal';
import { SecureVideoPlayer } from '@/components/shared/SecureVideoPlayer';
import { HandwrittenNoteModal } from '@/components/shared/HandwrittenNoteModal';
import { ComingSoonCourseModal, isUpcomingCourse } from '@/components/shared/ComingSoonCourseModal';
import { 
  Play, 
  Check, 
  Search, 
  Download, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Send, 
  Image as ImageIcon, 
  Pin, 
  Smile, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users as UsersIcon,
  Video as VideoIcon,
  PlusCircle,
  FileText,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Settings,
  X,
  Loader2,
  Briefcase,
  UploadCloud,
  Building2,
  Globe,
  Star,
  Shield,
  Mail,
  Lock,
  MessageSquare, 
  ArrowLeft,
  ShieldCheck,
  ArrowRight,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@/utils/supabase/client';

// Helper to dynamically load external scripts like Razorpay
export const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const supabase = createClient();

export default function PortalPage() {
  const {
    currentUser,
    isAuthenticated,
    authReady,
    courses,
    enrolledCourseIds,
    enrollInCourse,
    addCourse,
    videos,
    notes,
    assignments,
    addNote,
    addAssignment,
    tests,
    questions,
    testSubmissions,
    createTest,
    submitTest,
    videoProgress,
    updateVideoProgress,
    submissions,
    submitAssignment,
    evaluateSubmission,
    liveSessions,
    savedRecordings,
    addSavedLiveRecording,
    deleteSavedLiveRecording,
    createLiveSession,
    updateLiveSessionStatus,
    attendance,
    joinLiveSession,
    activeLiveSessionId,
    setActiveLiveSessionId,
    liveChats,
    sendLiveChatMessage,
      rateMentor,
    leaderboard,
    communityPosts,
    activeChannel,
    setActiveChannel,
    addCommunityPost,
    addCommentToPost,
    reactToPost,
    deleteCommunityPost,
    pinCommunityPost,
    payments,
    leads,
    updateLeadStatus,
    refundPayment,
    resetDatabase
  } = useDatabase();

  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const hasInitializedTab = React.useRef(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionToRate, setSessionToRate] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [upcomingModalCourse, setUpcomingModalCourse] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course-gen-ai');
  
  // Student active sub-tab inside classroom
  const [classroomTab, setClassroomTab] = useState<'notes' | 'assignments' | 'live' | 'tests' | 'leaderboard' | 'attendance' | 'progress'>('notes');


  // Smart tab handler: for students, 'live', 'notes', 'leaderboard' stay as activeTab
  // (so the sidebar highlights correctly) but also set classroomTab so the workspace
  // opens on the right sub-tab.
  const handleSidebarTabChange = (tab: string) => {
    const studentSubTabs: Record<string, 'notes' | 'assignments' | 'live' | 'tests' | 'leaderboard' | 'attendance' | 'progress'> = {
      live: 'live',
      notes: 'notes',
      leaderboard: 'leaderboard',
    };
    if (currentUser?.role === 'student' && studentSubTabs[tab]) {
      setClassroomTab(studentSubTabs[tab]);
    }
    setActiveTab(tab);
  };


  const [selectedHandwrittenNote, setSelectedHandwrittenNote] = useState<Note | null>(null);
  const [assignmentSubmittingId, setAssignmentSubmittingId] = useState<string | null>(null);
  const [submittingFileUrl, setSubmittingFileUrl] = useState('');

  // Student test taking state
  const [activeTestTakingId, setActiveTestTakingId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(0);

  // Mentor Course Management state
  const [mentorSelectedCourseId, setMentorSelectedCourseId] = useState<string>('course-ds');
  const [batchEnrolledCount, setBatchEnrolledCount] = useState<number>(0);

  // Fetch real enrolled student count for the mentor's selected batch
  useEffect(() => {
    if (currentUser?.role !== 'mentor' || !mentorSelectedCourseId) return;
    
    const fetchEnrollments = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', mentorSelectedCourseId);
      
      setBatchEnrolledCount(count || 0);
    };
    
    fetchEnrollments();
  }, [mentorSelectedCourseId, currentUser]);

  const [mentorCourseTab, setMentorCourseTab] = useState<'notes' | 'assignments' | 'tests'>('notes');

  // Mentor Live In-Web Recording State
  const [isMentorRecording, setIsMentorRecording] = useState(false);
  const [mentorRecordingTime, setMentorRecordingTime] = useState(0);
  const [mediaRecorderInstance, setMediaRecorderInstance] = useState<MediaRecorder | null>(null);
  const recordingTimerRef = React.useRef<number>(0);

  useEffect(() => {
    let interval: any;
    if (isMentorRecording) {
      interval = setInterval(() => {
        setMentorRecordingTime(prev => {
          recordingTimerRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } else {
      setMentorRecordingTime(0);
      recordingTimerRef.current = 0;
    }
    return () => clearInterval(interval);
  }, [isMentorRecording]);

  const startMentorInWebRecording = async (sessionTitle: string, courseId: string) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Web recording API is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1) + ' MB';
        const blobUrl = URL.createObjectURL(blob);

        await addSavedLiveRecording({
          sessionId: activeLiveSessionId || 'session-live',
          sessionTitle: sessionTitle,
          courseId: courseId,
          mentorName: currentUser?.fullName || 'Mentor Vaibhav Ahire',
          recordedAt: new Date().toISOString(),
          durationSeconds: recordingTimerRef.current || 180,
          fileSize: sizeMB,
          videoUrl: blobUrl,
          fileName: `${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Recorded.webm`
        });

        setIsMentorRecording(false);
        setMediaRecorderInstance(null);
        alert('🎉 Live Class recorded successfully! Saved inside website storage. Only mentor can download this file.');
      };

      recorder.start(1000);
      setMediaRecorderInstance(recorder);
      setIsMentorRecording(true);
    } catch (err: any) {
      console.error(err);
      alert('Screen & Audio Recording permission is required to record live lecture inside website.');
    }
  };

  const stopMentorInWebRecording = () => {
    if (mediaRecorderInstance && mediaRecorderInstance.state !== 'inactive') {
      mediaRecorderInstance.stop();
      setIsMentorRecording(false);
    }
  };

  const handleDownloadRecording = (rec: any) => {
    if (currentUser?.role !== 'mentor') {
      alert('🔒 Access Denied: Only official mentors can download live class recordings.');
      return;
    }
    const a = document.createElement('a');
    a.href = rec.videoUrl;
    a.download = rec.fileName || `${rec.sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Recorded.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const [mentorEvalTab, setMentorEvalTab] = useState<'assignments' | 'tests'>('assignments');
  const [communityCourseFilter, setCommunityCourseFilter] = useState<string>('all');

  // Helper to resolve student profile details
  const getStudentInfo = (studentId: string) => {
    const lbStudent = leaderboard.find(s => s.studentId === studentId);
    if (lbStudent) {
      return { name: lbStudent.studentName, avatar: lbStudent.avatarUrl };
    }
    if (currentUser && currentUser.id === studentId) {
      return { name: currentUser.fullName, avatar: currentUser.avatarUrl };
    }
    return { 
      name: `Student (${studentId.substring(0, 6)})`, 
      avatar: `https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff` 
    };
  };

  // Mentor Forms State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionTime, setNewSessionTime] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState(60);
      const [newSessionFileUrl, setNewSessionFileUrl] = useState('');
  const [evaluatingSubId, setEvaluatingSubId] = useState<string | null>(null);
  const [evaluationScore, setEvaluationScore] = useState(90);
  const [evaluationFeedback, setEvaluationFeedback] = useState('');

  // Mentor Notes Form State
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDesc, setNewNoteDesc] = useState('');
  const [newNoteFileUrl, setNewNoteFileUrl] = useState('');
  const [newNoteFileSize, setNewNoteFileSize] = useState('2.5 MB');

  // Mentor Assignment Form State
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newAssignmentPoints, setNewAssignmentPoints] = useState(100);
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');
  const [newAssignmentFileUrl, setNewAssignmentFileUrl] = useState('');

  // Mentor Test Form State
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestDuration, setNewTestDuration] = useState(15);
  const [builderQuestionsList, setBuilderQuestionsList] = useState<any[]>([]);

  // Question Builder Form State
  const [qBuilderText, setQBuilderText] = useState('');
  const [qBuilderOptA, setQBuilderOptA] = useState('');
  const [qBuilderOptB, setQBuilderOptB] = useState('');
  const [qBuilderOptC, setQBuilderOptC] = useState('');
  const [qBuilderOptD, setQBuilderOptD] = useState('');
  const [qBuilderCorrect, setQBuilderCorrect] = useState('A');
  const [qBuilderPoints, setQBuilderPoints] = useState(10);

  // Community State
  const [chatInput, setChatInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // AI Resume Job Matcher State
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); // 0=idle 1=reading 2=skills 3=education 4=experience 5=done
  const [jobPlatformFilter, setJobPlatformFilter] = useState<'all' | 'linkedin' | 'naukri'>('all');
  const [jobExperienceFilter, setJobExperienceFilter] = useState<'all' | 'fresher' | 'experienced'>('all');
  const [resumeAnalysis, setResumeAnalysis] = useState<{
    technicalSkills: string[];
    softSkills: string[];
    education: string;
    educationStream: string;
    experienceYears: number;
    experienceLabel: string;
    resumeScore: number;
    profileStrength: string;
    certifications: string[];
    languages: string[];
  } | null>(null);

  // Mentor / Admin Free Gmail Access Generator State
  const [grantGmail, setGrantGmail] = useState('');
  const [grantCourseId, setGrantCourseId] = useState('all');
  const [grantPassKey, setGrantPassKey] = useState('FreeAccess@2026');
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const [grantedAccessResult, setGrantedAccessResult] = useState<{
    gmail: string;
    courseTitle: string;
    passKey: string;
    grantedAt: string;
  } | null>(null);
  const [grantedHistory, setGrantedHistory] = useState<Array<{
    id: string;
    gmail: string;
    courseTitle: string;
    passKey: string;
    grantedBy: string;
    grantedAt: string;
  }>>([
    {
      id: 'grant-1',
      gmail: 'student.sample@gmail.com',
      courseTitle: 'Generative AI & LLM Engineering Masterclass',
      passKey: 'FreeAccess@2026',
      grantedBy: 'Dr. Vishwadeep (Senior AI Mentor)',
      grantedAt: '07/08/2026, 10:30 AM',
    }
  ]);

  const parsedSkills = resumeAnalysis
    ? [...resumeAnalysis.technicalSkills, ...resumeAnalysis.softSkills]
    : [];

  const runResumeAnalysis = (fileName: string) => {
    setIsAnalyzingResume(true);
    setAnalysisStep(1);
    const steps = [1, 2, 3, 4, 5];
    const delays = [600, 1200, 1900, 2500, 3200];
    steps.forEach((step, idx) => {
      setTimeout(() => setAnalysisStep(step), delays[idx]);
    });
    setTimeout(() => {
      // Simulate AI analysis result based on filename hints
      const name = fileName.toLowerCase();
      const isCyber = name.includes('cyber') || name.includes('security') || name.includes('soc');
      const isWeb = name.includes('web') || name.includes('frontend') || name.includes('react') || name.includes('node');
      const isCloud = name.includes('cloud') || name.includes('devops') || name.includes('aws') || name.includes('azure');
      const isData = name.includes('data') || name.includes('analyst') || name.includes('bi') || name.includes('sql');

      let techSkills = ['Python', 'Machine Learning', 'SQL', 'Data Analytics', 'PowerBI', 'Deep Learning', 'Generative AI', 'TensorFlow', 'Pandas', 'NumPy'];
      let education = 'B.Tech / B.E. — Computer Science';
      let educationStream = 'Computer Science & Engineering';

      if (isCyber)   { techSkills = ['Python', 'SQL', 'Network Security', 'SIEM Tools', 'Penetration Testing', 'Linux', 'Firewall', 'Risk Assessment']; education = 'B.Tech — Cybersecurity'; educationStream = 'Information Security'; }
      if (isWeb)     { techSkills = ['JavaScript', 'React.js', 'Node.js', 'SQL', 'HTML/CSS', 'Python', 'REST APIs', 'TypeScript', 'Git', 'MongoDB']; education = 'B.Tech / B.Sc — Computer Science'; educationStream = 'Software Engineering'; }
      if (isCloud)   { techSkills = ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Python', 'SQL', 'Linux', 'Terraform', 'CI/CD', 'Git']; education = 'B.Tech — IT / CS'; educationStream = 'Cloud & Infrastructure'; }
      if (isData)    { techSkills = ['SQL', 'Python', 'PowerBI', 'Tableau', 'Data Analytics', 'Excel', 'Machine Learning', 'Pandas', 'Data Wrangling', 'ETL']; education = 'B.Tech / B.Sc — Statistics / CS'; educationStream = 'Data Science & Analytics'; }

      setResumeAnalysis({
        technicalSkills: techSkills,
        softSkills: ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Critical Thinking'],
        education,
        educationStream,
        experienceYears: isCyber || isCloud ? 2 : 0,
        experienceLabel: isCyber || isCloud ? '1-2 Years Experience' : 'Fresher (0-1 Year)',
        resumeScore: isCyber ? 78 : isWeb ? 82 : isCloud ? 80 : isData ? 88 : 85,
        profileStrength: isCyber || isData ? 'Strong' : 'Good',
        certifications: isCyber
          ? ['CEH', 'CompTIA Security+']
          : isCloud
          ? ['AWS Certified Cloud Practitioner', 'Azure Fundamentals']
          : ['Google Data Analytics', 'Python for AI — Coursera'],
        languages: ['English', 'Hindi'],
      });
      setIsAnalyzingResume(false);
      setAnalysisStep(0);
      triggerConfetti();
    }, 3400);
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const fetchSupabasePasses = async () => {
        try {
          const { data } = await supabase
            .from('granted_access_passes')
            .select('*')
            .order('granted_at', { ascending: false });

          if (data && data.length > 0) {
            const mappedHistory = data.map(d => ({
              id: d.id,
              gmail: d.gmail,
              courseId: d.course_id,
              courseTitle: d.course_title,
              passKey: d.password,
              grantedBy: d.granted_by || 'Mentor',
              grantedAt: d.granted_at ? new Date(d.granted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now',
            }));
            setGrantedHistory(mappedHistory);
            localStorage.setItem('lms_granted_passes', JSON.stringify(mappedHistory));
          }
        } catch (e) {}
      };
      fetchSupabasePasses();

      const params = new URLSearchParams(window.location.search);
      const urlCourseId = params.get('courseId') || params.get('enroll') || params.get('checkout');
      const urlTab = params.get('tab');

      if (urlCourseId && isUpcomingCourse(urlCourseId)) {
        setUpcomingModalCourse(urlCourseId);
      }

      let targetCourseId = urlCourseId;
      const role = localStorage.getItem('user_role');
      const rawGUser = localStorage.getItem('granted_student_user');

      // Wait until auth is resolved before deciding to redirect
      if (!authReady) return;

      // Unauthenticated visitors must log in first before accessing portal
      if (!isAuthenticated && !role && !rawGUser) {
        router.push('/login');
        return;
      }

      if (rawGUser) {
        try {
          const gUser = JSON.parse(rawGUser);
          if (gUser && gUser.courseId) {
            targetCourseId = gUser.courseId === 'all' ? 'course-gen-ai' : gUser.courseId;
          }
        } catch (e) {}
      }

      if (targetCourseId && !isUpcomingCourse(targetCourseId)) {
        const finalId = targetCourseId === 'all' ? 'course-gen-ai' : targetCourseId;
        setSelectedCourseId(finalId);
        setClassroomTab('notes');
        enrollInCourse(finalId);
      }

      if (!hasInitializedTab.current) {
        hasInitializedTab.current = true;
        if (urlTab) {
          setActiveTab(urlTab);
        }
      }
    }
  }, [isAuthenticated, currentUser, authReady]);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = ['.pdf', '.doc', '.docx'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        alert('❌ Invalid file format!\n\nOnly PDF (.pdf) and Word documents (.doc, .docx) are accepted.\n\nPlease upload a valid resume file.');
        e.target.value = '';
        return;
      }
      setResumeFileName(file.name);
      setResumeAnalysis(null);
      runResumeAnalysis(file.name);
    }
  };

  const triggerDemoResumeScan = () => {
    setResumeFileName('Jay_Koche_AI_ML_Resume.pdf');
    setResumeAnalysis(null);
    runResumeAnalysis('Jay_Koche_AI_ML_Resume.pdf');
  };

  const getCompanyLogoUrl = (companyName: string): string => {
    const c = (companyName || '').toLowerCase();

    if (c.includes('google')) return 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg';
    if (c.includes('microsoft')) return 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg';
    if (c.includes('amazon') || c.includes('aws')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';
    if (c.includes('tcs') || c.includes('tata')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg';
    if (c.includes('infosys')) return 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg';
    if (c.includes('wipro')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg';
    if (c.includes('hcl')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ab/HCLTech_Logo.svg';
    if (c.includes('ibm')) return 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg';
    if (c.includes('accenture')) return 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg';
    if (c.includes('cognizant')) return 'https://upload.wikimedia.org/wikipedia/commons/4/43/Cognizant_logo_2022.svg';
    if (c.includes('capgemini')) return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg';
    if (c.includes('deloitte')) return 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_of_Deloitte.svg';
    if (c.includes('samsung')) return 'https://cdn.simpleicons.org/samsung/1428A0';
    if (c.includes('intel')) return 'https://cdn.simpleicons.org/intel/0071C5';
    if (c.includes('flipkart')) return 'https://cdn.simpleicons.org/flipkart/2874F0';
    if (c.includes('swiggy')) return 'https://cdn.simpleicons.org/swiggy/FC6011';
    if (c.includes('zomato')) return 'https://cdn.simpleicons.org/zomato/CB202D';
    if (c.includes('razorpay')) return 'https://cdn.simpleicons.org/razorpay/0C2340';
    if (c.includes('paytm')) return 'https://cdn.simpleicons.org/paytm/002E6E';
    if (c.includes('phonepe')) return 'https://cdn.simpleicons.org/phonepe/5F259F';
    if (c.includes('cred')) return 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Cred_logo.png';
    if (c.includes('ola')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Ola_Cabs_logo.svg';
    if (c.includes('makemytrip')) return 'https://upload.wikimedia.org/wikipedia/commons/7/71/MakeMyTrip_Logo.svg';
    if (c.includes('mphasis')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Mphasis_Logo.svg';
    if (c.includes('hexaware')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Hexaware_technologies_logo.svg';
    if (c.includes('l&t') || c.includes('ltts')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e5/L%26T.svg';

    return 'https://cdn.simpleicons.org/google/4285F4';
  };

  const JobCardCompanyAvatar = ({ company }: { company: string }) => {
    const [logoFailed, setLogoFailed] = useState(false);
    const logoUrl = getCompanyLogoUrl(company);

    return (
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-center">
        {!logoFailed && logoUrl ? (
          <img
            src={logoUrl}
            alt={company}
            className="max-h-full max-w-full object-contain filter dark:invert"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="font-extrabold text-[10px] leading-tight text-blue-600 dark:text-blue-400 uppercase tracking-tight">
            {company}
          </span>
        )}
      </div>
    );
  };

  const ALL_MATCHED_JOBS = [
    // ── AI / ML / Data Science Jobs ────────────────────────────
    { id: 'job-1', title: 'Junior AI / ML Engineer', company: 'Google', source: 'LinkedIn' as const, matchScore: 98, location: 'Bangalore / Remote', salary: '₹14 - ₹26 LPA', skillsMatched: ['Python', 'Machine Learning', 'Deep Learning', 'Generative AI'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=AI+ML+Engineer+Google', posted: '2 hours ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-2', title: 'Data Science & Analytics Associate', company: 'Microsoft', source: 'Naukri.com' as const, matchScore: 96, location: 'Hyderabad / Hybrid', salary: '₹12 - ₹22 LPA', skillsMatched: ['SQL', 'Python', 'PowerBI', 'Data Analytics'], applyUrl: 'https://www.naukri.com/data-science-jobs-in-hyderabad', posted: '4 hours ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-3', title: 'Generative AI & LLM Specialist', company: 'Amazon Web Services', source: 'LinkedIn' as const, matchScore: 95, location: 'Bangalore', salary: '₹16 - ₹28 LPA', skillsMatched: ['Generative AI', 'Python', 'Deep Learning'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Generative+AI+AWS', posted: '1 day ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-4', title: 'Python & Business Intelligence Developer', company: 'Deloitte', source: 'Naukri.com' as const, matchScore: 93, location: 'Pune / Remote', salary: '₹10 - ₹18 LPA', skillsMatched: ['PowerBI', 'SQL', 'Python', 'Data Analytics'], applyUrl: 'https://www.naukri.com/deloitte-python-jobs', posted: '1 day ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-5', title: 'Data Analyst Trainee', company: 'Flipkart', source: 'LinkedIn' as const, matchScore: 91, location: 'Bangalore', salary: '₹8 - ₹14 LPA', skillsMatched: ['SQL', 'PowerBI', 'Data Analytics'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Data+Analyst+Flipkart', posted: '2 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-6', title: 'Machine Learning Research Engineer', company: 'IBM India', source: 'Naukri.com' as const, matchScore: 89, location: 'Bangalore / Hybrid', salary: '₹12 - ₹20 LPA', skillsMatched: ['Machine Learning', 'Python', 'Deep Learning', 'SQL'], applyUrl: 'https://www.naukri.com/ibm-machine-learning-jobs', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-7', title: 'NLP / Computer Vision Engineer', company: 'Samsung R&D', source: 'LinkedIn' as const, matchScore: 88, location: 'Bangalore', salary: '₹15 - ₹25 LPA', skillsMatched: ['Python', 'Deep Learning', 'Machine Learning'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=NLP+Computer+Vision+Samsung', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-8', title: 'Junior Data Engineer', company: 'Zomato', source: 'Naukri.com' as const, matchScore: 87, location: 'Gurgaon / Hybrid', salary: '₹9 - ₹16 LPA', skillsMatched: ['Python', 'SQL', 'Data Analytics'], applyUrl: 'https://www.naukri.com/zomato-data-engineer-jobs', posted: '3 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-9', title: 'AI Product Analyst', company: 'Razorpay', source: 'LinkedIn' as const, matchScore: 85, location: 'Bangalore / Remote', salary: '₹10 - ₹18 LPA', skillsMatched: ['Data Analytics', 'SQL', 'Python', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=AI+Product+Analyst+Razorpay', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Full Stack / Web Development Jobs ──────────────────────────
    { id: 'job-10', title: 'Full Stack Developer (React + Node.js)', company: 'TCS Digital', source: 'Naukri.com' as const, matchScore: 83, location: 'Chennai / Hybrid', salary: '₹6 - ₹12 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/tcs-full-stack-developer-jobs', posted: '1 day ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-11', title: 'Backend Engineer (Python / Django)', company: 'Wipro', source: 'LinkedIn' as const, matchScore: 81, location: 'Pune / Remote', salary: '₹8 - ₹16 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Python+Backend+Engineer+Wipro', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-12', title: 'Frontend Developer (React.js)', company: 'Swiggy', source: 'LinkedIn' as const, matchScore: 79, location: 'Bangalore / Remote', salary: '₹7 - ₹14 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Frontend+React+Developer+Swiggy', posted: '3 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-13', title: 'MERN Stack Developer', company: 'Infosys BPM', source: 'Naukri.com' as const, matchScore: 78, location: 'Hyderabad', salary: '₹5 - ₹11 LPA', skillsMatched: ['SQL', 'Python', 'Communication'], applyUrl: 'https://www.naukri.com/infosys-mern-stack-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-14', title: 'Senior Full Stack Engineer', company: 'Paytm', source: 'LinkedIn' as const, matchScore: 84, location: 'Noida / Hybrid', salary: '₹18 - ₹32 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Engineer+Paytm', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── Cloud / DevOps / SRE Jobs ───────────────────────────────────
    { id: 'job-15', title: 'Cloud Solutions Architect', company: 'Accenture', source: 'LinkedIn' as const, matchScore: 78, location: 'Bangalore / Hybrid', salary: '₹18 - ₹35 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Cloud+Architect+Accenture', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-16', title: 'DevOps Engineer Trainee', company: 'Infosys', source: 'Naukri.com' as const, matchScore: 76, location: 'Mysore / On-site', salary: '₹5 - ₹9 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/infosys-devops-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-17', title: 'AWS Cloud Engineer', company: 'HCL Technologies', source: 'Naukri.com' as const, matchScore: 77, location: 'Noida / Remote', salary: '₹10 - ₹20 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/hcl-aws-cloud-engineer-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-18', title: 'Site Reliability Engineer (SRE)', company: 'PhonePe', source: 'LinkedIn' as const, matchScore: 80, location: 'Bangalore', salary: '₹16 - ₹28 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=SRE+PhonePe', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-19', title: 'Azure Cloud Trainee', company: 'Capgemini', source: 'Naukri.com' as const, matchScore: 74, location: 'Mumbai', salary: '₹4 - ₹8 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/capgemini-azure-cloud-jobs', posted: '6 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── QA / Testing Jobs ──────────────────────────────────────────
    { id: 'job-20', title: 'QA Automation Engineer', company: 'HCL Technologies', source: 'Naukri.com' as const, matchScore: 74, location: 'Noida / Hybrid', salary: '₹5 - ₹10 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/hcl-qa-automation-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-21', title: 'Senior QA Lead', company: 'Mphasis', source: 'LinkedIn' as const, matchScore: 75, location: 'Pune / Hybrid', salary: '₹12 - ₹22 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=QA+Lead+Mphasis', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-22', title: 'Manual QA Engineer', company: 'Hexaware', source: 'Naukri.com' as const, matchScore: 72, location: 'Chennai', salary: '₹4 - ₹7 LPA', skillsMatched: ['SQL', 'Communication'], applyUrl: 'https://www.naukri.com/hexaware-qa-manual-jobs', posted: '6 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Business Analyst / IT Analyst Jobs ──────────────────────────
    { id: 'job-23', title: 'Business Analyst (IT)', company: 'Capgemini', source: 'LinkedIn' as const, matchScore: 79, location: 'Mumbai / Remote', salary: '₹8 - ₹15 LPA', skillsMatched: ['SQL', 'PowerBI', 'Data Analytics', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Business+Analyst+Capgemini', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-24', title: 'Junior IT Business Analyst', company: 'Cognizant', source: 'Naukri.com' as const, matchScore: 77, location: 'Hyderabad', salary: '₹4 - ₹8 LPA', skillsMatched: ['SQL', 'PowerBI', 'Communication'], applyUrl: 'https://www.naukri.com/cognizant-business-analyst-jobs', posted: '3 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-25', title: 'IT Systems Analyst', company: 'L&T Technology Services', source: 'Naukri.com' as const, matchScore: 76, location: 'Vadodara / Hybrid', salary: '₹6 - ₹12 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Communication'], applyUrl: 'https://www.naukri.com/ltts-it-systems-analyst-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Cybersecurity Jobs ──────────────────────────────────────────
    { id: 'job-26', title: 'Cybersecurity Analyst', company: 'Tata Consultancy Services', source: 'LinkedIn' as const, matchScore: 73, location: 'Mumbai / Hybrid', salary: '₹8 - ₹16 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Cybersecurity+Analyst+TCS', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-27', title: 'SOC Analyst (L1)', company: 'Wipro CyberSec', source: 'Naukri.com' as const, matchScore: 71, location: 'Pune', salary: '₹4 - ₹8 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/wipro-soc-analyst-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-28', title: 'Penetration Tester', company: 'Infosys Cybersecurity', source: 'LinkedIn' as const, matchScore: 74, location: 'Bangalore', salary: '₹10 - ₹20 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Penetration+Tester+Infosys', posted: '5 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── Mobile App Development Jobs ─────────────────────────────────
    { id: 'job-29', title: 'Android Developer (Kotlin)', company: 'CRED', source: 'LinkedIn' as const, matchScore: 75, location: 'Bangalore / Remote', salary: '₹10 - ₹20 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Android+Kotlin+Developer+CRED', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-30', title: 'iOS Developer (Swift) Trainee', company: 'MakeMyTrip', source: 'Naukri.com' as const, matchScore: 72, location: 'Gurgaon', salary: '₹6 - ₹12 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/makemytrip-ios-developer-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-31', title: 'React Native Mobile Developer', company: 'Ola Electric', source: 'LinkedIn' as const, matchScore: 76, location: 'Bangalore', salary: '₹8 - ₹16 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=React+Native+Developer+Ola', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Database / DBA Jobs ─────────────────────────────────────────
    { id: 'job-32', title: 'Database Administrator (Oracle/MySQL)', company: 'Oracle India', source: 'Naukri.com' as const, matchScore: 80, location: 'Hyderabad / Hybrid', salary: '₹10 - ₹18 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Communication'], applyUrl: 'https://www.naukri.com/oracle-dba-jobs-in-hyderabad', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-33', title: 'Junior SQL / Database Developer', company: 'Persistent Systems', source: 'LinkedIn' as const, matchScore: 78, location: 'Pune', salary: '₹5 - ₹10 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Python'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=SQL+Database+Developer+Persistent', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Networking / System Admin Jobs ──────────────────────────────
    { id: 'job-34', title: 'Network Engineer (CCNA/CCNP)', company: 'Tech Mahindra', source: 'Naukri.com' as const, matchScore: 71, location: 'Pune', salary: '₹5 - ₹10 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/tech-mahindra-network-engineer-jobs', posted: '6 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-35', title: 'IT Infrastructure Manager', company: 'Larsen & Toubro Infotech', source: 'LinkedIn' as const, matchScore: 73, location: 'Mumbai', salary: '₹14 - ₹24 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=IT+Infrastructure+Manager+LTI', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-36', title: 'System Administrator (Linux)', company: 'HCL Technologies', source: 'Naukri.com' as const, matchScore: 70, location: 'Chennai', salary: '₹5 - ₹9 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/hcl-linux-sysadmin-jobs', posted: '7 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── IT Project Management Jobs ───────────────────────────────────
    { id: 'job-37', title: 'IT Project Manager (PMP)', company: 'Accenture', source: 'LinkedIn' as const, matchScore: 78, location: 'Mumbai / Remote', salary: '₹20 - ₹40 LPA', skillsMatched: ['Data Analytics', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=IT+Project+Manager+Accenture', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-38', title: 'Scrum Master / Agile Coach', company: 'Mphasis', source: 'Naukri.com' as const, matchScore: 76, location: 'Pune / Hybrid', salary: '₹15 - ₹28 LPA', skillsMatched: ['Data Analytics', 'Communication'], applyUrl: 'https://www.naukri.com/mphasis-scrum-master-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── SAP / ERP Jobs ───────────────────────────────────────────────
    { id: 'job-39', title: 'SAP ABAP Developer', company: 'Wipro', source: 'Naukri.com' as const, matchScore: 74, location: 'Bangalore / Hybrid', salary: '₹8 - ₹18 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Communication'], applyUrl: 'https://www.naukri.com/wipro-sap-abap-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-40', title: 'SAP S/4HANA Functional Consultant', company: 'Deloitte', source: 'LinkedIn' as const, matchScore: 75, location: 'Mumbai', salary: '₹12 - ₹25 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=SAP+S4HANA+Consultant+Deloitte', posted: '5 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── Salesforce / CRM Jobs ────────────────────────────────────────
    { id: 'job-41', title: 'Salesforce Developer (Apex)', company: 'Cognizant', source: 'Naukri.com' as const, matchScore: 76, location: 'Hyderabad / Remote', salary: '₹8 - ₹18 LPA', skillsMatched: ['SQL', 'Python', 'Communication'], applyUrl: 'https://www.naukri.com/cognizant-salesforce-developer-jobs', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-42', title: 'Salesforce Admin Trainee', company: 'Infosys', source: 'LinkedIn' as const, matchScore: 72, location: 'Pune', salary: '₹5 - ₹9 LPA', skillsMatched: ['SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Salesforce+Admin+Infosys', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Product Management / IT Consulting ──────────────────────────
    { id: 'job-43', title: 'Associate Product Manager (Tech)', company: 'Meesho', source: 'LinkedIn' as const, matchScore: 80, location: 'Bangalore', salary: '₹12 - ₹22 LPA', skillsMatched: ['Data Analytics', 'SQL', 'Python', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Associate+Product+Manager+Meesho', posted: '2 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-44', title: 'IT Consultant', company: 'PwC India', source: 'Naukri.com' as const, matchScore: 77, location: 'Delhi / Hybrid', salary: '₹10 - ₹20 LPA', skillsMatched: ['Data Analytics', 'PowerBI', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/pwc-it-consultant-jobs', posted: '3 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── UI/UX & Design Technology ────────────────────────────────────
    { id: 'job-45', title: 'UI/UX Designer (Figma)', company: 'Urban Company', source: 'LinkedIn' as const, matchScore: 72, location: 'Gurgaon / Remote', salary: '₹6 - ₹12 LPA', skillsMatched: ['Python', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=UX+Designer+Urban+Company', posted: '4 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Blockchain / Web3 Jobs ───────────────────────────────────────
    { id: 'job-46', title: 'Blockchain Developer (Solidity)', company: 'Polygon Labs', source: 'LinkedIn' as const, matchScore: 74, location: 'Bangalore / Remote', salary: '₹12 - ₹24 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Blockchain+Developer+Polygon', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── IoT / Embedded Systems ───────────────────────────────────────
    { id: 'job-47', title: 'IoT Solutions Engineer', company: 'Bosch India', source: 'Naukri.com' as const, matchScore: 73, location: 'Bangalore', salary: '₹8 - ₹16 LPA', skillsMatched: ['Python', 'SQL', 'Machine Learning', 'Communication'], applyUrl: 'https://www.naukri.com/bosch-iot-engineer-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-48', title: 'Embedded Systems Developer', company: 'Qualcomm India', source: 'LinkedIn' as const, matchScore: 75, location: 'Hyderabad', salary: '₹12 - ₹22 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Embedded+Systems+Developer+Qualcomm', posted: '6 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    // ── IT Support / Helpdesk ────────────────────────────────────────
    { id: 'job-49', title: 'IT Support & Systems Engineer', company: 'Tech Mahindra', source: 'Naukri.com' as const, matchScore: 70, location: 'Pune', salary: '₹4 - ₹7 LPA', skillsMatched: ['Python', 'SQL', 'Communication'], applyUrl: 'https://www.naukri.com/tech-mahindra-it-support-jobs', posted: '6 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-50', title: 'Technical Support Engineer (L2)', company: 'Zoho Corporation', source: 'Naukri.com' as const, matchScore: 71, location: 'Chennai', salary: '₹4 - ₹8 LPA', skillsMatched: ['SQL', 'Python', 'Communication'], applyUrl: 'https://www.naukri.com/zoho-technical-support-jobs', posted: '5 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── Data Engineering / ETL ────────────────────────────────────────
    { id: 'job-51', title: 'Data Pipeline Engineer (Spark/Hadoop)', company: 'Mu Sigma', source: 'LinkedIn' as const, matchScore: 86, location: 'Bangalore / Hybrid', salary: '₹10 - ₹20 LPA', skillsMatched: ['Python', 'SQL', 'Data Analytics', 'Machine Learning'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Data+Engineer+Mu+Sigma', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-52', title: 'ETL Developer (Informatica)', company: 'Mindtree', source: 'Naukri.com' as const, matchScore: 82, location: 'Bangalore', salary: '₹8 - ₹15 LPA', skillsMatched: ['SQL', 'Data Analytics', 'Python'], applyUrl: 'https://www.naukri.com/mindtree-etl-developer-jobs', posted: '4 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
    { id: 'job-53', title: 'Junior Data Engineer (Python/SQL)', company: 'Swiggy Tech', source: 'LinkedIn' as const, matchScore: 85, location: 'Bangalore / Remote', salary: '₹8 - ₹14 LPA', skillsMatched: ['Python', 'SQL', 'Data Analytics'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Data+Engineer+Swiggy', posted: '3 days ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    // ── BI / Reporting / Analytics ────────────────────────────────────
    { id: 'job-54', title: 'Power BI / Tableau Developer', company: 'Ernst & Young (EY)', source: 'Naukri.com' as const, matchScore: 90, location: 'Delhi / Remote', salary: '₹9 - ₹18 LPA', skillsMatched: ['PowerBI', 'SQL', 'Data Analytics'], applyUrl: 'https://www.naukri.com/ey-power-bi-tableau-jobs', posted: '1 day ago', type: 'Full-time', experienceLevel: 'fresher' as const },
    { id: 'job-55', title: 'Senior BI Analyst (Looker/Tableau)', company: 'KPMG India', source: 'LinkedIn' as const, matchScore: 88, location: 'Bangalore / Hybrid', salary: '₹14 - ₹24 LPA', skillsMatched: ['PowerBI', 'SQL', 'Data Analytics', 'Communication'], applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=BI+Analyst+KPMG', posted: '2 days ago', type: 'Full-time', experienceLevel: 'experienced' as const },
  ].filter(job => {
    const overlap = job.skillsMatched.filter(s => parsedSkills.includes(s));
    return overlap.length >= 1;
  });


  // Admin Forms State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Generative AI');
  const [newCoursePrice, setNewCoursePrice] = useState(2999);
  const [newCourseCurriculum, setNewCourseCurriculum] = useState('Intro, Core Concepts, Advanced Building, Capstone Project');

  const fallbackCourse: Course = courses[0] || {
    id: 'course-gen-ai',
    title: 'Generative AI & LLM Masterclass',
    description: 'Learn to build products with OpenAI, LangChain, and LlamaIndex.',
    category: 'Generative AI',
    price: 0,
    originalPrice: 6999,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    mentorName: 'Vaibhav Ahire',
    duration: '80+ Hours',
    rating: 4.9,
    studentsCount: 934,
    curriculum: ['Prompt Engineering', 'LangChain Framework', 'Vector Databases', 'Fine-tuning Models'],
  };

  const selectedCourse: Course = courses.find(c => c.id === selectedCourseId) || fallbackCourse;

  const [isUploading, setIsUploading] = useState(false);
  const [checkoutCourseId, setCheckoutCourseId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Automated Indian UPI Payment & QR Code Verification State
  const [selectedUpiMethod, setSelectedUpiMethod] = useState<'qr' | 'phonepe' | 'gpay' | 'paytm' | 'bhim'>('qr');
  const [utrInput, setUtrInput] = useState('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  // Settings State
  const [editFullName, setEditFullName] = useState(currentUser?.fullName || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editExpertise, setEditExpertise] = useState(currentUser?.expertise || '');
  const [editExperience, setEditExperience] = useState(currentUser?.experienceYears || 0);
  const [editCompany, setEditCompany] = useState(currentUser?.company || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName);
      setEditAvatarUrl(currentUser.avatarUrl);
      setEditBio(currentUser.bio || '');
      setEditExpertise(currentUser.expertise || '');
      setEditExperience(currentUser.experienceYears || 0);
      setEditCompany(currentUser.company || '');
    }
  }, [currentUser]);

  // Handle 100% Free Instant Course Access from Landing Page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const checkoutId = searchParams.get('checkout') || searchParams.get('enroll') || searchParams.get('courseId');
      if (checkoutId && currentUser) {
        const finalId = checkoutId === 'all' ? 'course-gen-ai' : checkoutId;
        enrollInCourse(finalId);
        setSelectedCourseId(finalId);
        setActiveTab('classroom-detail');
        setClassroomTab('notes');
        
        // Clean up the URL so it doesn't trigger again on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [currentUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsSavingSettings(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw new Error('Failed to upload profile photo');
      
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      setEditAvatarUrl(publicUrlData.publicUrl);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveSettings = async () => {
    if (!currentUser) return;
    setIsSavingSettings(true);
    try {
      const updates: any = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: editFullName,
        avatar_url: editAvatarUrl,
        profile_photo_url: editAvatarUrl
      };
      if (currentUser.role === 'mentor') {
        updates.bio = editBio;
        updates.expertise = editExpertise;
        updates.experience_years = editExperience;
        updates.company = editCompany;
      }
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
      
      if (error) throw error;
      
      triggerConfetti();
      // Force page reload so DatabaseContext fetches the newly saved data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    setUrl: (url: string) => void, 
    setSize?: (size: string) => void,
    requirePdf?: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (requirePdf) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        alert('Invalid file format! Assignments must be uploaded in PDF format (.pdf) only.');
        e.target.value = '';
        return;
      }
    }

    if (setSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setSize(`${sizeMB} MB`);
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper for confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const startQuizTaking = (test: any) => {
    setActiveTestTakingId(test.id);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizTimeRemaining(test.durationMinutes * 60);
  };

  const submitActiveQuiz = () => {
    if (!activeTestTakingId) return;
    const test = tests.find(t => t.id === activeTestTakingId);
    if (!test) return;

    const testQs = questions.filter(q => q.testId === test.id);
    let finalScore = 0;

    testQs.forEach((q) => {
      const studentAnswer = selectedAnswers[q.id];
      if (studentAnswer === q.correctAnswer) {
        finalScore += q.points;
      }
    });

    submitTest(test.id, selectedAnswers, finalScore);
    setActiveTestTakingId(null);
    triggerConfetti();
  };

  const handleQuizAutoSubmit = () => {
    submitActiveQuiz();
  };

  // Countdown Timer for Student Test
  React.useEffect(() => {
    if (!activeTestTakingId || quizTimeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitActiveQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTestTakingId, quizTimeRemaining]);
  // Dynamic Stats Calculations
  const totalSecondsLearned = Object.values(videoProgress).reduce((acc, curr) => acc + curr.progressSeconds, 0);
  const totalHoursLearned = (totalSecondsLearned / 3600).toFixed(1);

  const userTests = testSubmissions.filter(ts => ts.studentId === currentUser?.id);
  const testsTakenCount = userTests.length;
  
  const currentUserLeaderboard = leaderboard.find(l => l.studentId === currentUser?.id);
  const avgTestScorePerc = currentUserLeaderboard?.testScore || 0;
  
    // Monitor session completion
    useEffect(() => {
      if (activeLiveSessionId && currentUser?.role === 'student') {
        const session = liveSessions.find(s => s.id === activeLiveSessionId);
        if (session && session.status === 'completed') {
          setSessionToRate(session);
          setActiveLiveSessionId(null);
        }
      }
    }, [liveSessions, activeLiveSessionId, currentUser]);

    const currentXP = currentUserLeaderboard?.xp || 0;

  if (activeLiveSessionId) {
    const activeSession = liveSessions.find(s => s.id === activeLiveSessionId);
    if (!activeSession) {
      setActiveLiveSessionId(null);
      return null;
    }

    let jitsiConfig = '#config.disableInviteFunctions=true&config.prejoinPageEnabled=false&config.fileRecordingsEnabled=false&config.liveStreamingEnabled=false&config.localRecording.enabled=false&config.disableThirdPartyRequests=true&config.disableDeepLinking=true&config.recordingType="none"';
    if (currentUser?.role === 'student') {
      jitsiConfig += '&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.toolbarButtons=%5B%22fullscreen%22%2C%22hangup%22%5D';
    }
    const iframeSrc = `https://meet.jit.si/${activeSession.meetingLink}${jitsiConfig}`;
    
    return (
      <div className="flex flex-col h-screen bg-[#080c14] text-white">
        <div className="flex-1 flex overflow-hidden">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
            <div className="absolute top-4 left-4 z-30 flex items-center gap-4">
              <button 
                onClick={() => setActiveLiveSessionId(null)}
                className="bg-slate-800/80 hover:bg-slate-700 p-3 rounded-full backdrop-blur-sm transition-colors text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-xl">
                {activeSession.title}
              </h2>
              {currentUser?.role === 'mentor' && (
                <div className="flex items-center gap-3 ml-2">
                  {!isMentorRecording ? (
                    <button
                      onClick={() => startMentorInWebRecording(activeSession.title, activeSession.courseId)}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all border border-rose-400/30"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                      <span>🔴 Start Web Recording (Mentor Only)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900/90 border border-rose-500/50 px-3 py-1.5 rounded-xl shadow-xl">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-extrabold animate-pulse">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        <span>REC {Math.floor(mentorRecordingTime / 60)}:{(mentorRecordingTime % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <button
                        onClick={stopMentorInWebRecording}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-lg shadow cursor-pointer transition-all"
                      >
                        ⏹️ Stop & Save to Website
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      updateLiveSessionStatus(activeSession.id, 'completed');
                      setActiveLiveSessionId(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    End Session
                  </button>
                </div>
              )}
            </div>
            <iframe 
              src={iframeSrc}
              className="w-full h-full border-0"
              allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; autoplay"
            />
          </div>
        
        {/* Live Chat Area */}
        <div className="w-[400px] border-l border-slate-800 bg-[#0f1420] flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Live Chat
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {liveChats.filter(c => c.sessionId === activeSession.id).map((chat) => (
              <div key={chat.id} className={`flex flex-col ${chat.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-400 mb-1">{chat.userName} • {chat.userRole}</span>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${chat.userId === currentUser?.id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                  {chat.message}
                </div>
              </div>
            ))}
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              const input = form.elements.namedItem('chatMessage');
              if (input.value.trim()) {
                sendLiveChatMessage(activeSession.id, input.value);
                input.value = '';
              }
            }} 
            className="p-4 border-t border-slate-800"
          >
            <div className="relative">
              <input 
                name="chatMessage"
                type="text" 
                placeholder="Send a message..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
                autoComplete="off"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080c14]">
      {/* Dynamic Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleSidebarTabChange} onEditProfile={() => setIsProfileModalOpen(true)} />

      {/* Indian Instant UPI & QR Code Payment Modal */}
      {checkoutCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0f1420] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-lg">
                  🇮🇳
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Indian Instant UPI Payment</h3>
                  <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Auto-Verified • PhonePe, GPay, Paytm, BHIM
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCheckoutCourseId(null);
                  setUtrInput('');
                  setUpiError(null);
                  setUpiVerified(false);
                }}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              
              {/* Course Title & Price Banner */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider block">Course Enrollment</span>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                    {courses.find(c => c.id === checkoutCourseId)?.title}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{courses.find(c => c.id === checkoutCourseId)?.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold block">100% Guaranteed</span>
                </div>
              </div>

              {/* Indian UPI Payment App Selector Tabs */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Select Your Indian UPI Payment App
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'qr', label: 'Scan QR', icon: '📱' },
                    { id: 'phonepe', label: 'PhonePe', icon: '💜' },
                    { id: 'gpay', label: 'Google Pay', icon: '🌐' },
                    { id: 'paytm', label: 'Paytm / BHIM', icon: '💙' },
                  ].map((app) => {
                    const isSelected = selectedUpiMethod === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiMethod(app.id as any)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                        }`}
                      >
                        <span className="text-lg">{app.icon}</span>
                        <span className="text-[10px] font-extrabold leading-tight">{app.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic QR Code & Direct Deep Link Display */}
              {(() => {
                const currentUpiId = process.env.NEXT_PUBLIC_UPI_ID || 'aiinstitute@upi';
                const currentUpiName = process.env.NEXT_PUBLIC_UPI_NAME || 'AI Institute Satana';
                const checkoutPrice = courses.find(c => c.id === checkoutCourseId)?.price || 2999;
                const encodedUpiUri = encodeURIComponent(`upi://pay?pa=${currentUpiId}&pn=${currentUpiName}&am=${checkoutPrice}&tn=Course Enrollment ${checkoutCourseId}&cu=INR`);
                const directUpiLink = `upi://pay?pa=${currentUpiId}&pn=${encodeURIComponent(currentUpiName)}&am=${checkoutPrice}&tn=Course+Enrollment&cu=INR`;

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-center">
                    {selectedUpiMethod === 'qr' && (
                      <div className="space-y-3">
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5">
                          <span>📱 Scan with Any Indian UPI App</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Instant Auto-Verify</span>
                        </p>
                        <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border-2 border-blue-500/20 shadow-md flex items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUpiUri}`}
                            alt="UPI Payment QR Code"
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">
                          Official UPI ID: <span className="text-blue-500 font-extrabold select-all">{currentUpiId}</span>
                        </p>
                      </div>
                    )}

                    {selectedUpiMethod === 'phonepe' && (
                      <div className="space-y-3 py-2">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold">
                          💜
                        </div>
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-800 dark:text-white">Pay via PhonePe UPI</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Click below to open PhonePe with pre-filled details.</p>
                        </div>
                        <a
                          href={directUpiLink}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all"
                        >
                          <span>Launch PhonePe App</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {selectedUpiMethod === 'gpay' && (
                      <div className="space-y-3 py-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center text-2xl font-bold">
                          🌐
                        </div>
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-800 dark:text-white">Pay via Google Pay (Tez)</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tap below to open Google Pay directly.</p>
                        </div>
                        <a
                          href={directUpiLink}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
                        >
                          <span>Launch Google Pay</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {selectedUpiMethod === 'paytm' && (
                      <div className="space-y-3 py-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-2xl font-bold">
                          💙
                        </div>
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-800 dark:text-white">Pay via Paytm / BHIM UPI</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Launch Paytm or BHIM app to complete payment.</p>
                        </div>
                        <a
                          href={directUpiLink}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all"
                        >
                          <span>Launch Paytm / BHIM App</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Automated Verification Form */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Automated UPI Verification System</span>
                  </label>
                  <span className="text-[9px] font-bold text-slate-400">12-Digit UTR / Ref No.</span>
                </div>

                {upiError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold">
                    ⚠️ {upiError}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter 12-Digit UPI UTR / Ref No. (e.g. 421890123456)"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const randomUtr = '4218' + Math.floor(10000000 + Math.random() * 90000000).toString();
                        setUtrInput(randomUtr);
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold hover:text-blue-500 transition-colors"
                    >
                      ⚡ Auto-Fill Test UTR
                    </button>

                    <button
                      type="button"
                      disabled={isVerifyingUpi}
                      onClick={async () => {
                        if (!checkoutCourseId || !currentUser) return;
                        if (!utrInput.trim() || utrInput.trim().length < 6) {
                          setUpiError('Please enter a valid 12-digit UPI UTR number.');
                          return;
                        }
                        setIsVerifyingUpi(true);
                        setUpiError(null);

                        try {
                          // Call UPI verification API endpoint
                          const res = await fetch('/api/payment/verify-upi', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              utrNumber: utrInput,
                              courseId: checkoutCourseId,
                              amount: courses.find(c => c.id === checkoutCourseId)?.price,
                              appName: selectedUpiMethod.toUpperCase(),
                            }),
                          });

                          const data = await res.json();
                          if (res.ok && data.success) {
                            await enrollInCourse(checkoutCourseId);
                            setCheckoutCourseId(null);
                            setUtrInput('');
                            triggerConfetti();
                            setSelectedCourseId(checkoutCourseId);
                            setActiveTab('classroom-detail');
                          } else {
                            setUpiError(data.error || 'UPI Verification failed.');
                          }
                        } catch (err: any) {
                          setUpiError('Verification service error. Please try again.');
                        } finally {
                          setIsVerifyingUpi(false);
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isVerifyingUpi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Verifying UPI...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Activate Classroom</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header 
          onEditProfile={() => setIsProfileModalOpen(true)} 
          onSelectCourse={(id) => setSelectedCourseId(id)}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        <main className="flex-grow p-6">
          {/* ========================================== */}
          {/* USER ROLE: STUDENT VIEWS                   */}
          {/* ========================================== */}
          {currentUser.role === 'student' && (
            <div>
              {/* STUDENT TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Greeting Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-violet-600 to-blue-800 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-2 z-10">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        Hello, {currentUser.fullName} 👋
                      </h2>
                      <p className="text-xs text-blue-100 font-medium">Let's continue your learning journey. You are making amazing progress!</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6 z-0">
                      <Sparkles className="w-48 h-48 text-white" />
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'Courses Enrolled', val: enrolledCourseIds.length, desc: 'Active Programs', color: 'border-blue-500/20' },
                      { title: 'Hours Learned', val: totalHoursLearned, desc: 'Total lecture time', color: 'border-emerald-500/20' },
                      { title: 'Tests Taken', val: testsTakenCount, desc: testsTakenCount > 0 ? `Average ${avgTestScorePerc}% score` : 'No tests taken', color: 'border-violet-500/20' },
                      { title: 'Current XP', val: currentXP, desc: 'Total Experience Points', color: 'border-amber-500/20' },
                    ].map((stat, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl bg-white dark:bg-[#0f1420] border ${stat.color} dark:border-slate-800 shadow-sm flex flex-col justify-between`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{stat.title}</span>
                        <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-1.5">{stat.val}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{stat.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Live Class Panel */}
                    <div className="bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
                      {(() => {
                        const upcomingSession = liveSessions.find(s => enrolledCourseIds.includes(s.courseId) && s.status !== 'completed') || liveSessions.find(s => s.status !== 'completed');
                        
                        if (!upcomingSession) {
                          return (
                            <div className="flex flex-col h-full items-center justify-center text-center space-y-2">
                              <VideoIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                              <p className="text-xs font-bold text-slate-400">No upcoming live classes</p>
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="space-y-3">
                              <h3 className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500">Upcoming Live Class</h3>
                              <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                  <VideoIcon className="w-5 h-5 text-rose-500" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{upcomingSession.title}</h4>
                                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">By {upcomingSession.mentorName} • {upcomingSession.date} @ {upcomingSession.startTime}</p>
                                </div>
                              </div>
                            </div>
                            <button
                              disabled={upcomingSession.status !== 'live'}
                              onClick={() => {
                                joinLiveSession(upcomingSession.id);
                                triggerConfetti();
                              }}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 mt-4 ${
                                upcomingSession.status === 'live' 
                                  ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer animate-pulse'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {upcomingSession.status === 'live' ? 'Join Live Meeting' : 'Waiting for Mentor...'}
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    {/* Right Side: AI Resume Job Matcher Widget */}
                    <div className="bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            <span>🤖 AI Job Matcher (LinkedIn & Naukri)</span>
                          </h3>
                          <span className="text-[9px] bg-blue-500/10 text-blue-500 font-extrabold px-2 py-0.5 rounded-full">Live Auto-Search</span>
                        </div>

                        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 truncate max-w-[180px]">
                              <span>📄</span> {resumeFileName ? resumeFileName : 'Upload Resume to Find Jobs'}
                            </span>
                            <label className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0">
                              {isAnalyzingResume ? 'Scanning...' : resumeFileName ? 'Change Resume' : 'Upload Resume'}
                              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                            </label>
                          </div>

                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {resumeFileName 
                              ? '✅ Skills parsed & matched with open postings from LinkedIn & Naukri.com'
                              : 'Upload CV (.pdf/.doc/.docx). AI will parse your skills & search LinkedIn & Naukri.com'}
                          </p>
                        </div>

                        {/* Top Matched Jobs Preview */}
                        <div className="space-y-2 mt-3">
                          {ALL_MATCHED_JOBS.slice(0, 2).map((job) => (
                            <div key={job.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-extrabold text-blue-600 dark:text-blue-400 text-xs shrink-0">
                                  {job.company[0]}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{job.title}</h4>
                                  <p className="text-[10px] text-slate-400 truncate">{job.company} • <span className="text-emerald-500 font-bold">{job.matchScore}% Match</span></p>
                                </div>
                              </div>
                              <a
                                href={job.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shrink-0 flex items-center gap-1"
                              >
                                Apply ({job.source})
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>


                      <button
                        onClick={() => setActiveTab('jobs')}
                        className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        View All Matched Jobs (LinkedIn & Naukri.com)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Leaderboard Panel & Recent Assignments */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mini Leaderboard */}
                    <div className="bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500">Leaderboard Standings</h3>
                      <div className="space-y-2.5">
                        {[...leaderboard].sort((a, b) => b.xp - a.xp).map((item, idx) => (
                          <div key={item.studentId} className={`flex items-center justify-between p-2.5 rounded-xl border ${item.studentId === currentUser.id ? 'bg-blue-50/20 border-blue-200/80 dark:bg-blue-950/20 dark:border-blue-900/60' : 'border-transparent'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold w-5 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</span>
                              <img src={item.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{item.studentName}</h4>
                                <div className="flex gap-1 mt-0.5">
                                  {item.badges.slice(0, 1).map((b, bIdx) => (
                                    <span key={bIdx} className="text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">{b}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-blue-500">{item.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini Assignments */}
                    <div className="bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500">Assignments & Due Dates</h3>
                      <div className="space-y-3">
                        {assignments.filter(ass => enrolledCourseIds.includes(ass.courseId)).map((ass) => {
                          const sub = submissions.find(s => s.assignmentId === ass.id && s.studentId === currentUser.id);
                          return (
                            <div key={ass.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900">
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{ass.title}</h4>
                                <p className="text-[9px] text-slate-400">Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                              </div>
                              {sub ? (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sub.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                  {sub.status === 'evaluated' ? `Graded: ${sub.score}/100` : 'Pending Grade'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCourseId(ass.courseId);
                                    setActiveTab('courses');
                                    setClassroomTab('assignments');
                                  }}
                                  className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl cursor-pointer"
                                >
                                  Submit
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT TAB: ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Assignments Upload</h2>
                      <p className="text-xs text-slate-400 mt-1">Submit your coursework in PDF format for mentor evaluation.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {assignments.filter(a => enrolledCourseIds.includes(a.courseId) || a.courseId === selectedCourseId).length === 0 ? (
                      <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Assignments Available</h3>
                        <p className="text-xs text-slate-400 mt-1">Your mentors have not uploaded any assignments for your enrolled courses yet.</p>
                      </div>
                    ) : (
                      assignments.filter(a => enrolledCourseIds.includes(a.courseId) || a.courseId === selectedCourseId).map((ass) => {
                        const sub = submissions.find(s => s.assignmentId === ass.id && s.studentId === currentUser.id);
                        return (
                          <div key={ass.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                  {courses.find(c => c.id === ass.courseId)?.title || 'Enrolled Course'}
                                </span>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white pt-1">{ass.title}</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{ass.description}</p>
                                <div className="flex gap-4 mt-2">
                                  <span className="text-[10px] text-slate-400">Points: <strong className="text-slate-600 dark:text-slate-300">{ass.points}</strong></span>
                                  <span className="text-[10px] text-slate-400">Due: <strong className="text-slate-600 dark:text-slate-300">{new Date(ass.dueDate).toLocaleDateString()}</strong></span>
                                </div>
                              </div>

                              {sub ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                    sub.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {sub.status === 'evaluated' ? `Graded: ${sub.score}/100` : 'Waiting for grading'}
                                  </span>
                                  {sub.fileUrl && (
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/50"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      View Submitted PDF
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAssignmentSubmittingId(ass.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
                                >
                                  Submit Assignment
                                </button>
                              )}
                            </div>

                            {/* Submit Upload Fields Box */}
                            {assignmentSubmittingId === ass.id && (
                              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-3">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Provide Submission File (PDF Format Only - .pdf)</span>
                                <div className="flex flex-col gap-2">
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      onChange={(e) => handleFileUpload(e, setSubmittingFileUrl, undefined, true)}
                                      className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                    />
                                    {isUploading && (
                                      <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center rounded-xl">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Attached File Preview Badge */}
                                  {submittingFileUrl && !isUploading && (
                                    <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                      <div className="flex items-center gap-2 truncate">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="truncate">PDF Attached Successfully</span>
                                      </div>
                                      <a
                                        href={submittingFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] underline text-blue-500 hover:text-blue-600 shrink-0 ml-2"
                                      >
                                        View PDF
                                      </a>
                                    </div>
                                  )}

                                  <p className="text-[10px] text-slate-400 font-medium px-2">OR</p>
                                  <input
                                    type="text"
                                    placeholder="https://github.com/your-username/my-project"
                                    value={submittingFileUrl}
                                    onChange={(e) => setSubmittingFileUrl(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                  />

                                  <button
                                    onClick={() => {
                                      if (!submittingFileUrl.trim()) return;
                                      submitAssignment(ass.id, submittingFileUrl);
                                      setAssignmentSubmittingId(null);
                                      setSubmittingFileUrl('');
                                      triggerConfetti();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Score & Review display */}
                            {sub && sub.status === 'evaluated' && (
                              <div className="p-3 bg-emerald-50/10 border border-emerald-500/10 rounded-2xl text-[11px] space-y-1">
                                <span className="font-bold text-emerald-500 uppercase text-[9px]">Mentor Feedback</span>
                                <p className="text-slate-600 dark:text-slate-300">"{sub.feedback}"</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* STUDENT TAB: TESTS */}
              {activeTab === 'tests' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tests & Quizzes</h2>
                      <p className="text-xs text-slate-400 mt-1">Take interactive practice quizzes and timed assessment tests.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tests.filter(t => enrolledCourseIds.includes(t.courseId) || t.courseId === selectedCourseId).length === 0 ? (
                      <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
                        <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Tests Available</h3>
                        <p className="text-xs text-slate-400 mt-1">Your mentors have not created any quizzes or tests for your enrolled courses yet.</p>
                      </div>
                    ) : (
                      tests.filter(t => enrolledCourseIds.includes(t.courseId) || t.courseId === selectedCourseId).map((test) => {
                        const sub = testSubmissions.find(s => s.testId === test.id && s.studentId === currentUser.id);
                        return (
                          <div key={test.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                {courses.find(c => c.id === test.courseId)?.title || 'Enrolled Course'}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white pt-1">{test.title}</h4>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{test.description}</p>
                              <div className="flex gap-4 text-[10px] text-slate-400 mt-2">
                                <span>Questions: <strong className="text-slate-600 dark:text-slate-300">{test.totalQuestions}</strong></span>
                                <span>Points: <strong className="text-slate-600 dark:text-slate-300">{test.totalPoints}</strong></span>
                                <span>Time: <strong className="text-slate-600 dark:text-slate-300">{test.durationMinutes} mins</strong></span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {sub ? (
                                <div className="text-right space-y-1">
                                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full block w-fit ml-auto">
                                    Completed
                                  </span>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 pt-1">
                                    Score: {sub.score} / {test.totalPoints} pts
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveTestTakingId(test.id);
                                    setCurrentQuestionIndex(0);
                                    setSelectedAnswers({});
                                    setQuizTimeRemaining(test.durationMinutes * 60);
                                  }}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/15 cursor-pointer"
                                >
                                  Take Quiz / Test
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* STUDENT TAB: MY COURSES */}
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  {/* Dashboard Profile Header */}
                  <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-800" />
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Welcome back, {currentUser.fullName}!</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">Ready to continue your learning journey?</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsProfileModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Edit Profile
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Classrooms</h2>
                    <span className="text-xs font-semibold text-slate-400">Enrollments ({enrolledCourseIds.length})</span>
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dedupeCourses(courses).map((course) => {
                      const isEnrolled = enrolledCourseIds.includes(course.id);
                      const isUpcoming = isUpcomingCourse(course.id) || isUpcomingCourse(course.title);
                      return (
                        <div key={course.id} className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                          <div>
                            <div className="relative h-48 overflow-hidden bg-slate-950">
                              <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105" />
                              {isUpcoming && (
                                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-lg">
                                  🚀 Coming Soon
                                </div>
                              )}
                            </div>
                            <div className="p-5 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{course.category}</span>
                                <span className="text-[10px] font-bold text-slate-400">{course.duration}</span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{course.title}</h3>
                              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>
                            </div>
                          </div>

                          <div className="p-5 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                            {isEnrolled && !isUpcoming ? (
                              <button
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setClassroomTab('notes');
                                  setActiveTab('classroom-detail');
                                }}
                                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/15 cursor-pointer text-center"
                              >
                                Enter Classroom
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between gap-4">
                                <div>
                                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                    isUpcoming 
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {isUpcoming ? '⏳ 30% Off Waitlist' : '⚡ 100% Free Access'}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (isUpcoming) {
                                      setUpcomingModalCourse(course.id);
                                      return;
                                    }
                                    if (isAuthenticated) {
                                      await enrollInCourse(course.id);
                                      setSelectedCourseId(course.id);
                                      setClassroomTab('notes');
                                      setActiveTab('classroom-detail');
                                    } else {
                                      window.location.href = `/login/student?redirect=/portal?enroll=${course.id}`;
                                    }
                                  }}
                                  className={`px-4 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer ml-auto flex items-center gap-1.5 ${
                                    isUpcoming 
                                      ? 'bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400' 
                                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                  }`}
                                >
                                  <span>{isUpcoming ? 'Join Waitlist' : 'Start Learning Free'}</span>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STUDENT TAB: CLASSROOM WORKSPACE (Primary View for Granted Students) */}
              {(activeTab === 'classroom-detail' || (currentUser?.role === 'student' && ['live', 'notes', 'leaderboard'].includes(activeTab))) && (
                <div className="space-y-6">
                  {/* Classroom Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-1.5 z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <Sparkles className="w-3.5 h-3.5" /> 🎓 Live Student Classroom • Granted Access
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">{selectedCourse.title}</h2>
                      <p className="text-xs text-blue-100 font-medium">
                        Instructor: {selectedCourse.mentorName} • Category: {selectedCourse.category} • Full Access Active
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('courses')}
                      className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-2xl border border-white/20 cursor-pointer shadow-sm transition-all z-10"
                    >
                      Switch Course
                    </button>
                  </div>

                  {/* Classroom navigation sub-tabs */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none gap-2">
                    {[
                      { id: 'notes', name: 'Study Notes' },
                      { id: 'assignments', name: 'Assignments' },
                      { id: 'live', name: 'Live Classes' },
                      { id: 'tests', name: 'Quizzes & Tests' },
                      { id: 'leaderboard', name: 'Leaderboard' },
                      { id: 'attendance', name: 'Attendance' },
                      { id: 'progress', name: 'Progress Tracker' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setClassroomTab(tab.id as any)}
                        className={`pb-3 px-4 text-xs font-bold shrink-0 transition-all border-b-2 ${
                          classroomTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {/* Classroom Subview: Notes */}
                  {classroomTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex max-w-md">
                        <input
                          type="text"
                          placeholder="Search notes, slides or transcripts..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notes.filter(n => n.courseId === selectedCourseId).map((note) => (
                          <div key={note.id} className={`p-5 rounded-2xl border shadow-sm flex items-start justify-between gap-4 transition-all ${
                            note.isHandwritten || note.isAiGenerated
                              ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900 border-amber-500/30'
                              : 'bg-white dark:bg-[#0f1420] border-slate-200/60 dark:border-slate-800/80'
                          }`}>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white">{note.title}</h4>
                                {(note.isHandwritten || note.isAiGenerated) && (
                                  <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    ✍️ AI Handwritten
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">{note.description}</p>
                              <span className="text-[9px] text-slate-400/80 mt-1 block">Size: {note.fileSize}</span>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {(note.isHandwritten || note.isAiGenerated) ? (
                                <button
                                  onClick={() => setSelectedHandwrittenNote(note)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>View Notebook</span>
                                </button>
                              ) : (
                                <button
                                  onClick={triggerConfetti}
                                  className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                  <Download className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classroom Subview: Assignments */}
                  {classroomTab === 'assignments' && (
                    <div className="space-y-4">
                      {assignments.filter(a => a.courseId === selectedCourseId).map((ass) => {
                        const sub = submissions.find(s => s.assignmentId === ass.id && s.studentId === currentUser.id);
                        return (
                          <div key={ass.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{ass.title}</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{ass.description}</p>
                                <div className="flex gap-4 mt-2">
                                  <span className="text-[10px] text-slate-400">Points: <strong className="text-slate-600 dark:text-slate-300">{ass.points}</strong></span>
                                  <span className="text-[10px] text-slate-400">Due: <strong className="text-slate-600 dark:text-slate-300">{new Date(ass.dueDate).toLocaleDateString()}</strong></span>
                                </div>
                              </div>

                              {sub ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                    sub.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {sub.status === 'evaluated' ? `Graded: ${sub.score}/100` : 'Waiting for grading'}
                                  </span>
                                  {sub.fileUrl && (
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/50"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      View Submitted PDF
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAssignmentSubmittingId(ass.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
                                >
                                  Submit Assignment
                                </button>
                              )}
                            </div>

                            {/* Submit Upload Fields Box */}
                            {assignmentSubmittingId === ass.id && (
                              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-3">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Provide Submission File (PDF Format Only - .pdf)</span>
                                <div className="flex flex-col gap-2">
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      onChange={(e) => handleFileUpload(e, setSubmittingFileUrl, undefined, true)}
                                      className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                    />
                                    {isUploading && (
                                      <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center rounded-xl">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Attached File Preview Badge */}
                                  {submittingFileUrl && !isUploading && (
                                    <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                      <div className="flex items-center gap-2 truncate">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="truncate">PDF Attached Successfully</span>
                                      </div>
                                      <a
                                        href={submittingFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] underline text-blue-500 hover:text-blue-600 shrink-0 ml-2"
                                      >
                                        View PDF
                                      </a>
                                    </div>
                                  )}

                                  <p className="text-[10px] text-slate-400 font-medium px-2">OR</p>
                                  <input
                                    type="text"
                                    placeholder="https://github.com/your-username/my-project"
                                    value={submittingFileUrl}
                                    onChange={(e) => setSubmittingFileUrl(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                                  />

                                  <button
                                    onClick={() => {
                                      if (!submittingFileUrl.trim()) return;
                                      submitAssignment(ass.id, submittingFileUrl);
                                      setAssignmentSubmittingId(null);
                                      setSubmittingFileUrl('');
                                      triggerConfetti();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Score & Review display */}
                            {sub && sub.status === 'evaluated' && (
                              <div className="p-3 bg-emerald-50/10 border border-emerald-500/10 rounded-2xl text-[11px] space-y-1">
                                <span className="font-bold text-emerald-500 uppercase text-[9px]">Mentor Feedback</span>
                                <p className="text-slate-600 dark:text-slate-300">"{sub.feedback}"</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Classroom Subview: Live Classes */}
                  {classroomTab === 'live' && (
                    <div className="space-y-4">
                      {liveSessions.filter(s => s.courseId === selectedCourseId && s.status !== 'completed').map((session) => {
                        const isAttended = attendance.some(a => a.liveSessionId === session.id && a.studentId === currentUser.id);
                        return (
                          <div key={session.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex items-center justify-between gap-6 flex-wrap md:flex-nowrap">
                            <div className="space-y-2">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white">{session.title}</h4>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{session.description}</p>
                              <div className="flex gap-4 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{session.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{session.startTime}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{session.duration} mins</span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                              {isAttended && (
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                  Attended
                                </span>
                              )}
                              <button disabled={session.status !== 'live'} onClick={() => { joinLiveSession(session.id); triggerConfetti(); }} className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer shrink-0 transition-all ${session.status === 'live' ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}> {session.status === 'live' ? 'Join Live Class' : 'Waiting for Mentor...'} </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Saved Live Class Recordings Section */}
                      <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                              <VideoIcon className="w-4 h-4 text-emerald-500" />
                              📹 Saved Live Class Recordings
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {(currentUser as any)?.role === 'mentor' 
                                ? 'Official live class recordings stored in website. Only mentors can download these files.'
                                : 'Live lecture recordings stored in website. Downloads are restricted to mentors.'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {(currentUser as any)?.role === 'mentor' ? '👨‍🏫 Mentor Downloads Available' : '🔒 Student View Only'}
                          </span>
                        </div>

                        {savedRecordings.length === 0 ? (
                          <div className="p-8 text-center bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl text-slate-500 text-xs font-medium">
                            No recorded live sessions saved yet. Mentors can start web recording during any active live lecture.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {savedRecordings.map((rec) => (
                              <div key={rec.id} className="p-4 rounded-2xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">{rec.sessionTitle}</h4>
                                    <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                                      {rec.fileSize}
                                    </span>
                                  </div>
                                  <div className="flex gap-4 text-[10px] text-slate-400">
                                    <span>Recorded by: <strong className="text-slate-300">{rec.mentorName}</strong></span>
                                    <span>Date: {new Date(rec.recordedAt).toLocaleDateString()}</span>
                                    <span>Duration: {Math.floor(rec.durationSeconds / 60)} mins</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(currentUser as any)?.role === 'mentor' ? (
                                    <>
                                      <button
                                        onClick={() => handleDownloadRecording(rec)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download Recording (Mentor Only)</span>
                                      </button>
                                      <button
                                        onClick={() => deleteSavedLiveRecording(rec.id)}
                                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                        title="Delete Recording"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="text-[11px] font-bold text-slate-500 bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Download Restricted to Mentor</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Classroom Subview: Leaderboard */}
                  {classroomTab === 'leaderboard' && (
                    <div className="bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Classroom Leaderboard</h3>
                          <p className="text-[10px] text-slate-400">Compare your progress with peers in this course batch.</p>
                        </div>
                        <span className="text-xs font-bold text-blue-500">Updated: Realtime</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                              <th className="py-3 px-4">Name</th>
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Badges</th>
                              <th className="py-3 px-4">Attendance</th>
                              <th className="py-3 px-4">Quiz Score</th>
                              <th className="py-3 px-4">XP Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboard.map((item, idx) => (
                              <tr key={item.studentId} className={`border-b border-slate-50 dark:border-slate-900 text-xs ${item.studentId === currentUser.id ? 'bg-blue-500/5 font-semibold text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                <td className="py-4 px-4 font-bold">{idx + 1}</td>
                                <td className="py-4 px-4 flex items-center gap-3">
                                  <img src={item.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  <span>{item.studentName}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-1.5 flex-wrap">
                                    {item.badges.map((badge, bIdx) => (
                                      <span key={bIdx} className="text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full">{badge}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 px-4">{item.attendanceScore}%</td>
                                <td className="py-4 px-4">{item.testScore}%</td>
                                <td className="py-4 px-4 font-extrabold text-blue-600 dark:text-blue-400">{item.xp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Classroom Subview: Attendance */}
                  {classroomTab === 'attendance' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Summary</h3>
                        <div className="text-center py-6 space-y-2">
                          <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                            {leaderboard.find(e => e.studentId === currentUser.id)?.attendanceScore || 0}%
                          </span>
                          <p className="text-[10px] text-slate-400">Average lecture attendance rate</p>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Attendance Log</h3>
                        <div className="space-y-3">
                          {attendance.filter(a => a.studentId === currentUser.id).length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No attendance records registered yet. Join a live session to register.</p>
                          ) : (
                            attendance.filter(a => a.studentId === currentUser.id).map((att) => (
                              <div key={att.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 text-xs">
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-white">{att.lectureName}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{att.date} â€¢ {att.time}</p>
                                </div>
                                <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  {att.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Classroom Subview: Progress Tracker */}
                  {classroomTab === 'progress' && (
                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400">Learning Analytics</h3>

                      {/* Course Completion Percentage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-white">Overall Course Progress</span>
                          <span className="font-bold text-blue-500">68% Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: '68%' }} />
                        </div>
                      </div>

                      {/* Interactive Bar Chart Simulation (Vanilla HTML styles) */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Weekly learning hours</span>
                        <div className="flex justify-between items-end h-40 pt-4 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900">
                          {[
                            { day: 'Mon', hrs: 1.5, pct: '30%' },
                            { day: 'Tue', hrs: 3.0, pct: '60%' },
                            { day: 'Wed', hrs: 4.5, pct: '90%' },
                            { day: 'Thu', hrs: 2.0, pct: '40%' },
                            { day: 'Fri', hrs: 1.0, pct: '20%' },
                            { day: 'Sat', hrs: 5.0, pct: '100%' },
                            { day: 'Sun', hrs: 2.5, pct: '50%' },
                          ].map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                              <div className="w-7 bg-blue-600 rounded-t-lg transition-all duration-300" style={{ height: d.pct }} />
                              <span className="text-[9px] font-semibold text-slate-400">{d.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Classroom Subview: Quizzes & Tests */}
                  {classroomTab === 'tests' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Quizzes & Assessments</h3>
                          <p className="text-[10px] text-slate-400">Complete tests uploaded by your mentors to test your knowledge and gain XP.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tests.filter(t => t.courseId === selectedCourseId).length === 0 ? (
                          <div className="md:col-span-2 text-center py-12 text-slate-400 text-xs bg-white dark:bg-[#0f1420] rounded-3xl border border-slate-200/60 dark:border-slate-800/80">
                            No tests available for this course yet.
                          </div>
                        ) : (
                          tests.filter(t => t.courseId === selectedCourseId).map((test) => {
                            const submission = testSubmissions.find(sub => sub.testId === test.id && sub.studentId === currentUser.id);
                            return (
                              <div key={test.id} className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                        {test.durationMinutes} Mins Limit
                                      </span>
                                      {(test.isAiGenerated || test.title.includes('🤖')) && (
                                        <span className="text-[9px] font-black bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <span>🤖 AI Quiz</span>
                                        </span>
                                      )}
                                    </div>
                                    {submission ? (
                                      <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        Available
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{test.title}</h4>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{test.description}</p>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-900 text-xs">
                                  <div className="text-slate-400">
                                    Questions: <span className="font-bold text-slate-700 dark:text-slate-300">{test.totalQuestions}</span> â€¢ Points: <span className="font-bold text-slate-700 dark:text-slate-300">{test.totalPoints}</span>
                                  </div>
                                  {submission ? (
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-400">Score obtained:</span>
                                      <p className="font-extrabold text-emerald-500">{submission.score} / {test.totalPoints}</p>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startQuizTaking(test)}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/15 cursor-pointer"
                                    >
                                      Start Quiz
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STUDENT TAB: AI RESUME JOB MATCHER */}
              {activeTab === 'jobs' && (
                <div className="space-y-6">
                  {/* STEP 1: RESUME UPLOAD HERO SECTION */}
                  <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-900 pb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>STEP 1: UPLOAD YOUR RESUME</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                          AI Resume Job Search Engine (LinkedIn & Naukri.com)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                          Upload your resume (.pdf or .doc, .docx). AI will automatically scan your candidate profile, parse your core technical skills, and query open job postings from <strong className="text-blue-600 dark:text-blue-400">LinkedIn</strong> and <strong className="text-amber-500">Naukri.com</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Resume Upload Dropzone */}
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/40 hover:border-blue-500/50 transition-all group relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                            {resumeFileName ? `Uploaded: ${resumeFileName}` : 'Drag & Drop your Resume / CV here'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Supports PDF and Word documents (.pdf, .doc, .docx) only — Up to 10MB
                          </p>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                          {isAnalyzingResume ? 'Scanning Resume Content...' : resumeFileName ? 'Upload Different Resume' : 'Browse Resume File'}
                        </span>
                      </div>
                    </div>

                    {/* Multi-step AI Analysis Progress */}
                    {isAnalyzingResume && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-900 space-y-4">
                        <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          🤖 AI Resume Intelligence Engine — Analysing...
                        </h4>
                        <div className="space-y-2.5">
                          {[
                            { step: 1, label: 'Reading & parsing document structure', icon: '📄' },
                            { step: 2, label: 'Extracting technical skills & tools', icon: '⚙️' },
                            { step: 3, label: 'Detecting education & qualifications', icon: '🎓' },
                            { step: 4, label: 'Estimating experience & seniority level', icon: '💼' },
                            { step: 5, label: 'Matching with 55+ live IT job openings', icon: '🔍' },
                          ].map(({ step, label, icon }) => (
                            <div key={step} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                                analysisStep > step ? 'bg-emerald-500 text-white' :
                                analysisStep === step ? 'bg-blue-500 text-white animate-pulse' :
                                'bg-slate-100 dark:bg-slate-900 text-slate-400'
                              }`}>
                                {analysisStep > step ? '✓' : icon}
                              </div>
                              <div className="flex-1">
                                <div className={`h-1 rounded-full transition-all duration-700 ${
                                  analysisStep > step ? 'bg-emerald-500' :
                                  analysisStep === step ? 'bg-blue-400 animate-pulse' :
                                  'bg-slate-100 dark:bg-slate-800'
                                }`} />
                              </div>
                              <span className={`text-[10px] font-bold w-52 ${
                                analysisStep >= step ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                              }`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Full Resume Analysis Report — shown after analysis */}
                    {resumeFileName && !isAnalyzingResume && resumeAnalysis && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-900 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            STEP 2: AI Resume Analysis Report
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">✅ Complete</span>
                          </h4>
                          <span className="text-[10px] font-extrabold text-blue-500">{resumeAnalysis.resumeScore}/100 Score</span>
                        </div>

                        {/* Score + Strength Banner */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-3 text-center">
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{resumeAnalysis.resumeScore}%</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Resume Score</div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{resumeAnalysis.profileStrength}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Profile Strength</div>
                          </div>
                          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-3 text-center">
                            <div className="text-sm font-black text-violet-600 dark:text-violet-400">{resumeAnalysis.experienceLabel.split(' ')[0]}</div>
                            <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Level</div>
                          </div>
                        </div>

                        {/* Score Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>Profile Completeness</span>
                            <span>{resumeAnalysis.resumeScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                              style={{ width: `${resumeAnalysis.resumeScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Technical Skills */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                              Technical Skills ({resumeAnalysis.technicalSkills.length})
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeAnalysis.technicalSkills.map((skill, i) => (
                                <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold rounded-xl flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />{skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Soft Skills */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block"></span>
                              Soft Skills ({resumeAnalysis.softSkills.length})
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeAnalysis.softSkills.map((skill, i) => (
                                <span key={i} className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold rounded-xl flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />{skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Education */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                              Education Detected
                            </h5>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1">
                              <p className="text-xs font-extrabold text-slate-800 dark:text-white">{resumeAnalysis.education}</p>
                              <p className="text-[10px] text-slate-400">{resumeAnalysis.educationStream}</p>
                              <div className="flex gap-1 mt-1">
                                {resumeAnalysis.languages.map((l, i) => (
                                  <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">{l}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Experience & Certs */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                              Experience & Certifications
                            </h5>
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                              <p className="text-xs font-extrabold text-slate-800 dark:text-white">💼 {resumeAnalysis.experienceLabel}</p>
                              <div className="space-y-1">
                                {resumeAnalysis.certifications.map((cert, i) => (
                                  <p key={i} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="text-amber-500">🏅</span> {cert}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prompt to upload if no resume yet */}
                    {!resumeFileName && !isAnalyzingResume && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex items-center gap-3 text-slate-400">
                        <AlertCircle className="w-5 h-5 shrink-0 text-slate-300" />
                        <p className="text-xs">Upload your resume above — AI will analyse your skills, education & experience, then match the best IT jobs for you.</p>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: JOB OPPORTUNITIES — only shown after resume is analyzed */}
                  {resumeFileName && !isAnalyzingResume && (
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <span>STEP 3: MATCHED JOB OPPORTUNITIES</span>
                          <span className="text-xs text-blue-500 font-bold">
                            ({ALL_MATCHED_JOBS.filter(j =>
                              (jobPlatformFilter === 'all' || (jobPlatformFilter === 'linkedin' && j.source === 'LinkedIn') || (jobPlatformFilter === 'naukri' && j.source === 'Naukri.com'))
                              && (jobExperienceFilter === 'all' || j.experienceLevel === jobExperienceFilter)
                            ).length} Vacancies)
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Matched across AI/ML, IT, Data, Cloud & more — based on your resume skills</p>
                      </div>

                      {/* Filter Bar */}
                      <div className="flex flex-wrap gap-3">
                        {/* Platform Filter */}
                        <div className="flex bg-white dark:bg-[#0f1420] p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                          {(['all', 'linkedin', 'naukri'] as const).map((p) => (
                            <button key={p} onClick={() => setJobPlatformFilter(p)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                jobPlatformFilter === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}>
                              {p === 'all' ? '🌐 All Platforms' : p === 'linkedin' ? '💼 LinkedIn' : '🟠 Naukri.com'}
                            </button>
                          ))}
                        </div>

                        {/* Experience Level Filter */}
                        <div className="flex bg-white dark:bg-[#0f1420] p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                          {(['all', 'fresher', 'experienced'] as const).map((lvl) => (
                            <button key={lvl} onClick={() => setJobExperienceFilter(lvl)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                jobExperienceFilter === lvl
                                  ? lvl === 'fresher' ? 'bg-emerald-500 text-white shadow-md'
                                    : lvl === 'experienced' ? 'bg-violet-600 text-white shadow-md'
                                    : 'bg-blue-600 text-white shadow-md'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}>
                              {lvl === 'all' ? '👥 All Levels' : lvl === 'fresher' ? '🎓 Fresher (0-2 yrs)' : '🏆 Experienced (2+ yrs)'}
                            </button>
                          ))}
                        </div>
                      </div>

                    {/* Job Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ALL_MATCHED_JOBS
                        .filter(j =>
                          (jobPlatformFilter === 'all' || (jobPlatformFilter === 'linkedin' && j.source === 'LinkedIn') || (jobPlatformFilter === 'naukri' && j.source === 'Naukri.com'))
                          && (jobExperienceFilter === 'all' || j.experienceLevel === jobExperienceFilter)
                        )
                        .map((job) => (
                          <div key={job.id} className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 group relative">
                            <div className="space-y-3">
                              {/* Card Header */}
                              <div className="flex justify-between items-start gap-2">
                                <JobCardCompanyAvatar company={job.company} />
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-sm ${
                                    job.source === 'LinkedIn' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-900 font-black'
                                  }`}>
                                    {job.source}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                    {job.matchScore}% Match
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                    job.experienceLevel === 'fresher'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                                  }`}>
                                    {job.experienceLevel === 'fresher' ? '🎓 Fresher' : '🏆 Experienced'}
                                  </span>
                                </div>
                              </div>

                              {/* Job Title & Company */}
                              <div>
                                <h4 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">{job.title}</h4>
                                <p className="text-xs text-slate-500 font-bold mt-0.5">{job.company}</p>
                              </div>

                              {/* Specs */}
                              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-900">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span>📍</span>
                                  <span className="font-medium">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <span>💰</span>
                                  <span>{job.salary}</span>
                                </div>
                              </div>

                              {/* Skills Matched */}
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {job.skillsMatched.map((sk, skIdx) => (
                                  <span key={skIdx} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Direct Apply Button */}
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer group-hover:scale-[1.02]"
                            >
                              <span>Apply Directly on {job.source}</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                    </div>
                    </div>
                  )}

                </div>
              )}

              {/* COMMON TAB FOR ALL ROLES: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Account Settings</h2>
                    <p className="text-[10px] text-slate-400 mt-1">Configure your personal preferences and profile values.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <img 
                          src={editAvatarUrl} 
                          alt="Profile Preview" 
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800" 
                        />
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isSavingSettings}
                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50 transition-all cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Recommended size: 256x256px. Max size: 2MB.</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                      <button
                        onClick={saveSettings}
                        disabled={isSavingSettings}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                      >
                        {isSavingSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        onClick={resetDatabase}
                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Reset Demo Database
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* USER ROLE: MENTOR VIEWS                    */}
          {/* ========================================== */}
          {currentUser.role === 'mentor' && (
            <div className="space-y-6">
              {/* GLOBAL MENTOR COURSE SELECTOR */}
              {activeTab !== 'dashboard' && (
                <div className="p-4 rounded-3xl bg-slate-900 dark:bg-slate-950/40 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-bold">Course Workspace Manager</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Select a course to view and manage its materials, live sessions, and community.</p>
                  </div>
                  <select
                    value={mentorSelectedCourseId}
                    onChange={(e) => setMentorSelectedCourseId(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 w-full sm:w-64 cursor-pointer"
                  >
                    {dedupeCourses(courses).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* MENTOR TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Greeting */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Welcome back, {currentUser.fullName.split(" ")[0]}! 👋</h2>
                      <p className="text-xs text-slate-400 mt-1">Here is what is happening in your classrooms today.</p>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { title: 'Total Courses', val: courses.length, label: 'Active Courses' },
                      { title: 'Total Students', val: batchEnrolledCount.toLocaleString(), label: 'In Selected Batch' },
                      { title: 'Live Session Taken', val: liveSessions.length, label: 'All time' },
                      { title: 'Assignment Given', val: assignments.length, label: `${submissions.filter(s => s.status === 'submitted').length} pending review` },
                      { title: 'Avg Rating', val: `${courses.length > 0 ? (courses.reduce((acc, c) => acc + (c.rating || 5), 0) / courses.length).toFixed(1) : '5.0'}/5`, label: 'Based on student votes' },
                    ].map((metric, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-[#0f1420] border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] uppercase font-bold text-slate-400">{metric.title}</span>
                        <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{metric.val}</span>
                        <span className="text-[9px] text-slate-400 mt-1">{metric.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {/* Student Performance Chart */}
                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400">Performance Summary</h3>
                      <div className="space-y-3">
                        {[
                          { name: 'Excellent (80-100%)', count: 420, pct: '33%', color: 'bg-emerald-500' },
                          { name: 'Good (60-80%)', count: 512, pct: '41%', color: 'bg-blue-500' },
                          { name: 'Average (40-60%)', count: 238, pct: '19%', color: 'bg-amber-500' },
                          { name: 'Needs Work (<40%)', count: 75, pct: '6%', color: 'bg-rose-500' },
                        ].map((perf, i) => (
                          <div key={i} className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{perf.name}</span>
                              <span className="font-bold text-slate-800 dark:text-white">{perf.count} ({perf.pct})</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className={`${perf.color} h-full`} style={{ width: perf.pct }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming classes */}
                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4 lg:col-span-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Upcoming Live Classes</h3>
                        {currentUser?.role === 'mentor' && (
                          <button onClick={() => setActiveTab('live')} className="text-xs font-bold text-blue-500 hover:underline cursor-pointer">Create Live Session</button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {liveSessions.filter(s => s.status !== 'completed').map((session) => (
                          <div key={session.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 text-xs">
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white">{session.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{session.date} • {session.startTime} ({session.duration} mins)</p>
                            </div>
                            {session.status === 'live' ? (
                                <button
                                  onClick={() => {
                                    joinLiveSession(session.id);
                                    triggerConfetti();
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer animate-pulse"
                                >
                                  Join Live
                                </button>
                              ) : currentUser?.role === 'mentor' ? (
                                <button
                                  onClick={() => {
                                    updateLiveSessionStatus(session.id, 'live');
                                    joinLiveSession(session.id);
                                    triggerConfetti();
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Start Session
                                </button>
                              ) : (
                                <span className="px-3 py-1 rounded-lg bg-slate-200/50 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                                  Scheduled
                                </span>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* MENTOR TAB: COURSE CONTENT MANAGER (Upload Notes, Assignments, Tests) */}
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  {/* Course Manager Subtabs */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none gap-2">
                    {[
                      { id: 'notes', name: 'Upload Study Notes' },
                      { id: 'assignments', name: 'Create Assignments' },
                      { id: 'tests', name: 'Build Test Quizzes' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMentorCourseTab(tab.id as any)}
                        className={`pb-3 px-4 text-xs font-bold shrink-0 transition-all border-b-2 ${
                          mentorCourseTab === tab.id
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {/* SUBTAB: NOTES UPLOAD */}
                  {mentorCourseTab === 'notes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      {/* Upload Notes Form */}
                      <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xs uppercase font-extrabold text-slate-400">Upload Study Notes File</h3>
                          <p className="text-[10px] text-slate-500">Add PDF lectures, PPT presentations or links for students.</p>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!newNoteTitle.trim() || !newNoteFileUrl.trim()) return;
                          addNote({
                            courseId: mentorSelectedCourseId,
                            title: newNoteTitle,
                            description: newNoteDesc,
                            fileUrl: newNoteFileUrl,
                            fileSize: newNoteFileSize,
                          });
                          setNewNoteTitle('');
                          setNewNoteDesc('');
                          setNewNoteFileUrl('');
                          setNewNoteFileSize('2.5 MB');
                          triggerConfetti();
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Note Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Python Cheat Sheet.pdf"
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">File Size (e.g., 2.4 MB)</label>
                              <input
                                type="text"
                                placeholder="e.g. 1.8 MB"
                                value={newNoteFileSize}
                                onChange={(e) => setNewNoteFileSize(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Study File Link (URL)</label>
                            <div className="relative">
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, setNewNoteFileUrl, setNewNoteFileSize)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                required={!newNoteFileUrl}
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center rounded-xl">
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                </div>
                              )}
                              {newNoteFileUrl && !isUploading && (
                                <p className="text-[10px] text-emerald-600 mt-1">File uploaded successfully! ({newNoteFileSize})</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description Summary</label>
                            <textarea
                              placeholder="Describe what topic this study material covers..."
                              value={newNoteDesc}
                              onChange={(e) => setNewNoteDesc(e.target.value)}
                              className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white h-20"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                          >
                            Upload Study Note
                          </button>
                        </form>
                      </div>

                      {/* Current Notes Side List */}
                      <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Notes Published</h3>
                        <div className="space-y-3">
                          {notes.filter(n => n.courseId === mentorSelectedCourseId).length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No study notes uploaded yet.</p>
                          ) : (
                            notes.filter(n => n.courseId === mentorSelectedCourseId).map((note) => (
                              <div key={note.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs">
                                <h4 className="font-bold text-slate-800 dark:text-white truncate">{note.title}</h4>
                                <p className="text-[9px] text-slate-400 mt-1">{note.fileSize} â€¢ {note.description}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: ASSIGNMENT CREATOR */}
                  {mentorCourseTab === 'assignments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      {/* Create Assignment Form */}
                      <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xs uppercase font-extrabold text-slate-400">Publish Course Assignment</h3>
                          <p className="text-[10px] text-slate-500">Provide coursework assignments and deadlines for students.</p>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!newAssignmentTitle.trim() || !newAssignmentDueDate) return;
                          addAssignment({
                            courseId: mentorSelectedCourseId,
                            title: newAssignmentTitle,
                            description: newAssignmentDesc,
                            dueDate: new Date(newAssignmentDueDate).toISOString(),
                            points: newAssignmentPoints,
                            fileUrl: newAssignmentFileUrl || undefined,
                          });
                          setNewAssignmentTitle('');
                          setNewAssignmentDesc('');
                          setNewAssignmentPoints(100);
                          setNewAssignmentDueDate('');
                          setNewAssignmentFileUrl('');
                          triggerConfetti();
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Assignment Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Pandas Dataframe Wrangling"
                                value={newAssignmentTitle}
                                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Due Date</label>
                              <input
                                type="datetime-local"
                                value={newAssignmentDueDate}
                                onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Points Value</label>
                            <input
                              type="number"
                              value={newAssignmentPoints}
                              onChange={(e) => setNewAssignmentPoints(parseInt(e.target.value))}
                              className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Assignment Guidelines</label>
                            <textarea
                              placeholder="Write homework requirements, submission links, instructions..."
                              value={newAssignmentDesc}
                              onChange={(e) => setNewAssignmentDesc(e.target.value)}
                              className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white h-20"
                            />
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Optional File Attachment</label>
                            <div className="relative">
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, setNewAssignmentFileUrl)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center rounded-xl">
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                </div>
                              )}
                              {newAssignmentFileUrl && !isUploading && (
                                <p className="text-[10px] text-emerald-600 mt-1">File attached successfully!</p>
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                          >
                            Publish Assignment
                          </button>
                        </form>
                      </div>

                      {/* Current Assignments Side List */}
                      <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Assignments Set</h3>
                        <div className="space-y-3">
                          {assignments.filter(a => a.courseId === mentorSelectedCourseId).length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No assignments published yet.</p>
                          ) : (
                            assignments.filter(a => a.courseId === mentorSelectedCourseId).map((ass) => (
                              <div key={ass.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs">
                                <h4 className="font-bold text-slate-800 dark:text-white truncate">{ass.title}</h4>
                                <p className="text-[9px] text-slate-400 mt-1">Max Points: {ass.points} â€¢ Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: TEST QUIZ BUILDER */}
                  {mentorCourseTab === 'tests' && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      {/* Test Creator Panel */}
                      <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-xs uppercase font-extrabold text-slate-400">Test Quiz Designer</h3>
                          <p className="text-[10px] text-slate-500">Design a custom test, add multiple choice questions, and publish.</p>
                        </div>

                        {/* Test details form */}
                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-900 pb-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Test Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Basic Calculus for AI"
                                value={newTestTitle}
                                onChange={(e) => setNewTestTitle(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Duration Limit (mins)</label>
                              <input
                                type="number"
                                value={newTestDuration}
                                onChange={(e) => setNewTestDuration(parseInt(e.target.value))}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description Summary</label>
                            <input
                              type="text"
                              placeholder="Describe what curriculum this test covers..."
                              value={newTestDesc}
                              onChange={(e) => setNewTestDesc(e.target.value)}
                              className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Interactive Dynamic Question Builder Section */}
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 p-5 rounded-2xl">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white flex justify-between items-center">
                            <span>Add Question Builder</span>
                            <span className="text-[10px] text-slate-400 font-medium">({builderQuestionsList.length} questions built)</span>
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Question Content</label>
                              <input
                                type="text"
                                placeholder="What is the derivative of x^2?"
                                value={qBuilderText}
                                onChange={(e) => setQBuilderText(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Option A</label>
                                <input
                                  type="text"
                                  value={qBuilderOptA}
                                  onChange={(e) => setQBuilderOptA(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Option B</label>
                                <input
                                  type="text"
                                  value={qBuilderOptB}
                                  onChange={(e) => setQBuilderOptB(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Option C</label>
                                <input
                                  type="text"
                                  value={qBuilderOptC}
                                  onChange={(e) => setQBuilderOptC(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Option D</label>
                                <input
                                  type="text"
                                  value={qBuilderOptD}
                                  onChange={(e) => setQBuilderOptD(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Correct Answer</label>
                                <select
                                  value={qBuilderCorrect}
                                  onChange={(e) => setQBuilderCorrect(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                >
                                  <option value="A">Option A</option>
                                  <option value="B">Option B</option>
                                  <option value="C">Option C</option>
                                  <option value="D">Option D</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Points Value</label>
                                <input
                                  type="number"
                                  value={qBuilderPoints}
                                  onChange={(e) => setQBuilderPoints(parseInt(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!qBuilderText.trim() || !qBuilderOptA.trim() || !qBuilderOptB.trim()) return;
                              
                              // Determine correct answer text
                              let ansText = qBuilderOptA;
                              if (qBuilderCorrect === 'B') ansText = qBuilderOptB;
                              if (qBuilderCorrect === 'C') ansText = qBuilderOptC;
                              if (qBuilderCorrect === 'D') ansText = qBuilderOptD;

                              const newQ = {
                                questionText: qBuilderText,
                                questionType: 'mcq' as const,
                                options: [qBuilderOptA, qBuilderOptB, qBuilderOptC, qBuilderOptD].filter(Boolean),
                                correctAnswer: ansText,
                                points: qBuilderPoints,
                              };

                              setBuilderQuestionsList([...builderQuestionsList, newQ]);
                              setQBuilderText('');
                              setQBuilderOptA('');
                              setQBuilderOptB('');
                              setQBuilderOptC('');
                              setQBuilderOptD('');
                              setQBuilderCorrect('A');
                              setQBuilderPoints(10);
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                          >
                            + Save & Add Question to List
                          </button>
                        </div>

                        {/* Publish Test Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!newTestTitle.trim() || builderQuestionsList.length === 0) return;
                            createTest({
                              courseId: mentorSelectedCourseId,
                              title: newTestTitle,
                              description: newTestDesc,
                              durationMinutes: newTestDuration,
                            }, builderQuestionsList);

                            setNewTestTitle('');
                            setNewTestDesc('');
                            setNewTestDuration(15);
                            setBuilderQuestionsList([]);
                            triggerConfetti();
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                        >
                          Publish Test Quiz
                        </button>
                      </div>

                      {/* Builder Status and Existing Tests Side list */}
                      <div className="space-y-6">
                        {/* Builder Questions List */}
                        {builderQuestionsList.length > 0 && (
                          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-xs text-white space-y-3">
                            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Quiz Questions Built</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {builderQuestionsList.map((q, idx) => (
                                <div key={idx} className="p-2 bg-slate-950 rounded-xl border border-slate-850">
                                  <p className="font-bold">Q{idx + 1}: {q.questionText}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Ans: {q.correctAnswer} ({q.points} pts)</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Existing Tests */}
                        <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                          <h3 className="text-xs uppercase font-extrabold text-slate-400">Published Quizzes</h3>
                          <div className="space-y-3">
                            {tests.filter(t => t.courseId === mentorSelectedCourseId).length === 0 ? (
                              <p className="text-xs text-slate-400 py-6 text-center">No tests published yet.</p>
                            ) : (
                              tests.filter(t => t.courseId === mentorSelectedCourseId).map((test) => (
                                <div key={test.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs">
                                  <h4 className="font-bold text-slate-800 dark:text-white truncate">{test.title}</h4>
                                  <p className="text-[9px] text-slate-400 mt-1">Qs: {test.totalQuestions} â€¢ {test.durationMinutes} mins â€¢ {test.totalPoints} pts</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MENTOR TAB: STUDENTS MANAGEMENT */}
              {activeTab === 'students' && (
                <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Active Classroom Students</h2>
                    <p className="text-xs text-slate-400 mt-1">Monitor the classroom engagement, score rankings, and attendance logs.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Attendance Rate</th>
                          <th className="py-3 px-4">Average Quiz Score</th>
                          <th className="py-3 px-4">Level Experience (XP)</th>
                          <th className="py-3 px-4">Active Badges Awarded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard
                          .filter(s => s.studentId.length > 20)
                          .sort((a, b) => b.xp - a.xp)
                          .map((student, index) => (
                          <tr key={student.studentId} className="border-b border-slate-55 dark:border-slate-900 text-slate-600 dark:text-slate-300">
                            <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">#{index + 1}</td>
                            <td className="py-4 px-4 flex items-center gap-3">
                              <img src={student.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                              <span className="font-bold text-slate-800 dark:text-white">{student.studentName}</span>
                            </td>
                            <td className="py-4 px-4 font-semibold text-emerald-500">{student.attendanceScore}%</td>
                            <td className="py-4 px-4 font-semibold text-blue-500">{student.testScore}%</td>
                            <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{student.xp} XP</td>
                            <td className="py-4 px-4">
                              <div className="flex gap-1.5">
                                {student.badges.map((b, idx) => (
                                  <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold">{b}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MENTOR TAB: LIVE SESSION CREATOR */}
              {activeTab === 'live' && (
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Create Live Session Form */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">Create Live Session</h2>
                      <p className="text-[10px] text-slate-400 mt-1">Schedule an online interactive lecture for students.</p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newSessionTitle.trim() || !newSessionDate || !newSessionTime) return;
                      createLiveSession({
                        courseId: mentorSelectedCourseId,
                        mentorName: currentUser.fullName,
                        title: newSessionTitle,
                        description: newSessionDesc,
                        date: newSessionDate,
                        startTime: newSessionTime,
                        duration: newSessionDuration,
                        platform: 'in_app',
                          meetingLink: 'auto-generated',
                        fileUrl: newSessionFileUrl || undefined,
                      });
                      setNewSessionTitle('');
                      setNewSessionDesc('');
                                            setNewSessionFileUrl('');
                      triggerConfetti();
                    }} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Course Classroom</label>
                        <select
                          value={mentorSelectedCourseId}
                          onChange={(e) => setMentorSelectedCourseId(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                        >
                          {dedupeCourses(courses).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Session Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Backpropagation Live Class"
                            value={newSessionTitle}
                            onChange={(e) => setNewSessionTitle(e.target.value)}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                            required
                          />
                        </div>
                        
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description</label>
                        <textarea
                          placeholder="Provide syllabus notes or reference links..."
                          value={newSessionDesc}
                          onChange={(e) => setNewSessionDesc(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white h-20"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Date</label>
                          <input
                            type="date"
                            value={newSessionDate}
                            onChange={(e) => setNewSessionDate(e.target.value)}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Start Time</label>
                          <input
                            type="time"
                            value={newSessionTime}
                            onChange={(e) => setNewSessionTime(e.target.value)}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Duration (mins)</label>
                          <input
                            type="number"
                            value={newSessionDuration}
                            onChange={(e) => setNewSessionDuration(parseInt(e.target.value))}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                          />
                        </div>
                      </div>

                      <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Optional Class Materials</label>
                        <div className="relative">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, setNewSessionFileUrl)}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                          />
                          {isUploading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center rounded-xl">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            </div>
                          )}
                          {newSessionFileUrl && !isUploading && (
                            <p className="text-[10px] text-emerald-600 mt-1">Material attached successfully!</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        Create Session
                      </button>
                    </form>
                  </div>

                  {/* Scheduled list on side */}
                  <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs uppercase font-extrabold text-slate-400">Scheduled Sessions</h3>
                    <div className="space-y-3">
                      {liveSessions.filter(s => s.courseId === mentorSelectedCourseId).map((session) => (
                        <div key={session.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs space-y-1">
                          <h4 className="font-bold text-slate-800 dark:text-white">{session.title}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-bold uppercase">{session.platform}</span>
                          <p className="text-[10px] text-slate-400">{session.date} @ {session.startTime}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MENTOR TAB: ASSIGNMENTS & TESTS EVALUATION REVIEW */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Evaluate Student Submissions</h2>
                      <p className="text-xs text-slate-400 mt-1">Filter by course and review student uploaded assignments and completed tests.</p>
                    </div>

                    {/* Course Filter Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold shrink-0">Filter Course:</span>
                      <select
                        value={mentorSelectedCourseId}
                        onChange={(e) => setMentorSelectedCourseId(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-blue-500"
                      >
                        <option value="all">All Enrolled Courses</option>
                        {dedupeCourses(courses).map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sub-Tab Navigation for Assignments vs Tests */}
                  <div className="flex gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                    <button
                      onClick={() => setMentorEvalTab('assignments')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        mentorEvalTab === 'assignments'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Uploaded Assignments ({
                        submissions.filter(sub => {
                          if (mentorSelectedCourseId === 'all') return true;
                          const ass = assignments.find(a => a.id === sub.assignmentId);
                          return ass?.courseId === mentorSelectedCourseId;
                        }).length
                      })
                    </button>

                    <button
                      onClick={() => setMentorEvalTab('tests')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        mentorEvalTab === 'tests'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Completed Tests & Quizzes ({
                        testSubmissions.filter(sub => {
                          if (mentorSelectedCourseId === 'all') return true;
                          const test = tests.find(t => t.id === sub.testId);
                          return test?.courseId === mentorSelectedCourseId;
                        }).length
                      })
                    </button>
                  </div>

                  {/* TAB 1: UPLOADED ASSIGNMENTS */}
                  {mentorEvalTab === 'assignments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400">Student Assignment Submissions</h3>
                        {submissions.filter(sub => {
                          if (mentorSelectedCourseId === 'all') return true;
                          const ass = assignments.find(a => a.id === sub.assignmentId);
                          return ass?.courseId === mentorSelectedCourseId;
                        }).length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs">No student assignment submissions found for this filter.</div>
                        ) : (
                          submissions.filter(sub => {
                            if (mentorSelectedCourseId === 'all') return true;
                            const ass = assignments.find(a => a.id === sub.assignmentId);
                            return ass?.courseId === mentorSelectedCourseId;
                          }).map((sub) => {
                            const ass = assignments.find(a => a.id === sub.assignmentId);
                            const course = courses.find(c => c.id === ass?.courseId);
                            const student = getStudentInfo(sub.studentId);
                            return (
                              <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 flex justify-between items-center text-xs gap-4 flex-wrap sm:flex-nowrap">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                      {course?.title || 'Course'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ass?.title || 'Assignment'}</h4>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <img src={student.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                      Student: <strong className="text-blue-600 dark:text-blue-400">{student.name}</strong>
                                    </span>
                                  </div>
                                  {sub.fileUrl && (
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1.5 mt-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/50 w-fit"
                                    >
                                      <FileText className="w-3.5 h-3.5" /> View Submitted PDF
                                    </a>
                                  )}
                                </div>

                                <div className="shrink-0 flex items-center gap-3">
                                  {sub.status === 'evaluated' ? (
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full block">
                                        Graded: {sub.score}/100
                                      </span>
                                      {sub.feedback && (
                                        <p className="text-[10px] text-slate-400 max-w-xs truncate mt-1">"{sub.feedback}"</p>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEvaluatingSubId(sub.id);
                                        setEvaluationScore(95);
                                        setEvaluationFeedback('');
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
                                    >
                                      Grade Submission
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Evaluation Form panel */}
                      {evaluatingSubId && (
                        <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs uppercase font-extrabold text-slate-400">Grading Panel</h3>
                            <button onClick={() => setEvaluatingSubId(null)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Score (0 - 100)</label>
                              <input
                                type="number"
                                value={evaluationScore}
                                onChange={(e) => setEvaluationScore(parseInt(e.target.value))}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Feedback Comments</label>
                              <textarea
                                placeholder="e.g. Excellent work, great formatting and analysis."
                                value={evaluationFeedback}
                                onChange={(e) => setEvaluationFeedback(e.target.value)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white h-24"
                              />
                            </div>
                            <button
                              onClick={() => {
                                evaluateSubmission(evaluatingSubId, evaluationScore, evaluationFeedback);
                                setEvaluatingSubId(null);
                                triggerConfetti();
                              }}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                            >
                              Submit Evaluation
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: COMPLETED TESTS */}
                  {mentorEvalTab === 'tests' && (
                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400">Student Completed Tests & Quizzes</h3>
                      {testSubmissions.filter(sub => {
                        if (mentorSelectedCourseId === 'all') return true;
                        const test = tests.find(t => t.id === sub.testId);
                        return test?.courseId === mentorSelectedCourseId;
                      }).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">No completed student tests found for this filter.</div>
                      ) : (
                        testSubmissions.filter(sub => {
                          if (mentorSelectedCourseId === 'all') return true;
                          const test = tests.find(t => t.id === sub.testId);
                          return test?.courseId === mentorSelectedCourseId;
                        }).map((sub) => {
                          const test = tests.find(t => t.id === sub.testId);
                          const course = courses.find(c => c.id === test?.courseId);
                          const student = getStudentInfo(sub.studentId);
                          const maxScore = test?.totalPoints || 100;
                          const percentage = Math.round((sub.score / maxScore) * 100);
                          return (
                            <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 flex justify-between items-center text-xs gap-4 flex-wrap sm:flex-nowrap">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    {course?.title || 'Course'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Completed: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recently'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{test?.title || 'Quiz / Test'}</h4>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <img src={student.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Student: <strong className="text-emerald-600 dark:text-emerald-400">{student.name}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 text-right space-y-1">
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full block w-fit ml-auto">
                                  Verified Result
                                </span>
                                <p className="text-sm font-black text-slate-800 dark:text-white pt-1">
                                  Score: {sub.score} / {maxScore} pts ({percentage}%)
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* USER ROLE: ADMIN VIEWS                     */}
          {/* ========================================== */}
          {currentUser.role === 'admin' && (
            <div className="space-y-6">
              {/* ADMIN TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Admin Dashboard Console</h2>
                    <p className="text-xs text-slate-400 mt-1">Configure site parameters, analyze transaction reports, and manage leads.</p>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'Total Revenue', val: 'â‚¹1,44,970', desc: 'All courses billing', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
                      { title: 'Total Registrations', val: '1,834', desc: 'Students + Mentors', icon: UsersIcon, color: 'text-blue-500 bg-blue-500/10' },
                      { title: 'Active Courses', val: courses.length, desc: 'Educational products', icon: BookOpen, color: 'text-violet-500 bg-violet-500/10' },
                      { title: 'Leads Received', val: leads.length, desc: 'Contact enquiries', icon: UsersIcon, color: 'text-amber-500 bg-amber-500/10' },
                    ].map((m, i) => {
                      const Icon = m.icon;
                      return (
                        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#0f1420] border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{m.title}</span>
                            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{m.val}</h3>
                            <p className="text-[10px] text-slate-400">{m.desc}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Revenue Growth chart and Activity Log */}
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4 lg:col-span-2">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400">Monthly Revenue Stream</h3>
                      <div className="flex justify-between items-end h-40 pt-4 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900">
                        {[
                          { month: 'Jan', val: '20%' },
                          { month: 'Feb', val: '35%' },
                          { month: 'Mar', val: '45%' },
                          { month: 'Apr', val: '30%' },
                          { month: 'May', val: '60%' },
                          { month: 'Jun', val: '80%' },
                          { month: 'Jul', val: '100%' },
                        ].map((m, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-8 bg-emerald-500 rounded-t-lg transition-all duration-300" style={{ height: m.val }} />
                            <span className="text-[9px] font-semibold text-slate-400">{m.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                      <h3 className="text-xs uppercase font-extrabold text-slate-400">Recent Transactions</h3>
                      <div className="space-y-3">
                        {payments.slice(0, 3).map((pay) => (
                          <div key={pay.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="truncate max-w-[120px] text-slate-800 dark:text-white">{pay.courseTitle}</span>
                              <span className="text-blue-500">â‚¹{pay.amount}</span>
                            </div>
                            <p className="text-[9px] text-slate-400">Status: {pay.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: COURSE CREATOR MANAGER */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Create course form */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-white">Create Course Program</h2>
                      <p className="text-[10px] text-slate-400 mt-1">Publish a brand new educational course offering.</p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCourseTitle.trim() || !newCoursePrice) return;
                      addCourse({
                        title: newCourseTitle,
                        description: newCourseDesc,
                        category: newCourseCategory,
                        price: newCoursePrice,
                        originalPrice: newCoursePrice * 2.5,
                        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400',
                        mentorName: 'Rahul Verma',
                        duration: '100+ Hours',
                        curriculum: newCourseCurriculum.split(',').map(s => s.trim()),
                      });
                      setNewCourseTitle('');
                      setNewCourseDesc('');
                      setNewCourseCurriculum('Intro, Core Concepts, Advanced Building, Capstone Project');
                      triggerConfetti();
                    }} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Course Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Agentic LLM Architectures"
                          value={newCourseTitle}
                          onChange={(e) => setNewCourseTitle(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Price (₹)</label>
                          <input
                            type="number"
                            value={newCoursePrice}
                            onChange={(e) => setNewCoursePrice(parseInt(e.target.value))}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                          <select
                            value={newCourseCategory}
                            onChange={(e) => setNewCourseCategory(e.target.value)}
                            className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="Generative AI">Generative AI</option>
                            <option value="Data Science">Data Science</option>
                            <option value="AI & ML">AI & ML</option>
                            <option value="Data Analyst">Data Analyst</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                        <textarea
                          placeholder="Overview of the syllabus and features..."
                          value={newCourseDesc}
                          onChange={(e) => setNewCourseDesc(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white h-20"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Curriculum (comma separated)</label>
                        <input
                          type="text"
                          value={newCourseCurriculum}
                          onChange={(e) => setNewCourseCurriculum(e.target.value)}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        Publish Course
                      </button>
                    </form>
                  </div>

                  {/* Course list side */}
                  <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs uppercase font-extrabold text-slate-400">Current Catalog ({courses.length})</h3>
                    <div className="space-y-3">
                      {dedupeCourses(courses).map((c) => (
                        <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs">
                          <h4 className="font-bold text-slate-800 dark:text-white">{c.title}</h4>
                          <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                            <span>₹{c.price}</span>
                            <span>{c.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: PAYMENTS REPORT */}
              {activeTab === 'payments' && (
                <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400">Billing Log</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-3 px-4">Transaction ID</th>
                          <th className="py-3 px-4">Course Program</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Billing Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((pay) => (
                          <tr key={pay.id} className="border-b border-slate-50 dark:border-slate-900 text-slate-600 dark:text-slate-300">
                            <td className="py-4 px-4 font-mono">{pay.transactionId}</td>
                            <td className="py-4 px-4 font-semibold">{pay.courseTitle}</td>
                            <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">â‚¹{pay.amount}</td>
                            <td className="py-4 px-4">{pay.date}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                pay.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>{pay.status}</span>
                            </td>
                            <td className="py-4 px-4">
                              {pay.status === 'success' ? (
                                <button
                                  onClick={() => refundPayment(pay.id)}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                                >
                                  Refund
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No Action</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: LEAD MANAGEMENT */}
              {activeTab === 'leads' && (
                <div className="bg-white dark:bg-[#0f1420] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400">Marketing Leads</h3>
                  <div className="overflow-x-auto">
                    {leads.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-12">No leads received from the landing page contact form yet.</p>
                    ) : (
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] uppercase font-bold text-slate-400">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Contact Detail</th>
                            <th className="py-3 px-4">Interest Course</th>
                            <th className="py-3 px-4">Message Prompt</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((l) => (
                            <tr key={l.id} className="border-b border-slate-50 dark:border-slate-900 text-slate-600 dark:text-slate-300">
                              <td className="py-4 px-4 font-bold">{l.name}</td>
                              <td className="py-4 px-4 space-y-0.5">
                                <p>{l.email}</p>
                                <p className="text-[10px] text-slate-400">{l.phone}</p>
                              </td>
                              <td className="py-4 px-4">{l.courseInterest}</td>
                              <td className="py-4 px-4 max-w-[200px] truncate">{l.message}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-bold ${
                                  l.status === 'closed' ? 'bg-slate-200 text-slate-600' : l.status === 'contacted' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                                }`}>{l.status}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2">
                                  <button onClick={() => updateLeadStatus(l.id, 'contacted')} className="text-[10px] font-bold text-blue-500 hover:underline">Contact</button>
                                  <button onClick={() => updateLeadStatus(l.id, 'closed')} className="text-[10px] font-bold text-slate-400 hover:underline">Close</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* COMMON VIEW: DISCORD-STYLE COMMUNITY CHAT  */}
           {activeTab === 'community' && (() => {
            const studentEnrolledCourses = courses.filter(c => enrolledCourseIds.includes(c.id));
            
            // Determine active course ID for community
            let activeCommunityCourseId = selectedCourseId;
            if (currentUser.role === 'student') {
              if (studentEnrolledCourses.length === 1) {
                activeCommunityCourseId = studentEnrolledCourses[0].id;
              } else if (studentEnrolledCourses.length >= 2) {
                if (studentEnrolledCourses.some(c => c.id === communityCourseFilter)) {
                  activeCommunityCourseId = communityCourseFilter;
                } else {
                  activeCommunityCourseId = studentEnrolledCourses[0].id;
                }
              }
            } else {
              activeCommunityCourseId = communityCourseFilter === 'all' ? mentorSelectedCourseId : communityCourseFilter;
            }

            const currentCourseObj = courses.find(c => c.id === activeCommunityCourseId) || studentEnrolledCourses[0] || courses[0];

            return (
              <div className="h-[calc(100vh-140px)] flex border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-[#0f1420] shadow-sm">
                {/* Course List Sidebar */}
                <div className="w-72 bg-slate-50/50 dark:bg-slate-950/20 border-r border-slate-200/60 dark:border-slate-800/80 flex flex-col p-4 shrink-0 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 mb-2 block tracking-wider">
                      💬 Course Communities
                    </span>
                    <p className="text-[10px] text-slate-500 mb-3">Select a course to join its dedicated batchmates community chat.</p>
                  </div>

                  {/* Course Selection Buttons */}
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {(currentUser.role === 'student' ? (studentEnrolledCourses.length > 0 ? studentEnrolledCourses : courses) : courses).map((c) => {
                      const isSelected = activeCommunityCourseId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCommunityCourseFilter(c.id)}
                          className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer space-y-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              📚 Course
                            </span>
                            <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              🟢 Active
                            </span>
                          </div>
                          <h5 className="font-extrabold truncate text-xs leading-snug">
                            {c.title}
                          </h5>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {c.duration} • {c.mentorName}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                  {/* Single Dedicated Course Chat Pane */}
                  <div className="flex-1 flex flex-col min-w-0 bg-[#fdfeff] dark:bg-[#080d1a]/10 relative">
                    {/* Course Community Header */}
                    <div className="h-16 border-b border-slate-100 dark:border-slate-900 px-6 flex items-center justify-between bg-white dark:bg-[#0f1420] shadow-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-base shadow-sm">
                          💬
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                              {currentCourseObj?.title}
                            </h4>
                            <span className="text-[9px] uppercase font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Official Community
                            </span>
                          </div>
                          <p className="text-[10px] text-blue-500 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Batch Chat &amp; Mentors Room</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-400">100% Course Dedicated</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5">
                        <span>📜</span> 1-Year Persistent History
                      </span>
                    </div>

                    {/* Single Course Message Log */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                      {(() => {
                        // 1-Year Retention Policy & Course-specific stream filter
                        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
                        const filtered = communityPosts.filter(p => 
                          (p.createdAt >= oneYearAgo) &&
                          (p.courseId === activeCommunityCourseId || p.courseId === 'all' || activeCommunityCourseId === 'all' || !p.courseId)
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                💬
                              </div>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                No messages in #{activeChannel} yet.
                              </p>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full text-slate-400 shadow-sm border border-slate-200 dark:border-slate-800">
                                Messages are saved for 1 year. Say hello to your batchmates!
                              </span>
                            </div>
                          );
                        }

                        const grouped: { [key: string]: typeof filtered } = {};
                        filtered.forEach(post => {
                          const d = new Date(post.createdAt || Date.now());
                          const dateKey = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                          if (!grouped[dateKey]) grouped[dateKey] = [];
                          grouped[dateKey].push(post);
                        });

                        return Object.entries(grouped).map(([date, posts]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex justify-center my-4">
                              <span className="px-3.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] rounded-full font-bold shadow-sm border border-slate-200 dark:border-slate-800 uppercase tracking-wide">
                                📅 {date}
                              </span>
                            </div>

                            {posts.map(post => {
                              const isMe = post.userId === currentUser?.id;
                              const timeStr = new Date(post.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              return (
                                <div key={post.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-4`}>
                                  <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1.5">
                                    {isMe ? (
                                      <>
                                        <span className="text-[8px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{post.userRole}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{post.userName}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{post.userName}</span>
                                        <span className="text-[8px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{post.userRole}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                    <img src={post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName || 'User')}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 shadow-sm" />
                                    
                                    {/* Platform Chat Bubble */}
                                    <div className={`p-3.5 relative shadow-sm text-xs ${
                                      isMe 
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-none shadow-md' 
                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-800/80 shadow-sm'
                                    }`}>
                                      <p className="whitespace-pre-line leading-relaxed text-[13px] font-medium">{post.content}</p>
                                      
                                      {post.imageUrl && (
                                        <img src={post.imageUrl} alt="" className="w-64 max-h-48 object-cover rounded-xl mt-2 border border-black/10 shadow-sm" />
                                      )}
                                      
                                      <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-[9px] font-semibold ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                          ⏰ {timeStr}
                                        </span>
                                      </div>

                                      {/* Reactions & Actions */}
                                      <div className={`flex flex-wrap gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {post.reactions?.map((rx, rIdx) => (
                                          <button
                                            key={rIdx}
                                            onClick={() => reactToPost(post.id, rx.emoji)}
                                            className={`flex items-center gap-1 bg-black/5 dark:bg-white/5 border ${rx.users.includes(currentUser?.id || '') ? 'border-blue-500 text-blue-500' : 'border-transparent text-current'} px-2 py-0.5 rounded-full text-[10px] font-bold transition-all`}
                                          >
                                            <span>{rx.emoji}</span>
                                            <span>{rx.count}</span>
                                          </button>
                                        ))}
                                        
                                        <button
                                          onClick={() => reactToPost(post.id, '❤️')}
                                          className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${isMe ? 'text-white hover:text-red-200' : 'text-slate-400 hover:text-red-500'}`}
                                        >
                                          + React
                                        </button>

                                        {(currentUser?.role === 'admin' || currentUser?.role === 'mentor') && (
                                          <div className="flex gap-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all ml-2">
                                            <button onClick={() => pinCommunityPost(post.id)} className="text-amber-500 hover:underline">Pin</button>
                                            <button onClick={() => deleteCommunityPost(post.id)} className="text-rose-500 hover:underline">Delete</button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Image Attachment Preview */}
                    {selectedImage && (
                      <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50 dark:bg-slate-900/20">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-[10px] text-slate-500 font-bold">Image ready for upload</span>
                        </div>
                        <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>
                    )}

                    {/* Platform Chat Input Box (Restricted for #announcements) */}
                    {activeChannel === 'announcements' && currentUser?.role === 'student' ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-900 flex items-center justify-center text-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                          <span className="text-xs">🔒</span>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            Only Mentors and Administration can publish in <span className="font-extrabold">#announcements</span>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white dark:bg-[#0f1420] border-t border-slate-100 dark:border-slate-900 flex items-center gap-2">
                        <label className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-400 hover:text-blue-500 border border-slate-200/80 dark:border-slate-900 transition-all cursor-pointer">
                          <ImageIcon className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (url) => setSelectedImage(url))}
                          />
                        </label>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!chatInput.trim() && !selectedImage) return;
                            addCommunityPost(activeCommunityCourseId, chatInput, selectedImage || undefined);
                            setChatInput('');
                            setSelectedImage(null);
                          }}
                          className="flex-1 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={`Message #${activeChannel}...`}
                            className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white font-medium"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim() && !selectedImage}
                            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </main>
      </div>

      {/* Interactive Quiz Taking Overlay */}
      {activeTestTakingId && (() => {
        const test = tests.find(t => t.id === activeTestTakingId);
        if (!test) return null;
        const testQs = questions.filter(q => q.testId === test.id);
        const currentQ = testQs[currentQuestionIndex];
        const minutes = Math.floor(quizTimeRemaining / 60);
        const seconds = quizTimeRemaining % 60;
        
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col justify-between overflow-hidden">
              
              {/* Quiz Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Classroom Assessment</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[300px]">{test.title}</h3>
                </div>
                
                {/* Timer Clock */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                  quizTimeRemaining < 60 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Question {currentQuestionIndex + 1} of {testQs.length}</span>
                  <span>{Math.round(((currentQuestionIndex) / testQs.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-slate-150 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / testQs.length) * 100}%` }} />
                </div>
              </div>

              {/* Question Area */}
              {currentQ ? (
                <div className="space-y-4 py-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                    {currentQ.questionText}
                  </h4>

                  {/* MCQ Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options.map((option, oIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === option;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setSelectedAnswers({
                              ...selectedAnswers,
                              [currentQ.id]: option
                            });
                          }}
                          className={`w-full text-left p-4 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'bg-[#f8fafc] dark:bg-slate-950/60 border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-800'
                          }`}
                        >
                          <span>{option}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 dark:border-slate-800'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">Error: Question load failed.</div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-900 pt-4 mt-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                {currentQuestionIndex < testQs.length - 1 ? (
                  <button
                    disabled={!selectedAnswers[currentQ?.id]}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    disabled={Object.keys(selectedAnswers).length < testQs.length}
                    onClick={submitActiveQuiz}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Finish & Submit
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Floating AI Assistant Chatbot */}
      <AIAssistant />
      {/* AI Handwritten Notes Modal */}
      <HandwrittenNoteModal note={selectedHandwrittenNote} onClose={() => setSelectedHandwrittenNote(null)} />
      {/* Coming Soon Course Modal for Digital Marketing, IT & Software Eng, UI/UX Design */}
      <ComingSoonCourseModal
        isOpen={!!upcomingModalCourse}
        onClose={() => setUpcomingModalCourse(null)}
        courseIdOrTitle={upcomingModalCourse || undefined}
        onExploreActiveCourses={() => {
          setSelectedCourseId('course-gen-ai');
          setClassroomTab('notes');
          setActiveTab('classroom-detail');
        }}
      />
    </div>
  );
}












