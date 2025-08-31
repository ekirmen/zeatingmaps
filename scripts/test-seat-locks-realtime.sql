-- Script para probar la funcionalidad de seat_locks y realtime
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la tabla existe y tiene la estructura correcta
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks' 
ORDER BY ordinal_position;

-- 2. Verificar que las políticas RLS están activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'seat_locks';

-- 3. Verificar que realtime está habilitado
SELECT 
  name,
  enabled,
  config
FROM pg_publication_tables 
WHERE tablename = 'seat_locks';

-- 4. Insertar un registro de prueba
INSERT INTO seat_locks (
  seat_id, 
  funcion_id, 
  session_id, 
  status, 
  lock_type,
  locked_at,
  expires_at
) VALUES (
  'test-seat-123',
  43,
  'test-session-456',
  'seleccionado',
  'seat',
  NOW(),
  NOW() + INTERVAL '10 minutes'
) ON CONFLICT (seat_id, funcion_id) DO NOTHING;

-- 5. Verificar que se insertó correctamente
SELECT * FROM seat_locks WHERE seat_id = 'test-seat-123';

-- 6. Actualizar el estado
UPDATE seat_locks 
SET status = 'bloqueado' 
WHERE seat_id = 'test-seat-123';

-- 7. Verificar la actualización
SELECT * FROM seat_locks WHERE seat_id = 'test-seat-123';

-- 8. Eliminar el registro de prueba
DELETE FROM seat_locks WHERE seat_id = 'test-seat-123';

-- 9. Verificar que se eliminó
SELECT COUNT(*) as total_seat_locks FROM seat_locks WHERE seat_id = 'test-seat-123';

-- 10. Verificar la función set_updated_at si existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'set_updated_at';
