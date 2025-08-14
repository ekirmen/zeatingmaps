-- 🚨 SOLUCIÓN INMEDIATA para el problema de acceso RLS
-- El tenant zeatingmaps existe pero no se puede acceder desde el frontend

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
-- PASO 2: SOLUCIÓN TEMPORAL - DESHABILITAR RLS
-- ========================================
SELECT '=== DESHABILITANDO RLS TEMPORALMENTE ===' as info;

-- ⚠️ ADVERTENCIA: Esto elimina la seguridad temporalmente
-- Solo usar para desarrollo/testing

-- Deshabilitar RLS en la tabla tenants
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT 
    'RLS deshabilitado:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'tenants';

-- ========================================
-- PASO 3: CREAR POLÍTICAS RLS PERMISIVAS (ALTERNATIVA)
-- ========================================
SELECT '=== CREANDO POLÍTICAS RLS PERMISIVAS ===' as info;

-- Si prefieres mantener RLS habilitado, crear políticas permisivas
-- Habilitar RLS nuevamente
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Crear política para SELECT - permitir lectura de todos los tenants
CREATE POLICY IF NOT EXISTS "tenants_select_policy" ON tenants
    FOR SELECT
    USING (true);

-- Crear política para INSERT - permitir inserción de cualquier tenant
CREATE POLICY IF NOT EXISTS "tenants_insert_policy" ON tenants
    FOR INSERT
    WITH CHECK (true);

-- Crear política para UPDATE - permitir actualización de cualquier tenant
CREATE POLICY IF NOT EXISTS "tenants_update_policy" ON tenants
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Crear política para DELETE - permitir eliminación de cualquier tenant
CREATE POLICY IF NOT EXISTS "tenants_delete_policy" ON tenants
    FOR DELETE
    USING (true);

-- ========================================
-- PASO 4: VERIFICAR POLÍTICAS CREADAS
-- ========================================
SELECT '=== VERIFICANDO POLÍTICAS ===' as info;

SELECT 
    'Políticas RLS creadas:' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'tenants';

-- ========================================
-- PASO 5: VERIFICAR ACCESO AL TENANT
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
-- PASO 6: SOLUCIÓN ALTERNATIVA - CREAR TENANT DE FALLBACK
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
WHERE subdomain IN ('zeatingmaps', 'zeatingmaps-fallback')
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
WHERE t.subdomain IN ('zeatingmaps', 'zeatingmaps-fallback')
ORDER BY t.subdomain;

-- ========================================
-- PASO 8: INSTRUCCIONES DE VERIFICACIÓN
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
    '7. Verifica que no hay errores de CORS o permisos' as instruccion;

-- ========================================
-- SOLUCIÓN DE EMERGENCIA (si nada funciona)
-- ========================================
SELECT '=== SOLUCIÓN DE EMERGENCIA ===' as info;

-- Si el problema persiste, puedes crear un tenant completamente abierto
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
