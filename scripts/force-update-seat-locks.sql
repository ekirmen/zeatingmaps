-- Script para forzar la actualización de seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Insertar manualmente el asiento como vendido en seat_locks
INSERT INTO seat_locks (
    seat_id,
    funcion_id,
    tenant_id,
    user_id,
    status,
    lock_type,
    session_id,
    locked_at,
    metadata
) VALUES (
    'silla_1755825682843_4',
    43,
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
    '713a4d5b-bab9-4370-8c25-afb8dd198d6d',
    'vendido',
    'payment',
    '713a4d5b-bab9-4370-8c25-afb8dd198d6d',
    NOW(),
    jsonb_build_object(
        'order_id', 'PAONZTUZ',
        'locator', 'PAONZTUZ',
        'payment_id', '44baea8a-1cfc-45d0-9c06-387c11826873'
    )
)
ON CONFLICT (seat_id, funcion_id, tenant_id)
DO UPDATE SET
    status = 'vendido',
    user_id = '713a4d5b-bab9-4370-8c25-afb8dd198d6d',
    session_id = '713a4d5b-bab9-4370-8c25-afb8dd198d6d',
    locked_at = NOW(),
    metadata = jsonb_build_object(
        'order_id', 'PAONZTUZ',
        'locator', 'PAONZTUZ',
        'payment_id', '44baea8a-1cfc-45d0-9c06-387c11826873'
    );

-- 2. Verificar que se insertó correctamente
SELECT 
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    metadata
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1755825682843_4';
