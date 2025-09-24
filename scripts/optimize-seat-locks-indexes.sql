-- Script para optimizar índices de seat_locks
-- Ejecutar cada comando por separado en el SQL Editor de Supabase

-- 1. Eliminar índices duplicados/redundantes
DROP INDEX IF EXISTS idx_seat_locks_session_id;
DROP INDEX IF EXISTS idx_seat_locks_expires_at;
DROP INDEX IF EXISTS idx_seat_locks_user;

-- 2. Crear índice optimizado para consultas de disponibilidad
-- (Ejecutar este comando por separado)
CREATE INDEX CONCURRENTLY idx_seat_locks_availability 
ON seat_locks (funcion_id, tenant_id, status, expires_at) 
WHERE status IN ('seleccionado', 'reservado', 'vendido');

-- 3. Crear índice para limpieza eficiente
-- (Ejecutar este comando por separado)
CREATE INDEX CONCURRENTLY idx_seat_locks_cleanup 
ON seat_locks (last_activity, status) 
WHERE status IN ('seleccionado', 'locked');

-- 4. Agregar campo para tracking de actividad (si no existe)
-- (Ejecutar este comando por separado)
ALTER TABLE seat_locks ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- 5. Crear trigger para actualizar last_activity
-- (Ejecutar este comando por separado)
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Aplicar trigger a seat_locks
-- (Ejecutar este comando por separado)
DROP TRIGGER IF EXISTS tr_seat_locks_update_activity ON seat_locks;
CREATE TRIGGER tr_seat_locks_update_activity
  BEFORE UPDATE ON seat_locks
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- 7. Función optimizada para limpieza
-- (Ejecutar este comando por separado)
CREATE OR REPLACE FUNCTION cleanup_expired_locks_optimized()
RETURNS void AS $$
BEGIN
  DELETE FROM seat_locks 
  WHERE expires_at < NOW() 
    AND status IN ('seleccionado', 'locked');
    
  -- Actualizar estadísticas
  ANALYZE seat_locks;
END;
$$ LANGUAGE plpgsql;

-- 8. Vista para monitoreo
-- (Ejecutar este comando por separado)
CREATE OR REPLACE VIEW seat_locks_monitoring AS
SELECT 
  funcion_id,
  status,
  COUNT(*) as count,
  MIN(expires_at) as oldest_expiry,
  MIN(last_activity) as oldest_activity
FROM seat_locks 
WHERE status IN ('seleccionado', 'locked')
GROUP BY funcion_id, status;

-- 9. Verificar índices existentes
-- (Ejecutar este comando por separado)
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'seat_locks'
ORDER BY indexname;
