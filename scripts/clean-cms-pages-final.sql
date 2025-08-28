-- =====================================================
-- LIMPIEZA FINAL DE PÁGINAS CORRUPTAS CMS_PAGES
-- =====================================================

-- PASO 1: IDENTIFICAR PÁGINAS CORRUPTAS
-- =====================================================

-- Ver páginas con slugs genéricos o numéricos (creadas por el bug)
SELECT 'PÁGINAS CORRUPTAS CREADAS POR EL BUG:' as info;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id
FROM cms_pages 
WHERE slug LIKE 'pagina-%' 
   OR nombre ~ '^[0-9]+$'
   OR (tenant_id IS NULL AND slug ~ '^[0-9]+$')
   OR slug ~ '^[0-9]+$'
ORDER BY id;

-- Ver páginas válidas del sistema
SELECT 'PÁGINAS VÁLIDAS DEL SISTEMA:' as info;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id
FROM cms_pages 
WHERE slug IN ('inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq', 'usa', 'venezuela')
ORDER BY id;

-- PASO 2: LIMPIEZA COMPLETA
-- =====================================================

-- Eliminar TODAS las páginas corruptas creadas por el bug
DELETE FROM cms_pages 
WHERE slug LIKE 'pagina-%' 
   OR nombre ~ '^[0-9]+$'
   OR (tenant_id IS NULL AND slug ~ '^[0-9]+$')
   OR slug ~ '^[0-9]+$';

-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar estado final
SELECT 'ESTADO FINAL POST-LIMPIEZA:' as estado;
SELECT 
  COUNT(*) as total_paginas,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as paginas_con_tenant,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as paginas_sin_tenant
FROM cms_pages;

-- Lista final de páginas válidas
SELECT 'PÁGINAS VÁLIDAS RESTANTES:' as resultado;
SELECT 
  id,
  slug,
  nombre,
  created_at,
  tenant_id
FROM cms_pages 
ORDER BY id;

-- Verificar que no queden problemas
SELECT 'VERIFICACIÓN FINAL:' as verificacion;
SELECT 
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT slug) 
    AND COUNT(CASE WHEN slug LIKE 'pagina-%' THEN 1 END) = 0
    AND COUNT(CASE WHEN nombre ~ '^[0-9]+$' THEN 1 END) = 0
    AND COUNT(CASE WHEN slug ~ '^[0-9]+$' THEN 1 END) = 0
    THEN '✅ TABLA COMPLETAMENTE LIMPIA'
    ELSE '❌ AÚN HAY PROBLEMAS'
  END as estado_final
FROM cms_pages;

-- Verificar que solo queden las páginas del sistema
SELECT 'PÁGINAS ESPERADAS:' as esperadas;
SELECT 
  CASE 
    WHEN COUNT(*) = 10 
    AND COUNT(CASE WHEN slug IN ('inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq', 'usa', 'venezuela') THEN 1 END) = 10
    THEN '✅ EXACTAMENTE 10 PÁGINAS DEL SISTEMA'
    ELSE '❌ NÚMERO INCORRECTO DE PÁGINAS'
  END as verificacion_final
FROM cms_pages;
