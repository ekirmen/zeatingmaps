-- PASO 7: Crear vista para monitoreo
-- Ejecutar este script completo en el SQL Editor

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

-- Verificar que se creó
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name = 'seat_locks_monitoring';
