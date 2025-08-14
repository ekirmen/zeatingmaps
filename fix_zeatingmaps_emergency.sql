-- 🚨 SOLUCIÓN DE EMERGENCIA para zeatingmaps
-- Ejecuta este script en el SQL Editor de Supabase para resolver el error inmediatamente

-- ========================================
-- PASO 1: VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLAS ===' as info;

-- Verificar estructura de la tabla recintos
SELECT 
    'Columnas de tabla recintos:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla eventos
SELECT 
    'Columnas de tabla eventos:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 2: SOLUCIÓN RÁPIDA (Ejecutar en orden)
-- ========================================
SELECT '=== CREANDO TENANT ZEATINGMAPS ===' as info;

-- 1. Crear tenant zeatingmaps básico
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type
) VALUES (
    'zeatingmaps',
    'ZeatingMaps',
    'info@zeatingmaps.com',
    'active',
    'premium'
) ON CONFLICT (subdomain) DO NOTHING;

-- 2. Verificar que se creó
SELECT 
    '✅ Tenant creado:' as status,
    id,
    subdomain,
    company_name,
    status
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- 3. Si la tabla domain_configs no existe, crearla
CREATE TABLE IF NOT EXISTS domain_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    domain text NOT NULL,
    config_data jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(tenant_id, domain)
);

-- 4. Crear configuración básica
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{"name": "ZeatingMaps", "companyName": "ZeatingMaps"}',
    true
) ON CONFLICT (tenant_id, domain) DO NOTHING;

-- 5. Verificar configuración
SELECT 
    '✅ Configuración creada:' as status,
    dc.domain,
    dc.is_active
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 3: CREAR DATOS DE PRUEBA (CORREGIDO)
-- ========================================
SELECT '=== CREANDO DATOS DE PRUEBA ===' as info;

-- Obtener el tenant_id de zeatingmaps
DO $$
DECLARE
    tenant_id_zeatingmaps uuid;
    recinto_id uuid;
BEGIN
    SELECT id INTO tenant_id_zeatingmaps FROM tenants WHERE subdomain = 'zeatingmaps';
    
    IF tenant_id_zeatingmaps IS NOT NULL THEN
        -- Crear recinto de prueba (sin columna status)
        INSERT INTO recintos (
            nombre,
            direccion,
            ciudad,
            estado,
            pais,
            tenant_id
        ) VALUES (
            'Estadio de Prueba ZeatingMaps',
            'Dirección de Prueba',
            'Ciudad de Prueba',
            'Estado de Prueba',
            'Venezuela',
            tenant_id_zeatingmaps
        ) RETURNING id INTO recinto_id;
        
        -- Crear evento de prueba (sin columna status)
        INSERT INTO eventos (
            nombre,
            slug,
            descripcion,
            tenant_id,
            fecha_inicio,
            fecha_fin
        ) VALUES (
            'Evento de Prueba ZeatingMaps',
            'evento-prueba-zeatingmaps',
            'Evento de prueba para verificar funcionamiento del tenant',
            tenant_id_zeatingmaps,
            NOW() + INTERVAL '30 days',
            NOW() + INTERVAL '31 days'
        );
        
        RAISE NOTICE '✅ Datos de prueba creados para tenant zeatingmaps. Recinto ID: %, Tenant ID: %', recinto_id, tenant_id_zeatingmaps;
    ELSE
        RAISE NOTICE '❌ No se encontró el tenant zeatingmaps';
    END IF;
END $$;

-- ========================================
-- PASO 4: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar tenant completo
SELECT 
    '🎯 Tenant zeatingmaps:' as info,
    t.id,
    t.subdomain,
    t.company_name,
    t.status,
    t.created_at
FROM tenants t
WHERE t.subdomain = 'zeatingmaps';

-- Verificar configuración
SELECT 
    '🎯 Configuración zeatingmaps:' as info,
    dc.domain,
    dc.is_active,
    dc.created_at
FROM domain_configs dc
JOIN tenants t ON dc.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar datos de prueba
SELECT 
    '🎯 Recintos zeatingmaps:' as info,
    COUNT(*) as total_recintos
FROM recintos r
JOIN tenants t ON r.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

SELECT 
    '🎯 Eventos zeatingmaps:' as info,
    COUNT(*) as total_eventos
FROM eventos e
JOIN tenants t ON e.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- ========================================
-- PASO 5: SOLUCIÓN ALTERNATIVA SI PERSISTE EL ERROR
-- ========================================
SELECT '=== SOLUCIÓN ALTERNATIVA ===' as info;

-- Crear tenant adicional con configuración más específica
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    domain,
    full_url
) VALUES (
    'zeatingmaps-backup',
    'ZeatingMaps Backup',
    'backup@zeatingmaps.com',
    'active',
    'premium',
    'vercel.app',
    'zeatingmaps-ekirmens-projects.vercel.app'
) ON CONFLICT (subdomain) DO NOTHING;

-- Configuración para el tenant backup
INSERT INTO domain_configs (
    tenant_id,
    domain,
    config_data,
    is_active
) VALUES (
    (SELECT id FROM tenants WHERE subdomain = 'zeatingmaps-backup'),
    'zeatingmaps-ekirmens-projects.vercel.app',
    '{"name": "ZeatingMaps Backup", "companyName": "ZeatingMaps"}',
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
    '4. El error debería desaparecer' as paso,
    '5. Si persiste, revisa la consola del navegador' as instruccion
UNION ALL
SELECT 
    '6. Verifica que el tenant se creó correctamente' as paso,
    '7. Revisa los logs de detección de tenant' as instruccion;
