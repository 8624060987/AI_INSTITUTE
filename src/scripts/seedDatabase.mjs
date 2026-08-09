import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.resolve(__dirname, '../../.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
  console.error("Could not read .env.local");
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    envVars[key.trim()] = val.join('=').trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_COURSES = [
  {
    title: 'Data Science Mastery Program',
    description: 'Master statistics, machine learning algorithms, deep learning models, and deploy production-level data projects.',
    category: 'Data Science',
    price: 4999,
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400',
    duration: '250+ Hours',
    rating: 4.8,
    students_count: 1245,
    curriculum: ['Introduction to Data Science', 'Python for Data Science', 'Machine Learning Basics', 'Statistics & Probability', 'Data Analysis with Pandas', 'Data Visualization'],
  },
  {
    title: 'Data Analyst Professional',
    description: 'Learn SQL, Tableau, PowerBI, Excel and statistics to gather insights and drive data-informed decisions.',
    category: 'Data Analyst',
    price: 3499,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
    duration: '120+ Hours',
    rating: 4.7,
    students_count: 890,
    curriculum: ['Excel Foundations', 'SQL for Analytics', 'Data Visualization with Tableau', 'PowerBI Dashboards', 'Business Analytics Core'],
  },
  {
    title: 'AI & Machine Learning Complete Guide',
    description: 'A deep dive into neural networks, reinforcement learning, Computer Vision, and Natural Language Processing.',
    category: 'AI & ML',
    price: 6499,
    image_url: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=400',
    duration: '300+ Hours',
    rating: 4.9,
    students_count: 1530,
    curriculum: ['Linear Algebra & Calculus', 'Neural Networks from Scratch', 'Computer Vision Basics', 'Natural Language Processing', 'Deploying Models to Cloud'],
  }
];

const SEED_VIDEOS = [
  {
    title: '1. Introduction to Data Science',
    description: 'Overview of the data science lifecycle, roles, and course syllabus.',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '15:45',
    order_index: 1,
  },
  {
    title: '2. Python Setup and Basic Syntax',
    description: 'Install Anaconda, navigate Jupyter notebooks, and write basic Python constructs.',
    video_url: 'https://www.w3schools.com/html/movie.mp4',
    duration: '12:30',
    order_index: 2,
  }
];

async function seed() {
  console.log("Starting DB Seed...");

  // 1. Create a dummy mentor profile
  // Because 'profiles' is linked to 'auth.users' via foreign key, and we can't easily create auth users using ANON key, 
  // we will skip setting mentor_id for now (it allows null).

  // 2. Insert Courses
  console.log("Inserting courses...");
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .insert(SEED_COURSES)
    .select();

  if (courseError) {
    console.error("Error inserting courses:", courseError);
    return;
  }
  console.log("Courses inserted:", courses.length);

  // 3. Insert Videos for the first course
  const firstCourseId = courses[0].id;
  console.log("Inserting videos for course:", firstCourseId);
  const videosWithCourse = SEED_VIDEOS.map(v => ({ ...v, course_id: firstCourseId }));
  
  const { data: videos, error: videoError } = await supabase
    .from('videos')
    .insert(videosWithCourse)
    .select();

  if (videoError) {
    console.error("Error inserting videos:", videoError);
    return;
  }
  console.log("Videos inserted:", videos.length);

  // 4. Create community channels
  console.log("Inserting community channels...");
  const channels = [
    { name: 'General Discussion', type: 'general' },
    { name: 'Resources & Links', type: 'resources' }
  ];
  const { error: channelError } = await supabase.from('community_channels').upsert(channels, { onConflict: 'name' });
  if (channelError) console.error("Error inserting channels:", channelError);

  console.log("Seed complete!");
}

seed();
