-- Script para limpiar asientos recordados en boletería
-- Esto libera los asientos cuando se actualiza la página

-- 1. Limpiar seat_locks expirados o antiguos
DELETE FROM public.seat_locks 
WHERE expires_at < NOW() 
   OR created_at < NOW() - INTERVAL '1 hour';

-- 2. Limpiar seat_locks de sesiones inactivas (opcional)
-- DELETE FROM public.seat_locks 
-- WHERE session_id NOT IN (
--     SELECT DISTINCT session_id 
--     FROM public.seat_locks 
--     WHERE updated_at > NOW() - INTERVAL '30 minutes'
-- );

-- 3. Resetear estado de asientos bloqueados a available
UPDATE public.seats 
SET status = 'available', 
    user_id = NULL, 
    locked_at = NULL, 
    locked_by = NULL, 
    lock_expires_at = NULL,
    bloqueado = false
WHERE status IN ('locked', 'reserved') 
  AND (lock_expires_at < NOW() OR lock_expires_at IS NULL);

-- 4. Verificar asientos disponibles
SELECT 
    COUNT(*) as total_seats,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_seats,
    COUNT(CASE WHEN status = 'locked' THEN 1 END) as locked_seats,
    COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_seats,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_seats
FROM public.seats;

-- 5. Verificar locks activos
SELECT 
    COUNT(*) as active_locks,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_locks
FROM public.seat_locks;
