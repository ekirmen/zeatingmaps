-- =====================================================
-- LIMPIEZA AGRESIVA DE TODOS LOS SLUGS CORRUPTOS
-- =====================================================

-- PASO 1: IDENTIFICAR TODOS LOS PROBLEMAS
-- =====================================================

-- 1.1 Slugs numéricos corruptos
SELECT 'SLUGS NUMÉRICOS CORRUPTOS:' as problema;
SELECT 
  id,
  slug,
  nombre,
  created_at
FROM cms_pages 
WHERE slug ~ '^[0-9]+$'
ORDER BY slug::integer;

-- 1.2 Slugs duplicados
SELECT 'SLUGS DUPLICADOS:' as problema;
SELECT 
  slug,
  COUNT(*) as cantidad,
  array_agg(id ORDER BY id) as ids
FROM cms_pages 
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY slug;

-- 1.3 Estado general de la tabla
SELECT 'ESTADO ACTUAL DE LA TABLA:' as estado;
SELECT 
  COUNT(*) as total_paginas,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) as slugs_corruptos,
  COUNT(CASE WHEN slug LIKE 'pagina-corrupta-%' THEN 1 END) as slugs_renombrados
FROM cms_pages;

-- PASO 2: LIMPIEZA AGRESIVA
-- =====================================================

-- 2.1 Crear backup (IMPORTANTE)
-- CREATE TABLE cms_pages_backup_before_aggressive AS SELECT * FROM cms_pages;

-- 2.2 ELIMINAR TODAS las páginas con slugs numéricos
SELECT 'ELIMINANDO PÁGINAS CON SLUGS NUMÉRICOS...' as accion;
DELETE FROM cms_pages 
WHERE slug ~ '^[0-9]+$';

-- 2.3 ELIMINAR TODAS las páginas duplicadas
SELECT 'ELIMINANDO PÁGINAS DUPLICADAS...' as accion;
DELETE FROM cms_pages 
WHERE id NOT IN (
  SELECT DISTINCT ON (slug) id 
  FROM cms_pages 
  ORDER BY slug, created_at DESC
);

-- 2.4 Limpiar slugs renombrados problemáticos
SELECT 'LIMPIANDO SLUGS RENOMBRADOS PROBLEMÁTICOS...' as accion;
DELETE FROM cms_pages 
WHERE slug LIKE 'pagina-corrupta-%';

-- PASO 3: VERIFICACIÓN POST-LIMPIEZA
-- =====================================================

-- 3.1 Estado final
SELECT 'ESTADO FINAL POST-LIMPIEZA:' as estado;
SELECT 
  COUNT(*) as total_paginas,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) as slugs_corruptos_restantes,
  COUNT(CASE WHEN slug LIKE 'pagina-corrupta-%' THEN 1 END) as slugs_renombrados_restantes
FROM cms_pages;

-- 3.2 Lista final de páginas válidas
SELECT 'PÁGINAS VÁLIDAS RESTANTES:' as resultado;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id
FROM cms_pages 
ORDER BY slug;

-- 3.3 Verificar que no queden problemas
SELECT 'VERIFICACIÓN FINAL:' as verificacion;
SELECT 
  CASE 
    WHEN COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) = 0 
    AND COUNT(CASE WHEN slug LIKE 'pagina-corrupta-%' THEN 1 END) = 0
    AND COUNT(*) = COUNT(DISTINCT slug)
    THEN '✅ TABLA COMPLETAMENTE LIMPIA'
    ELSE '❌ AÚN HAY PROBLEMAS'
  END as estado_final
FROM cms_pages;
