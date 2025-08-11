-- Script para limpiar asientos bloqueados en Boletería
-- Esto resuelve el problema de "recordar asientos" - los asientos se liberan al refrescar la página

-- 1. Limpiar locks expirados en seat_locks
DELETE FROM public.seat_locks 
WHERE expires_at < NOW();

-- 2. Resetear asientos bloqueados a disponible en la tabla seats
UPDATE public.seats 
SET 
    status = 'available',
    bloqueado = false,
    locked_at = NULL,
    locked_by = NULL,
    lock_expires_at = NULL,
    updated_at = NOW()
WHERE 
    bloqueado = true 
    OR status = 'locked'
    OR (lock_expires_at IS NOT NULL AND lock_expires_at < NOW());

-- 3. Limpiar locks expirados en seat_locks (repetir para asegurar)
DELETE FROM public.seat_locks 
WHERE expires_at < NOW() - INTERVAL '1 minute';

-- 4. Verificar que se limpiaron los locks
SELECT 
    COUNT(*) as total_seats,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_seats,
    COUNT(CASE WHEN status = 'locked' THEN 1 END) as locked_seats,
    COUNT(CASE WHEN bloqueado = true THEN 1 END) as blocked_seats
FROM public.seats;

-- 5. Verificar locks activos
SELECT COUNT(*) as active_locks FROM public.seat_locks WHERE expires_at > NOW();
