-- Script para crear tenant de prueba en veneventos.com
-- Ejecuta este script en el SQL Editor de Supabase

-- Opción 1: Tenant para test.veneventos.com
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings
) VALUES (
    'test',
    'Veneventos - Empresa de Prueba',
    'test@veneventos.com',
    'active',
    'premium',
    '{"theme": "default", "features": ["ticketing", "maps", "analytics"]}'
) ON CONFLICT (subdomain) 
DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    plan_type = EXCLUDED.plan_type,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Opción 2: Tenant para demo.veneventos.com (si quieres otro subdominio)
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings
) VALUES (
    'demo',
    'Veneventos - Demo',
    'demo@veneventos.com',
    'active',
    'premium',
    '{"theme": "default", "features": ["ticketing", "maps", "analytics"]}'
) ON CONFLICT (subdomain) 
DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    plan_type = EXCLUDED.plan_type,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Verificar que se insertaron correctamente
SELECT 
    id,
    subdomain,
    company_name,
    status,
    plan_type,
    created_at
FROM tenants 
WHERE subdomain IN ('test', 'demo')
ORDER BY created_at DESC;

-- Mostrar todos los tenants existentes
SELECT 
    id,
    subdomain,
    company_name,
    status,
    plan_type,
    created_at
FROM tenants 
ORDER BY created_at DESC;
