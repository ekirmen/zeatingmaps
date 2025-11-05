-- =====================================================
-- ELIMINAR POLÍTICAS RLS DUPLICADAS
-- Mantiene solo las políticas optimizadas
-- =====================================================

-- Eliminar políticas duplicadas (sin "_optimized")
DROP POLICY IF EXISTS "seat_locks_delete_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_select_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_policy" ON public.seat_locks;

-- Verificar que las políticas optimizadas existan
-- Si no existen, crearlas

-- Política SELECT optimizada
DROP POLICY IF EXISTS "seat_locks_select_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_select_policy_optimized" ON public.seat_locks
FOR SELECT
USING (true); -- Permitir lectura a todos (necesario para Realtime)

-- Política INSERT optimizada
DROP POLICY IF EXISTS "seat_locks_insert_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_insert_policy_optimized" ON public.seat_locks
FOR INSERT
WITH CHECK (true); -- Permitir inserción a todos

-- Política UPDATE optimizada
DROP POLICY IF EXISTS "seat_locks_update_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_update_policy_optimized" ON public.seat_locks
FOR UPDATE
USING (true)
WITH CHECK (true); -- Permitir actualización a todos

-- Política DELETE optimizada
DROP POLICY IF EXISTS "seat_locks_delete_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_delete_policy_optimized" ON public.seat_locks
FOR DELETE
USING (true); -- Permitir eliminación a todos

-- Asegurar que RLS esté habilitado
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Después de ejecutar, ejecuta esto para verificar:
-- 
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'seat_locks'
-- ORDER BY policyname;
-- 
-- Deberías ver solo 4 políticas:
-- - seat_locks_delete_policy_optimized
-- - seat_locks_insert_policy_optimized
-- - seat_locks_select_policy_optimized
-- - seat_locks_update_policy_optimized
-- =====================================================

