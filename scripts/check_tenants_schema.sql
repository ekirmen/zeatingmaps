-- Script para verificar el schema actual de la tabla tenants
-- Este script nos ayudará a identificar columnas duplicadas y la estructura actual

-- Ver estructura actual de la tabla tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver si hay columnas duplicadas
SELECT 
    column_name,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
GROUP BY column_name
HAVING COUNT(*) > 1;

-- Ver datos actuales de la tabla
SELECT 
    id,
    subdomain,
    company_name,
    contact_email,
    domain,
    full_url,
    status,
    plan_type,
    created_at,
    updated_at
FROM tenants 
LIMIT 5;

-- Ver si existen las nuevas columnas que queremos agregar
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
AND column_name IN (
    'theme_config',
    'feature_flags', 
    'branding_config',
    'custom_routes',
    'is_main_domain',
    'parent_tenant_id',
    'tenant_type'
);
