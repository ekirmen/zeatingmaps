-- ==========================================
-- 1. Recrear Vista: seat_status_view
-- ==========================================
-- Esta vista es requerida por lock_seat_atomically para verificar el estado de forma eficiente
DROP VIEW IF EXISTS seat_status_view;

-- Eliminar trigger legado que intentaba escribir en la vista
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
    lock_type,
    precio,
    metadata
FROM seat_locks
WHERE (expires_at > NOW() OR status IN ('vendido', 'pagado', 'reservado', 'bloqueado'));

-- ==========================================
-- 2. Corregir RPC: check_seats_payment_status
-- ==========================================
-- Corrige el error "query has no destination for result data"
-- Eliminar variantes antiguas para evitar ambigüedades
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
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH payment_status AS (
        -- Verificar transacciones de pago (Prioridad máxima)
        SELECT 
            elem->>'id' as s_id,
            true as paid,
            'pagado' as st,
            'payment' as src
        FROM payment_transactions pt,
        jsonb_array_elements(pt.seats) as elem
        WHERE pt.status = 'completed'
        AND (elem->>'id' = ANY(p_seat_ids) OR elem->>'_id' = ANY(p_seat_ids))
    ),
    lock_status AS (
        -- Verificar bloqueos de asientos
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
-- 3. Corregir RPC: lock_seat_atomically
-- ==========================================
-- Añade soporte para precio y metadatos, y asegura lógica atómica.
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, text, text);
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, text, text, text);

CREATE OR REPLACE FUNCTION lock_seat_atomically(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id text,
    p_status text DEFAULT 'seleccionado',
    p_tenant_id text DEFAULT NULL,
    p_precio numeric DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    seat_id text,
    funcion_id integer,
    session_id text,
    status text,
    locked_at timestamptz,
    expires_at timestamptz,
    precio numeric,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_lock record;
    v_expires_at timestamptz;
    v_result record;
BEGIN
    -- Establecer expiración (10 minutos por defecto)
    v_expires_at := NOW() + interval '10 minutes';

    -- Verificar bloqueo activo existente
    SELECT * INTO v_existing_lock 
    FROM seat_locks sl
    WHERE sl.seat_id = p_seat_id 
    AND sl.funcion_id = p_funcion_id
    AND (sl.expires_at > NOW() OR sl.status IN ('vendido', 'pagado', 'reservado', 'bloqueado'))
    FOR UPDATE; -- Bloqueo a nivel de fila para prevenir condiciones de carrera

    IF v_existing_lock.id IS NOT NULL THEN
        -- Si está bloqueado por la misma sesión, extender el bloqueo
        IF v_existing_lock.session_id::text = p_session_id AND v_existing_lock.status NOT IN ('vendido', 'pagado', 'reservado', 'bloqueado') THEN
             UPDATE seat_locks
             SET expires_at = v_expires_at,
                 locked_at = NOW(),
                 tenant_id = COALESCE(p_tenant_id::uuid, tenant_id),
                 precio = COALESCE(p_precio, precio),
                 metadata = COALESCE(p_metadata, metadata)
             WHERE id = v_existing_lock.id
             RETURNING 
                seat_locks.id, 
                seat_locks.seat_id, 
                seat_locks.funcion_id, 
                seat_locks.session_id::text, 
                seat_locks.status, 
                seat_locks.locked_at, 
                seat_locks.expires_at,
                seat_locks.precio,
                seat_locks.metadata
             INTO v_result;
             
             RETURN QUERY SELECT v_result.id, v_result.seat_id, v_result.funcion_id, v_result.session_id, v_result.status, v_result.locked_at, v_result.expires_at, v_result.precio, v_result.metadata;
             RETURN;
        ELSE
             -- Bloqueado por otro usuario o estado permanente
             RAISE EXCEPTION 'seat_already_locked' USING HINT = 'Asiento ya ocupado';
        END IF;
    END IF;

    -- Insertar nuevo bloqueo
    RETURN QUERY
    INSERT INTO seat_locks (seat_id, funcion_id, session_id, status, locked_at, expires_at, lock_type, tenant_id, precio, metadata)
    VALUES (p_seat_id, p_funcion_id, p_session_id::uuid, p_status, NOW(), v_expires_at, 'seat', p_tenant_id::uuid, p_precio, p_metadata)
    ON CONFLICT (seat_id, funcion_id, tenant_id) 
    DO UPDATE SET 
        session_id = EXCLUDED.session_id,
        status = EXCLUDED.status,
        locked_at = EXCLUDED.locked_at,
        expires_at = EXCLUDED.expires_at,
        lock_type = EXCLUDED.lock_type,
        precio = COALESCE(EXCLUDED.precio, seat_locks.precio),
        metadata = COALESCE(EXCLUDED.metadata, seat_locks.metadata)
    WHERE seat_locks.session_id::text = p_session_id OR seat_locks.expires_at < NOW()
    RETURNING seat_locks.id, seat_locks.seat_id, seat_locks.funcion_id, seat_locks.session_id::text, seat_locks.status, seat_locks.locked_at, seat_locks.expires_at, seat_locks.precio, seat_locks.metadata;
END;
$$;

-- ==========================================
-- 4. Corregir RPC: check_seat_availability
-- ==========================================
DROP FUNCTION IF EXISTS check_seat_availability(text, integer, text);

CREATE OR REPLACE FUNCTION check_seat_availability(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
    AND (p_session_id IS NULL OR sl.session_id != p_session_id::uuid); 

    RETURN v_count = 0;
END;
$$;

-- Habilitar RLS en la tabla seat_locks
ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;

-- Permitir acceso de lectura público a seat_locks para actualizaciones en tiempo real
DROP POLICY IF EXISTS "Enable read access for all users" ON seat_locks;
CREATE POLICY "Enable read access for all users" ON seat_locks FOR SELECT USING (true);

-- ==========================================
-- 5. Habilitar Replicación en Tiempo Real
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'seat_locks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE seat_locks;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payment_transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
  END IF;
END $$;
