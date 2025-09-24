-- PASO 6: Crear función optimizada para limpieza
-- Ejecutar este script completo en el SQL Editor

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

-- Verificar que se creó
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'cleanup_expired_locks_optimized';
