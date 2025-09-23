-- Script para verificar asientos pagados en payment_transactions
-- Ejecutar en Supabase SQL Editor

-- 1. Ver transacciones completadas de la función 43
SELECT 
    id,
    order_id,
    locator,
    status,
    amount,
    payment_method,
    gateway_name,
    seats,
    created_at,
    user_id,
    usuario_id
FROM payment_transactions 
WHERE funcion_id = 43
AND status = 'completed'
ORDER BY created_at DESC;

-- 2. Ver asientos específicos de las transacciones completadas
SELECT 
    pt.id as transaction_id,
    pt.order_id,
    pt.locator,
    pt.status as transaction_status,
    pt.seats,
    pt.created_at,
    pt.user_id,
    pt.usuario_id
FROM payment_transactions pt
WHERE pt.funcion_id = 43 
AND pt.status = 'completed'
ORDER BY pt.created_at DESC;

-- 3. Verificar si hay asientos específicos en las transacciones
-- (Esto requiere que veas manualmente el campo seats JSON)
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
AND pt.seats IS NOT NULL
ORDER BY pt.created_at DESC;

-- 4. Ver todos los status únicos en payment_transactions para la función 43
SELECT DISTINCT status, COUNT(*) as count
FROM payment_transactions 
WHERE funcion_id = 43
GROUP BY status
ORDER BY count DESC;
