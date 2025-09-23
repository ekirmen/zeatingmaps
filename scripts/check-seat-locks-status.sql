-- Script para verificar el estado del asiento en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el asiento está en seat_locks con status vendido
SELECT 
    id,
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    expires_at,
    created_at,
    metadata
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1755825682843_4';

-- 2. Ver todos los asientos vendidos de la función 43
SELECT 
    seat_id,
    status,
    session_id,
    user_id,
    locked_at,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
AND status = 'vendido'
ORDER BY created_at DESC;

-- 3. Ver el estado actual del asiento específico
SELECT 
    seat_id,
    status,
    CASE 
        WHEN status = 'vendido' THEN 'VENDIDO - No se puede seleccionar'
        WHEN status = 'seleccionado' THEN 'SELECCIONADO - Temporalmente bloqueado'
        WHEN status = 'pagado' THEN 'PAGADO - No se puede seleccionar'
        WHEN status = 'reservado' THEN 'RESERVADO - No se puede seleccionar'
        ELSE 'DISPONIBLE - Se puede seleccionar'
    END as estado_descripcion,
    locked_at,
    created_at
FROM seat_locks 
WHERE funcion_id = 43
AND seat_id = 'silla_1755825682843_4';