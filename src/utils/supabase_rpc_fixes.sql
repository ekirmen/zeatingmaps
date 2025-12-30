-- ==========================================
-- Solución alternativa: Sin ON CONFLICT
-- ==========================================
-- Esta versión NO requiere modificar constraints de la tabla
-- Solo actualiza la función RPC para evitar el error 42P10

-- ==========================================
-- 1. Asegurar columnas (opcional, pero recomendado)
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seat_locks' AND column_name = 'precio') THEN
        ALTER TABLE seat_locks ADD COLUMN precio numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seat_locks' AND column_name = 'metadata') THEN
        ALTER TABLE seat_locks ADD COLUMN metadata jsonb;
    END IF;
END $$;

-- ==========================================
-- 2. Función lock_seat_atomically SIN ON CONFLICT
-- ==========================================
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, text, text, text, numeric, jsonb);

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
#variable_conflict use_variable
DECLARE
    v_existing_lock record;
    v_expires_at timestamptz;
    v_tenant_uuid uuid;
    v_session_uuid uuid;
BEGIN
    v_expires_at := NOW() + interval '10 minutes';
    v_tenant_uuid := COALESCE(p_tenant_id::uuid, NULL);
    v_session_uuid := p_session_id::uuid;

    -- Buscar bloqueo existente
    SELECT * INTO v_existing_lock 
    FROM seat_locks
    WHERE seat_locks.seat_id = p_seat_id 
    AND seat_locks.funcion_id = p_funcion_id
    AND COALESCE(seat_locks.tenant_id::text, '') = COALESCE(v_tenant_uuid::text, '')
    FOR UPDATE;

    -- Si existe un bloqueo
    IF v_existing_lock.id IS NOT NULL THEN
        -- Verificar si es la misma sesión
        IF v_existing_lock.session_id = v_session_uuid THEN
            -- Actualizar el bloqueo existente (extender tiempo)
            UPDATE seat_locks
            SET expires_at = v_expires_at,
                locked_at = NOW(),
                precio = COALESCE(p_precio, seat_locks.precio),
                metadata = COALESCE(p_metadata, seat_locks.metadata),
                status = p_status
            WHERE seat_locks.id = v_existing_lock.id
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
            INTO STRICT v_existing_lock;
            
            RETURN QUERY SELECT 
                v_existing_lock.id,
                v_existing_lock.seat_id,
                v_existing_lock.funcion_id,
                v_existing_lock.session_id,
                v_existing_lock.status,
                v_existing_lock.locked_at,
                v_existing_lock.expires_at,
                v_existing_lock.precio,
                v_existing_lock.metadata;
            RETURN;
        ELSE
            -- Bloqueo de otro usuario: verificar si expiró
            IF v_existing_lock.expires_at <= NOW() AND v_existing_lock.status NOT IN ('vendido', 'pagado', 'reservado', 'bloqueado') THEN
                -- Expiró: eliminar y permitir nuevo bloqueo
                DELETE FROM seat_locks WHERE seat_locks.id = v_existing_lock.id;
            ELSE
                -- Aún vigente o permanente
                RAISE EXCEPTION 'seat_already_locked' USING HINT = 'Asiento ya ocupado';
            END IF;
        END IF;
    END IF;

    -- Insertar nuevo bloqueo (sin ON CONFLICT)
    RETURN QUERY
    INSERT INTO seat_locks (seat_id, funcion_id, session_id, status, locked_at, expires_at, lock_type, tenant_id, precio, metadata)
    VALUES (p_seat_id, p_funcion_id, v_session_uuid, p_status, NOW(), v_expires_at, 'seat', v_tenant_uuid, p_precio, p_metadata)
    RETURNING 
        seat_locks.id, 
        seat_locks.seat_id, 
        seat_locks.funcion_id, 
        seat_locks.session_id::text, 
        seat_locks.status, 
        seat_locks.locked_at, 
        seat_locks.expires_at,
        seat_locks.precio,
        seat_locks.metadata;
END;
$$;
