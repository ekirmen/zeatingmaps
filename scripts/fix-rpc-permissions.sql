-- Script para arreglar permisos de funciones RPC
-- Ejecutar en Supabase SQL Editor

-- 1. Otorgar permisos de ejecución a anon para las funciones RPC
GRANT EXECUTE ON FUNCTION atomic_seat_lock(text, integer, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION atomic_seat_unlock(text, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION is_seat_available(text, integer) TO anon;

-- 2. Otorgar permisos de ejecución a authenticated para las funciones RPC
GRANT EXECUTE ON FUNCTION atomic_seat_lock(text, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_seat_unlock(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_seat_available(text, integer) TO authenticated;

-- 3. Verificar que los permisos se otorgaron correctamente
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name IN ('atomic_seat_lock', 'atomic_seat_unlock', 'is_seat_available')
AND routine_schema = 'public'
ORDER BY routine_name, grantee;

-- 4. Verificar que anon puede ejecutar las funciones
SELECT 
    has_function_privilege('anon', 'atomic_seat_lock(text, integer, uuid, text)', 'EXECUTE') as anon_can_lock,
    has_function_privilege('anon', 'atomic_seat_unlock(text, integer, uuid)', 'EXECUTE') as anon_can_unlock,
    has_function_privilege('anon', 'is_seat_available(text, integer)', 'EXECUTE') as anon_can_check;

-- 5. Verificar que authenticated puede ejecutar las funciones
SELECT 
    has_function_privilege('authenticated', 'atomic_seat_lock(text, integer, uuid, text)', 'EXECUTE') as auth_can_lock,
    has_function_privilege('authenticated', 'atomic_seat_unlock(text, integer, uuid)', 'EXECUTE') as auth_can_unlock,
    has_function_privilege('authenticated', 'is_seat_available(text, integer)', 'EXECUTE') as auth_can_check;
