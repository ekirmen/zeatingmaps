-- 🔧 SOLUCIÓN COMPLETA para el error "No se encontró una empresa configurada para el subdominio: zeatingmaps"
-- Este script crea y configura el tenant zeatingmaps correctamente

-- ========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ========================================
SELECT '=== VERIFICANDO ESTADO ACTUAL ===' as info;

-- Verificar si existe la tabla tenants
SELECT 
    'Tabla tenants existe:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
    ) as tabla_existe;

-- Verificar si existe el tenant zeatingmaps
SELECT 
    'Tenant zeatingmaps existe:' as info,
    id,
    subdomain,
    company_name,
    status,
    created_at
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- ========================================
-- PASO 2: CREAR TENANT ZEATINGMAPS
-- ========================================
SELECT '=== CREANDO TENANT ZEATINGMAPS ===' as info;

-- Insertar tenant zeatingmaps con configuración completa
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings,
    primary_color,
    secondary_color,
    logo_url,
    domain,
    full_url
) VALUES (
    'zeatingmaps',
    'ZeatingMaps - Sistema de Eventos',
    'info@zeatingmaps.com',
    'active',
    'premium',
    '{"theme": "default", "features": ["ticketing", "maps", "analytics", "saas"]}',
    '#1890ff',
    '#52c41a',
    '/assets/logo-zeatingmaps.png',
    'vercel.app',
    'zeatingmaps-ekirmens-projects.vercel.app'
) ON CONFLICT (subdomain) 
DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    plan_type = EXCLUDED.plan_type,
    settings = EXCLUDED.settings,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    logo_url = EXCLUDED.logo_url,
    domain = EXCLUDED.domain,
    full_url = EXCLUDED.full_url,
    updated_at = NOW();

-- ========================================
-- PASO 3: VERIFICAR TENANT CREADO
-- ========================================
SELECT '=== VERIFICANDO TENANT CREADO ===' as info;

SELECT 
    'Tenant zeatingmaps creado:' as info,
    id,
    subdomain,
    company_name,
    status,
    plan_type,
    domain,
    full_url,
    created_at
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- ========================================
-- PASO 4: CREAR CONFIGURACIÓN DINÁMICA
-- ========================================
SELECT '=== CREANDO CONFIGURACIÓN DINÁMICA ===' as info;

-- Insertar configuración dinámica para zeatingmaps
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{
        "id": "zeatingmaps",
        "name": "ZeatingMaps - Sistema de Eventos",
        "theme": {
            "primaryColor": "#1890ff",
            "secondaryColor": "#52c41a",
            "logo": "/assets/logo-zeatingmaps.png"
        },
        "features": {
            "showSaaS": true,
            "showStore": true,
            "showBackoffice": true,
            "showTicketing": true,
            "showEvents": true,
            "showVenues": true
        },
        "branding": {
            "companyName": "ZeatingMaps",
            "tagline": "Sistema de Gestión de Eventos Profesional",
            "contactEmail": "info@zeatingmaps.com"
        },
        "customRoutes": [],
        "isMainDomain": false,
        "tenantType": "company"
    }',
    true
) ON CONFLICT (tenant_id, domain) 
DO UPDATE SET
    config_data = EXCLUDED.config_data,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ========================================
-- PASO 5: VERIFICAR CONFIGURACIÓN
-- ========================================
SELECT '=== VERIFICANDO CONFIGURACIÓN ===' as info;

SELECT 
    'Configuración dinámica creada:' as info,
    dc.id,
    dc.tenant_id,
    dc.domain,
    dc.is_active,
    dc.created_at
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 6: CREAR DATOS DE PRUEBA (OPCIONAL)
-- ========================================
SELECT '=== CREANDO DATOS DE PRUEBA ===' as info;

-- Obtener el tenant_id de zeatingmaps
DO $$
DECLARE
    tenant_id_zeatingmaps uuid;
BEGIN
    SELECT id INTO tenant_id_zeatingmaps FROM tenants WHERE subdomain = 'zeatingmaps';
    
    IF tenant_id_zeatingmaps IS NOT NULL THEN
        -- Crear recinto de prueba
        INSERT INTO recintos (
            nombre,
            direccion,
            ciudad,
            estado,
            pais,
            tenant_id,
            status
        ) VALUES (
            'Estadio de Prueba ZeatingMaps',
            'Dirección de Prueba',
            'Ciudad de Prueba',
            'Estado de Prueba',
            'Venezuela',
            tenant_id_zeatingmaps,
            'active'
        ) ON CONFLICT DO NOTHING;
        
        -- Crear evento de prueba
        INSERT INTO eventos (
            nombre,
            slug,
            descripcion,
            tenant_id,
            status,
            fecha_inicio,
            fecha_fin
        ) VALUES (
            'Evento de Prueba ZeatingMaps',
            'evento-prueba-zeatingmaps',
            'Evento de prueba para verificar funcionamiento del tenant',
            tenant_id_zeatingmaps,
            'active',
            NOW() + INTERVAL '30 days',
            NOW() + INTERVAL '31 days'
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Datos de prueba creados para tenant zeatingmaps';
    ELSE
        RAISE NOTICE 'No se encontró el tenant zeatingmaps';
    END IF;
END $$;

-- ========================================
-- PASO 7: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar tenant completo
SELECT 
    'Tenant zeatingmaps completo:' as info,
    t.id,
    t.subdomain,
    t.company_name,
    t.status,
    t.domain,
    t.full_url,
    t.created_at
FROM tenants t
WHERE t.subdomain = 'zeatingmaps';

-- Verificar configuración
SELECT 
    'Configuración zeatingmaps:' as info,
    dc.domain,
    dc.is_active,
    dc.created_at
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar datos de prueba
SELECT 
    'Recintos zeatingmaps:' as info,
    COUNT(*) as total_recintos
FROM recintos r
JOIN tenants t ON r.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

SELECT 
    'Eventos zeatingmaps:' as info,
    COUNT(*) as total_eventos
FROM eventos e
JOIN tenants t ON e.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 8: INSTRUCCIONES DE VERIFICACIÓN
-- ========================================
SELECT '=== INSTRUCCIONES DE VERIFICACIÓN ===' as info;

SELECT 
    'Para verificar que funciona:' as paso,
    '1. Ve a https://zeatingmaps-ekirmens-projects.vercel.app/store' as instruccion
UNION ALL
SELECT 
    '2. Verifica que no aparezca el error de empresa no configurada' as paso,
    '3. Deberías ver la interfaz de ZeatingMaps funcionando' as instruccion
UNION ALL
SELECT 
    '4. Si persiste el error, verifica en la consola del navegador' as paso,
    '5. Revisa los logs de detección de tenant' as instruccion;

-- ========================================
-- SOLUCIÓN ALTERNATIVA (si persiste el error)
-- ========================================
SELECT '=== SOLUCIÓN ALTERNATIVA ===' as info;

-- Si el error persiste, puedes deshabilitar temporalmente la detección de tenant
-- Editando el archivo src/contexts/TenantContext.js y comentando la validación

-- O crear un tenant de fallback:
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings
) VALUES (
    'fallback',
    'Empresa de Fallback',
    'fallback@example.com',
    'active',
    'basic',
    '{"theme": "default", "features": ["basic"]}'
) ON CONFLICT (subdomain) DO NOTHING;
