-- Migration 005: Fix Row Level Security (RLS) & Secure Sensitive Columns for public.granted_access_passes
-- Resolves Supabase Advisor Critical Security Errors:
-- 1. Policy Exists RLS Disabled
-- 2. RLS Disabled in Public
-- 3. Sensitive Columns Exposed (password)

-- Step 1: Enable Row Level Security on public.granted_access_passes
ALTER TABLE public.granted_access_passes ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all legacy insecure public policies
DROP POLICY IF EXISTS "Public delete granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Public insert granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Public read granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Public update granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Allow public read granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Allow public insert granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Allow public update granted_access_passes" ON public.granted_access_passes;
DROP POLICY IF EXISTS "Allow public delete granted_access_passes" ON public.granted_access_passes;

-- Step 3: Create Secure RLS Policies for Authenticated Users, Mentors, and Admins

-- Policy 1: Authenticated Users / Students can read passes granted to their email
CREATE POLICY "Users can view access passes granted to their email" 
ON public.granted_access_passes
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND (
    gmail = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role IN ('admin', 'mentor')
    )
  )
);

-- Policy 2: Mentors and Admins can create access passes
CREATE POLICY "Mentors and Admins can insert access passes" 
ON public.granted_access_passes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role IN ('admin', 'mentor')
  )
  OR auth.role() = 'service_role'
);

-- Policy 3: Mentors and Admins can update access passes
CREATE POLICY "Mentors and Admins can update access passes" 
ON public.granted_access_passes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role IN ('admin', 'mentor')
  )
  OR auth.role() = 'service_role'
);

-- Policy 4: Mentors and Admins can delete access passes
CREATE POLICY "Mentors and Admins can delete access passes" 
ON public.granted_access_passes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role IN ('admin', 'mentor')
  )
  OR auth.role() = 'service_role'
);

-- Policy 5: Service Role full access fallback
CREATE POLICY "Service Role full access on granted_access_passes"
ON public.granted_access_passes
FOR ALL
USING (auth.role() = 'service_role');
