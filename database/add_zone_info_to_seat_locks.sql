-- Agregar información de zona a seat_locks
-- Esto permitirá que los asientos mantengan su información de zona

-- Agregar columnas para información de zona
ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS zona_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS zona_nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2);

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_seat_locks_zona_id ON seat_locks(zona_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_zona_nombre ON seat_locks(zona_nombre);

-- Actualizar asientos existentes con información de zona por defecto
UPDATE seat_locks 
SET 
  zona_id = 'ORO',
  zona_nombre = 'ORO',
  precio = 10.00
WHERE zona_id IS NULL;

-- Crear función para actualizar información de zona cuando se crea un seat_lock
CREATE OR REPLACE FUNCTION update_seat_lock_zone_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona información de zona, usar valores por defecto
  IF NEW.zona_id IS NULL THEN
    NEW.zona_id := 'ORO';
  END IF;
  
  IF NEW.zona_nombre IS NULL THEN
    NEW.zona_nombre := 'ORO';
  END IF;
  
  IF NEW.precio IS NULL THEN
    NEW.precio := 10.00;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar información de zona automáticamente
DROP TRIGGER IF EXISTS trigger_update_seat_lock_zone_info ON seat_locks;
CREATE TRIGGER trigger_update_seat_lock_zone_info
  BEFORE INSERT OR UPDATE ON seat_locks
  FOR EACH ROW
  EXECUTE FUNCTION update_seat_lock_zone_info();

-- Función para obtener asientos con información completa de zona
CREATE OR REPLACE FUNCTION get_seats_with_zone_info(locator_param VARCHAR)
RETURNS TABLE (
  seat_id VARCHAR,
  zona_id VARCHAR,
  zona_nombre VARCHAR,
  precio DECIMAL(10,2),
  status VARCHAR,
  locator VARCHAR,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.seat_id,
    sl.zona_id,
    sl.zona_nombre,
    sl.precio,
    sl.status,
    sl.locator,
    sl.user_id,
    sl.created_at
  FROM seat_locks sl
  WHERE sl.locator = locator_param;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN seat_locks.zona_id IS 'ID de la zona del asiento';
COMMENT ON COLUMN seat_locks.zona_nombre IS 'Nombre de la zona del asiento';
COMMENT ON COLUMN seat_locks.precio IS 'Precio del asiento en la zona';
