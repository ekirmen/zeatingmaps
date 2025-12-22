-- ==========================================
-- 1. Recreate Missing View: seat_status_view
-- ==========================================
-- This view is required by lock_seat_atomically to check status efficiently
DROP VIEW IF EXISTS seat_status_view;

-- Remove legacy trigger that tries to write to the view
DROP TRIGGER IF EXISTS update_seat_status_view_trigger ON seat_locks;
DROP FUNCTION IF EXISTS update_seat_status_view();

CREATE OR REPLACE VIEW seat_status_view AS
SELECT 
    seat_id,
    funcion_id,
    status,
    session_id,
    user_id,
    locked_at,
    expires_at,
    lock_type
FROM seat_locks
WHERE (expires_at > NOW() OR status IN ('vendido', 'pagado', 'reservado', 'bloqueado'));

-- ==========================================
-- 2. Fix RPC: check_seats_payment_status
-- ==========================================
-- Fixes "query has no destination for result data" error
-- Drop variants to avoid "Could not choose the best candidate function"
DROP FUNCTION IF EXISTS check_seats_payment_status(text[], integer, text, text);
DROP FUNCTION IF EXISTS check_seats_payment_status(text[], integer, text, uuid);
DROP FUNCTION IF EXISTS check_seats_payment_status(text[], integer, uuid, uuid);

CREATE OR REPLACE FUNCTION check_seats_payment_status(
    p_seat_ids text[], 
    p_funcion_id integer, 
    p_session_id text DEFAULT NULL, 
    p_user_id text DEFAULT NULL 
)
RETURNS TABLE (
    seat_id text,
    is_paid boolean,
    status text,
    source text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH payment_status AS (
        -- Check payment_transactions (Highest priority)
        SELECT 
            elem->>'id' as s_id,
            true as paid,
            'pagado' as st,
            'payment' as src
        FROM payment_transactions pt,
        jsonb_array_elements(pt.seats) as elem
        WHERE pt.status = 'completed' -- Explicitly qualify status column
        AND (elem->>'id' = ANY(p_seat_ids) OR elem->>'_id' = ANY(p_seat_ids))
    ),
    lock_status AS (
        -- Check seat_locks
        SELECT 
            sl.seat_id as s_id,
            CASE WHEN sl.status IN ('vendido', 'pagado') THEN true ELSE false END as paid,
            sl.status as st,
            'lock' as src
        FROM seat_locks sl
        WHERE sl.seat_id = ANY(p_seat_ids)
        AND sl.funcion_id = p_funcion_id
        AND (sl.expires_at > NOW() OR sl.status IN ('vendido', 'pagado', 'reservado', 'bloqueado'))
    )
    SELECT 
        u.unnest_seat_id as seat_id,
        COALESCE(p.paid, l.paid, false) as is_paid,
        COALESCE(p.st, l.st, 'disponible') as status,
        COALESCE(p.src, l.src, 'none') as source
    FROM unnest(p_seat_ids) as u(unnest_seat_id)
    LEFT JOIN payment_status p ON (p.s_id = u.unnest_seat_id OR p.s_id = 'silla_' || u.unnest_seat_id)
    LEFT JOIN lock_status l ON l.s_id = u.unnest_seat_id;
END;
$$;

-- ==========================================
-- 3. Fix RPC: lock_seat_atomically
-- ==========================================
-- Replaces usage of missing 'seat_status_view' relation error if any, 
-- and ensures correct atomic locking logic.
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, text, text);
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, text, text, text);

