-- 🔍 DIAGNÓSTICO COMPLETO para el problema de zeatingmaps
-- Este script te ayudará a entender por qué persiste el error

-- ========================================
-- PASO 1: VERIFICAR ESTADO DE LA BASE DE DATOS
-- ========================================
SELECT '=== VERIFICANDO BASE DE DATOS ===' as info;

-- Verificar si existe la tabla tenants
SELECT 
    'Tabla tenants existe:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
    ) as tabla_existe;

-- Verificar si existe la tabla domain_configs
SELECT 
    'Tabla domain_configs existe:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'domain_configs'
    ) as tabla_existe;

-- ========================================
-- PASO 2: VERIFICAR TENANTS EXISTENTES
-- ========================================
SELECT '=== VERIFICANDO TENANTS ===' as info;

-- Mostrar todos los tenants
SELECT 
    'Todos los tenants:' as info,
    id,
    subdomain,
    company_name,
    status,
    domain,
    full_url,
    created_at
FROM tenants 
ORDER BY created_at DESC;

-- Verificar específicamente zeatingmaps
SELECT 
    'Tenant zeatingmaps específico:' as info,
    id,
    subdomain,
    company_name,
    status,
    domain,
    full_url,
    created_at
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- ========================================
-- PASO 3: VERIFICAR CONFIGURACIONES DE DOMINIO
-- ========================================
SELECT '=== VERIFICANDO CONFIGURACIONES ===' as info;

-- Mostrar todas las configuraciones de dominio
SELECT 
    'Todas las configuraciones:' as info,
    dc.id,
    dc.tenant_id,
    dc.domain,
    dc.is_active,
    dc.created_at,
    t.subdomain,
    t.company_name
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
ORDER BY dc.created_at DESC;

-- Verificar configuración específica para zeatingmaps
SELECT 
    'Configuración zeatingmaps:' as info,
    dc.id,
    dc.tenant_id,
    dc.domain,
    dc.is_active,
    dc.created_at,
    t.subdomain,
    t.company_name
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 4: VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================
SELECT '=== VERIFICANDO ESTRUCTURA ===' as info;

-- Estructura de la tabla tenants
SELECT 
    'Columnas de tenants:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Estructura de la tabla domain_configs
SELECT 
    'Columnas de domain_configs:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'domain_configs' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 5: VERIFICAR POLÍTICAS RLS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS RLS ===' as info;

-- Verificar si RLS está habilitado en tenants
SELECT 
    'RLS en tenants:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'tenants';

-- Verificar políticas de tenants
SELECT 
    'Políticas de tenants:' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'tenants';

-- ========================================
-- PASO 6: VERIFICAR PERMISOS
-- ========================================
SELECT '=== VERIFICANDO PERMISOS ===' as info;

-- Verificar permisos del usuario actual
SELECT 
    'Usuario actual:' as info,
    current_user as usuario,
    session_user as sesion;

-- Verificar permisos en la tabla tenants
SELECT 
    'Permisos en tenants:' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'tenants';

-- ========================================
-- PASO 7: VERIFICAR DATOS DE PRUEBA
-- ========================================
SELECT '=== VERIFICANDO DATOS DE PRUEBA ===' as info;

-- Verificar recintos de zeatingmaps
SELECT 
    'Recintos zeatingmaps:' as info,
    COUNT(*) as total_recintos
FROM recintos r
JOIN tenants t ON r.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar eventos de zeatingmaps
SELECT 
    'Eventos zeatingmaps:' as info,
    COUNT(*) as total_eventos
FROM eventos e
JOIN tenants t ON e.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 8: DIAGNÓSTICO DEL PROBLEMA
-- ========================================
SELECT '=== DIAGNÓSTICO DEL PROBLEMA ===' as info;

-- Verificar si hay inconsistencias
SELECT 
    'Inconsistencias detectadas:' as info,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM tenants WHERE subdomain = 'zeatingmaps') 
        THEN '❌ No existe tenant zeatingmaps'
        ELSE '✅ Tenant zeatingmaps existe'
    END as tenant_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM domain_configs dc 
            JOIN tenants t ON dc.tenant_id = t.id 
            WHERE t.subdomain = 'zeatingmaps'
        ) 
        THEN '❌ No existe configuración para zeatingmaps'
        ELSE '✅ Configuración existe'
    END as config_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM tenants 
            WHERE subdomain = 'zeatingmaps' AND status = 'active'
        ) 
        THEN '❌ Tenant zeatingmaps no está activo'
        ELSE '✅ Tenant zeatingmaps está activo'
    END as active_status;

-- ========================================
-- PASO 9: SOLUCIONES RECOMENDADAS
-- ========================================
SELECT '=== SOLUCIONES RECOMENDADAS ===' as info;

SELECT 
    'Si el tenant no existe:' as problema,
    'Ejecuta fix_zeatingmaps_emergency.sql' as solucion
UNION ALL
SELECT 
    'Si el tenant existe pero no se detecta:' as problema,
    'Verifica las políticas RLS y permisos' as solucion
UNION ALL
SELECT 
    'Si la configuración no existe:' as problema,
    'Crea la configuración en domain_configs' as solucion
UNION ALL
SELECT 
    'Si persiste el error:' as problema,
    'Revisa la consola del navegador y logs' as solucion;

-- ========================================
-- PASO 10: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Resumen del estado
SELECT 
    'Estado final:' as info,
    (SELECT COUNT(*) FROM tenants WHERE subdomain = 'zeatingmaps') as tenants_zeatingmaps,
    (SELECT COUNT(*) FROM domain_configs dc JOIN tenants t ON dc.tenant_id = t.id WHERE t.subdomain = 'zeatingmaps') as configs_zeatingmaps,
    (SELECT COUNT(*) FROM tenants WHERE subdomain = 'zeatingmaps' AND status = 'active') as tenants_activos;
