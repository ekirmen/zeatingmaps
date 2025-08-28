-- =====================================================
-- SCRIPT RÁPIDO PARA RESOLVER cms_pages CORRUPTOS
-- =====================================================

-- PASO 1: VERIFICAR EL PROBLEMA
-- =====================================================

-- Ver slugs corruptos (numéricos)
SELECT 'SLUGS CORRUPTOS ENCONTRADOS:' as info;
SELECT 
  id,
  slug,
  nombre
FROM cms_pages 
WHERE slug ~ '^[0-9]+$';

-- Ver duplicados
SELECT 'SLUGS DUPLICADOS:' as info;
SELECT 
  slug,
  COUNT(*) as cantidad
FROM cms_pages 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- PASO 2: SOLUCIÓN RÁPIDA
-- =====================================================

-- 1. Limpiar slugs numéricos corruptos
UPDATE cms_pages 
SET slug = 'pagina-corrupta-' || id 
WHERE slug ~ '^[0-9]+$';

-- 2. Eliminar duplicados (mantener la más reciente)
DELETE FROM cms_pages 
WHERE id NOT IN (
  SELECT DISTINCT ON (slug) id 
  FROM cms_pages 
  ORDER BY slug, created_at DESC
);

-- PASO 3: VERIFICAR SOLUCIÓN
-- =====================================================

-- Verificar que no queden problemas
SELECT 'VERIFICACIÓN FINAL:' as info;
SELECT 
  COUNT(*) as total_paginas,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) as slugs_corruptos_restantes
FROM cms_pages;

-- Lista final de páginas
SELECT 'PÁGINAS RESTANTES:' as info;
SELECT 
  id,
  slug,
  nombre
FROM cms_pages 
ORDER BY slug;
