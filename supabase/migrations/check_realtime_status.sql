-- =====================================================
-- VERIFICAR ESTADO DE REALTIME PARA seat_locks
-- =====================================================

-- 1. Verificar replication identity
SELECT 
  c.relname AS tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'f' THEN 'full'
    WHEN 'n' THEN 'nothing'
    WHEN 'i' THEN 'index'
  END AS replication_identity,
  CASE c.relreplident
    WHEN 'f' THEN '✅ Realtime habilitado (FULL)'
    WHEN 'd' THEN '⚠️ Realtime puede funcionar (DEFAULT)'
    WHEN 'i' THEN '⚠️ Realtime puede funcionar (INDEX)'
    WHEN 'n' THEN '❌ Realtime NO habilitado (NOTHING)'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';

-- 2. Verificar si la función lock_seat_atomically existe
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'lock_seat_atomically'
  AND n.nspname = 'public';

-- 3. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'seat_locks'
ORDER BY policyname;

-- 4. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'seat_locks'
  AND schemaname = 'public';

