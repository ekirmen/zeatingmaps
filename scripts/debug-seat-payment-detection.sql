-- Script para debuggear la detección de asientos pagados
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar el asiento específico en payment_transactions
SELECT 
    'payment_transactions' as tabla,
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
AND seats::text LIKE '%silla_1755825682843_4%';

-- 2. Verificar si el asiento está en seat_locks
SELECT 
    'seat_locks' as tabla,
    id,
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    expires_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1755825682843_4';

-- 3. Verificar el campo seats JSON en detalle
SELECT 
    id,
    order_id,
    status,
    seats,
    jsonb_array_length(seats) as seats_count,
    seats->0->>'sillaId' as first_seat_id,
    seats->0->>'nombre' as first_seat_name
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats::text LIKE '%silla_1755825682843_4%';

-- 4. Verificar si hay algún problema con el parsing del JSON
SELECT 
    id,
    order_id,
    status,
    seats,
    CASE 
        WHEN seats IS NULL THEN 'seats is NULL'
        WHEN jsonb_typeof(seats) = 'array' THEN 'seats is array'
        WHEN jsonb_typeof(seats) = 'object' THEN 'seats is object'
        ELSE 'seats is ' || jsonb_typeof(seats)
    END as seats_type
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats::text LIKE '%silla_1755825682843_4%';
