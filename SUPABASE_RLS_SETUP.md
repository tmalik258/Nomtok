# Supabase RLS Policy Setup for Jobs Realtime

## Problem
Realtime is enabled on the `jobs` table, but no events are being received because Row Level Security (RLS) is enabled without any policies. This blocks the `anon` role from reading the table, which prevents Supabase Realtime from delivering events.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
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
```

### Option 2: Use Supabase Dashboard UI

1. Go to **Authentication → Policies**
2. Find the `jobs` table
3. Click **New Policy**
4. Create a policy with:
   - **Policy Name**: `Allow anon to read jobs for realtime`
   - **Allowed Operation**: `SELECT`
   - **Target Roles**: `anon`
   - **USING expression**: `true`
5. Click **Save**

## Verification

After creating the policy:

1. Refresh your dashboard page
2. Check the **Realtime Diagnostics** panel (bottom-left)
3. You should see:
   - Subscription Status: `SUBSCRIBED`
   - Events Received: Should increment when jobs are updated
4. Check browser console for:
   - `✅ Successfully subscribed to jobs realtime`
   - `📥 Raw UPDATE payload received:` when jobs update

## Security Note

The policy `USING (true)` allows all rows to be read. If you need more restrictive access:

- Filter by user ID: `USING (user_id = auth.uid())`
- Filter by status: `USING (status IN ('running', 'completed'))`
- Combine conditions: `USING (user_id = auth.uid() OR status = 'public')`

For realtime to work, the `anon` role must have SELECT permission, even if you restrict which rows are visible.
