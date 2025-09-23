-- Script para verificar si el sessionId coincide con user_id/usuario_id
-- Ejecutar en Supabase SQL Editor

-- 1. Ver la transacción específica con todos los IDs
SELECT 
    id,
    order_id,
    status,
    user_id,
    usuario_id,
    seats,
    created_at
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats::text LIKE '%silla_1755825682843_4%';

-- 2. Verificar si hay diferencias entre user_id y usuario_id
SELECT 
    id,
    order_id,
    user_id,
    usuario_id,
    CASE 
        WHEN user_id = usuario_id THEN 'user_id = usuario_id'
        WHEN user_id IS NULL AND usuario_id IS NOT NULL THEN 'user_id is NULL, usuario_id has value'
        WHEN user_id IS NOT NULL AND usuario_id IS NULL THEN 'user_id has value, usuario_id is NULL'
        ELSE 'user_id != usuario_id'
    END as id_comparison
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
AND seats::text LIKE '%silla_1755825682843_4%';

-- 3. Ver todas las transacciones de la función 43 para comparar
SELECT 
    id,
    order_id,
    user_id,
    usuario_id,
    status,
    created_at
FROM payment_transactions 
WHERE funcion_id = 43
ORDER BY created_at DESC
LIMIT 10;
