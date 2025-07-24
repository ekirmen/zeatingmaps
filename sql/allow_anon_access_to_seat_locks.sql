-- Allow anonymous users to read and modify seat locks using a session_id.
-- Drops existing policies and creates more permissive ones that don't require
-- auth.uid(), so incognito sessions can manage locks.

DROP POLICY IF EXISTS "Allow insert with valid session_id" ON public.seat_locks;
DROP POLICY IF EXISTS "Allow delete by session_id" ON public.seat_locks;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.seat_locks;
DROP POLICY IF EXISTS "Allow update by session_id" ON public.seat_locks;

-- Insert allowed for both authenticated and anon roles as long as a session_id
-- is supplied. This enables guest users to lock seats.
CREATE POLICY "Allow insert with session_id"
ON public.seat_locks
FOR INSERT
TO authenticated, anon
WITH CHECK (session_id IS NOT NULL);

-- Delete allowed when a session_id is present. The client is expected to filter
-- by session_id so users can only remove their own locks.
CREATE POLICY "Allow delete with session_id"
ON public.seat_locks
FOR DELETE
TO authenticated, anon
USING (session_id IS NOT NULL);

-- Permit updates when a session_id is provided. This enables upserts used by
-- the application when extending an existing lock.
CREATE POLICY "Allow update with session_id"
ON public.seat_locks
FOR UPDATE
TO authenticated, anon
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- Allow all users to select seat locks to display seat availability.
CREATE POLICY "Allow select for all"
ON public.seat_locks
FOR SELECT
USING (true);
