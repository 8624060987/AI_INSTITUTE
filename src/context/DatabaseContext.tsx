'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// --- TYPE DEFINITIONS ---

export type UserRole = 'student' | 'mentor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  college?: string;
  location?: string;
  careerGoal?: string;
  qualification?: string;
  learningMode?: string;
  currentYear?: string;
  expertise?: string;
  experienceYears?: number;
  company?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  mentorName: string;
  mentorId?: string;
  duration: string;
  rating: number;
  studentsCount: number;
  curriculum: string[];
}

export interface Video {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  orderIndex: number;
  webOnly?: boolean;
  isRecordedLive?: boolean;
}

export interface VideoProgress {
  videoId: string;
  progressSeconds: number;
  completed: boolean;
}

export interface Note {
  id: string;
  courseId: string;
  title: string;
  fileUrl: string;
  fileSize: string;
  description: string;
  isHandwritten?: boolean;
  isAiGenerated?: boolean;
  handwrittenContent?: {
    topicSummary: string;
    keyPoints: string[];
    formulasOrKeyConcepts: string[];
    teacherTips: string;
    date: string;
  };
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  fileUrl?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  status: 'submitted' | 'evaluated';
  score?: number;
  feedback?: string;
  submittedAt: string;
}

export interface LiveSession {
  id: string;
  courseId: string;
  mentorName: string;
  mentorId?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: number; // in mins
  platform: 'zoom' | 'google_meet' | 'teams' | 'custom' | 'in_app';
  meetingLink: string;
  status?: 'scheduled' | 'live' | 'completed';
  fileUrl?: string;
}

export interface SavedLiveRecording {
  id: string;
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  mentorName: string;
  recordedAt: string;
  durationSeconds: number;
  fileSize: string;
  videoUrl: string;
  fileName: string;
}

export interface LiveChat {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  courseName: string;
  lectureName: string;
  date: string;
  time: string;
  duration: number;
  status: 'present' | 'absent';
  liveSessionId: string;
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  xp: number;
  attendanceScore: number;
  assignmentScore: number;
  projectScore: number;
  testScore: number;
  badges: string[];
}

export interface CommunityPost {
  id: string;
  courseId: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  pinned: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  comments: CommunityComment[];
  createdAt: string;
  expiresAt?: string; // 1-Year Long-Term Retention Policy
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  date: string;
  transactionId: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseInterest: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export interface Test {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  isAiGenerated?: boolean;
}

export interface Question {
  id: string;
  testId: string;
  questionText: string;
  questionType: 'mcq' | 'text';
  options: string[];
  correctAnswer: string;
  points: number;
  orderIndex: number;
}

export interface TestSubmission {
  id: string;
  testId: string;
  studentId: string;
  score: number;
  answers: Record<string, string>;
  submittedAt: string;
}

// --- CONTEXT STATE INTERFACE ---

interface DatabaseContextType {
  // Auth state
  currentUser: UserProfile;
  isAuthenticated: boolean;
  authReady: boolean;  // true after first auth check completes
  logout: (reason?: string) => Promise<void>;
  registerNewDeviceSession: (userId: string) => Promise<void>;
  loginAs: (role: UserRole) => void;
  updateProfile: (fullName: string, avatarUrl: string) => void;

  // Courses & classroom
  courses: Course[];
  enrolledCourseIds: string[];
  enrollInCourse: (courseId: string) => Promise<void>;
  addCourse: (course: Omit<Course, 'id' | 'rating' | 'studentsCount'>) => void;
  
  // Content
  videos: Video[];
  notes: Note[];
  assignments: Assignment[];
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  
  // Tests & Quizzes
  tests: Test[];
  questions: Question[];
  testSubmissions: TestSubmission[];
  createTest: (test: Omit<Test, 'id' | 'totalQuestions' | 'totalPoints'>, questions: Omit<Question, 'id' | 'testId'>[]) => Promise<void>;
  submitTest: (testId: string, answers: Record<string, string>, score: number) => Promise<void>;
  
  // Interactive features
  videoProgress: Record<string, VideoProgress>;
  updateVideoProgress: (videoId: string, progress: number, completed: boolean) => void;
  submissions: AssignmentSubmission[];
  submitAssignment: (assignmentId: string, fileUrl: string) => void;
  evaluateSubmission: (submissionId: string, score: number, feedback: string) => void;
  
  // Live session, Recording & Attendance
  liveSessions: LiveSession[];
  savedRecordings: SavedLiveRecording[];
  addSavedLiveRecording: (recording: Omit<SavedLiveRecording, 'id'>) => Promise<void>;
  deleteSavedLiveRecording: (id: string) => Promise<void>;
  createLiveSession: (session: Omit<LiveSession, 'id'>) => Promise<void>;
  updateLiveSessionStatus: (sessionId: string, status: 'scheduled' | 'live' | 'completed') => void;
  attendance: AttendanceRecord[];
  joinLiveSession: (sessionId: string) => void;
  activeLiveSessionId: string | null;
  setActiveLiveSessionId: (id: string | null) => void;
  liveChats: LiveChat[];
  sendLiveChatMessage: (sessionId: string, message: string) => Promise<void>;
  rateMentor: (mentorId: string, rating: number) => Promise<void>;
  // Leaderboard & metrics
  leaderboard: LeaderboardEntry[];
  
  // Community Chat
  communityPosts: CommunityPost[];
  activeChannel: string;
  setActiveChannel: (channel: string) => void;
  addCommunityPost: (courseId: string, content: string, imageUrl?: string) => void;
  addCommentToPost: (postId: string, content: string) => void;
  reactToPost: (postId: string, emoji: string) => void;
  deleteCommunityPost: (postId: string) => void;
  pinCommunityPost: (postId: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationsAsRead: () => void;

  // Admin Panels
  payments: PaymentRecord[];
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'status' | 'createdAt'>) => void;
  updateLeadStatus: (leadId: string, status: 'new' | 'contacted' | 'closed') => void;
  refundPayment: (paymentId: string) => void;

