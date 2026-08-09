-- Initial SQL migration for AI Institute LMS Database Setup

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles / Users Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'mentor', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Courses Table
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text not null,
  price numeric not null,
  image_url text,
  mentor_id uuid references public.profiles(id) on delete set null,
  curriculum jsonb default '[]'::jsonb,
  duration text,
  rating numeric default 4.8,
  students_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Course Enrollments Table
create table public.course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, course_id)
);

-- 4. Live Sessions Table
create table public.live_sessions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  mentor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  session_date date not null,
  start_time time not null,
  duration integer not null, -- in minutes
  platform text check (platform in ('zoom', 'google_meet', 'teams', 'custom')) not null,
  meeting_link text not null,
  settings jsonb default '{"chat": true, "record": true, "email_reminder": true, "join_early": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Attendance Table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  live_session_id uuid references public.live_sessions(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('present', 'absent')) default 'present',
  duration_minutes integer,
  email_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Videos Table
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text not null,
  duration text,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Video Progress Table
create table public.video_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  progress_seconds integer default 0,
  completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, video_id)
);

-- 8. Notes Table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_size text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Assignments Table
create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text,
  due_date timestamp with time zone not null,
  points integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Assignment Submissions
create table public.assignment_submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  file_url text not null,
  status text check (status in ('submitted', 'evaluated')) default 'submitted',
  score integer,
  feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  evaluated_at timestamp with time zone,
  unique (assignment_id, student_id)
);

-- 11. Projects Table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamp with time zone not null,
  points integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Project Submissions Table
create table public.project_submissions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  file_url text not null,
  status text check (status in ('submitted', 'evaluated')) default 'submitted',
  score integer,
  feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  evaluated_at timestamp with time zone,
  unique (project_id, student_id)
);

-- 13. Tests Table
create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  duration_minutes integer not null,
  total_questions integer not null,
  total_points integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Questions Table
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  question_text text not null,
  question_type text check (question_type in ('mcq', 'text')) default 'mcq',
  options jsonb default '[]'::jsonb, -- array of options for MCQ
  correct_answer text not null,
  points integer default 10,
  order_index integer not null
);

-- 15. Test Submissions Table
create table public.test_submissions (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null,
  answers jsonb not null, -- JSON object of student answers
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (test_id, student_id)
);

-- 16. Community Channels Table
create table public.community_channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  type text check (type in ('general', 'announcements', 'resources', 'doubts')) default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. Community Posts Table
create table public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.community_channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 18. Community Comments Table
create table public.community_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 19. Community Reactions Table
create table public.community_reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, user_id, emoji)
);

-- 20. Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  type text not null,
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 21. Leaderboard Table
create table public.leaderboard (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  weekly_points integer default 0,
  monthly_points integer default 0,
  overall_points integer default 0,
  badges jsonb default '[]'::jsonb,
  rank integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, course_id)
);

-- 22. Certificates Table
create table public.certificates (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  certificate_number text not null unique,
  file_url text not null,
  completion_date date not null,
  qr_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, course_id)
);

-- 23. Coupons Table
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  discount_percentage integer not null,
  active boolean default true,
  expiry_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 24. Payments / Transactions Table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'INR' not null,
  status text check (status in ('success', 'pending', 'failed', 'refunded')) not null,
  provider text check (provider in ('stripe', 'razorpay')) not null,
  provider_payment_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 25. Leads Table (Landing Page Leads)
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  phone text,
  course_interest text,
  message text,
  status text check (status in ('new', 'contacted', 'closed')) default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 26. Blogs Table
create table public.blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.live_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.videos enable row level security;
alter table public.video_progress enable row level security;
alter table public.notes enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.projects enable row level security;
alter table public.project_submissions enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.test_submissions enable row level security;
alter table public.community_channels enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.leaderboard enable row level security;
alter table public.certificates enable row level security;
alter table public.coupons enable row level security;
alter table public.payments enable row level security;
alter table public.leads enable row level security;
alter table public.blogs enable row level security;

-- Setup RLS Policies (Example: Profiles)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Setup RLS Policies (Example: Courses)
create policy "Courses are viewable by everyone." on public.courses
  for select using (true);

create policy "Mentors and Admins can manage courses." on public.courses
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- Setup RLS Policies (Example: Enrollments)
create policy "Students can view their own enrollments." on public.course_enrollments
  for select using (auth.uid() = student_id);

create policy "Students can enroll in courses." on public.course_enrollments
  for insert with check (auth.uid() = student_id);

-- Setup RLS Policies (Example: Community)
create policy "Community channels are viewable by authenticated users." on public.community_channels
  for select using (auth.uid() is not null);

create policy "Community posts are viewable by channel members." on public.community_posts
  for select using (auth.uid() is not null);

create policy "Authenticated users can post to community channels." on public.community_posts
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own posts." on public.community_posts
  for delete using (auth.uid() = user_id or exists (
    select 1 from public.profiles where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
  ));
