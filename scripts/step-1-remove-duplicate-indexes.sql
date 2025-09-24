-- PASO 1: Eliminar índices duplicados
-- Ejecutar este script completo en el SQL Editor

DROP INDEX IF EXISTS idx_seat_locks_session_id;
DROP INDEX IF EXISTS idx_seat_locks_expires_at;
DROP INDEX IF EXISTS idx_seat_locks_user;

-- Verificar que se eliminaron
SELECT 'Índices duplicados eliminados correctamente' as resultado;
