-- Script para limpiar registros de prueba y resetear el estado
-- Ejecutar en Supabase SQL Editor

-- 1. Limpiar registros de prueba
DELETE FROM seat_locks WHERE seat_id = 'silla_test_123';

-- 2. Limpiar bloqueos expirados
SELECT cleanup_expired_seat_locks();

-- 3. Verificar que no hay registros para la función 43
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'seleccionado' THEN 1 END) as seleccionados,
  COUNT(CASE WHEN status = 'locked' THEN 1 END) as bloqueados,
  COUNT(CASE WHEN expires_at < now() THEN 1 END) as expirados
FROM seat_locks 
WHERE funcion_id = 43;

-- 4. Verificar que la tabla saved_carts está vacía (opcional)
SELECT COUNT(*) as saved_carts_count FROM saved_carts;

-- 5. Verificar que las funciones RPC están funcionando
SELECT 
  routine_name, 
  routine_type, 
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'lock_seat_atomically', 
  'unlock_seat_atomically', 
  'check_seat_availability', 
  'cleanup_expired_seat_locks'
)
ORDER BY routine_name;
