-- Script para limpiar datos de prueba de payment_transactions
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar transacciones de prueba
DELETE FROM payment_transactions 
WHERE funcion_id = 43
AND order_id LIKE 'TEST_%';

-- 2. Verificar que se eliminaron
SELECT COUNT(*) as remaining_test_transactions
FROM payment_transactions 
WHERE funcion_id = 43
AND order_id LIKE 'TEST_%';

-- 3. Verificar el estado del asiento después de la limpieza
SELECT 
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1757209438389_41';
