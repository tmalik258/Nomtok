-- Enable RLS policies for jobs table to allow realtime subscriptions
-- This allows the anon role to SELECT from jobs table for realtime updates

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anon to read jobs for realtime" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated users to read jobs" ON public.jobs;

-- Policy for anon role to read jobs (required for realtime)
CREATE POLICY "Allow anon to read jobs for realtime"
ON public.jobs
FOR SELECT
TO anon
USING (true);

-- Policy for authenticated users to read jobs
CREATE POLICY "Allow authenticated users to read jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled on the jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
