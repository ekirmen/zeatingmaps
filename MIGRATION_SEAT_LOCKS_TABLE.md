# Migración de la tabla seat_locks

## Cambios necesarios en la base de datos

Para que el nuevo sistema de bloqueo funcione correctamente con mesas y sillas, necesitas ejecutar las siguientes migraciones en tu base de datos Supabase:

### 1. Agregar nuevas columnas a la tabla seat_locks

```sql
-- Agregar columna table_id para identificar mesas bloqueadas
ALTER TABLE seat_locks 
ADD COLUMN table_id UUID;

-- Agregar columna lock_type para distinguir entre bloqueos de asientos y mesas
ALTER TABLE seat_locks 
ADD COLUMN lock_type TEXT DEFAULT 'seat' CHECK (lock_type IN ('seat', 'table'));

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_table_id ON seat_locks(table_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_lock_type ON seat_locks(lock_type);
```

### 2. Actualizar las políticas RLS (Row Level Security)

```sql
-- Política para permitir inserción de bloqueos de asientos y mesas
CREATE POLICY "Users can insert seat and table locks" ON seat_locks
FOR INSERT WITH CHECK (
  (seat_id IS NOT NULL AND table_id IS NULL AND lock_type = 'seat') OR
  (table_id IS NOT NULL AND seat_id IS NULL AND lock_type = 'table')
);

-- Política para permitir actualización de bloqueos
CREATE POLICY "Users can update their own locks" ON seat_locks
FOR UPDATE USING (session_id = auth.jwt() ->> 'sub' OR session_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política para permitir eliminación de bloqueos propios
CREATE POLICY "Users can delete their own locks" ON seat_locks
FOR DELETE USING (session_id = auth.jwt() ->> 'sub' OR session_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política para permitir lectura de todos los bloqueos
CREATE POLICY "Users can view all locks" ON seat_locks
FOR SELECT USING (true);
```

### 3. Función para limpiar bloqueos expirados

```sql
-- Función para limpiar bloqueos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM seat_locks 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Crear un job para ejecutar la limpieza cada 5 minutos
SELECT cron.schedule(
  'cleanup-expired-locks',
  '*/5 * * * *',
  'SELECT cleanup_expired_locks();'
);
```

## Verificación de la migración

Después de ejecutar las migraciones, puedes verificar que todo funciona correctamente:

```sql
-- Verificar que las nuevas columnas existen
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'seat_locks';

-- Verificar que los índices se crearon
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'seat_locks';

-- Probar inserción de un bloqueo de asiento
INSERT INTO seat_locks (seat_id, funcion_id, session_id, locked_at, expires_at, status, lock_type)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 1, 'test-session', NOW(), NOW() + INTERVAL '10 minutes', 'seleccionado', 'seat');

-- Probar inserción de un bloqueo de mesa
INSERT INTO seat_locks (table_id, funcion_id, session_id, locked_at, expires_at, status, lock_type)
VALUES ('123e4567-e89b-12d3-a456-426614174001', 1, 'test-session', NOW(), NOW() + INTERVAL '10 minutes', 'seleccionado', 'table');
```

## Notas importantes

1. **Compatibilidad hacia atrás**: Los bloqueos existentes seguirán funcionando ya que `lock_type` tiene un valor por defecto de 'seat'.

2. **Migración de datos existentes**: Si tienes datos existentes en la tabla `seat_locks`, no necesitas migrarlos ya que el valor por defecto de `lock_type` es 'seat'.

3. **Rendimiento**: Los nuevos índices mejorarán el rendimiento de las consultas por `table_id` y `lock_type`.

4. **Seguridad**: Las políticas RLS aseguran que los usuarios solo puedan modificar sus propios bloqueos.

## Rollback (si es necesario)

Si necesitas revertir los cambios:

```sql
-- Eliminar las nuevas columnas
ALTER TABLE seat_locks DROP COLUMN IF EXISTS table_id;
ALTER TABLE seat_locks DROP COLUMN IF EXISTS lock_type;

-- Eliminar los índices
DROP INDEX IF EXISTS idx_seat_locks_table_id;
DROP INDEX IF EXISTS idx_seat_locks_lock_type;

-- Eliminar el job de limpieza
SELECT cron.unschedule('cleanup-expired-locks');
``` 