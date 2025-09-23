-- Script para debuggear los locks de asientos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los locks activos
SELECT 
    id,
    seat_id,
    funcion_id,
    session_id,
    status,
    lock_type,
    locked_at,
    expires_at,
    tenant_id,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
ORDER BY locked_at DESC;

-- 2. Verificar si hay locks expirados
SELECT 
    seat_id,
    session_id,
    status,
    locked_at,
    expires_at,
    NOW() as current_time,
    (expires_at < NOW()) as is_expired
FROM seat_locks 
WHERE funcion_id = 43
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY locked_at DESC;

-- 3. Verificar la función de disponibilidad
SELECT 
    seat_id,
    funcion_id,
    check_seat_availability(seat_id, funcion_id) as is_available
FROM (
    SELECT DISTINCT seat_id, 43 as funcion_id
    FROM seat_locks 
    WHERE funcion_id = 43
) seats
ORDER BY seat_id;
