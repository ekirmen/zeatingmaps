-- Script simple para insertar tenant zeatingmaps
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings
) VALUES (
    'zeatingmaps',
    'ZeatingMaps - Empresa de Prueba',
    'demo@zeatingmaps.com',
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

-- Verificar que se insertó
SELECT 
    id,
    subdomain,
    company_name,
    status,
    plan_type,
    created_at
FROM tenants 
WHERE subdomain = 'zeatingmaps';
