-- Verificación rápida de funciones RPC
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si las funciones existen
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('atomic_seat_lock', 'atomic_seat_unlock', 'is_seat_available')
AND routine_schema = 'public';

-- 2. Verificar permisos de las funciones
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name IN ('atomic_seat_lock', 'atomic_seat_unlock', 'is_seat_available')
AND routine_schema = 'public';

-- 3. Verificar si el usuario anónimo puede ejecutar las funciones
SELECT 
    has_function_privilege('anon', 'atomic_seat_lock(text, integer, uuid, text)', 'EXECUTE') as can_execute_lock,
    has_function_privilege('anon', 'atomic_seat_unlock(text, integer, uuid)', 'EXECUTE') as can_execute_unlock,
    has_function_privilege('anon', 'is_seat_available(text, integer)', 'EXECUTE') as can_execute_check;
