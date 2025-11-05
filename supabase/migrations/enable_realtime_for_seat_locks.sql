-- =====================================================
-- HABILITAR REALTIME PARA seat_locks
-- Necesario para que los eventos en tiempo real funcionen
-- =====================================================

-- Habilitar Realtime para la tabla seat_locks
-- REPLICA IDENTITY FULL permite que Realtime envíe todos los datos de la fila en los eventos
ALTER TABLE public.seat_locks REPLICA IDENTITY FULL;

-- Verificar que se aplicó correctamente
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

-- =====================================================
-- NOTA: Después de ejecutar esto, también necesitas:
-- 1. Habilitar Realtime en Supabase Dashboard:
--    - Database → Replication → Habilitar para seat_locks
-- 2. Recargar ambos navegadores (Ctrl+F5)
-- 3. Verificar en la consola:
--    - Deberías ver: ✅ [SEAT_LOCK_STORE] Suscrito exitosamente a Realtime
-- =====================================================