CREATE OR REPLACE FUNCTION lock_seat_atomically(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id text,
    p_status text DEFAULT 'seleccionado',
    p_tenant_id text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    seat_id text,
    funcion_id integer,
    session_id text,
    status text,
    locked_at timestamptz,
    expires_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_lock record;
    v_expires_at timestamptz;
BEGIN
    -- Set expiration (e.g., 10 minutes from now)
    v_expires_at := NOW() + interval '10 minutes';

    -- Check for existing active lock
    -- ALIAS tables to avoid ambiguity with output columns
    SELECT * INTO v_existing_lock 
    FROM seat_locks sl
    WHERE sl.seat_id = p_seat_id 
    AND sl.funcion_id = p_funcion_id
    AND (sl.expires_at > NOW() OR sl.status IN ('vendido', 'pagado', 'reservado', 'bloqueado'))
    FOR UPDATE; -- Row-level lock to prevent race conditions

    IF v_existing_lock.id IS NOT NULL THEN
        -- If locked by same session, extend it
        -- CAST p_session_id to UUID for comparison
        IF v_existing_lock.session_id = p_session_id::uuid AND v_existing_lock.status NOT IN ('vendido', 'pagado', 'reservado', 'bloqueado') THEN
             UPDATE seat_locks sl_update
             SET expires_at = v_expires_at,
                 locked_at = NOW(),
                 tenant_id = COALESCE(p_tenant_id::uuid, sl_update.tenant_id)
             WHERE sl_update.id = v_existing_lock.id
             RETURNING sl_update.id, sl_update.seat_id, sl_update.funcion_id, sl_update.session_id::text, sl_update.status, sl_update.locked_at, sl_update.expires_at;
             
             RETURN QUERY SELECT v_existing_lock.id, v_existing_lock.seat_id, v_existing_lock.funcion_id, v_existing_lock.session_id::text, v_existing_lock.status, NOW() as locked_at, v_expires_at as expires_at;
             RETURN;
        ELSE
             -- Locked by someone else or permanent status
             RAISE EXCEPTION 'seat_already_locked' USING HINT = 'Asiento ya ocupado';
        END IF;
    END IF;

    -- Insert new lock
    -- CAST p_session_id to UUID for insert
    RETURN QUERY
    INSERT INTO seat_locks (seat_id, funcion_id, session_id, status, locked_at, expires_at, lock_type, tenant_id)
    VALUES (p_seat_id, p_funcion_id, p_session_id::uuid, p_status, NOW(), v_expires_at, 'seat', p_tenant_id::uuid)
    RETURNING seat_locks.id, seat_locks.seat_id, seat_locks.funcion_id, seat_locks.session_id::text, seat_locks.status, seat_locks.locked_at, seat_locks.expires_at;
END;
$$;

-- ==========================================
-- 4. Fix RPC: check_seat_availability
-- ==========================================
DROP FUNCTION IF EXISTS check_seat_availability(text, integer, text);

CREATE OR REPLACE FUNCTION check_seat_availability(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count
    FROM seat_locks sl
    WHERE sl.seat_id = p_seat_id 
    AND sl.funcion_id = p_funcion_id
    AND (
        sl.expires_at > NOW() 
        OR sl.status IN ('vendido', 'pagado', 'reservado', 'bloqueado')
    )
    -- CAST p_session_id to UUID for comparison
    AND (p_session_id IS NULL OR sl.session_id != p_session_id::uuid); 

    RETURN v_count = 0;
END;
$$;

-- Enable RLS on seat_locks table to ensure proper access control
ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to seat_locks so all users can see which seats are locked/sold
-- This is critical for Realtime updates to work across different clients
DROP POLICY IF EXISTS "Enable read access for all users" ON seat_locks;
CREATE POLICY "Enable read access for all users" ON seat_locks FOR SELECT USING (true);

-- Allow authenticated (and anon) users to insert/update their own locks
-- Note: The RPC lock_seat_atomically handles the logic, but RLS must allow the underlying operations if not using security definer
-- However, since we want to rely on the RPC (which should ideally be SECURITY DEFINER, but let's keep it simple for now),
-- we will allow detailed access. But purely for Realtime syncing, SELECT is the most important.

-- For now, we rely on the RPC (which runs with owner privileges or default) 
-- But IF the RPC is not SECURITY DEFINER, the user needs permission.
-- Let's make the RPC SECURITY DEFINER to avoid RLS issues for the write operations.
ALTER FUNCTION lock_seat_atomically(text, integer, text, text, text) SECURITY DEFINER;
ALTER FUNCTION check_seat_availability(text, integer, text) SECURITY DEFINER;
ALTER FUNCTION check_seats_payment_status(text[], integer, text, text) SECURITY DEFINER;

-- ==========================================
-- 5. Enable Realtime Replication
-- ==========================================
-- Ensure table is part of the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'seat_locks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE seat_locks;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payment_transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
  END IF;
END $$;
