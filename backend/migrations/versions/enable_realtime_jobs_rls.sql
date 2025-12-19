-- Enable RLS policies for jobs table to allow realtime subscriptions
-- This allows the anon role to SELECT from jobs table for realtime updates

-- Policy for anon role to read jobs (required for realtime)
CREATE POLICY IF NOT EXISTS "Allow anon to read jobs for realtime"
ON public.jobs
FOR SELECT
TO anon
USING (true);

-- Policy for authenticated users to read jobs
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled on the jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