  // Database helper
  resetDatabase: () => void;
}

// --- INITIAL SEED DATA ---

const DEFAULT_USER: UserProfile = {
  id: 'student-ankit',
  email: 'ankit.sharma@aiinstitute.in',
  fullName: 'Ankit Sharma',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  role: 'student',
};

const SEED_COURSES: Course[] = [
  {
    id: 'course-ds',
    title: 'Data Science Mastery Program',
    description: 'Master statistics, machine learning algorithms, deep learning models, and deploy production-level data projects.',
    category: 'Data Science',
    price: 4599,
    originalPrice: 12999,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Vaibhav Ahire',
    duration: '250+ Hours',
    rating: 4.8,
    studentsCount: 1245,
    curriculum: ['Introduction to Data Science', 'Python for Data Science', 'Machine Learning Basics', 'Statistics & Probability', 'Data Analysis with Pandas', 'Data Visualization'],
  },
  {
    id: 'course-da',
    title: 'Data Analytics Professional Program',
    description: 'Learn SQL, Tableau, PowerBI, Excel formulas and business intelligence analytics to drive data-informed decisions.',
    category: 'Data Analytics',
    price: 4599,
    originalPrice: 9999,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Jay Koche',
    duration: '160+ Hours',
    rating: 4.8,
    studentsCount: 1120,
    curriculum: ['Excel Foundations & Pivot Tables', 'SQL Queries & Joins for Analytics', 'PowerBI Interactive Dashboards', 'Tableau Data Storytelling', 'Statistical Business Analytics'],
  },
  {
    id: 'course-dm',
    title: 'Digital Marketing & Growth Mastery',
    description: 'Master Search Engine Optimization (SEO), Social Media Marketing, Google Ads PPC, Email Funnels, and Performance Analytics.',
    category: 'Digital Marketing',
    price: 4599,
    originalPrice: 11999,
    imageUrl: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Siddhi Pawar',
    duration: '140+ Hours',
    rating: 4.9,
    studentsCount: 980,
    curriculum: ['SEO & Organic Keyword Strategy', 'Social Media Marketing & Ad Design', 'Google Ads & Search PPC Campaigns', 'Email Marketing & Conversion Funnels', 'Performance Analytics & Brand Growth'],
  },
  {
    id: 'course-ai-ml',
    title: 'AI & Machine Learning Complete Guide',
    description: 'A deep dive into neural networks, reinforcement learning, Computer Vision, and Natural Language Processing.',
    category: 'AI & ML',
    price: 4599,
    originalPrice: 16999,
    imageUrl: '/images/banner_ai_ml.png',
    mentorName: 'Vaibhav Ahire',
    duration: '300+ Hours',
    rating: 4.9,
    studentsCount: 1530,
    curriculum: ['Linear Algebra & Calculus', 'Neural Networks from Scratch', 'Computer Vision Basics', 'Natural Language Processing', 'Deploying Models to Cloud'],
  },
  {
    id: 'course-gen-ai',
    title: 'Generative AI & LLMs Masterclass',
    description: 'Learn to build products with OpenAI, LangChain, LlamaIndex, stable diffusion, and fine-tune open-source models.',
    category: 'Generative AI',
    price: 4599,
    originalPrice: 6999,
    imageUrl: '/banners/generative-ai.png',
    mentorName: 'Vaibhav Ahire',
    duration: '80+ Hours',
    rating: 4.9,
    studentsCount: 934,
    curriculum: ['Large Language Models foundations', 'Prompt Engineering', 'LangChain Framework', 'Vector Databases', 'Fine-tuning Models', 'AI Agents'],
  },
  {
    id: 'course-cyber-sec',
    title: 'Cyber Security Masterclass',
    description: 'Learn network security, ethical hacking, cryptography, and secure systems design.',
    category: 'Cyber Security',
    price: 4599,
    originalPrice: 10999,
    imageUrl: '/images/banner_cyber_sec.png',
    mentorName: 'Vishwadeep Chavan',
    duration: '150+ Hours',
    rating: 4.8,
    studentsCount: 845,
    curriculum: ['Network Security', 'Ethical Hacking', 'Cryptography', 'Cyber Threats', 'Security Architecture'],
  },
  {
    id: 'course-soft-skills',
    title: 'Soft Skill Development',
    description: 'Enhance your interpersonal skills, leadership, time management, and emotional intelligence.',
    category: 'Soft Skills',
    price: 1999,
    originalPrice: 4999,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Siddhi Pawar',
    duration: '40+ Hours',
    rating: 4.9,
    studentsCount: 1200,
    curriculum: ['Interpersonal Skills', 'Time Management', 'Leadership', 'Emotional Intelligence', 'Problem Solving'],
  },
  {
    id: 'course-business-comm',
    title: 'Business Communication',
    description: 'Master corporate communication, presentation skills, and professional email writing.',
    category: 'Communication',
    price: 2499,
    originalPrice: 5999,
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Siddhi Pawar',
    duration: '60+ Hours',
    rating: 4.7,
    studentsCount: 950,
    curriculum: ['Corporate Communication', 'Presentation Skills', 'Professional Writing', 'Public Speaking', 'Negotiation'],
  },
  {
    id: 'course-business-analyst',
    title: 'Business Analyst Professional',
    description: 'Learn business strategy, data-driven decision making, requirement gathering, and agile methodologies.',
    category: 'Business Analyst',
    price: 3999,
    originalPrice: 8999,
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Jay Koche',
    duration: '100+ Hours',
    rating: 4.8,
    studentsCount: 1100,
    curriculum: ['Business Strategy', 'Data-Driven Decisions', 'Agile Methodologies', 'Requirement Gathering', 'Stakeholder Management'],
  },
  {
    id: 'course-it',
    title: 'Information Technology & Software Engineering',
    description: 'Master computer networks, system administration, cloud infrastructure, DevOps pipelines, and enterprise IT architecture.',
    category: 'Information Technology',
    price: 4599,
    originalPrice: 12999,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Vishwadeep Chavan',
    duration: '200+ Hours',
    rating: 4.9,
    studentsCount: 1430,
    curriculum: ['Computer Networks & Protocols', 'Linux & Windows Administration', 'Cloud Computing (AWS & Azure)', 'Docker & Containerization', 'DevOps & CI/CD Pipelines'],
  },
  {
    id: 'course-ui-ux',
    title: 'UI/UX Design Masterclass',
    description: 'Learn modern UI/UX design, Figma wireframing, component design systems, prototyping, user journey mapping, and mobile app design.',
    category: 'Design & Experience',
    price: 3999,
    originalPrice: 9999,
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800',
    mentorName: 'Siddhi Pawar',
    duration: '120+ Hours',
    rating: 4.9,
    studentsCount: 890,
    curriculum: ['Figma Fundamentals & Design Systems', 'User Research & Personas', 'Wireframing & Interactive Prototyping', 'Visual Hierarchy & Typography', 'Design to Code Handoff'],
  },
];

const SEED_VIDEOS: Video[] = [
  {
    id: 'v2',
    courseId: 'course-ds',
    title: '1. Python Setup and Basic Syntax',
    description: 'Install Anaconda, navigate Jupyter notebooks, and write basic Python constructs.',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: '12:30',
    orderIndex: 1,
  },
  {
    id: 'v3',
    courseId: 'course-ds',
    title: '2. Machine Learning Workflow',
    description: 'Understanding training, validation, testing split, and metrics evaluation.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '18:12',
    orderIndex: 2,
  },
  {
    id: 'v4',
    courseId: 'course-ds',
    title: '3. ML Algorithms Hands-on',
    description: 'Practical implementation of classification, regression, and clustering algorithms.',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: '22:10',
    orderIndex: 3,
  },
];

const SEED_NOTES: Note[] = [
  {
    id: 'n1',
    courseId: 'course-ds',
    title: 'Python Essentials Cheat Sheet.pdf',
    fileUrl: '#',
    fileSize: '2.4 MB',
    description: 'Variables, Loops, Functions, Lists and Dict comprehensions.',
  },
  {
    id: 'n2',
    courseId: 'course-ds',
    title: 'ML Workflow & Architecture Slides.pptx',
    fileUrl: '#',
    fileSize: '5.7 MB',
    description: 'Lecture slides visualizing ML deployment, data cleaning, and features engineering.',
  },
];

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    courseId: 'course-ds',
    title: 'Data Cleaning Project',
    description: 'Handle missing values, anomalies, and outliers in a customer churn dataset.',
    dueDate: '2026-07-30T18:30:00.000Z',
    points: 100,
  },
  {
    id: 'a2',
    courseId: 'course-ds',
    title: 'SQL Hands-on Assignment',
    description: 'Write complex JOINs and Subqueries to answer 10 commercial business queries.',
    dueDate: '2026-08-05T18:30:00.000Z',
    points: 100,
  },
];

const SEED_LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'session-fresh-1',
    courseId: 'course-gen-ai',
    mentorName: 'Vaibhav Ahire',
    title: 'Generative AI & LLMs Orientation Lecture',
    description: 'Live interactive session covering course roadmap, hands-on projects, and AI tools setup.',
    date: '2026-08-15',
    startTime: '19:00',
    duration: 60,
    platform: 'google_meet',
    meetingLink: 'https://meet.google.com/ai-institute-satana',
    status: 'scheduled'
  }
];

const SEED_SAVED_RECORDINGS: SavedLiveRecording[] = [];

const SEED_LEADERBOARD: LeaderboardEntry[] = [];

const SEED_COMMUNITY: CommunityPost[] = [
  {
    id: 'post-welcome-fresh',
    courseId: 'course-gen-ai',
    channelId: 'announcements',
    userId: 'mentor-vaibhav',
    userName: 'Vaibhav Ahire (Lead Mentor)',
    userRole: 'mentor',
    userAvatar: '/uploads/vaibhav_ahire.jpg',
    content: '🎉 Welcome to AI Institute Satana Official Community Platform! Share questions, collaborate on AI projects, and join live batch discussions here.',
    pinned: true,
    reactions: [{ emoji: '👋', count: 1, users: ['mentor-vaibhav'] }],
    comments: [],
    createdAt: new Date().toISOString(),
  }
];

const SEED_PAYMENTS: PaymentRecord[] = [
  { id: 'p1', courseId: 'course-ds', courseTitle: 'Data Science Mastery Program', amount: 4999, status: 'success', date: '2026-07-20', transactionId: 'pay_stripe_982312' },
];

const SEED_TESTS: Test[] = [
  {
    id: 'test-py',
    courseId: 'course-ds',
    title: 'Python for Data Science Quiz',
    description: 'Test your understanding of basic Python programming syntax, data structures, and functions.',
    durationMinutes: 10,
    totalQuestions: 2,
    totalPoints: 20,
  },
  {
    id: 'test-sql',
    courseId: 'course-ds',
    title: 'SQL Join & Queries Challenge',
    description: 'Assess your skills in inner, outer joins, subqueries, and grouping in PostgreSQL.',
    durationMinutes: 15,
    totalQuestions: 2,
    totalPoints: 20,
  }
];

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q-py-1',
    testId: 'test-py',
    questionText: 'What is the output of print(2 ** 3) in Python?',
    questionType: 'mcq',
    options: ['5', '6', '8', '9'],
    correctAnswer: '8',
    points: 10,
    orderIndex: 1,
  },
  {
    id: 'q-py-2',
    testId: 'test-py',
    questionText: 'Which of the following data types is mutable in Python?',
    questionType: 'mcq',
    options: ['List', 'Tuple', 'String', 'Integer'],
    correctAnswer: 'List',
    points: 10,
    orderIndex: 2,
  },
  {
    id: 'q-sql-1',
    testId: 'test-sql',
    questionText: 'Which JOIN returns all rows from the left table, and the matched rows from the right table?',
    questionType: 'mcq',
    options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
    correctAnswer: 'LEFT JOIN',
    points: 10,
    orderIndex: 1,
  },
  {
    id: 'q-sql-2',
    testId: 'test-sql',
    questionText: 'Which keyword is used to retrieve unique values from a column?',
    questionType: 'mcq',
    options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'GROUP BY'],
    correctAnswer: 'DISTINCT',
    points: 10,
    orderIndex: 2,
  }
];

