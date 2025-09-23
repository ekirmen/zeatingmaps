-- Script para renombrar y recrear las funciones RPC
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, crear las funciones con nombres temporales únicos
CREATE OR REPLACE FUNCTION atomic_seat_lock_v2(
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
BEGIN
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
                expires_at = NOW() + INTERVAL '10 minutes'
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
            expires_at
        ) VALUES (
            p_seat_id,
            p_funcion_id,
            p_session_id,
            p_status,
            'seat',
            NOW(),
            NOW() + INTERVAL '10 minutes'
        );
        
        result := json_build_object(
            'success', true,
            'action', 'created',
            'lock_id', currval('seat_locks_id_seq'),
            'message', 'Lock creado exitosamente'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 2. Crear función de desbloqueo con nombre temporal
CREATE OR REPLACE FUNCTION atomic_seat_unlock_v2(
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

-- 3. Crear función de verificación con nombre temporal
CREATE OR REPLACE FUNCTION is_seat_available_v2(
    p_seat_id text,
    p_funcion_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lock_count integer;
BEGIN
    -- Contar locks activos para este asiento
    SELECT COUNT(*) INTO lock_count
    FROM seat_locks
    WHERE seat_id = p_seat_id 
    AND funcion_id = p_funcion_id
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- El asiento está disponible si no hay locks activos
    RETURN lock_count = 0;
END;
$$;

-- 4. Ahora eliminar las funciones antiguas (una por una con tipos específicos)
DO $$
DECLARE
    func_record record;
BEGIN
    -- Eliminar todas las versiones de atomic_seat_lock
    FOR func_record IN 
        SELECT routine_name, specific_name
        FROM information_schema.routines 
        WHERE routine_name = 'atomic_seat_lock' 
        AND routine_schema = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las versiones de atomic_seat_unlock
    FOR func_record IN 
        SELECT routine_name, specific_name
        FROM information_schema.routines 
        WHERE routine_name = 'atomic_seat_unlock' 
        AND routine_schema = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las versiones de is_seat_available
    FOR func_record IN 
        SELECT routine_name, specific_name
        FROM information_schema.routines 
        WHERE routine_name = 'is_seat_available' 
        AND routine_schema = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
    END LOOP;
END;
$$;

-- 5. Renombrar las funciones temporales a los nombres finales
ALTER FUNCTION atomic_seat_lock_v2(text, integer, uuid, text) RENAME TO atomic_seat_lock;
ALTER FUNCTION atomic_seat_unlock_v2(text, integer, uuid) RENAME TO atomic_seat_unlock;
ALTER FUNCTION is_seat_available_v2(text, integer) RENAME TO is_seat_available;

-- 6. Otorgar permisos a los roles
GRANT EXECUTE ON FUNCTION atomic_seat_lock(text, integer, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION atomic_seat_lock(text, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_seat_unlock(text, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION atomic_seat_unlock(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_seat_available(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION is_seat_available(text, integer) TO authenticated;

-- 7. Verificar que las funciones se crearon correctamente
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('atomic_seat_lock', 'atomic_seat_unlock', 'is_seat_available')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 8. Probar la función
SELECT atomic_seat_lock(
    'test_seat_123'::text,
    43::integer,
    gen_random_uuid()::uuid,
    'seleccionado'::text
) as test_result;
