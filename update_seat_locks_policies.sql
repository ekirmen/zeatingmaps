-- Actualizar políticas RLS para seat_locks con las nuevas columnas
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Eliminar políticas existentes que puedan causar conflictos
DROP POLICY IF EXISTS "Allow delete by session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow delete with session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow insert with valid session_id" ON seat_locks;
DROP POLICY IF EXISTS "Allow insert/update access to seat_locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow read access to seat_locks" ON seat_locks;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON seat_locks;
DROP POLICY IF EXISTS "Allow update by session_id" ON seat_locks;

-- 2. Crear nuevas políticas que funcionen con table_id y lock_type

-- Política para INSERT - permitir inserción de asientos y mesas
CREATE POLICY "Allow insert seat and table locks" ON seat_locks
FOR INSERT WITH CHECK (
  (seat_id IS NOT NULL AND table_id IS NULL AND lock_type = 'seat') OR
  (table_id IS NOT NULL AND seat_id IS NULL AND lock_type = 'table')
);

-- Política para SELECT - permitir lectura de todos los bloqueos
CREATE POLICY "Allow read all locks" ON seat_locks
FOR SELECT USING (true);

-- Política para UPDATE - permitir actualización de bloqueos propios
CREATE POLICY "Allow update own locks" ON seat_locks
FOR UPDATE USING (session_id = auth.jwt() ->> 'sub');

-- Política para DELETE - permitir eliminación de bloqueos propios
CREATE POLICY "Allow delete own locks" ON seat_locks
FOR DELETE USING (session_id = auth.jwt() ->> 'sub');

-- 3. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'seat_locks'
ORDER BY policyname; 