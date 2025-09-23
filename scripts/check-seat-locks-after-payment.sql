-- Script para verificar si el asiento está en seat_locks después del pago
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el asiento está en seat_locks
SELECT 
    'seat_locks' as tabla,
    id,
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    expires_at,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1755825682843_4';

-- 2. Verificar si el asiento está en payment_transactions
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

-- 3. Verificar el trigger update_seat_locks_on_payment
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_seat_locks_trigger';

-- 4. Verificar la función del trigger
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'update_seat_locks_on_payment';
