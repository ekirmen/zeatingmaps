-- Script mejorado para limpiar locks duplicados en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar locks duplicados
SELECT 
  seat_id, 
  funcion_id, 
  tenant_id, 
  COUNT(*) as count
FROM public.seat_locks 
GROUP BY seat_id, funcion_id, tenant_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Ver todos los locks actuales
SELECT 
  id,
  seat_id,
  funcion_id,
  tenant_id,
  status,
  session_id,
  created_at,
  expires_at
FROM public.seat_locks 
ORDER BY created_at DESC
LIMIT 20;

-- 3. Eliminar locks duplicados (mantener solo el más reciente)
WITH ranked_locks AS (
  SELECT 
    id,
    seat_id,
    funcion_id,
    tenant_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY seat_id, funcion_id, tenant_id 
      ORDER BY created_at DESC
    ) as rn
  FROM public.seat_locks
)
DELETE FROM public.seat_locks 
WHERE id IN (
  SELECT id 
  FROM ranked_locks 
  WHERE rn > 1
);

-- 4. Verificar que no hay duplicados después de la limpieza
SELECT 
  seat_id, 
  funcion_id, 
  tenant_id, 
  COUNT(*) as count
FROM public.seat_locks 
GROUP BY seat_id, funcion_id, tenant_id 
HAVING COUNT(*) > 1;

-- 5. Mostrar locks restantes
SELECT 
  id,
  seat_id,
  funcion_id,
  status,
  session_id,
  created_at
FROM public.seat_locks 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Limpiar locks expirados (opcional)
DELETE FROM public.seat_locks 
WHERE expires_at < NOW();

-- 7. Verificar locks expirados eliminados
SELECT 
  'Locks expirados eliminados' as status,
  COUNT(*) as count
FROM public.seat_locks 
WHERE expires_at < NOW();
