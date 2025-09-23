-- Script para arreglar la función check_seat_availability
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar todas las versiones existentes de la función
DROP FUNCTION IF EXISTS check_seat_availability(text, integer) CASCADE;
DROP FUNCTION IF EXISTS check_seat_availability(text, integer, uuid) CASCADE;

-- 2. Crear la nueva función con parámetro opcional session_id
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

-- 3. Otorgar permisos a los roles
GRANT EXECUTE ON FUNCTION check_seat_availability(text, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION check_seat_availability(text, integer, uuid) TO authenticated;

-- 4. Verificar que la función se creó correctamente
SELECT 
    proname as function_name,
    pronargs as num_args,
    proargnames as arg_names,
    proargtypes::regtype[] as arg_types
FROM pg_proc 
WHERE proname = 'check_seat_availability';
