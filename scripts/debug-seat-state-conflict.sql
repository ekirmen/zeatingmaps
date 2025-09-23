-- Script para debuggear el conflicto de estados de asientos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar el estado en seat_locks
SELECT 
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    created_at,
    metadata
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1757209438389_41';

-- 2. Verificar el estado en payment_transactions
SELECT 
    id,
    order_id,
    locator,
    status,
    seats,
    user_id,
    usuario_id,
    created_at
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats::text LIKE '%silla_1757209438389_41%';

-- 3. Verificar si hay múltiples registros en seat_locks
SELECT 
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1757209438389_41'
ORDER BY created_at DESC;

-- 4. Verificar si hay múltiples transacciones para el mismo asiento
SELECT 
    id,
    order_id,
    status,
    seats,
    user_id,
    usuario_id,
    created_at
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
ORDER BY created_at DESC;
