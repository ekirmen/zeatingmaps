-- =====================================================
-- LIMPIEZA DE POLÍTICAS RLS DUPLICADAS
-- Elimina políticas duplicadas y mantiene solo las optimizadas
-- =====================================================

-- Eliminar políticas duplicadas (mantener solo las optimizadas)
DROP POLICY IF EXISTS "seat_locks_delete_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_select_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_policy" ON public.seat_locks;

-- Eliminar políticas antiguas que puedan existir
DROP POLICY IF EXISTS "seat_locks_delete_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_select_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_any_auth" ON public.seat_locks;

-- Asegurar que las políticas optimizadas existan y estén correctas
-- Si no existen, crearlas

-- Política para SELECT (permite lectura a todos para Realtime)
DROP POLICY IF EXISTS "seat_locks_select_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_select_policy_optimized" ON public.seat_locks
FOR SELECT
USING (true); -- Permitir lectura a todos (necesario para Realtime)

-- Política para INSERT (permite inserción a todos)
DROP POLICY IF EXISTS "seat_locks_insert_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_insert_policy_optimized" ON public.seat_locks
FOR INSERT
WITH CHECK (true); -- Permitir inserción a todos

-- Política para UPDATE (permite actualización a todos)
DROP POLICY IF EXISTS "seat_locks_update_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_update_policy_optimized" ON public.seat_locks
FOR UPDATE
USING (true)
WITH CHECK (true); -- Permitir actualización a todos

-- Política para DELETE (permite eliminación a todos)
DROP POLICY IF EXISTS "seat_locks_delete_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_delete_policy_optimized" ON public.seat_locks
FOR DELETE
USING (true); -- Permitir eliminación a todos

-- Verificar que RLS esté habilitado (necesario para que las políticas funcionen)
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecutar después para verificar:
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'seat_locks';
-- 
-- Deberías ver solo:
-- - seat_locks_select_policy_optimized (SELECT)
-- - seat_locks_insert_policy_optimized (INSERT)
-- - seat_locks_update_policy_optimized (UPDATE)
-- - seat_locks_delete_policy_optimized (DELETE)
-- =====================================================

