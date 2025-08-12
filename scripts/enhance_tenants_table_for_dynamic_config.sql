-- Script para mejorar la tabla tenants para configuración dinámica
-- Este script agrega campos que permiten configurar empresas desde el panel SaaS

-- Agregar campos para configuración dinámica
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_routes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_main_domain BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS tenant_type VARCHAR(50) DEFAULT 'company';

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tenants_tenant_type ON tenants(tenant_type);
CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_main_domain ON tenants(is_main_domain);

-- Actualizar tenant principal (sistema.veneventos.com)
UPDATE tenants 
SET 
  is_main_domain = TRUE,
  tenant_type = 'main',
  theme_config = '{"primaryColor": "#1890ff", "secondaryColor": "#52c41a", "logo": "/assets/logo-veneventos.png"}',
  feature_flags = '{"showSaaS": true, "showStore": true, "showBackoffice": true, "showTicketing": true, "showEvents": true, "showVenues": true}',
  branding_config = '{"companyName": "Veneventos - Sistema Principal", "tagline": "Sistema de Eventos Profesional", "contactEmail": "info@veneventos.com"}'
WHERE full_url = 'sistema.veneventos.com';

-- Crear función para obtener configuración de tenant
CREATE OR REPLACE FUNCTION get_tenant_config(tenant_hostname TEXT)
RETURNS JSONB AS $$
DECLARE
  tenant_record RECORD;
  config JSONB;
BEGIN
  -- Buscar tenant por hostname
  SELECT * INTO tenant_record
  FROM tenants
  WHERE full_url = tenant_hostname 
     OR (subdomain || '.' || domain) = tenant_hostname
     OR domain = tenant_hostname
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Construir configuración
  config := jsonb_build_object(
    'id', tenant_record.id,
    'name', tenant_record.company_name,
    'theme', COALESCE(tenant_record.theme_config, '{}'),
    'features', COALESCE(tenant_record.feature_flags, '{}'),
    'branding', COALESCE(tenant_record.branding_config, '{}'),
    'customRoutes', COALESCE(tenant_record.custom_routes, '[]'),
    'isMainDomain', tenant_record.is_main_domain,
    'tenantType', tenant_record.tenant_type
  );
  
  RETURN config;
END;
$$ LANGUAGE plpgsql;

-- Crear función para actualizar configuración de tenant
CREATE OR REPLACE FUNCTION update_tenant_config(
  tenant_id UUID,
  theme_config JSONB DEFAULT NULL,
  feature_flags JSONB DEFAULT NULL,
  branding_config JSONB DEFAULT NULL,
  custom_routes JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenants 
  SET 
    theme_config = COALESCE(theme_config, theme_config),
    feature_flags = COALESCE(feature_flags, feature_flags),
    branding_config = COALESCE(branding_config, branding_config),
    custom_routes = COALESCE(custom_routes, custom_routes),
    updated_at = NOW()
  WHERE id = tenant_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Crear vista para facilitar la gestión de tenants
CREATE OR REPLACE VIEW tenants_with_config AS
SELECT 
  t.*,
  t.theme_config->>'primaryColor' as primary_color_hex,
  t.theme_config->>'secondaryColor' as secondary_color_hex,
  t.theme_config->>'logo' as logo_url,
  t.feature_flags->>'showSaaS' as show_saas,
  t.feature_flags->>'showStore' as show_store,
  t.feature_flags->>'showBackoffice' as show_backoffice,
  t.feature_flags->>'showTicketing' as show_ticketing,
  t.feature_flags->>'showEvents' as show_events,
  t.feature_flags->>'showVenues' as show_venues,
  t.branding_config->>'companyName' as display_name,
  t.branding_config->>'tagline' as company_tagline,
  t.branding_config->>'contactEmail' as contact_email
FROM tenants t;

-- Insertar tenant de ejemplo para zeatingmaps-ekirmens-projects.vercel.app
INSERT INTO tenants (
  subdomain,
  company_name,
  contact_email,
  domain,
  full_url,
  status,
  plan_type,
  theme_config,
  feature_flags,
  branding_config,
  tenant_type
) VALUES (
  'zeatingmaps',
  'ZeatingMaps',
  'info@zeatingmaps.com',
  'vercel.app',
  'zeatingmaps-ekirmens-projects.vercel.app',
  'active',
  'premium',
  '{"primaryColor": "#1890ff", "secondaryColor": "#52c41a", "logo": "/assets/logo.png"}',
  '{"showSaaS": true, "showStore": true, "showBackoffice": true, "showTicketing": true, "showEvents": true, "showVenues": true}',
  '{"companyName": "ZeatingMaps", "tagline": "Sistema de Gestión de Eventos", "contactEmail": "info@zeatingmaps.com"}',
  'company'
) ON CONFLICT (subdomain) DO UPDATE SET
  full_url = EXCLUDED.full_url,
  theme_config = EXCLUDED.theme_config,
  feature_flags = EXCLUDED.feature_flags,
  branding_config = EXCLUDED.branding_config,
  updated_at = NOW();

-- Comentarios sobre la nueva estructura
COMMENT ON TABLE tenants IS 'Tabla de tenants con configuración dinámica completa';
COMMENT ON COLUMN tenants.theme_config IS 'Configuración de tema (colores, logo, etc.)';
COMMENT ON COLUMN tenants.feature_flags IS 'Flags para habilitar/deshabilitar funcionalidades';
COMMENT ON COLUMN tenants.branding_config IS 'Configuración de marca (nombre, tagline, email)';
COMMENT ON COLUMN tenants.custom_routes IS 'Rutas personalizadas para el tenant';
COMMENT ON COLUMN tenants.is_main_domain IS 'Indica si es el dominio principal del sistema';
COMMENT ON COLUMN tenants.tenant_type IS 'Tipo de tenant: main, company, partner, etc.';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'ID del tenant padre (para sub-empresas)';
