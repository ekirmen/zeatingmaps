-- 🚀 Corregir Mismatch de Tenant_ID
-- Este script verifica y corrige el problema de tenant_id

-- =====================================================
-- VERIFICAR TENANTS
-- =====================================================

-- Mostrar todos los tenants
SELECT 
    'TENANTS EXISTENTES' as tipo,
    id,
    subdomain,
    company_name,
    status
FROM tenants 
ORDER BY subdomain;

-- =====================================================
-- VERIFICAR EVENTOS Y SUS TENANT_IDS
-- =====================================================

-- Mostrar eventos con sus tenant_ids
SELECT 
    'EVENTOS CON TENANT_IDS' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    t.subdomain as tenant_subdomain,
    t.company_name as tenant_company
FROM eventos e
LEFT JOIN tenants t ON e.tenant_id = t.id
ORDER BY e.nombre;

-- =====================================================
-- VERIFICAR FUNCIONES Y SUS TENANT_IDS
-- =====================================================

-- Mostrar funciones con sus tenant_ids
SELECT 
    'FUNCIONES CON TENANT_IDS' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    e.nombre as evento_nombre,
    t.subdomain as tenant_subdomain
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN tenants t ON f.tenant_id = t.id
ORDER BY f.fecha_celebracion;

-- =====================================================
-- CORREGIR TENANT_ID DE EVENTOS
-- =====================================================

-- Actualizar eventos para usar el tenant correcto
UPDATE eventos 
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
WHERE tenant_id != (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
AND tenant_id IS NOT NULL;

-- =====================================================
-- CORREGIR TENANT_ID DE FUNCIONES
-- =====================================================

-- Actualizar funciones para usar el tenant correcto
UPDATE funciones 
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
WHERE tenant_id != (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
AND tenant_id IS NOT NULL;

-- =====================================================
-- VERIFICAR CORRECCIÓN
-- =====================================================

-- Verificar que los eventos ahora tienen el tenant correcto
SELECT 
    'EVENTOS CORREGIDOS' as tipo,
    e.id,
    e.nombre,
    e.tenant_id,
    t.subdomain as tenant_subdomain
FROM eventos e
LEFT JOIN tenants t ON e.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps'
ORDER BY e.nombre;

-- Verificar que las funciones ahora tienen el tenant correcto
SELECT 
    'FUNCIONES CORREGIDAS' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    e.nombre as evento_nombre,
    COUNT(*) OVER() as total_funciones
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN tenants t ON f.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto corregirá el problema de tenant_id
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Los eventos y funciones tendrán el tenant_id correcto
- Las funciones deberían aparecer en el store
*/
