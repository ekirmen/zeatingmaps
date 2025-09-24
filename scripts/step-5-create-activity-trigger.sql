-- PASO 5: Crear trigger para actualizar last_activity
-- Ejecutar este script completo en el SQL Editor

-- Función para actualizar last_activity
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a seat_locks
DROP TRIGGER IF EXISTS tr_seat_locks_update_activity ON seat_locks;
CREATE TRIGGER tr_seat_locks_update_activity
  BEFORE UPDATE ON seat_locks
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- Verificar que se creó
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'seat_locks' AND trigger_name = 'tr_seat_locks_update_activity';
