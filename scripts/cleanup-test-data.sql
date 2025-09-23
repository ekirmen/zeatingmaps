-- Script para limpiar datos de prueba
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar datos de prueba de seat_locks
DELETE FROM seat_locks WHERE seat_id = 'test_seat_123';

-- 2. Verificar que se eliminaron los datos de prueba
SELECT * FROM seat_locks WHERE seat_id = 'test_seat_123';

-- 3. Verificar que las funciones existen y tienen permisos
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('lock_seat_atomically', 'unlock_seat_atomically', 'check_seat_availability')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 4. Verificar permisos de las funciones
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name IN ('lock_seat_atomically', 'unlock_seat_atomically', 'check_seat_availability')
AND routine_schema = 'public'
ORDER BY routine_name, grantee;
