-- Script para crear funciones con nombres únicos
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la función para bloquear asiento con nombre único
CREATE OR REPLACE FUNCTION seat_lock_atomic(
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

-- 2. Crear la función para desbloquear asiento con nombre único
CREATE OR REPLACE FUNCTION seat_unlock_atomic(
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

-- 3. Crear la función para verificar disponibilidad con nombre único
CREATE OR REPLACE FUNCTION seat_check_available(
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

-- 4. Otorgar permisos a los roles
GRANT EXECUTE ON FUNCTION seat_lock_atomic(text, integer, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION seat_lock_atomic(text, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION seat_unlock_atomic(text, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION seat_unlock_atomic(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION seat_check_available(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION seat_check_available(text, integer) TO authenticated;

-- 5. Verificar que las funciones se crearon correctamente
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('seat_lock_atomic', 'seat_unlock_atomic', 'seat_check_available')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 6. Probar la función
SELECT seat_lock_atomic(
    'test_seat_123'::text,
    43::integer,
    gen_random_uuid()::uuid,
    'seleccionado'::text
) as test_result;
