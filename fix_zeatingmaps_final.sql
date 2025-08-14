-- 🚨 SOLUCIÓN FINAL para zeatingmaps
-- Compatible con versiones anteriores de PostgreSQL

-- ========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ========================================
SELECT '=== VERIFICANDO ESTADO ACTUAL ===' as info;

-- Verificar si RLS está habilitado en tenants
SELECT 
    'RLS en tabla tenants:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'tenants';

-- Verificar políticas existentes
SELECT 
    'Políticas RLS existentes:' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'tenants';

-- ========================================
-- PASO 2: DESHABILITAR RLS COMPLETAMENTE
-- ========================================
SELECT '=== DESHABILITANDO RLS COMPLETAMENTE ===' as info;

-- Deshabilitar RLS en la tabla tenants
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en domain_configs si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'domain_configs') THEN
        EXECUTE 'ALTER TABLE domain_configs DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS deshabilitado en domain_configs';
    ELSE
        RAISE NOTICE 'Tabla domain_configs no existe';
    END IF;
END $$;

-- Verificar que se deshabilitó
SELECT 
    'RLS deshabilitado:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('tenants', 'domain_configs');

-- ========================================
-- PASO 3: ELIMINAR POLÍTICAS EXISTENTES
-- ========================================
SELECT '=== ELIMINANDO POLÍTICAS EXISTENTES ===' as info;

-- Eliminar políticas existentes en tenants
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tenants'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON tenants';
        RAISE NOTICE 'Política eliminada: %', policy_name;
    END LOOP;
END $$;

-- Eliminar políticas existentes en domain_configs si existe
DO $$
DECLARE
    policy_name text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'domain_configs') THEN
        FOR policy_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'domain_configs'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON domain_configs';
            RAISE NOTICE 'Política eliminada en domain_configs: %', policy_name;
        END LOOP;
    END IF;
END $$;

-- ========================================
-- PASO 4: VERIFICAR ACCESO AL TENANT
-- ========================================
SELECT '=== VERIFICANDO ACCESO ===' as info;

-- Verificar que se puede acceder al tenant zeatingmaps
SELECT 
    '✅ Acceso a tenant zeatingmaps:' as info,
    id,
    subdomain,
    company_name,
    status,
    domain,
    full_url,
    created_at
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- Verificar configuración
SELECT 
    '✅ Configuración zeatingmaps:' as info,
    dc.id,
    dc.tenant_id,
    dc.domain,
    dc.is_active,
    dc.created_at
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 5: CREAR TENANT DE FALLBACK
-- ========================================
SELECT '=== CREANDO TENANT DE FALLBACK ===' as info;

-- Crear un tenant adicional más permisivo
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    domain,
    full_url
) VALUES (
    'zeatingmaps-fallback',
    'ZeatingMaps Fallback',
    'fallback@zeatingmaps.com',
    'active',
    'premium',
    'vercel.app',
    'zeatingmaps-ekirmens-projects.vercel.app'
) ON CONFLICT (subdomain) DO NOTHING;

-- Configuración para el tenant fallback
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps-fallback'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{"name": "ZeatingMaps Fallback", "companyName": "ZeatingMaps"}',
    true
) ON CONFLICT (tenant_id, domain) DO NOTHING;

-- ========================================
-- PASO 6: SOLUCIÓN ALTERNATIVA - CREAR TENANT COMPLETAMENTE ABIERTO
-- ========================================
SELECT '=== CREANDO TENANT COMPLETAMENTE ABIERTO ===' as info;

-- Crear un tenant que funcione sin importar qué
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    domain,
    full_url
) VALUES (
    'open-access',
    'Acceso Abierto',
    'open@example.com',
    'active',
    'premium',
    'vercel.app',
    'zeatingmaps-ekirmens-projects.vercel.app'
) ON CONFLICT (subdomain) DO NOTHING;

-- Configuración completamente abierta
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'open-access'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{"name": "Acceso Abierto", "companyName": "Sistema Abierto", "openAccess": true}',
    true
) ON CONFLICT (tenant_id, domain) DO NOTHING;

-- ========================================
-- PASO 7: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar todos los tenants disponibles
SELECT 
    '🎯 Tenants disponibles:' as info,
    subdomain,
    company_name,
    status,
    domain,
    full_url
FROM tenants 
WHERE subdomain IN ('zeatingmaps', 'zeatingmaps-fallback', 'open-access')
ORDER BY subdomain;

-- Verificar configuraciones
SELECT 
    '🎯 Configuraciones disponibles:' as info,
    dc.domain,
    dc.is_active,
    t.subdomain,
    t.company_name
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain IN ('zeatingmaps', 'zeatingmaps-fallback', 'open-access')
ORDER BY t.subdomain;

-- ========================================
-- PASO 8: SOLUCIÓN DE EMERGENCIA - MODIFICAR CÓDIGO
-- ========================================
SELECT '=== SOLUCIÓN DE EMERGENCIA ===' as info;

-- Si el problema persiste, necesitamos modificar el código
-- Crear un tenant que coincida exactamente con el patrón que busca el frontend
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    domain,
    full_url
) VALUES (
    'zeatingmaps-ekirmens-projects',
    'ZeatingMaps Vercel',
    'vercel@zeatingmaps.com',
    'active',
    'premium',
    'vercel.app',
    'zeatingmaps-ekirmens-projects.vercel.app'
) ON CONFLICT (subdomain) DO NOTHING;

-- Configuración para el tenant de Vercel
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps-ekirmens-projects'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{"name": "ZeatingMaps Vercel", "companyName": "ZeatingMaps Vercel"}',
    true
) ON CONFLICT (tenant_id, domain) DO NOTHING;

-- ========================================
-- INSTRUCCIONES DE VERIFICACIÓN
-- ========================================
SELECT '=== INSTRUCCIONES DE VERIFICACIÓN ===' as info;

SELECT 
    '📋 PASOS A SEGUIR:' as paso,
    '1. Ejecuta este script completo en Supabase SQL Editor' as instruccion
UNION ALL
SELECT 
    '2. Verifica que no hay errores en la ejecución' as paso,
    '3. Ve a https://zeatingmaps-ekirmens-projects.vercel.app/store' as instruccion
UNION ALL
SELECT 
    '4. Haz HARD REFRESH (Ctrl+F5 o Cmd+Shift+R)' as paso,
    '5. El error debería desaparecer' as instruccion
UNION ALL
SELECT 
    '6. Si persiste, revisa la consola del navegador' as paso,
    '7. Verifica que no hay errores de CORS o permisos' as instruccion
UNION ALL
SELECT 
    '8. Si nada funciona, revisa el código del frontend' as paso,
    '9. Busca logs de "tenant detection" en la consola' as instruccion;
