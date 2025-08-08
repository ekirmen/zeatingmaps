-- 🚀 Arreglar Filtrado por Tenant
-- Este script verifica y arregla el problema de tenant en funciones

-- =====================================================
-- VERIFICAR ESTRUCTURA DE TENANTS
-- =====================================================

-- Mostrar estructura de la tabla tenants
SELECT 
    'ESTRUCTURA TENANTS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR DATOS POR TENANT
-- =====================================================

-- Mostrar funciones con su tenant_id
SELECT 
    'FUNCIONES POR TENANT' as tipo,
    f.id,
    f.evento,
    f.sala,
    f.tenant_id,
    e.nombre as evento_nombre,
    e.tenant_id as evento_tenant_id
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
ORDER BY f.tenant_id, f.id;

-- =====================================================
-- VERIFICAR TENANT ACTUAL
-- =====================================================

-- Mostrar tenant para zeatingmaps
SELECT 
    'TENANT ZEATINGMAPS' as tipo,
    id,
    subdomain,
    status
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- =====================================================
-- VERIFICAR EVENTOS DEL TENANT
-- =====================================================

-- Mostrar eventos del tenant zeatingmaps
SELECT 
    'EVENTOS ZEATINGMAPS' as tipo,
    e.id,
    e.nombre,
    e.slug,
    e.fecha_evento,
    e.tenant_id,
    COUNT(f.id) as total_funciones
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento
WHERE e.tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
GROUP BY e.id, e.nombre, e.slug, e.fecha_evento, e.tenant_id
ORDER BY e.fecha_evento;

-- =====================================================
-- VERIFICAR FUNCIONES DEL TENANT
-- =====================================================

-- Mostrar funciones del tenant zeatingmaps
SELECT 
    'FUNCIONES ZEATINGMAPS' as tipo,
    f.id,
    f.evento,
    f.sala,
    f.tenant_id,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.tenant_id = (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps')
ORDER BY f.id;

-- =====================================================
-- VERIFICAR RLS PARA FUNCIONES
-- =====================================================

-- Mostrar políticas RLS para funciones
SELECT 
    'RLS FUNCIONES' as tipo,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'funciones';

-- =====================================================
-- ARREGLAR FUNCIONES SIN TENANT_ID
-- =====================================================

-- Actualizar funciones que no tienen tenant_id
UPDATE funciones 
SET tenant_id = e.tenant_id
FROM eventos e
WHERE funciones.evento = e.id
AND funciones.tenant_id IS NULL;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Mostrar funciones actualizadas
SELECT 
    'FUNCIONES ACTUALIZADAS' as tipo,
    f.id,
    f.evento,
    f.sala,
    f.tenant_id,
    e.nombre as evento_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
ORDER BY f.tenant_id, f.id;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto te mostrará el estado del tenant y las funciones
3. Arreglará funciones sin tenant_id

PROBLEMAS A BUSCAR:
- Funciones sin tenant_id
- RLS bloqueando acceso
- Tenant incorrecto en funciones
*/
