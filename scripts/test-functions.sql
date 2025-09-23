-- Script para probar las funciones RPC
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que las funciones existen
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('atomic_seat_lock', 'atomic_seat_unlock', 'is_seat_available')
AND routine_schema = 'public';

-- 2. Probar la función atomic_seat_lock con datos de prueba
SELECT atomic_seat_lock(
    'test_seat_123',
    43,
    gen_random_uuid(),
    'seleccionado'
) as test_result;

-- 3. Verificar que se creó el lock
SELECT * FROM seat_locks WHERE seat_id = 'test_seat_123';

-- 4. Probar la función is_seat_available
SELECT is_seat_available('test_seat_123', 43) as is_available;

-- 5. Limpiar el test
DELETE FROM seat_locks WHERE seat_id = 'test_seat_123';
