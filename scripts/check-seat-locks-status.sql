-- Script para verificar los status en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los status únicos en seat_locks
SELECT DISTINCT status, COUNT(*) as count
FROM seat_locks 
WHERE funcion_id = 43
GROUP BY status
ORDER BY count DESC;

-- 2. Ver ejemplos de locks con diferentes status
SELECT 
    seat_id,
    status,
    lock_type,
    session_id,
    locked_at,
    expires_at,
    locator,
    user_id
FROM seat_locks 
WHERE funcion_id = 43
ORDER BY locked_at DESC
LIMIT 10;

-- 3. Verificar si hay locks con status 'completed'
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'completed';

-- 4. Verificar si hay locks con status 'pagado'
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'pagado';
