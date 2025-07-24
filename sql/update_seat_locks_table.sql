-- Migration to add funcion_id and session_id columns to seat_locks table and update RLS policies

ALTER TABLE public.seat_locks
ADD COLUMN IF NOT EXISTS funcion_id integer REFERENCES funciones(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS session_id uuid;

-- Ensure composite primary key on (funcion_id, seat_id)
ALTER TABLE public.seat_locks
DROP CONSTRAINT IF EXISTS seat_locks_pkey,
ADD PRIMARY KEY (funcion_id, seat_id);

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow insert with session_id" ON public.seat_locks;
DROP POLICY IF EXISTS "Allow delete by session_id" ON public.seat_locks;
DROP POLICY IF EXISTS "Allow select for all" ON public.seat_locks;

-- Create policy to allow inserts only if session_id is not null and matches current session
CREATE POLICY "Allow insert with valid session_id"
ON public.seat_locks
FOR INSERT
WITH CHECK (session_id IS NOT NULL AND session_id = auth.uid());

-- Create policy to allow deletes only if session_id matches current session
CREATE POLICY "Allow delete by session_id"
ON public.seat_locks
FOR DELETE
USING (session_id = auth.uid());

-- Create policy to allow selects for all authenticated users
CREATE POLICY "Allow select for authenticated users"
ON public.seat_locks
FOR SELECT
TO authenticated
USING (true);
