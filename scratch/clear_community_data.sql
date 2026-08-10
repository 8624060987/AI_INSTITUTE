-- SQL Script to clear old community posts, live chats, and scheduled lectures in Supabase
-- Run this in Supabase SQL Editor to start with a fresh clean database

TRUNCATE TABLE public.community_posts CASCADE;
TRUNCATE TABLE public.live_chats CASCADE;
TRUNCATE TABLE public.live_sessions CASCADE;

-- Insert Fresh Welcome Announcement in Community
INSERT INTO public.community_posts (id, course_id, channel_id, user_id, user_name, user_role, user_avatar, content, pinned, reactions, comments, created_at)
VALUES (
  'post-welcome-fresh',
  'course-gen-ai',
  'announcements',
  'mentor-vaibhav',
  'Vaibhav Ahire (Lead Mentor)',
  'mentor',
  '/uploads/vaibhav_ahire.jpg',
  '🎉 Welcome to AI Institute Satana Official Community Platform! Share questions, collaborate on AI projects, and join live batch discussions here.',
  true,
  '[{"emoji": "👋", "count": 1, "users": ["mentor-vaibhav"]}]'::jsonb,
  '[]'::jsonb,
  NOW()
);

-- Insert Fresh Scheduled Orientation Lecture
INSERT INTO public.live_sessions (id, course_id, mentor_name, title, description, date, start_time, duration, platform, meeting_link, status)
VALUES (
  'session-fresh-1',
  'course-gen-ai',
  'Vaibhav Ahire',
  'Generative AI & LLMs Orientation Lecture',
  'Live interactive session covering course roadmap, hands-on projects, and AI tools setup.',
  '2026-08-15',
  '19:00',
  60,
  'google_meet',
  'https://meet.google.com/ai-institute-satana',
  'scheduled'
);
