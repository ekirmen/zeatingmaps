-- 🚀 Corregir Eventos con Tenant_ID NULL
-- Este script corrige eventos que tienen tenant_id = null

-- =====================================================
-- VERIFICAR EVENTOS CON TENANT_ID NULL
-- =====================================================

-- Mostrar eventos con tenant_id null
SELECT 
    'EVENTOS CON TENANT_ID NULL' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    e.slug
FROM eventos e
WHERE e.tenant_id IS NULL
ORDER BY e.nombre;

-- =====================================================
-- VERIFICAR FUNCIONES CON TENANT_ID NULL
-- =====================================================

-- Mostrar funciones con tenant_id null
SELECT 
    'FUNCIONES CON TENANT_ID NULL' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    e.nombre as evento_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
WHERE f.tenant_id IS NULL
ORDER BY f.fecha_celebracion;

-- =====================================================
-- CORREGIR EVENTOS CON TENANT_ID NULL
-- =====================================================

-- Actualizar eventos con tenant_id null para usar el tenant zeatingmaps
UPDATE eventos 
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
WHERE tenant_id IS NULL;

-- =====================================================
-- CORREGIR FUNCIONES CON TENANT_ID NULL
-- =====================================================

-- Actualizar funciones con tenant_id null para usar el tenant zeatingmaps
UPDATE funciones 
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
WHERE tenant_id IS NULL;

-- =====================================================
-- VERIFICAR CORRECCIÓN
-- =====================================================

-- Verificar que no quedan eventos con tenant_id null
SELECT 
    'EVENTOS SIN TENANT_ID NULL' as tipo,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as eventos_con_null
FROM eventos;

-- Verificar que no quedan funciones con tenant_id null
SELECT 
    'FUNCIONES SIN TENANT_ID NULL' as tipo,
    COUNT(*) as total_funciones,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as funciones_con_null
FROM funciones;

-- Verificar el evento específico que causaba el error
SELECT 
    'EVENTO ESPECÍFICO' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    e.slug,
    t.subdomain as tenant_subdomain
FROM eventos e
LEFT JOIN tenants t ON e.tenant_id = t.id
WHERE e.id = 'c84baabd-c424-407f-b6c3-2051062237b7';

-- Verificar funciones del evento específico
SELECT 
    'FUNCIONES DEL EVENTO' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
WHERE f.evento = 'c84baabd-c424-407f-b6c3-2051062237b7'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto corregirá todos los eventos y funciones con tenant_id null
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- No debe haber eventos o funciones con tenant_id null
- El evento c84baabd-c424-407f-b6c3-2051062237b7 debe tener tenant_id correcto
- Las funciones deberían aparecer en el store
*/
