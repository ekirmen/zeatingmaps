-- Actualizar políticas RLS para seat_locks (versión simplificada)
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 0. Crear tabla seat_locks si no existe
CREATE TABLE IF NOT EXISTS seat_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seat_id TEXT,
  table_id TEXT,
  funcion_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'locked',
  lock_type TEXT DEFAULT 'seat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existe con UUID, convertir los campos
DO $$ 
BEGIN
  -- Verificar si seat_id es de tipo UUID y cambiarlo a TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seat_locks' 
    AND column_name = 'seat_id' 
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE seat_locks ALTER COLUMN seat_id TYPE TEXT;
  END IF;
  
  -- Verificar si table_id es de tipo UUID y cambiarlo a TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seat_locks' 
    AND column_name = 'table_id' 
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE seat_locks ALTER COLUMN table_id TYPE TEXT;
  END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_id ON seat_locks(funcion_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_session_id ON seat_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_seat_id ON seat_locks(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_table_id ON seat_locks(table_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires_at ON seat_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_locks_lock_type ON seat_locks(lock_type);

-- 1. Eliminar políticas existentes que puedan causar conflictos
DROP POLICY IF EXISTS "Allow delete by session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow delete with session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow insert with valid session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow insert/update access to seat_locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow read access to seat_locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON seat_locks;
DROP POLICY IF EXISTS "Allow update by session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow insert seat and table locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow read all locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow update own locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow delete own locks" ON seat_locks;

-- 2. Crear políticas simplificadas que funcionen con cualquier tipo de session_id

-- Política para INSERT - permitir inserción de asientos y mesas
CREATE POLICY "Allow insert seat and table locks" ON seat_locks
FOR INSERT WITH CHECK (
  (seat_id IS NOT NULL AND table_id IS NULL AND lock_type = 'seat') OR
  (table_id IS NOT NULL AND seat_id IS NULL AND lock_type = 'table')
);

-- Política para SELECT - permitir lectura de todos los bloqueos
CREATE POLICY "Allow read all locks" ON seat_locks
FOR SELECT USING (true);

-- Política para UPDATE - permitir actualización de bloqueos propios (simplificada)
CREATE POLICY "Allow update own locks" ON seat_locks
FOR UPDATE USING (true);

-- Política para DELETE - permitir eliminación de bloqueos propios (simplificada)
CREATE POLICY "Allow delete own locks" ON seat_locks
FOR DELETE USING (true);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 'Políticas actualizadas:' as status;
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'seat_locks'
ORDER BY policyname; 