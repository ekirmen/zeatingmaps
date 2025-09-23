-- Script para probar la integración de payment_transactions con seatLockStore
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el asiento existe en payment_transactions
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
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar el contenido del campo seats para el asiento específico
SELECT 
    id,
    order_id,
    seats,
    user_id,
    usuario_id
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats IS NOT NULL
ORDER BY created_at DESC;

-- 3. Verificar si el asiento específico está en alguna transacción
SELECT 
    pt.id,
    pt.order_id,
    pt.seats,
    pt.user_id,
    pt.usuario_id,
    pt.created_at
FROM payment_transactions pt
WHERE pt.funcion_id = 43 
AND pt.status = 'completed'
AND pt.seats::text LIKE '%silla_1757209438389_41%';

-- 4. Verificar el estado actual en seat_locks
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
