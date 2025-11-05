-- =====================================================
-- OPTIMIZACIÓN DE PERFORMANCE PARA seat_locks
-- Mejora la velocidad de sincronización
-- =====================================================

-- 1. ELIMINAR POLÍTICAS RLS DUPLICADAS
-- Mantener solo las políticas más eficientes

-- Eliminar políticas duplicadas (mantener solo las más optimizadas)
DROP POLICY IF EXISTS "seat_locks_delete_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_select_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_policy" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_delete_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_select_any_auth" ON public.seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_any_auth" ON public.seat_locks;

-- 2. CREAR POLÍTICAS RLS OPTIMIZADAS Y COMBINADAS
-- Políticas más eficientes que combinan múltiples condiciones

-- Política combinada para SELECT (más rápida)
DROP POLICY IF EXISTS "seat_locks_select_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_select_policy_optimized" ON public.seat_locks
FOR SELECT
USING (true); -- Permitir lectura a todos (necesario para Realtime)

-- Política combinada para INSERT (más rápida)
DROP POLICY IF EXISTS "seat_locks_insert_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_insert_policy_optimized" ON public.seat_locks
FOR INSERT
WITH CHECK (true); -- Permitir inserción a todos

-- Política combinada para UPDATE (más rápida)
DROP POLICY IF EXISTS "seat_locks_update_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_update_policy_optimized" ON public.seat_locks
FOR UPDATE
USING (true)
WITH CHECK (true); -- Permitir actualización a todos

-- Política combinada para DELETE (más rápida)
DROP POLICY IF EXISTS "seat_locks_delete_policy_optimized" ON public.seat_locks;
CREATE POLICY "seat_locks_delete_policy_optimized" ON public.seat_locks
FOR DELETE
USING (true); -- Permitir eliminación a todos

-- 3. OPTIMIZAR ÍNDICES EXISTENTES
-- Crear índices compuestos más eficientes para consultas frecuentes

-- Índice compuesto optimizado para búsquedas por funcion_id + tenant_id + status
-- (Ya existe, pero verificar que esté bien optimizado)
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_tenant_status_optimized 
ON public.seat_locks (funcion_id, tenant_id, status)
WHERE status IN ('seleccionado', 'reservado', 'vendido', 'pagado');

-- Índice compuesto optimizado para búsquedas por session_id + funcion_id
-- (Útil para limpiar bloqueos de sesión)
CREATE INDEX IF NOT EXISTS idx_seat_locks_session_funcion 
ON public.seat_locks (session_id, funcion_id)
WHERE session_id IS NOT NULL;

-- Índice compuesto optimizado para búsquedas por seat_id + funcion_id + tenant_id
-- (Último índice para consultas más específicas)
CREATE INDEX IF NOT EXISTS idx_seat_locks_seat_funcion_tenant_optimized 
ON public.seat_locks (seat_id, funcion_id, tenant_id)
INCLUDE (status, session_id, locked_at, expires_at);

-- Índice parcial optimizado para bloqueos activos
-- (Solo indexa registros activos para reducir tamaño)
CREATE INDEX IF NOT EXISTS idx_seat_locks_active_locks 
ON public.seat_locks (funcion_id, tenant_id, seat_id)
WHERE status IN ('seleccionado', 'reservado', 'locked', 'expirando')
AND expires_at IS NOT NULL;

-- 4. OPTIMIZAR TRIGGERS
-- Modificar triggers para que sean más rápidos (si es necesario)

-- Nota: Los triggers existentes están bien, pero podemos optimizarlos
-- si es necesario revisando las funciones que ejecutan

-- 5. CREAR ÍNDICE ADICIONAL PARA CONSULTAS DE EXPIRACIÓN
-- Optimizado para limpieza de bloqueos expirados
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires_cleanup 
ON public.seat_locks (expires_at, status, funcion_id)
WHERE expires_at IS NOT NULL
AND status IN ('seleccionado', 'locked', 'expirando');

-- 6. OPTIMIZAR ÍNDICE DE LOCATOR (si se usa frecuentemente)
CREATE INDEX IF NOT EXISTS idx_seat_locks_locator_optimized 
ON public.seat_locks (locator)
WHERE locator IS NOT NULL;

-- 7. HABILITAR RLS (necesario para que las políticas funcionen)
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

-- 8. ANALIZAR TABLA PARA OPTIMIZAR PLANIFICADOR
ANALYZE public.seat_locks;

-- =====================================================
-- NOTAS DE OPTIMIZACIÓN:
-- =====================================================
-- 1. Las políticas RLS se simplificaron eliminando duplicados
-- 2. Los índices compuestos mejoran las consultas frecuentes
-- 3. Los índices parciales reducen el tamaño y mejoran la velocidad
-- 4. El índice de session_id + funcion_id acelera la limpieza de sesiones
-- 5. El índice de expires_at optimiza la limpieza de bloqueos expirados
-- =====================================================

