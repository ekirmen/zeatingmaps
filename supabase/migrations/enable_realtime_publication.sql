-- =====================================================
-- Habilitar Realtime para seat_locks en la publicación
-- =====================================================
-- NOTA: Esto puede requerir permisos de superusuario
-- Si no funciona desde aquí, habilítalo desde el Dashboard:
-- Database → Replication → Enable Realtime para seat_locks

-- 1. Verificar si la publicación existe
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. Verificar si seat_locks está en la publicación
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'seat_locks';

-- 3. Intentar agregar la tabla a la publicación (puede fallar si no tienes permisos)
-- Si falla, ve al Dashboard de Supabase → Database → Replication
DO $$
BEGIN
  -- Verificar si la tabla ya está en la publicación
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'seat_locks'
  ) THEN
    -- Intentar agregar la tabla
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_locks;
      RAISE NOTICE 'Tabla seat_locks agregada a la publicación supabase_realtime';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'No se pudo agregar la tabla automáticamente. Error: %', SQLERRM;
      RAISE NOTICE 'Por favor, habilita Realtime desde el Dashboard: Database → Replication → Enable para seat_locks';
    END;
  ELSE
    RAISE NOTICE 'La tabla seat_locks ya está en la publicación supabase_realtime';
  END IF;
END $$;

-- 4. Verificar el estado final
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END as replication_identity,
  c.relrowsecurity as rls_enabled,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'seat_locks'
    ) THEN 'SÍ'
    ELSE 'NO'
  END as en_realtime_publication
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'seat_locks' 
  AND n.nspname = 'public';

