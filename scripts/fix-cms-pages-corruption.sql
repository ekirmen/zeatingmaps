-- =====================================================
-- SCRIPT COMPLETO PARA LIMPIAR CORRUPCIÓN EN cms_pages
-- =====================================================

-- PASO 1: DIAGNÓSTICO COMPLETO
-- =====================================================

-- 1.1 Verificar estructura de la tabla
SELECT 'ESTRUCTURA DE LA TABLA' as seccion;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cms_pages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.2 Verificar total de registros
SELECT 'TOTAL DE REGISTROS' as seccion;
SELECT COUNT(*) as total_paginas FROM cms_pages;

-- 1.3 Verificar slugs corruptos (numéricos)
SELECT 'SLUGS CORRUPTOS (NUMÉRICOS)' as seccion;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id,
  'CORRUPTO' as status
FROM cms_pages 
WHERE slug ~ '^[0-9]+$'
ORDER BY slug::integer;

-- 1.4 Verificar slugs duplicados
SELECT 'SLUGS DUPLICADOS' as seccion;
SELECT 
  slug,
  COUNT(*) as cantidad,
  array_agg(id ORDER BY id) as ids,
  array_agg(nombre ORDER BY id) as nombres,
  array_agg(created_at ORDER BY id) as fechas_creacion
FROM cms_pages 
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY slug;

-- 1.5 Verificar datos generales
SELECT 'DATOS GENERALES' as seccion;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id,
  CASE 
    WHEN slug ~ '^[0-9]+$' THEN 'CORRUPTO'
    WHEN slug IN (
      SELECT slug FROM cms_pages 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    ) THEN 'DUPLICADO'
    ELSE 'OK'
  END as status
FROM cms_pages 
ORDER BY 
  CASE WHEN slug ~ '^[0-9]+$' THEN 0 ELSE 1 END,
  slug;

-- PASO 2: LIMPIEZA DE DATOS CORRUPTOS
-- =====================================================

-- 2.1 Crear tabla de backup (OPCIONAL)
-- CREATE TABLE cms_pages_backup AS SELECT * FROM cms_pages;

-- 2.2 Limpiar slugs numéricos corruptos
SELECT 'LIMPIANDO SLUGS CORRUPTOS...' as accion;
UPDATE cms_pages 
SET slug = 'pagina-corrupta-' || id 
WHERE slug ~ '^[0-9]+$';

-- 2.3 Eliminar páginas duplicadas (mantener la más reciente)
SELECT 'ELIMINANDO PÁGINAS DUPLICADAS...' as accion;
DELETE FROM cms_pages 
WHERE id NOT IN (
  SELECT DISTINCT ON (slug) id 
  FROM cms_pages 
  ORDER BY slug, created_at DESC
);

-- PASO 3: VERIFICACIÓN POST-LIMPIEZA
-- =====================================================

-- 3.1 Verificar que no queden slugs corruptos
SELECT 'VERIFICACIÓN: SLUGS CORRUPTOS' as seccion;
SELECT 
  id,
  slug,
  nombre,
  CASE WHEN slug ~ '^[0-9]+$' THEN 'CORRUPTO' ELSE 'OK' END as status
FROM cms_pages 
WHERE slug ~ '^[0-9]+$';

-- 3.2 Verificar que no queden duplicados
SELECT 'VERIFICACIÓN: SLUGS DUPLICADOS' as seccion;
SELECT 
  slug,
  COUNT(*) as cantidad
FROM cms_pages 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- 3.3 Estado final de la tabla
SELECT 'ESTADO FINAL DE LA TABLA' as seccion;
SELECT 
  COUNT(*) as total_paginas,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) as slugs_corruptos_restantes,
  COUNT(CASE WHEN slug LIKE 'pagina-corrupta-%' THEN 1 END) as slugs_renombrados
FROM cms_pages;

-- 3.4 Lista final de páginas
SELECT 'LISTA FINAL DE PÁGINAS' as seccion;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id
FROM cms_pages 
ORDER BY slug;

-- PASO 4: RECOMENDACIONES
-- =====================================================
SELECT 'RECOMENDACIONES' as seccion;
SELECT 
  '1. Revisar slugs renombrados como "pagina-corrupta-XX"' as recomendacion
UNION ALL
SELECT '2. Asignar slugs válidos a las páginas renombradas' as recomendacion
UNION ALL
SELECT '3. Verificar que WebStudio funcione correctamente' as recomendacion
UNION ALL
SELECT '4. Implementar validación en el código para prevenir futuras corrupciones' as recomendacion;
