-- Script final para limpiar locks duplicados
-- Este script identifica y elimina duplicados manteniendo solo el más reciente

-- Paso 1: Identificar duplicados
WITH duplicates AS (
  SELECT 
    seat_id, 
    funcion_id, 
    tenant_id,
    COUNT(*) as duplicate_count
  FROM seat_locks 
  GROUP BY seat_id, funcion_id, tenant_id
  HAVING COUNT(*) > 1
),
-- Paso 2: Para cada duplicado, mantener solo el más reciente
locks_to_keep AS (
  SELECT DISTINCT ON (seat_id, funcion_id, tenant_id)
    id,
    seat_id,
    funcion_id,
    tenant_id,
    locked_at
  FROM seat_locks
  WHERE (seat_id, funcion_id, tenant_id) IN (
    SELECT seat_id, funcion_id, tenant_id FROM duplicates
  )
  ORDER BY seat_id, funcion_id, tenant_id, locked_at DESC
)
-- Paso 3: Eliminar todos los locks duplicados excepto los que se van a mantener
DELETE FROM seat_locks 
WHERE (seat_id, funcion_id, tenant_id) IN (
  SELECT seat_id, funcion_id, tenant_id FROM duplicates
)
AND id NOT IN (
  SELECT id FROM locks_to_keep
);

-- Verificar que no quedan duplicados
SELECT 
  seat_id, 
  funcion_id, 
  tenant_id,
  COUNT(*) as count
FROM seat_locks 
GROUP BY seat_id, funcion_id, tenant_id
HAVING COUNT(*) > 1;

-- Si la consulta anterior no devuelve resultados, significa que no hay duplicados
