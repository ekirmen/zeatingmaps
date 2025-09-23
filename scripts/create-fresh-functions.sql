-- Script para crear funciones con nombres completamente nuevos
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS lock_seat_atomically(text, integer, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS unlock_seat_atomically(text, integer, uuid) CASCADE;
DROP FUNCTION IF EXISTS check_seat_availability(text, integer) CASCADE;

-- 2. Crear la función para bloquear asiento con nombre completamente nuevo
CREATE OR REPLACE FUNCTION lock_seat_atomically(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id uuid,
    p_status text DEFAULT 'seleccionado'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    existing_lock record;
    tenant_id_value uuid;
BEGIN
    -- Obtener el tenant_id de la función
    SELECT tenant_id INTO tenant_id_value
    FROM funciones 
    WHERE id = p_funcion_id;
    
    -- Si no se encuentra tenant_id, usar un valor por defecto
    IF tenant_id_value IS NULL THEN
        tenant_id_value := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- Verificar si ya existe un lock para este asiento
    SELECT * INTO existing_lock
    FROM seat_locks
    WHERE seat_id = p_seat_id 
    AND funcion_id = p_funcion_id
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Si ya existe un lock, verificar si es del mismo usuario
    IF existing_lock IS NOT NULL THEN
        IF existing_lock.session_id = p_session_id THEN
            -- Es el mismo usuario, actualizar el lock existente
            UPDATE seat_locks
            SET locked_at = NOW(),
                status = p_status,
                expires_at = NOW() + INTERVAL '10 minutes',
                tenant_id = tenant_id_value
            WHERE id = existing_lock.id;
            
            result := json_build_object(
                'success', true,
                'action', 'updated',
                'lock_id', existing_lock.id,
                'message', 'Lock actualizado exitosamente'
            );
        ELSE
            -- Es otro usuario, el asiento no está disponible
            result := json_build_object(
                'success', false,
                'error', 'Asiento ya está bloqueado por otro usuario',
                'lock_id', existing_lock.id
            );
        END IF;
    ELSE
        -- No existe lock, crear uno nuevo
        INSERT INTO seat_locks (
            seat_id,
            funcion_id,
            session_id,
            status,
            lock_type,
            locked_at,
            expires_at,
            tenant_id
        ) VALUES (
            p_seat_id,
            p_funcion_id,
            p_session_id,
            p_status,
            'seat',
            NOW(),
            NOW() + INTERVAL '10 minutes',
            tenant_id_value
        ) RETURNING id INTO existing_lock.id;
        
        result := json_build_object(
            'success', true,
            'action', 'created',
            'lock_id', existing_lock.id,
            'message', 'Lock creado exitosamente'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 2. Crear la función para desbloquear asiento con nombre completamente nuevo
CREATE OR REPLACE FUNCTION unlock_seat_atomically(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    deleted_count integer;
BEGIN
    -- Eliminar el lock del asiento
    DELETE FROM seat_locks
    WHERE seat_id = p_seat_id 
    AND funcion_id = p_funcion_id
    AND session_id = p_session_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        result := json_build_object(
            'success', true,
            'message', 'Asiento desbloqueado exitosamente'
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'No se encontró el lock para desbloquear'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 3. Crear la función para verificar disponibilidad con nombre completamente nuevo
CREATE OR REPLACE FUNCTION check_seat_availability(
    p_seat_id text,
    p_funcion_id integer,
    p_session_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lock_count integer;
BEGIN
    -- Si se proporciona session_id, verificar si hay locks de otros usuarios
    IF p_session_id IS NOT NULL THEN
        SELECT COUNT(*) INTO lock_count
        FROM seat_locks
        WHERE seat_id = p_seat_id 
        AND funcion_id = p_funcion_id
        AND session_id != p_session_id
        AND (expires_at IS NULL OR expires_at > NOW());
    ELSE
        -- Si no se proporciona session_id, contar todos los locks activos
        SELECT COUNT(*) INTO lock_count
        FROM seat_locks
        WHERE seat_id = p_seat_id 
        AND funcion_id = p_funcion_id
        AND (expires_at IS NULL OR expires_at > NOW());
    END IF;
    
    -- El asiento está disponible si no hay locks de otros usuarios
    RETURN lock_count = 0;
END;
$$;

-- 4. Otorgar permisos a los roles
GRANT EXECUTE ON FUNCTION lock_seat_atomically(text, integer, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION lock_seat_atomically(text, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_seat_atomically(text, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION unlock_seat_atomically(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_seat_availability(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION check_seat_availability(text, integer) TO authenticated;

-- 5. Verificar que las funciones se crearon correctamente
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('lock_seat_atomically', 'unlock_seat_atomically', 'check_seat_availability')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 6. Probar la función
SELECT lock_seat_atomically(
    'test_seat_123'::text,
    43::integer,
    gen_random_uuid()::uuid,
    'seleccionado'::text
) as test_result;
