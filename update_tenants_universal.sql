-- Script para actualizar la tabla tenants con sistema universal de dominios
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar campos para dominio universal
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS full_url VARCHAR(500);

-- Actualizar registros existentes
UPDATE tenants SET 
  domain = 'veneventos.com',
  full_url = subdomain || '.veneventos.com'
WHERE domain IS NULL;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_full_url ON tenants(full_url);

-- Verificar la estructura actualizada
SELECT 
    id,
    subdomain,
    domain,
    full_url,
    company_name,
    status,
    created_at
FROM tenants 
ORDER BY created_at DESC;

-- Ejemplo de cómo insertar nuevos tenants con sistema universal
-- INSERT INTO tenants (
--     subdomain,
--     domain,
--     full_url,
--     company_name,
--     contact_email,
--     status,
--     plan_type,
--     settings
-- ) VALUES 
--     ('cliente1', 'veneventos.com', 'cliente1.veneventos.com', 'Cliente 1', 'cliente1@veneventos.com', 'active', 'premium', '{}'),
--     ('empresa', 'ticketera.com', 'empresa.ticketera.com', 'Empresa Ticketera', 'empresa@ticketera.com', 'active', 'pro', '{}'),
--     (NULL, 'midominio.com', 'midominio.com', 'Mi Dominio', 'admin@midominio.com', 'active', 'enterprise', '{}');
