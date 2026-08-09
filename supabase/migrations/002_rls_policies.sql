-- RLS Policies for AI Institute LMS Notes, Assignments, Live Sessions, Tests, and Questions

-- Enable Row Level Security (just in case they weren't fully set in init script)
alter table public.live_sessions enable row level security;
alter table public.notes enable row level security;
alter table public.assignments enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.test_submissions enable row level security;

-- 1. Live Sessions Policies
create policy "Live sessions are viewable by authenticated users" on public.live_sessions
  for select using (auth.uid() is not null);

create policy "Mentors and Admins can manage live sessions" on public.live_sessions
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- 2. Notes Policies
create policy "Notes are viewable by authenticated users" on public.notes
  for select using (auth.uid() is not null);

create policy "Mentors and Admins can manage notes" on public.notes
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- 3. Assignments Policies
create policy "Assignments are viewable by authenticated users" on public.assignments
  for select using (auth.uid() is not null);

create policy "Mentors and Admins can manage assignments" on public.assignments
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- 4. Tests Policies
create policy "Tests are viewable by authenticated users" on public.tests
  for select using (auth.uid() is not null);

create policy "Mentors and Admins can manage tests" on public.tests
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- 5. Questions Policies
create policy "Questions are viewable by authenticated users" on public.questions
  for select using (auth.uid() is not null);

create policy "Mentors and Admins can manage questions" on public.questions
  for all using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

-- 6. Test Submissions Policies
create policy "Students can view their own test submissions" on public.test_submissions
  for select using (auth.uid() = student_id);

create policy "Mentors and Admins can view all test submissions" on public.test_submissions
  for select using (
    exists (
      select 1 from public.profiles
      where public.profiles.id = auth.uid() and public.profiles.role in ('admin', 'mentor')
    )
  );

create policy "Students can insert their own test submissions" on public.test_submissions
  for insert with check (auth.uid() = student_id);
