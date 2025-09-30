-- Script para verificar el estado real del asiento en la base de datos
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar el estado del asiento en seat_locks
SELECT 
    'Estado en seat_locks' as tabla,
    id,
    seat_id,
    funcion_id,
    status,
    locked_at,
    expires_at,
    session_id,
    user_id
FROM public.seat_locks 
WHERE seat_id = 'silla_1758894264060_4' 
  AND funcion_id = 43
ORDER BY locked_at DESC;

-- 2. Verificar el estado del asiento en payment_transactions
SELECT 
    'Estado en payment_transactions' as tabla,
    id,
    order_id,
    status,
    amount,
    created_at,
    seats,
    funcion
FROM public.payment_transactions 
WHERE seats::text LIKE '%silla_1758894264060_4%'
  AND funcion = 43
ORDER BY created_at DESC;

-- 3. Verificar si hay múltiples transacciones para el mismo asiento
SELECT 
    'Múltiples transacciones' as test,
    COUNT(*) as total_transacciones,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidas
FROM public.payment_transactions 
WHERE seats::text LIKE '%silla_1758894264060_4%'
  AND funcion = 43;

-- 4. Verificar el estado actual del asiento en el mapa
SELECT 
    'Estado actual del asiento' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.seat_locks 
            WHERE seat_id = 'silla_1758894264060_4' 
              AND funcion_id = 43 
              AND status IN ('seleccionado', 'locked')
        ) THEN 'BLOQUEADO/SELECCIONADO'
        WHEN EXISTS (
            SELECT 1 FROM public.payment_transactions 
            WHERE seats::text LIKE '%silla_1758894264060_4%'
              AND funcion = 43 
              AND status = 'completed'
        ) THEN 'VENDIDO'
        ELSE 'DISPONIBLE'
    END as estado_actual;
