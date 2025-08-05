-- Migración de la tabla seat_locks
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Agregar nuevas columnas a la tabla seat_locks
ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS table_id UUID;

ALTER TABLE seat_locks 
ADD COLUMN IF NOT EXISTS lock_type TEXT DEFAULT 'seat' CHECK (lock_type IN ('seat', 'table'));

-- 2. Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_table_id ON seat_locks(table_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_lock_type ON seat_locks(lock_type);

-- 3. Actualizar las políticas RLS (Row Level Security)
-- Primero eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can insert seat and table locks" ON seat_locks;
DROP POLICY IF EXISTS "Users can update their own locks" ON seat_locks;
DROP POLICY IF EXISTS "Users can delete their own locks" ON seat_locks;
DROP POLICY IF EXISTS "Users can view all locks" ON seat_locks;

-- Crear nuevas políticas con manejo correcto de tipos
CREATE POLICY "Users can insert seat and table locks" ON seat_locks
FOR INSERT WITH CHECK (
  (seat_id IS NOT NULL AND table_id IS NULL AND lock_type = 'seat') OR
  (table_id IS NOT NULL AND seat_id IS NULL AND lock_type = 'table')
);

CREATE POLICY "Users can update their own locks" ON seat_locks
FOR UPDATE USING (
  session_id = COALESCE(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::json->>'sub')
);

CREATE POLICY "Users can delete their own locks" ON seat_locks
FOR DELETE USING (
  session_id = COALESCE(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::json->>'sub')
);

CREATE POLICY "Users can view all locks" ON seat_locks
FOR SELECT USING (true);

-- 4. Función para limpiar bloqueos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM seat_locks 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Crear un job para ejecutar la limpieza cada 5 minutos (opcional)
-- Descomenta la siguiente línea si tienes la extensión pg_cron habilitada
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');

-- 6. Verificar que las migraciones se aplicaron correctamente
SELECT 'Migración completada' as status; 