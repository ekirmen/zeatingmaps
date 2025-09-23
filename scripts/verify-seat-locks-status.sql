-- Script para verificar exactamente qué status se guarda en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los status únicos en seat_locks para la función 43
SELECT DISTINCT status, COUNT(*) as count
FROM seat_locks 
WHERE funcion_id = 43
GROUP BY status
ORDER BY count DESC;

-- 2. Ver ejemplos de locks con diferentes status y sus locators
SELECT 
    seat_id,
    status,
    lock_type,
    session_id,
    locked_at,
    expires_at,
    locator,
    user_id,
    CASE 
        WHEN locator IS NOT NULL THEN 'Tiene locator (pagado)'
        ELSE 'Sin locator (temporal)'
    END as payment_status
FROM seat_locks 
WHERE funcion_id = 43
ORDER BY locked_at DESC
LIMIT 15;

-- 3. Verificar si hay locks con status 'completed' (no debería haber)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'completed';

-- 4. Verificar locks con status 'pagado' (debería haber)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND status = 'pagado';

-- 5. Verificar locks con locator (asientos pagados)
SELECT 
    seat_id,
    status,
    locator,
    user_id,
    locked_at
FROM seat_locks 
WHERE funcion_id = 43 
AND locator IS NOT NULL
ORDER BY locked_at DESC;
