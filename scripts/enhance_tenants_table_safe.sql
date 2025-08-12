-- Script SEGURO para mejorar la tabla tenants
-- Este script verifica la existencia de columnas antes de crearlas

-- Función helper para verificar si una columna existe
CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Agregar campos para configuración dinámica (solo si no existen)
DO $$
BEGIN
    -- theme_config
    IF NOT column_exists('tenants', 'theme_config') THEN
        ALTER TABLE tenants ADD COLUMN theme_config JSONB DEFAULT '{}';
        RAISE NOTICE 'Columna theme_config agregada';
    ELSE
        RAISE NOTICE 'Columna theme_config ya existe';
    END IF;
    
    -- feature_flags
    IF NOT column_exists('tenants', 'feature_flags') THEN
        ALTER TABLE tenants ADD COLUMN feature_flags JSONB DEFAULT '{}';
        RAISE NOTICE 'Columna feature_flags agregada';
    ELSE
        RAISE NOTICE 'Columna feature_flags ya existe';
    END IF;
    
    -- branding_config
    IF NOT column_exists('tenants', 'branding_config') THEN
        ALTER TABLE tenants ADD COLUMN branding_config JSONB DEFAULT '{}';
        RAISE NOTICE 'Columna branding_config agregada';
    ELSE
        RAISE NOTICE 'Columna branding_config ya existe';
    END IF;
    
    -- custom_routes
    IF NOT column_exists('tenants', 'custom_routes') THEN
        ALTER TABLE tenants ADD COLUMN custom_routes JSONB DEFAULT '[]';
        RAISE NOTICE 'Columna custom_routes agregada';
    ELSE
        RAISE NOTICE 'Columna custom_routes ya existe';
    END IF;
    
    -- is_main_domain
    IF NOT column_exists('tenants', 'is_main_domain') THEN
        ALTER TABLE tenants ADD COLUMN is_main_domain BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna is_main_domain agregada';
    ELSE
        RAISE NOTICE 'Columna is_main_domain ya existe';
    END IF;
    
    -- parent_tenant_id
    IF NOT column_exists('tenants', 'parent_tenant_id') THEN
        ALTER TABLE tenants ADD COLUMN parent_tenant_id UUID REFERENCES tenants(id);
        RAISE NOTICE 'Columna parent_tenant_id agregada';
    ELSE
        RAISE NOTICE 'Columna parent_tenant_id ya existe';
    END IF;
    
    -- tenant_type
    IF NOT column_exists('tenants', 'tenant_type') THEN
        ALTER TABLE tenants ADD COLUMN tenant_type VARCHAR(50) DEFAULT 'company';
        RAISE NOTICE 'Columna tenant_type agregada';
    ELSE
        RAISE NOTICE 'Columna tenant_type ya existe';
    END IF;
END $$;

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_tenants_tenant_type ON tenants(tenant_type);
CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_main_domain ON tenants(is_main_domain);

-- Actualizar tenant principal (sistema.veneventos.com) solo si no tiene configuración
UPDATE tenants 
SET 
    is_main_domain = TRUE,
    tenant_type = 'main',
    theme_config = '{"primaryColor": "#1890ff", "secondaryColor": "#52c41a", "logo": "/assets/logo-veneventos.png"}',
    feature_flags = '{"showSaaS": true, "showStore": true, "showBackoffice": true, "showTicketing": true, "showEvents": true, "showVenues": true}',
    branding_config = '{"companyName": "Veneventos - Sistema Principal", "tagline": "Sistema de Eventos Profesional", "contactEmail": "info@veneventos.com"}'
WHERE full_url = 'sistema.veneventos.com'
AND (theme_config IS NULL OR theme_config = '{}');

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

-- Limpiar función helper
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- Comentarios sobre la nueva estructura
COMMENT ON TABLE tenants IS 'Tabla de tenants con configuración dinámica completa';
COMMENT ON COLUMN tenants.theme_config IS 'Configuración de tema (colores, logo, etc.)';
COMMENT ON COLUMN tenants.feature_flags IS 'Flags para habilitar/deshabilitar funcionalidades';
COMMENT ON COLUMN tenants.branding_config IS 'Configuración de marca (nombre, tagline, email)';
COMMENT ON COLUMN tenants.custom_routes IS 'Rutas personalizadas para el tenant';
COMMENT ON COLUMN tenants.is_main_domain IS 'Indica si es el dominio principal del sistema';
COMMENT ON COLUMN tenants.tenant_type IS 'Tipo de tenant: main, company, partner, etc.';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'ID del tenant padre (para sub-empresas)';
