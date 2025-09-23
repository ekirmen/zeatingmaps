-- Script para verificar la función del trigger
-- Ejecutar en Supabase SQL Editor

-- 1. Ver la función update_seat_locks_on_payment
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'update_seat_locks_on_payment';

-- 2. Ver el trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_name = 'update_seat_locks_trigger';

-- 3. Ver si hay algún error en el trigger
SELECT 
    schemaname,
    tablename,
    attname,
    atttypid::regtype
FROM pg_attribute 
WHERE attrelid = 'payment_transactions'::regclass 
AND attname IN ('seats', 'status', 'funcion_id');
