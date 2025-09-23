-- Script para simular una transacción de pago y verificar la integración
-- Ejecutar en Supabase SQL Editor

-- 1. Insertar una transacción de pago de prueba
INSERT INTO payment_transactions (
    order_id,
    locator,
    status,
    amount,
    currency,
    payment_method,
    gateway_name,
    seats,
    funcion_id,
    user_id,
    usuario_id,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    'TEST_' || extract(epoch from now())::text,
    'TEST_' || extract(epoch from now())::text,
    'completed',
    50.00,
    'USD',
    'test',
    'test_gateway',
    '[{"sillaId": "silla_1757209438389_41", "zonaId": "zona_test", "precio": 50.00, "nombre": "Asiento Test", "nombreZona": "Zona Test"}]',
    43,
    'cf142159-506f-4fe6-a45c-98ca2fd07f20',
    'cf142159-506f-4fe6-a45c-98ca2fd07f20',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
    NOW(),
    NOW()
);

-- 2. Verificar que se insertó correctamente
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
AND order_id LIKE 'TEST_%'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verificar si el trigger se ejecutó (debería haber actualizado seat_locks)
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
