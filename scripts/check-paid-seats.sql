-- Script para verificar asientos que han sido pagados
-- Ejecutar en Supabase SQL Editor

-- 1. Ver asientos con locator (estos son los pagados)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    session_id,
    locked_at,
    expires_at
FROM seat_locks 
WHERE funcion_id = 43 
AND locator IS NOT NULL
ORDER BY locked_at DESC;

-- 2. Ver asientos con status 'pagado' (si los hay)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    session_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'pagado'
ORDER BY locked_at DESC;

-- 3. Ver asientos con status 'vendido' (si los hay)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    session_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'vendido'
ORDER BY locked_at DESC;

-- 4. Ver asientos con status 'completed' (si los hay)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    session_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'completed'
ORDER BY locked_at DESC;

-- 5. Ver todos los status únicos para entender qué se está usando
SELECT DISTINCT status, COUNT(*) as count
FROM seat_locks 
WHERE funcion_id = 43
GROUP BY status
ORDER BY count DESC;
