-- Script para verificar pagos de la función 43
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los pagos de la función 43
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
    user_id
FROM payments 
WHERE funcion_id = 43
ORDER BY created_at DESC;

-- 2. Ver pagos completados de la función 43
SELECT 
    id,
    order_id,
    locator,
    status,
    amount,
    payment_method,
    seats,
    created_at,
    user_id
FROM payments 
WHERE funcion_id = 43 
AND status = 'completed'
ORDER BY created_at DESC;

-- 3. Ver asientos específicos de los pagos
SELECT 
    p.id as payment_id,
    p.order_id,
    p.locator,
    p.status as payment_status,
    p.seats,
    p.created_at,
    p.user_id
FROM payments p
WHERE p.funcion_id = 43 
AND p.status = 'completed'
ORDER BY p.created_at DESC;
