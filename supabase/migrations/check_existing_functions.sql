-- =====================================================
-- VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

-- Verificar todas las versiones de lock_seat_atomically
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.oid::regprocedure AS full_signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'lock_seat_atomically'
  AND n.nspname = 'public';

-- Verificar todas las versiones de unlock_seat_atomically
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.oid::regprocedure AS full_signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'unlock_seat_atomically'
  AND n.nspname = 'public';

