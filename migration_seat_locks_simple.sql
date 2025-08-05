-- Migración simplificada de la tabla seat_locks
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Agregar nuevas columnas a la tabla seat_locks
ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS table_id UUID;

ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS lock_type TEXT DEFAULT 'seat' CHECK (lock_type IN ('seat', 'table'));

-- 2. Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_table_id ON seat_locks(table_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_lock_type ON seat_locks(lock_type);

-- 3. Función para limpiar bloqueos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM seat_locks 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar que las migraciones se aplicaron correctamente
SELECT 'Migración completada' as status;

-- 5. Mostrar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks'
ORDER BY ordinal_position; 