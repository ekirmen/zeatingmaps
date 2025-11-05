-- =====================================================
-- Verificar y habilitar Realtime para seat_locks
-- =====================================================

-- 1. Verificar si Realtime está habilitado para la tabla
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END as replication_identity
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';

-- 2. Habilitar REPLICA IDENTITY FULL para Realtime (necesario para enviar datos completos)
ALTER TABLE public.seat_locks REPLICA IDENTITY FULL;

-- 3. Verificar que se haya aplicado correctamente
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END as replication_identity
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';

-- 4. Verificar que la tabla esté en la publicación de Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'seat_locks';

-- 5. Si no está en la publicación, agregarla
-- NOTA: Esto requiere permisos de superusuario, puede que necesites hacerlo desde el Dashboard
-- INSERT INTO pg_publication (pubname) VALUES ('supabase_realtime') ON CONFLICT DO NOTHING;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_locks;

-- 6. Verificar RLS está habilitado
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';

-- 7. Habilitar RLS si no está habilitado
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