export function dedupeCourses(courseList: Course[]): Course[] {
  if (!Array.isArray(courseList)) return [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: Course[] = [];

  for (const c of courseList) {
    if (!c || !c.id || !c.title) continue;
    const normId = c.id.trim().toLowerCase();
    
    // Normalize title to match duplicate titles
    const normTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenIds.has(normId)) continue;

    let isTitleDuplicate = false;
    for (const existingTitle of seenTitles) {
      if (
        existingTitle === normTitle ||
        (normTitle.includes('generativeai') && existingTitle.includes('generativeai')) ||
        (normTitle.includes('machinelearning') && existingTitle.includes('machinelearning')) ||
        (normTitle.includes('datascience') && existingTitle.includes('datascience')) ||
        (normTitle.includes('dataanalytics') && existingTitle.includes('dataanalytics')) ||
        (normTitle.includes('digitalmarketing') && existingTitle.includes('digitalmarketing')) ||
        (normTitle.includes('cybersecurity') && existingTitle.includes('cybersecurity')) ||
        (normTitle.includes('businessanalyst') && existingTitle.includes('businessanalyst')) ||
        (normTitle.includes('informationtechnology') && existingTitle.includes('informationtechnology')) ||
        (normTitle.includes('uiuxdesign') && existingTitle.includes('uiuxdesign'))
      ) {
        isTitleDuplicate = true;
        break;
      }
    }

    if (isTitleDuplicate) continue;

    seenIds.add(normId);
    seenTitles.add(normTitle);
    result.push(c);
  }

  return result;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  // Database Tables (stored in localState first, synced to LocalStorage)
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, VideoProgress>>({});
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [savedRecordings, setSavedRecordings] = useState<SavedLiveRecording[]>([]);
  const [liveChats, setLiveChats] = useState<LiveChat[]>([]);
  const [activeLiveSessionId, setActiveLiveSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Load from local storage or set seeds
  useEffect(() => {
    const loadOrSeed = <T,>(key: string, seed: T): T => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return seed;
        }
      }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    };

    const sanitizeCourseImage = (url: string | undefined, defaultUrl: string): string => {
      if (!url || url.includes('ai_ml_poster') || url.includes('generative_ai_poster') || url.includes('photo-1507146426996-ef05306b995a') || url.includes('dog')) {
        return defaultUrl;
      }
      return url;
    };

    const sanitizedSeedCourses = dedupeCourses(SEED_COURSES.map(c => ({
      ...c,
      imageUrl: c.id === 'course-ai-ml' 
        ? '/images/banner_ai_ml.png'
        : c.id === 'course-gen-ai'
        ? '/banners/generative-ai.png'
        : c.id === 'course-cyber-sec'
        ? '/images/banner_cyber_sec.png'
        : sanitizeCourseImage(c.imageUrl, c.imageUrl)
    })));

    setCourses(sanitizedSeedCourses);
    save('lms_courses', sanitizedSeedCourses);
    
    const loadedEnrolled = loadOrSeed('lms_enrolled', ['course-ds', 'course-ai-ml']);
    const validEnrolled = Array.isArray(loadedEnrolled) && loadedEnrolled.length > 0 ? loadedEnrolled : ['course-ds', 'course-ai-ml'];
    setEnrolledCourseIds(validEnrolled);
    save('lms_enrolled', validEnrolled);
    setVideos(loadOrSeed('lms_videos', SEED_VIDEOS));
    setNotes(loadOrSeed('lms_notes', SEED_NOTES));
    setAssignments(loadOrSeed('lms_assignments', SEED_ASSIGNMENTS));
    setTests(loadOrSeed('lms_tests', SEED_TESTS));
    setQuestions(loadOrSeed('lms_questions', SEED_QUESTIONS));
    setTestSubmissions(loadOrSeed('lms_test_submissions', []));
    setVideoProgress(loadOrSeed('lms_progress', {}));
    setSubmissions(loadOrSeed('lms_submissions', []));
    setLiveSessions(loadOrSeed('lms_live_sessions', SEED_LIVE_SESSIONS));
    setSavedRecordings(loadOrSeed('lms_saved_recordings', SEED_SAVED_RECORDINGS));
    setAttendance(loadOrSeed('lms_attendance', []));
    setLeaderboard(loadOrSeed('lms_leaderboard', SEED_LEADERBOARD));
    setCommunityPosts(loadOrSeed('lms_community', SEED_COMMUNITY));
    setPayments(loadOrSeed('lms_payments', SEED_PAYMENTS));
    setLeads(loadOrSeed('lms_leads', []));
    
    // Seed default notifications
    setNotifications(loadOrSeed('lms_notifications', [
      { id: 'n-welcome', title: 'Welcome to AI Institute!', content: 'Get ready to supercharge your skills with AI.', type: 'info', read: false, createdAt: new Date().toISOString() },
      { id: 'n-live', title: 'New Live Class Scheduled', content: 'ML Workflow Live Session starts on 24th July at 7:00 PM.', type: 'live', read: false, createdAt: new Date().toISOString() },
    ]));

    // Ensure current user is in leaderboard (Real users only based on progress)
    if (currentUser?.role === 'student') {
      setLeaderboard(prev => {
        if (!prev.find(l => l.studentId === currentUser.id)) {
          const updated = [...prev, {
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random`,
            xp: 0,
            attendanceScore: 0,
            assignmentScore: 0,
            projectScore: 0,
            testScore: 0,
            badges: []
          }];
          save('lms_leaderboard', updated);
          return updated;
        }
        return prev;
      });
    }

    // Mark auth as ready immediately for instant zero-latency UI rendering!
    setAuthReady(true);

    // Load active profile from Supabase in background
    const initAuth = async () => {
      // Fast path: Execute all Supabase queries in parallel with a 2-second timeout guard
      const fetchWithTimeout = (queryBuilder: any, ms = 2000) => 
        Promise.race([
          Promise.resolve(queryBuilder),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]).catch(() => ({ data: null }));

      const [
        coursesRes, videosRes, notesRes, assignmentsRes, liveRes,
        testsRes, questionsRes, testSubRes, assSubRes, studentsRes
      ] = await Promise.all([
        fetchWithTimeout(supabase.from('courses').select('*')),
        fetchWithTimeout(supabase.from('videos').select('*')),
        fetchWithTimeout(supabase.from('notes').select('*')),
        fetchWithTimeout(supabase.from('assignments').select('*')),
        fetchWithTimeout(supabase.from('live_sessions').select('*')),
        fetchWithTimeout(supabase.from('tests').select('*')),
        fetchWithTimeout(supabase.from('questions').select('*')),
        fetchWithTimeout(supabase.from('test_submissions').select('*')),
        fetchWithTimeout(supabase.from('assignment_submissions').select('*')),
        fetchWithTimeout(supabase.from('profiles').select('*').eq('role', 'student')),
      ]) as any[];

      // Process courses with strict deduplication
      const coursesData = coursesRes?.data;
      if (coursesData && coursesData.length > 0) {
        const mergedList: Course[] = [...sanitizedSeedCourses];
        coursesData.forEach((c: any) => {
          const normDbTitle = (c.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const existingIndex = mergedList.findIndex(seed => 
            seed.id === c.id || seed.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normDbTitle
          );

          const formatted: Course = {
            id: c.id,
            title: c.title || 'Course',
            description: c.description || '',
            category: c.category || 'General',
            price: c.price || 4599,
            originalPrice: c.original_price || 12999,
            imageUrl: c.id === 'course-ai-ml' 
              ? '/images/banner_ai_ml.png'
              : c.id === 'course-gen-ai'
              ? '/banners/generative-ai.png'
              : c.id === 'course-cyber-sec'
              ? '/images/banner_cyber_sec.png'
              : sanitizeCourseImage(c.thumbnail_url || c.image_url, '/images/banner_ai_ml.png'),
            mentorName: c.mentor_name || 'Vaibhav Ahire',
            duration: c.duration || '200+ Hours',
            rating: c.rating || 4.9,
            studentsCount: c.students_count || 1000,
            curriculum: c.curriculum || [],
          };

          if (existingIndex >= 0) {
            mergedList[existingIndex] = {
              ...mergedList[existingIndex],
              ...formatted,
              id: mergedList[existingIndex].id,
              imageUrl: mergedList[existingIndex].id === 'course-ai-ml' 
                ? '/images/banner_ai_ml.png' 
                : mergedList[existingIndex].id === 'course-gen-ai'
                ? '/banners/generative-ai.png'
                : mergedList[existingIndex].id === 'course-cyber-sec'
                ? '/images/banner_cyber_sec.png'
                : formatted.imageUrl
            };
          } else {
            mergedList.push(formatted);
          }
        });

        const finalUniqueCourses = dedupeCourses(mergedList);
        setCourses(finalUniqueCourses);
        save('lms_courses', finalUniqueCourses);
      }

      // Process videos
      const videosData = videosRes?.data;
      if (videosData && videosData.length > 0) {
        setVideos(videosData.map((v: any) => ({
          id: v.id,
          courseId: v.course_id,
          title: v.title,
          description: v.description,
          videoUrl: v.video_url,
          duration: v.duration,
          orderIndex: v.order_index,
        })));
      }

      // Process notes
      const notesData = notesRes?.data;
      if (notesData && notesData.length > 0) {
        setNotes(notesData.map((n: any) => ({
          id: n.id,
          courseId: n.course_id,
          title: n.title,
          fileUrl: n.file_url,
          fileSize: n.file_size || '0 MB',
          description: n.description || '',
        })));
      }

      // Process assignments
      const assignmentsData = assignmentsRes?.data;
      if (assignmentsData && assignmentsData.length > 0) {
        setAssignments(assignmentsData.map((a: any) => ({
          id: a.id,
          courseId: a.course_id,
          title: a.title,
          description: a.description || '',
          dueDate: a.due_date,
          points: a.points || 100,
        })));
      }

      // Process live sessions
      const liveData = liveRes?.data;
      if (liveData && liveData.length > 0) {
        setLiveSessions(liveData.map((s: any) => ({
          id: s.id,
          courseId: s.course_id,
          mentorId: s.mentor_id,
          mentorName: 'Expert Mentor',
          title: s.title,
          description: s.description || '',
          date: s.session_date,
          startTime: s.start_time,
          duration: s.duration,
          platform: s.platform,
          meetingLink: s.meeting_link,
        })));
      }

      // Process tests
      const testsData = testsRes?.data;
      if (testsData && testsData.length > 0) {
        setTests(testsData.map((t: any) => ({
          id: t.id,
          courseId: t.course_id,
          title: t.title,
          description: t.description || '',
          durationMinutes: t.duration_minutes,
          totalQuestions: t.total_questions,
          totalPoints: t.total_points,
        })));
      }

      // Process questions
      const questionsData = questionsRes?.data;
      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData.map((q: any) => ({
          id: q.id,
          testId: q.test_id,
          questionText: q.question_text,
          questionType: q.question_type as 'mcq' | 'text',
          options: q.options || [],
          correctAnswer: q.correct_answer,
          points: q.points || 10,
          orderIndex: q.order_index,
        })));
      }

      // Process test submissions
      const submissionsData = testSubRes?.data;
      if (submissionsData && submissionsData.length > 0) {
        setTestSubmissions(submissionsData.map((s: any) => ({
          id: s.id,
          testId: s.test_id,
          studentId: s.student_id,
          score: s.score,
          answers: s.answers || {},
          submittedAt: s.submitted_at,
        })));
      }

      // Process assignment submissions
      const assignmentSubmissionsData = assSubRes?.data;
      if (assignmentSubmissionsData && assignmentSubmissionsData.length > 0) {
        setSubmissions(assignmentSubmissionsData.map((s: any) => ({
          id: s.id,
          assignmentId: s.assignment_id,
          studentId: s.student_id,
          fileUrl: s.file_url,
          status: s.status as 'submitted' | 'evaluated',
          score: s.score || undefined,
          feedback: s.feedback || undefined,
          submittedAt: s.submitted_at,
          evaluatedAt: s.evaluated_at || undefined,
        })));
      }

      // Process leaderboard
      const studentsData = studentsRes?.data;
      if (studentsData && studentsData.length > 0) {
        const existingLocalLeaderboard: LeaderboardEntry[] = loadOrSeed('lms_leaderboard', []);
        const realLeaderboard = studentsData.map((s: any, idx: number) => {
          const existing = existingLocalLeaderboard.find(l => l.studentId === s.id);
          if (existing && existing.xp > 0) {
            return {
              ...existing,
              studentName: s.full_name || existing.studentName,
              avatarUrl: s.avatar_url || existing.avatarUrl,
            };
          }
          let charSum = 0;
          for (let i = 0; i < s.id.length; i++) charSum += s.id.charCodeAt(i);
          const baseDeterministicXP = 200 + ((charSum * 37) % 300) + (50 * (studentsData.length - idx));
          const baseAttendance = 75 + (charSum % 20);
          const baseTest = 70 + ((charSum * 11) % 25);
          return {
            studentId: s.id,
            studentName: s.full_name || 'Anonymous Student',
            avatarUrl: s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name || 'Student')}&background=random`,
            xp: baseDeterministicXP,
            attendanceScore: baseAttendance,
            assignmentScore: 80,
            projectScore: 85,
            testScore: baseTest,
            badges: idx === 0 ? ['Top Scholar'] : idx === 1 ? ['Fast Learner'] : []
          };
        });

        setLeaderboard(prev => {
          const finalLeaderboard = realLeaderboard.map((r: any) => {
            const matchInPrev = prev.find(p => p.studentId === r.studentId);
            return matchInPrev && matchInPrev.xp > r.xp ? matchInPrev : r;
          });
          save('lms_leaderboard', finalLeaderboard);
          return finalLeaderboard;
        });
      }

      const roleOverride = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
      const rawGUser = typeof window !== 'undefined' ? localStorage.getItem('granted_student_user') : null;
      const rawMentorUser = typeof window !== 'undefined' ? localStorage.getItem('lms_mentor_profile') : null;
      const rawLmsUser = typeof window !== 'undefined' ? localStorage.getItem('lms_user') : null;
      const isLogged = typeof window !== 'undefined' ? localStorage.getItem('lms_user_logged_in') : null;

      // 1. If user logged in as Mentor or Admin on this device, restore session immediately
      if ((roleOverride === 'mentor' || roleOverride === 'admin') && (rawMentorUser || rawLmsUser || isLogged === 'true')) {
        try {
          const parsed = rawMentorUser ? JSON.parse(rawMentorUser) : rawLmsUser ? JSON.parse(rawLmsUser) : null;
          if (parsed) {
            setIsAuthenticated(true);
            setCurrentUser({
              id: parsed.id || 'mentor-vaibhav',
              email: parsed.email || 'vaibhav.ahire@aiinstitute.in',
              fullName: parsed.fullName || 'Vaibhav Ahire',
              avatarUrl: parsed.avatarUrl || '/uploads/vaibhav_ahire.jpg',
              role: (roleOverride || parsed.role || 'mentor') as UserRole,
            });
            setAuthReady(true);
            return;
          }
        } catch (e) {}
      }

      // 2. If user logged in as Student on this device, restore student session immediately
      if (roleOverride === 'student' || (rawGUser && isLogged === 'true')) {
        try {
          const gUser = rawGUser ? JSON.parse(rawGUser) : null;
          const studentEmail = gUser?.email || 'student.sample@gmail.com';
          const studentName = gUser?.fullName || studentEmail.split('@')[0].toUpperCase();
          const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`custom_avatar_${studentEmail}`) : null;
          const photoUrl = gUser?.avatarUrl || savedAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;
          
          setIsAuthenticated(true);
          setCurrentUser({
            id: 'stu-' + studentEmail.replace(/[^a-zA-Z0-9]/g, ''),
            email: studentEmail,
            fullName: studentName,
            avatarUrl: photoUrl,
            role: 'student',
            college: gUser?.college || 'AI Institute Scholar',
            location: gUser?.location || 'Satana / Maharashtra',
            careerGoal: gUser?.careerGoal || 'Generative AI Engineer',
            qualification: gUser?.qualification || 'Graduate / B.Tech / BCA',
            learningMode: gUser?.learningMode || 'Live Interactive Online Batch',
            phone: gUser?.phone || '',
            bio: gUser?.bio || `Passionate student dedicated to mastering AI and Software Engineering.`,
            currentYear: gUser?.currentYear || 'Final Year (2025/2026)',
          });

          const allCourseIds = courses.map(c => c.id);
          const targetId = gUser?.courseId && gUser.courseId !== 'all' ? gUser.courseId : 'course-gen-ai';
          const finalEnrolled = Array.from(new Set([targetId, ...allCourseIds]));
          setEnrolledCourseIds(finalEnrolled);
          save('lms_enrolled', finalEnrolled);
          setAuthReady(true);
          return;
        } catch (e) {
          setAuthReady(true);
        }
      }

      // 3. Otherwise check Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        const activeRole = profile?.role || session.user.user_metadata?.role || (roleOverride === 'mentor' ? 'mentor' : 'student');

        if (activeRole === 'mentor' || activeRole === 'admin') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('granted_student_user');
          }
          const mentorName = profile?.full_name || session.user.user_metadata?.full_name || 'Aryan Bagul';
          const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`custom_avatar_${session.user.id}`) : null;
          const mentorAvatar = savedAvatar || profile?.profile_photo_url || profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorName)}&background=10B981&color=fff&bold=true`;
          
          setCurrentUser({
            id: profile?.id || session.user.id,
            email: profile?.email || session.user.email || '',
            fullName: mentorName,
            avatarUrl: mentorAvatar,
            role: activeRole as UserRole,
          });
        } else {
          const userName = profile?.full_name || session.user.user_metadata?.full_name || 'User';
          const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`custom_avatar_${session.user.id}`) : null;
          const userAvatar = savedAvatar || profile?.profile_photo_url || profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3B82F6&color=fff&bold=true`;

          setCurrentUser({
            id: profile?.id || session.user.id,
            email: profile?.email || session.user.email || '',
            fullName: userName,
            avatarUrl: userAvatar,
            role: activeRole as UserRole,
          });
        }

        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', session.user.id);
        if (enrollments && enrollments.length > 0) {
          setEnrolledCourseIds(enrollments.map(e => e.course_id));
        }
      } else if (rawLmsUser && isLogged === 'true') {
        try {
          const parsed = JSON.parse(rawLmsUser);
          if (parsed && parsed.email) {
            setIsAuthenticated(true);
            setCurrentUser(parsed);
          }
        } catch (e) {}
      }

        // Fetch community posts & merge with localStorage to guarantee zero message loss on refresh
        const { data: postsData } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: true });
        
        const localPosts: CommunityPost[] = loadOrSeed('lms_community', SEED_COMMUNITY);
        const postMap = new Map<string, CommunityPost>();
        
        // 1. Seed base posts
        SEED_COMMUNITY.forEach(p => postMap.set(p.id, p));
        // 2. Local posts from storage
        localPosts.forEach(p => postMap.set(p.id, p));
        // 3. Supabase backend posts
        if (postsData && postsData.length > 0) {
          postsData.forEach(p => {
            const mapped: CommunityPost = {
              id: p.id,
              courseId: p.course_id || 'course-ds',
              channelId: p.channel_id || 'general',
              userId: p.user_id,
              userName: p.user_name || 'User',
              userRole: (p.user_role as UserRole) || 'student',
              userAvatar: p.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              content: p.content,
              imageUrl: p.image_url,
              pinned: p.pinned || false,
              reactions: p.reactions || [],
              comments: p.comments || [],
              createdAt: p.created_at || new Date().toISOString(),
            };
            postMap.set(p.id, mapped);
          });
        }
        
        const finalCommunityPosts = Array.from(postMap.values());
        setCommunityPosts(finalCommunityPosts);
        save('lms_community', finalCommunityPosts);

        // Fetch notifications
        if (session?.user) {
          const { data: notifData } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (notifData && notifData.length > 0) {
            setNotifications(notifData.map(n => ({
              id: n.id,
              title: n.title,
              content: n.content,
              type: n.type || 'info',
              read: n.read || false,
              link: n.link,
              createdAt: n.created_at,
            })));
          }
        }
        // Fetch live chats
        const { data: chatsData } = await supabase
          .from('live_chats')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (chatsData && chatsData.length > 0) {
          setLiveChats(chatsData.map(c => ({
            id: c.id,
            sessionId: c.session_id,
            userId: c.user_id,
            userName: c.user_name,
            userRole: c.user_role,
            message: c.message,
            createdAt: c.created_at,
          })));
        }

        // Setup Realtime Subscriptions
        const chatChannelName = 'public:live_chats_' + Math.random();
        const chatChannel = supabase.channel(chatChannelName)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chats' }, (payload) => {
            const c = payload.new;
            setLiveChats(prev => {
              if (prev.some(chat => chat.id === c.id)) return prev;
              
              const newChat: LiveChat = {
                id: c.id,
                sessionId: c.session_id,
                userId: c.user_id,
                userName: c.user_name,
                userRole: c.user_role,
                message: c.message,
                createdAt: c.created_at,
              };
              return [...prev, newChat];
            });
          })
          .subscribe();

        // Setup Realtime Subscriptions
        const communityChannelName = 'public:community_posts_' + Math.random();
        const channel = supabase.channel(communityChannelName)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
            const p = payload.new;
            setCommunityPosts(prev => {
              // check if it already exists (optimistic update handles this)
              if (prev.some(post => post.id === p.id)) return prev;
              
              const newPost: CommunityPost = {
                id: p.id,
                courseId: p.course_id,
                channelId: p.channel_id || 'general',
                userId: p.user_id,
                userName: p.user_name || 'User',
                userRole: (p.user_role as UserRole) || 'student',
                userAvatar: p.user_avatar || '',
                content: p.content,
                imageUrl: p.image_url,
                pinned: p.pinned || false,
                reactions: p.reactions || [],
                comments: p.comments || [],
                createdAt: p.created_at,
              };
              return [...prev, newPost];
            });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_posts' }, (payload) => {
            const p = payload.new;
            setCommunityPosts(prev => prev.map(post => {
              if (post.id === p.id) {
                return {
                  ...post,
                  pinned: p.pinned || false,
                  reactions: p.reactions || [],
                  comments: p.comments || [],
                };
              }
              return post;
            }));
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, (payload) => {
            setCommunityPosts(prev => prev.filter(post => post.id !== payload.old.id));
          })
          .subscribe();

        return () => {
          supabase.removeChannel(chatChannel);
          supabase.removeChannel(channel);
        };
    };
      // Mark auth as ready after first complete check
      const ensureReady = async () => {
        await initAuth();
        setAuthReady(true);
      };
      let cleanupFn: (() => void) | undefined;
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const oauthRole = localStorage.getItem('oauth_role');
          if (oauthRole) {
            await supabase.from('profiles').update({ role: oauthRole }).eq('id', session.user.id);
            localStorage.removeItem('oauth_role');
          }
        }
        if (cleanupFn) {
          cleanupFn();
          cleanupFn = undefined;
        }
        const fn = await initAuth();
        if (fn) {
          cleanupFn = fn as unknown as (() => void);
        }
      });
      
      ensureReady().then(fn => {
        // authReady already set inside ensureReady
      });
      
      return () => {
        subscription.unsubscribe();
        if (cleanupFn) cleanupFn();
      };
    }, []);

  // Helper to save to localStorage
  const save = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- SINGLE DEVICE LOGIN POLICY & AUTH OPERATORS ---
  const logout = async (reason?: string) => {
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_user');
      localStorage.removeItem('lms_user_logged_in');
      localStorage.removeItem('granted_student_user');
      localStorage.removeItem('lms_mentor_profile');
      localStorage.removeItem('user_role');
      localStorage.removeItem('my_active_session_token');
      if (currentUser?.id) {
        localStorage.removeItem(`lms_active_session_${currentUser.id}`);
      }
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    if (typeof window !== 'undefined') {
      if (reason) {
        window.location.href = `/login/student?reason=${encodeURIComponent(reason)}`;
      } else {
        window.location.href = '/login/student';
      }
    }
  };

  const registerNewDeviceSession = async (userId: string) => {
    if (typeof window === 'undefined' || !userId) return;
    const newSessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Store locally on this device/browser
    localStorage.setItem('my_active_session_token', newSessionToken);
    localStorage.setItem(`lms_active_session_${userId}`, newSessionToken);

    // 2. Broadcast to other tabs on same machine
    try {
      const bc = new BroadcastChannel('lms_single_device_sync');
      bc.postMessage({ type: 'NEW_DEVICE_LOGIN', userId, sessionToken: newSessionToken });
      bc.close();
    } catch (e) {}

    // 3. Sync to Supabase profiles database table
    try {
      await supabase
        .from('profiles')
        .update({ active_session_token: newSessionToken })
        .eq('id', userId);
    } catch (e) {}
  };

  // --- SINGLE DEVICE ACTIVE SESSION GUARD ---
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || currentUser.id === 'guest') return;

    const userId = currentUser.id;

    // Initialize myToken if missing
    let myToken = typeof window !== 'undefined' ? localStorage.getItem('my_active_session_token') : null;
    if (!myToken && typeof window !== 'undefined') {
      myToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('my_active_session_token', myToken);
      localStorage.setItem(`lms_active_session_${userId}`, myToken);
    }

    const checkDeviceSession = async () => {
      if (typeof window === 'undefined') return;
      const currentMyToken = localStorage.getItem('my_active_session_token');
      const latestLocalToken = localStorage.getItem(`lms_active_session_${userId}`);

      // 1. Check local storage / same machine tab policy
      if (latestLocalToken && currentMyToken && latestLocalToken !== currentMyToken) {
        logout('logged_out_other_device');
        return;
      }

      // 2. Check Supabase database remote device policy
      try {
        const { data } = await supabase
          .from('profiles')
          .select('active_session_token')
          .eq('id', userId)
          .maybeSingle();

        if (data?.active_session_token && currentMyToken && data.active_session_token !== currentMyToken) {
          logout('logged_out_other_device');
          return;
        }
      } catch (e) {}
    };

    const intervalId = setInterval(checkDeviceSession, 3000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `lms_active_session_${userId}`) {
        const currentMyToken = localStorage.getItem('my_active_session_token');
        if (e.newValue && e.newValue !== currentMyToken) {
          logout('logged_out_other_device');
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('lms_single_device_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'NEW_DEVICE_LOGIN' && msg.data.userId === userId) {
          const currentMyToken = localStorage.getItem('my_active_session_token');
          if (msg.data.sessionToken !== currentMyToken) {
            logout('logged_out_other_device');
          }
        }
      };
    } catch (e) {}

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', checkDeviceSession);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', checkDeviceSession);
      if (bc) bc.close();
    };
  }, [isAuthenticated, currentUser?.id]);

  // Auth operations
  const loginAs = (role: UserRole) => {
    let profile: UserProfile;
    if (role === 'admin') {
      profile = {
        id: 'admin-ankit',
        email: 'ankit.admin@aiinstitute.in',
        fullName: 'Ankit (Admin)',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        role: 'admin',
      };
    } else if (role === 'mentor') {
      profile = {
        id: 'mentor-vaibhav',
        email: 'vaibhav.ahire@aiinstitute.in',
        fullName: 'Vaibhav Ahire',
        avatarUrl: '/uploads/vaibhav_ahire.jpg',
        role: 'mentor',
      };
    } else {
      profile = DEFAULT_USER;
    }
    setCurrentUser(profile);
    setIsAuthenticated(true);
    save('lms_user', profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_role', role);
      localStorage.setItem('lms_user_logged_in', 'true');
    }
    registerNewDeviceSession(profile.id);
  };

  const updateProfile = async (fullName: string, avatarUrl: string) => {
    const updated = { ...currentUser, fullName, avatarUrl };
    setCurrentUser(updated);
    save('lms_user', updated);
    if (typeof window !== 'undefined') {
      if (currentUser?.id) {
        localStorage.setItem(`custom_avatar_${currentUser.id}`, avatarUrl);
      }
      if (currentUser?.email) {
        localStorage.setItem(`custom_avatar_${currentUser.email}`, avatarUrl);
      }
      const rawGUser = localStorage.getItem('granted_student_user');
      if (rawGUser) {
        try {
          const parsed = JSON.parse(rawGUser);
          parsed.fullName = fullName;
          parsed.avatarUrl = avatarUrl;
          localStorage.setItem('granted_student_user', JSON.stringify(parsed));
        } catch (e) {}
      }
    }
    
    // Update Supabase Database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          profile_photo_url: avatarUrl
        })
        .eq('id', currentUser.id);
        
      if (error) {
        console.error("Supabase error updating profile:", error);
      }
    } catch (err) {
      console.error("Failed to update profile in database:", err);
    }
  };

  // Course operations
  const enrollInCourse = async (courseId: string) => {
    // 1. Always update local state first
    setEnrolledCourseIds(prev => {
      const updatedIds = Array.from(new Set([...prev, courseId]));
      save('lms_enrolled', updatedIds);
      return updatedIds;
    });

    // 2. Try Supabase insert gracefully without crashing or throwing console errors
    try {
      if (currentUser?.id && currentUser.id.length > 20) {
        const supabase = createClient();
        await supabase.from('course_enrollments').insert({
          student_id: currentUser.id,
          course_id: courseId
        });
      }
    } catch (err) {
      // Ignore remote DB error silently
    }

    // 3. Create access log & notification
    const targetCourse = courses.find(c => c.id === courseId);
    if (targetCourse) {
      const newPayment: PaymentRecord = {
        id: `pay_${Math.random().toString(36).substring(7)}`,
        courseId: courseId,
        courseTitle: targetCourse.title,
        amount: 0,
        status: 'success',
        date: new Date().toISOString().split('T')[0],
        transactionId: `tx_free_${Math.floor(Math.random() * 1000000)}`,
      };
      setPayments(prev => {
        const updatedPayments = [newPayment, ...prev];
        save('lms_payments', updatedPayments);
        return updatedPayments;
      });

      // Trigger notification
      const newNotif: Notification = {
        id: `notif_${Date.now()}`,
        title: 'Course Access Granted',
        content: `You have 100% free access to ${targetCourse.title}. Check your My Courses page.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => {
        const u = [newNotif, ...prev];
        save('lms_notifications', u);
        return u;
      });
    }
  };

  const addCourse = (newCourseData: Omit<Course, 'id' | 'rating' | 'studentsCount'>) => {
    const newCourse: Course = {
      ...newCourseData,
      id: `course-${Math.random().toString(36).substring(7)}`,
      rating: 5.0,
      studentsCount: 0,
    };
    const updated = [...courses, newCourse];
    setCourses(updated);
    save('lms_courses', updated);
  };

  // Progress Tracker
  const updateVideoProgress = (videoId: string, progress: number, completed: boolean) => {
    const updatedProgress = {
      ...videoProgress,
      [videoId]: { videoId, progressSeconds: progress, completed },
    };
    setVideoProgress(updatedProgress);
    save('lms_progress', updatedProgress);

    // If completed, add XP to leaderboard
    if (completed && !videoProgress[videoId]?.completed) {
      setLeaderboard(prev => {
        const u = prev.map(entry => {
          if (entry.studentId === currentUser.id) {
            return { ...entry, xp: entry.xp + 50 };
          }
          return entry;
        });
        save('lms_leaderboard', u);
        return u;
      });
    }
  };

  // Submissions
  const submitAssignment = async (assignmentId: string, fileUrl: string) => {
    const newSubmission: AssignmentSubmission = {
      id: `sub_${Math.random().toString(36).substring(7)}`,
      assignmentId,
      studentId: currentUser.id,
      fileUrl,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newSubmission, ...submissions.filter(s => !(s.assignmentId === assignmentId && s.studentId === currentUser.id))];
    setSubmissions(updated);
    save('lms_submissions', updated);

    // Sync to Supabase
    const supabase = createClient();
    await supabase.from('assignment_submissions').upsert({
      assignment_id: assignmentId,
      student_id: currentUser.id,
      file_url: fileUrl,
      status: 'submitted',
      submitted_at: newSubmission.submittedAt
    }, { onConflict: 'assignment_id,student_id' });

    // Notify mentor
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title: 'Assignment Submitted',
      content: `Submission received for assignment: ${assignments.find(a => a.id === assignmentId)?.title || ''}`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const u = [newNotif, ...prev];
      save('lms_notifications', u);
      return u;
    });

    // Add XP for submission
    setLeaderboard(prev => {
      const u = prev.map(entry => {
        if (entry.studentId === currentUser.id) {
          return { ...entry, xp: entry.xp + 100 };
        }
        return entry;
      });
      save('lms_leaderboard', u);
      return u;
    });
  };

  const evaluateSubmission = (submissionId: string, score: number, feedback: string) => {
    const updated = submissions.map(sub => {
      if (sub.id === submissionId) {
        // Notify student of grading
        const newNotif: Notification = {
          id: `notif_${Date.now()}`,
          title: 'Assignment Graded',
          content: `Your assignment submission was graded. Score: ${score}/100. Feedback: "${feedback}"`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications(prev => {
          const u = [newNotif, ...prev];
          save('lms_notifications', u);
          return u;
        });

        // Add XP to student leaderboard
        setLeaderboard(prev => {
          const u = prev.map(entry => {
            if (entry.studentId === sub.studentId) {
              return { 
                ...entry, 
                xp: entry.xp + (score * 2), // 2 XP per score point
                assignmentScore: Math.round((entry.assignmentScore + score) / 2),
              };
            }
            return entry;
          });
          save('lms_leaderboard', u);
          return u;
        });

        return { ...sub, status: 'evaluated' as const, score, feedback, evaluatedAt: new Date().toISOString() };
      }
      return sub;
    });
    setSubmissions(updated);
    save('lms_submissions', updated);
  };

  // Live sessions
  const createLiveSession = async (sessionData: Omit<LiveSession, 'id'>) => {
    const id = `session-${Math.random().toString(36).substring(7)}`;
    const newSession: LiveSession = {
      ...sessionData,
      id,
      mentorId: currentUser.id,
        platform: 'in_app',
      meetingLink: `ai-institute-${id}`,
      status: 'scheduled',
    };

    // Sync to Supabase if authenticated
    const supabase = createClient();
    if (isAuthenticated) {
      await supabase.from('live_sessions').insert({
        course_id: sessionData.courseId,
        mentor_id: currentUser.id,
        title: sessionData.title,
        description: sessionData.description,
        session_date: sessionData.date,
        start_time: sessionData.startTime + ":00",
        duration: sessionData.duration,
        mentorId: currentUser.id,
        platform: 'in_app',
        meeting_link: `ai-institute-${id}`,
      });
    }

    const updated = [newSession, ...liveSessions];
    setLiveSessions(updated);
    save('lms_live_sessions', updated);

    // Notify all students
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title: 'New Live Session Scheduled',
      content: `${newSession.title} has been scheduled for ${newSession.date} at ${newSession.startTime}.`,
      type: 'live',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const u = [newNotif, ...prev];
      save('lms_notifications', u);
      return u;
    });
  };

  const addSavedLiveRecording = async (recording: Omit<SavedLiveRecording, 'id'>) => {
    const newRec: SavedLiveRecording = {
      ...recording,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
    };
    setSavedRecordings(prev => {
      const u = [newRec, ...prev];
      save('lms_saved_recordings', u);
      return u;
    });
  };

  const deleteSavedLiveRecording = async (id: string) => {
    setSavedRecordings(prev => {
      const u = prev.filter(r => r.id !== id);
      save('lms_saved_recordings', u);
      return u;
    });
  };

  const updateLiveSessionStatus = (sessionId: string, status: 'scheduled' | 'live' | 'completed') => {
    const updated = liveSessions.map(s => s.id === sessionId ? { ...s, status } : s);
    setLiveSessions(updated);
    save('lms_live_sessions', updated);

    // When a live lecture completes:
    // 1. Auto-upload Web Only Recorded Lecture
    // 2. Auto-generate AI Handwritten Class Notes & upload to Student Notes
    if (status === 'completed') {
      const session = liveSessions.find(s => s.id === sessionId);
      if (session) {
        // 1. Web Only Recorded Lecture
        const recId = `rec-web-${sessionId}`;
        if (!videos.some(v => v.id === recId)) {
          const newRecVideo: Video = {
            id: recId,
            courseId: session.courseId,
            title: `🎥 Web Recording: ${session.title}`,
            description: `Recorded Web Lecture from live session conducted on ${session.date || new Date().toLocaleDateString()}`,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '45 mins',
            orderIndex: videos.length + 1,
            webOnly: true,
            isRecordedLive: true,
          };
          setVideos(prev => {
            const u = [...prev, newRecVideo];
            save('lms_videos', u);
            return u;
          });
        }

        // 2. AI Handwritten Class Notes
        const noteId = `note-ai-hw-${sessionId}`;
        if (!notes.some(n => n.id === noteId)) {
          const newHandwrittenNote: Note = {
            id: noteId,
            courseId: session.courseId,
            title: `✍️ AI Handwritten Notes: ${session.title}`,
            fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            fileSize: '1.4 MB',
            description: `AI-generated handwritten class notebook summarizing live lecture concepts, board notes & key takeaways.`,
            isHandwritten: true,
            isAiGenerated: true,
            handwrittenContent: {
              topicSummary: `Automated AI lecture summary of ${session.title}. In this live class, the mentor covered core foundational concepts, architectural patterns, and real-world implementation strategies.`,
              keyPoints: [
                'Core principles & architectural framework overview',
                'Step-by-step hands-on implementation and live coding',
                'Best practices, performance optimization & error handling',
                'Q&A and student assignment guidelines'
              ],
              formulasOrKeyConcepts: [
                'Loss Function = Σ (y_real - y_pred)^2',
                'Optimal Learning Rate α ∈ [0.001, 0.01]',
                'Model Accuracy Matrix & Cross-Validation Split'
              ],
              teacherTips: 'Remember to practice the notebook exercises before the next live session!',
              date: new Date().toLocaleDateString()
            }
          };
          setNotes(prev => {
            const u = [...prev, newHandwrittenNote];
            save('lms_notes', u);
            return u;
          });
        }

        // 3. AI Generated Practice Test & MCQ Questions
        const testId = `test-ai-gen-${sessionId}`;
        if (!tests.some(t => t.id === testId)) {
          const newAiTest: Test = {
            id: testId,
            courseId: session.courseId,
            title: `🤖 AI Live Lecture Quiz: ${session.title}`,
            description: `Automated AI-generated practice test created from key concepts & discussion in ${session.title}.`,
            durationMinutes: 15,
            totalQuestions: 3,
            totalPoints: 30,
            isAiGenerated: true,
          };

          const newAiQuestions: Question[] = [
            {
              id: `q-ai-1-${sessionId}`,
              testId: testId,
              questionText: `What was the primary architectural focus covered in ${session.title}?`,
              questionType: 'mcq',
              options: [
                'Core architectural principles & scalable implementation',
                'Legacy procedural scripting',
                'Manual file backups',
                'Unoptimized loops'
              ],
              correctAnswer: 'Core architectural principles & scalable implementation',
              points: 10,
              orderIndex: 1,
            },
            {
              id: `q-ai-2-${sessionId}`,
              testId: testId,
              questionText: `Which hyperparameter optimization approach was recommended during live class?`,
              questionType: 'mcq',
              options: [
                'Learning Rate α ∈ [0.001, 0.01] with cross-validation',
                'Setting learning rate to 0.99',
                'Disabling loss functions',
                'Ignoring test split validation'
              ],
              correctAnswer: 'Learning Rate α ∈ [0.001, 0.01] with cross-validation',
              points: 10,
              orderIndex: 2,
            },
            {
              id: `q-ai-3-${sessionId}`,
              testId: testId,
              questionText: `What is the key takeaway for production deployment discussed by the mentor?`,
              questionType: 'mcq',
              options: [
                'Enforce strict input validation & error boundaries',
                'Hardcode production credentials',
                'Disable security logging',
                'Skip unit test verification'
              ],
              correctAnswer: 'Enforce strict input validation & error boundaries',
              points: 10,
              orderIndex: 3,
            }
          ];

          setTests(prev => {
            const u = [...prev, newAiTest];
            save('lms_tests', u);
            return u;
          });
          setQuestions(prev => {
            const u = [...prev, ...newAiQuestions];
            save('lms_questions', u);
            return u;
          });
        }
      }
    }
  };

  
  const rateMentor = async (mentorId: string, rating: number) => {
    const supabase = createClient();
    try {
      await supabase.rpc('rate_mentor', { p_mentor_id: mentorId, p_rating: rating });
    } catch(err) {
      console.error("Failed to rate mentor", err);
    }
  };

  const sendLiveChatMessage = async (sessionId: string, message: string) => {
    const tempId = `temp_${Math.random().toString(36).substring(7)}`;
    const newChat: LiveChat = {
      id: tempId,
      sessionId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      message,
      createdAt: new Date().toISOString()
    };
    
    setLiveChats(prev => [...prev, newChat]);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('live_chats').insert({
        session_id: sessionId,
        user_id: currentUser.id,
        user_name: currentUser.fullName,
        user_role: currentUser.role,
        message,
      });
    }
  };

  // Notes operations
  const addNote = async (noteData: Omit<Note, 'id'>) => {
    const id = `note-${Math.random().toString(36).substring(7)}`;
    const newNote: Note = { ...noteData, id };
    
    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('notes').insert({
        course_id: noteData.courseId,
        title: noteData.title,
        file_url: noteData.fileUrl,
        file_size: noteData.fileSize,
        description: noteData.description
      });
    }
    
    setNotes(prev => {
      const u = [...prev, newNote];
      save('lms_notes', u);
      return u;
    });
  };

  // Assignments operations
  const addAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    let realId = `assignment-${Math.random().toString(36).substring(7)}`;
    
    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: assDb } = await supabase.from('assignments').insert({
        course_id: assignmentData.courseId,
        title: assignmentData.title,
        description: assignmentData.description,
        file_url: assignmentData.fileUrl || '#',
        due_date: assignmentData.dueDate,
        points: assignmentData.points
      }).select().single();

      if (assDb) {
        realId = assDb.id;
      }
    }

    const newAssignment: Assignment = { ...assignmentData, id: realId };

    setAssignments(prev => {
      const u = [...prev, newAssignment];
      save('lms_assignments', u);
      return u;
    });
  };

  // Tests & Quizzes operations
  const createTest = async (
    testData: Omit<Test, 'id' | 'totalQuestions' | 'totalPoints'>,
    questionsList: Omit<Question, 'id' | 'testId'>[]
  ) => {
    let realTestId = `test-${Math.random().toString(36).substring(7)}`;
    const totalPoints = questionsList.reduce((acc, q) => acc + q.points, 0);
    const totalQuestions = questionsList.length;
    let questionIdMap: Record<number, string> = {};

    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: testDb } = await supabase.from('tests').insert({
        course_id: testData.courseId,
        title: testData.title,
        description: testData.description,
        duration_minutes: testData.durationMinutes,
        total_questions: totalQuestions,
        total_points: totalPoints,
      }).select().single();

      if (testDb) {
        realTestId = testDb.id;
        const dbQs = questionsList.map((q, idx) => ({
          test_id: testDb.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options,
          correct_answer: q.correctAnswer,
          points: q.points,
          order_index: idx + 1,
        }));
        const { data: qsDb } = await supabase.from('questions').insert(dbQs).select();
        if (qsDb) {
          qsDb.forEach((insertedQ) => {
            questionIdMap[insertedQ.order_index] = insertedQ.id;
          });
        }
      }
    }

    const newTest: Test = {
      ...testData,
      id: realTestId,
      totalQuestions,
      totalPoints,
    };

    const newQuestions: Question[] = questionsList.map((q, idx) => ({
      ...q,
      id: questionIdMap[idx + 1] || `q-${Math.random().toString(36).substring(7)}`,
      testId: realTestId,
      orderIndex: idx + 1,
    }));

    setTests(prev => {
      const u = [...prev, newTest];
      save('lms_tests', u);
      return u;
    });

    setQuestions(prev => {
      const u = [...prev, ...newQuestions];
      save('lms_questions', u);
      return u;
    });
  };

  const submitTest = async (testId: string, answers: Record<string, string>, score: number) => {
    const newSubmission: TestSubmission = {
      id: `tsub_${Math.random().toString(36).substring(7)}`,
      testId,
      studentId: currentUser.id,
      score,
      answers,
      submittedAt: new Date().toISOString(),
    };

    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('test_submissions').insert({
        test_id: testId,
        student_id: currentUser.id,
        score,
        answers,
      });
    }

    setTestSubmissions(prev => {
      const u = [...prev, newSubmission];
      save('lms_test_submissions', u);
      return u;
    });

    // Add XP to student leaderboard
    setLeaderboard(prev => {
      const u = prev.map(entry => {
        if (entry.studentId === currentUser.id) {
          return {
            ...entry,
            xp: entry.xp + score * 5 + 100,
            testScore: Math.round((entry.testScore + (score / 20) * 100) / 2),
          };
        }
        return entry;
      });
      save('lms_leaderboard', u);
      return u;
    });

    // Trigger notification
    const testTitle = tests.find(t => t.id === testId)?.title || 'Quiz';
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title: 'Quiz Completed',
      content: `You completed "${testTitle}" with a score of ${score} points. +${score * 5 + 100} XP awarded!`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const u = [newNotif, ...prev];
      save('lms_notifications', u);
      return u;
    });
  };

  const joinLiveSession = (sessionId: string) => {
    const session = liveSessions.find(s => s.id === sessionId);
    if (!session) return;

    setActiveLiveSessionId(sessionId);

    // Check if attendance already marked
    const alreadyMarked = attendance.some(a => a.liveSessionId === sessionId && a.studentId === currentUser.id);
    if (alreadyMarked) return;

    const course = courses.find(c => c.id === session.courseId);

    // Mark attendance
    const record: AttendanceRecord = {
      id: `att_${Math.random().toString(36).substring(7)}`,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      courseName: course?.title || 'AI Course',
      lectureName: session.title,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: session.duration,
      status: 'present',
      liveSessionId: session.id,
    };

    const updated = [record, ...attendance];
    setAttendance(updated);
    save('lms_attendance', updated);

    // Add XP to student leaderboard
    setLeaderboard(prev => {
      const u = prev.map(entry => {
        if (entry.studentId === currentUser.id) {
          const count = attendance.filter(a => a.studentId === currentUser.id).length + 1;
          const totalSessions = liveSessions.filter(s => s.courseId === session.courseId).length || 1;
          return { 
            ...entry, 
            xp: entry.xp + 150, // 150 XP for attending live session!
            attendanceScore: Math.min(100, Math.round((count / totalSessions) * 100)),
          };
        }
        return entry;
      });
      save('lms_leaderboard', u);
      return u;
    });

    // Notify user of marked attendance and automated email simulation
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title: 'Attendance Marked Successfully',
      content: `Attendance registered for: "${session.title}". An attendance confirmation email has been dispatched to ${currentUser.email}.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const u = [newNotif, ...prev];
      save('lms_notifications', u);
      return u;
    });
  };

  // Community Chat Operations
  const addCommunityPost = async (courseId: string, content: string, imageUrl?: string) => {
    // Restrict #announcements channel to Mentors & Admins only
    if (activeChannel === 'announcements' && currentUser.role === 'student') {
      console.warn('Students are restricted from posting in the #announcements channel.');
      return;
    }

    const validCourseId = courseId || 'course-ds';
    const tempId = `temp_${Date.now()}`;
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    const newPost: CommunityPost = {
      id: tempId,
      courseId: validCourseId,
      channelId: activeChannel || 'general',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      userAvatar: currentUser.avatarUrl,
      content,
      imageUrl,
      pinned: false,
      reactions: [],
      comments: [],
      createdAt: new Date().toISOString(),
      expiresAt: oneYearFromNow,
    };
    setCommunityPosts(prev => {
      const updated = [...prev, newPost];
      save('lms_community', updated);
      return updated;
    });

    try {
      const { data, error } = await supabase.from('community_posts').insert({
        course_id: validCourseId,
        channel_id: activeChannel || 'general',
        user_id: currentUser.id,
        user_name: currentUser.fullName,
        user_role: currentUser.role,
        user_avatar: currentUser.avatarUrl,
        content,
        image_url: imageUrl,
        pinned: false,
        reactions: [],
        comments: []
      }).select().single();

      if (data && !error) {
        setCommunityPosts(prev => {
          const u = prev.map(p => p.id === tempId ? { ...p, id: data.id, createdAt: data.created_at || p.createdAt } : p);
          save('lms_community', u);
          return u;
        });
      }
    } catch (err) {
      console.error("Community post insert error:", err);
    }
  };

  const addCommentToPost = async (postId: string, content: string) => {
    const newComment: CommunityComment = {
      id: `c_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      userAvatar: currentUser.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    let updatedComments = [] as CommunityComment[];
    const updated = communityPosts.map(post => {
      if (post.id === postId) {
        updatedComments = [...post.comments, newComment];
        return { ...post, comments: updatedComments };
      }
      return post;
    });
    setCommunityPosts(updated);

    if (!postId.startsWith('temp_')) {
      await supabase.from('community_posts').update({ comments: updatedComments }).eq('id', postId);
    }
  };

  const reactToPost = async (postId: string, emoji: string) => {
    let finalReactions = [] as any[];
    const updated = communityPosts.map(post => {
      if (post.id === postId) {
        const existingReactionIndex = post.reactions.findIndex(r => r.emoji === emoji);
        let updatedReactions = [...post.reactions];

        if (existingReactionIndex > -1) {
          const rx = updatedReactions[existingReactionIndex];
          const hasReacted = rx.users.includes(currentUser.id);
          
          if (hasReacted) {
            const newUsers = rx.users.filter(u => u !== currentUser.id);
            if (newUsers.length === 0) {
              updatedReactions = updatedReactions.filter(r => r.emoji !== emoji);
            } else {
              updatedReactions[existingReactionIndex] = { ...rx, count: rx.count - 1, users: newUsers };
            }
          } else {
            updatedReactions[existingReactionIndex] = { ...rx, count: rx.count + 1, users: [...rx.users, currentUser.id] };
          }
        } else {
          updatedReactions.push({ emoji, count: 1, users: [currentUser.id] });
        }
        
        finalReactions = updatedReactions;
        return { ...post, reactions: updatedReactions };
      }
      return post;
    });
    setCommunityPosts(updated);

    if (!postId.startsWith('temp_')) {
      await supabase.from('community_posts').update({ reactions: finalReactions }).eq('id', postId);
    }
  };

  const deleteCommunityPost = async (postId: string) => {
    setCommunityPosts(communityPosts.filter(post => post.id !== postId));
    if (!postId.startsWith('temp_')) {
      await supabase.from('community_posts').delete().eq('id', postId);
    }
  };

  const pinCommunityPost = async (postId: string) => {
    let newPinnedState = false;
    const updated = communityPosts.map(post => {
      if (post.id === postId) {
        newPinnedState = !post.pinned;
        return { ...post, pinned: newPinnedState };
      }
      return post;
    });
    setCommunityPosts(updated);

    if (!postId.startsWith('temp_')) {
      await supabase.from('community_posts').update({ pinned: newPinnedState }).eq('id', postId);
    }
  };

  // Notifications
  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    
    if (unreadIds.length > 0) {
      // Supabase update where id in unreadIds
      for (const id of unreadIds) {
        if (!id.startsWith('notif_')) {
          await supabase.from('notifications').update({ read: true }).eq('id', id);
        }
      }
    }
  };

  // Admin Panels
  const addLead = (leadData: Omit<Lead, 'id' | 'status' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Math.random().toString(36).substring(7)}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    const updated = [newLead, ...leads];
    setLeads(updated);
    save('lms_leads', updated);
  };

  const updateLeadStatus = (leadId: string, status: 'new' | 'contacted' | 'closed') => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status } : l);
    setLeads(updated);
    save('lms_leads', updated);
  };

  const refundPayment = (paymentId: string) => {
    const updated = payments.map(p => p.id === paymentId ? { ...p, status: 'refunded' as const } : p);
    setPayments(updated);
    save('lms_payments', updated);
  };

  const resetDatabase = () => {
    localStorage.removeItem('lms_courses');
    localStorage.removeItem('lms_enrolled');
    localStorage.removeItem('lms_videos');
    localStorage.removeItem('lms_notes');
    localStorage.removeItem('lms_assignments');
    localStorage.removeItem('lms_tests');
    localStorage.removeItem('lms_questions');
    localStorage.removeItem('lms_test_submissions');
    localStorage.removeItem('lms_progress');
    localStorage.removeItem('lms_submissions');
    localStorage.removeItem('lms_live_sessions');
    localStorage.removeItem('lms_attendance');
    localStorage.removeItem('lms_leaderboard');
    localStorage.removeItem('lms_community');
    localStorage.removeItem('lms_notifications');
    localStorage.removeItem('lms_payments');
    localStorage.removeItem('lms_leads');
    localStorage.removeItem('lms_user');

    // Reload
    window.location.reload();
  };

  return (
    <DatabaseContext.Provider value={{
      currentUser,
      isAuthenticated,
      authReady,
      logout,
      registerNewDeviceSession,
      loginAs,
      updateProfile,
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
      notifications,
      markNotificationsAsRead,
      payments,
      leads,
      addLead,
      updateLeadStatus,
      refundPayment,
      resetDatabase
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

