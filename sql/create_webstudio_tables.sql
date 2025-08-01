-- Tabla para páginas personalizadas del Web Studio
CREATE TABLE IF NOT EXISTS webstudio_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'custom', -- 'custom', 'system', 'landing', 'event'
    estado VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_image VARCHAR(500),
    configuracion JSONB DEFAULT '{}',
    widgets JSONB DEFAULT '{"header":[],"content":[],"footer":[]}'::jsonb,
    css_custom TEXT,
    js_custom TEXT,
    usuario_creador UUID,
    fecha_publicacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para widgets disponibles
CREATE TABLE IF NOT EXISTS webstudio_widgets (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- 'header', 'content', 'footer', 'sidebar'
    categoria VARCHAR(100) NOT NULL, -- 'navigation', 'content', 'media', 'forms', 'social'
    descripcion TEXT,
    icono VARCHAR(100),
    configuracion_schema JSONB DEFAULT '{}', -- Esquema de configuración del widget
    configuracion_default JSONB DEFAULT '{}', -- Configuración por defecto
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para plantillas de páginas
CREATE TABLE IF NOT EXISTS webstudio_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'general', -- 'landing', 'event', 'blog', 'ecommerce'
    preview_image VARCHAR(500),
    configuracion JSONB DEFAULT '{}',
    widgets JSONB DEFAULT '{"header":[],"content":[],"footer":[]}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuraciones del sitio
CREATE TABLE IF NOT EXISTS webstudio_site_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string', -- 'string', 'json', 'boolean', 'number'
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'general', -- 'general', 'seo', 'analytics', 'social'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para componentes de header
CREATE TABLE IF NOT EXISTS webstudio_header_components (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    configuracion JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para componentes de footer
CREATE TABLE IF NOT EXISTS webstudio_footer_components (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    configuracion JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para plantillas de email
CREATE TABLE IF NOT EXISTS webstudio_email_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'general', -- 'newsletter', 'promotional', 'transactional'
    configuracion JSONB DEFAULT '{}',
    widgets JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para versiones de páginas (historial)
CREATE TABLE IF NOT EXISTS webstudio_page_versions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES webstudio_pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    widgets JSONB NOT NULL,
    configuracion JSONB DEFAULT '{}',
    usuario_creador UUID,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para estadísticas de páginas
CREATE TABLE IF NOT EXISTS webstudio_page_stats (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES webstudio_pages(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    vistas INTEGER DEFAULT 0,
    visitantes_unicos INTEGER DEFAULT 0,
    tiempo_promedio_segundos INTEGER DEFAULT 0,
    tasa_rebote DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_slug ON webstudio_pages(slug);
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_estado ON webstudio_pages(estado);
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_tipo ON webstudio_pages(tipo);
CREATE INDEX IF NOT EXISTS idx_webstudio_widgets_tipo ON webstudio_widgets(tipo);
CREATE INDEX IF NOT EXISTS idx_webstudio_widgets_categoria ON webstudio_widgets(categoria);
CREATE INDEX IF NOT EXISTS idx_webstudio_templates_categoria ON webstudio_templates(categoria);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_versions_page_id ON webstudio_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_stats_page_id ON webstudio_page_stats(page_id);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_stats_fecha ON webstudio_page_stats(fecha);

-- Triggers para actualizar updated_at
CREATE TRIGGER update_webstudio_pages_updated_at 
    BEFORE UPDATE ON webstudio_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webstudio_widgets_updated_at 
    BEFORE UPDATE ON webstudio_widgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webstudio_templates_updated_at 
    BEFORE UPDATE ON webstudio_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webstudio_site_config_updated_at 
    BEFORE UPDATE ON webstudio_site_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webstudio_email_templates_updated_at 
    BEFORE UPDATE ON webstudio_email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales para widgets
INSERT INTO webstudio_widgets (nombre, tipo, categoria, descripcion, configuracion_schema, configuracion_default) VALUES
('Header Classic', 'header', 'navigation', 'Header clásico con navegación', '{"logo":{"type":"string"},"menu":{"type":"array"}}', '{"logo":"","menu":[]}'),
('Header Search', 'header', 'navigation', 'Header con buscador integrado', '{"logo":{"type":"string"},"search":{"type":"boolean"}}', '{"logo":"","search":true}'),
('Footer Default', 'footer', 'navigation', 'Footer por defecto', '{"links":{"type":"array"},"social":{"type":"array"}}', '{"links":[],"social":[]}'),
('Featured Events', 'content', 'content', 'Widget de eventos destacados', '{"title":{"type":"string"},"limit":{"type":"number"}}', '{"title":"Eventos Destacados","limit":6}'),
('Event Calendar', 'content', 'content', 'Calendario de eventos', '{"view":{"type":"string"}}', '{"view":"month"}'),
('Newsletter Signup', 'content', 'forms', 'Formulario de suscripción', '{"title":{"type":"string"},"placeholder":{"type":"string"}}', '{"title":"Suscríbete","placeholder":"Tu email"}'),
('Social Media', 'content', 'social', 'Enlaces a redes sociales', '{"platforms":{"type":"array"}}', '{"platforms":["facebook","twitter","instagram"]}'),
('Contact Form', 'content', 'forms', 'Formulario de contacto', '{"title":{"type":"string"},"fields":{"type":"array"}}', '{"title":"Contáctanos","fields":["name","email","message"]}')
ON CONFLICT DO NOTHING;

-- Datos iniciales para componentes de header
INSERT INTO webstudio_header_components (nombre, descripcion, configuracion, orden) VALUES
('Classic con buscador', 'Header clásico con buscador integrado', '{"logo":true,"search":true,"menu":true}', 1),
('Classic', 'Header clásico sin buscador', '{"logo":true,"search":false,"menu":true}', 2),
('ON search', 'Header con búsqueda prominente', '{"logo":true,"search":true,"menu":false}', 3),
('Default', 'Header por defecto', '{"logo":true,"search":false,"menu":true}', 4),
('Search minimalist', 'Header minimalista con búsqueda', '{"logo":false,"search":true,"menu":false}', 5),
('Default search', 'Header por defecto con búsqueda', '{"logo":true,"search":true,"menu":true}', 6)
ON CONFLICT DO NOTHING;

-- Datos iniciales para componentes de footer
INSERT INTO webstudio_footer_components (nombre, descripcion, configuracion, orden) VALUES
('compact', 'Footer compacto', '{"links":false,"social":false,"newsletter":false}', 1),
('Default', 'Footer por defecto', '{"links":true,"social":true,"newsletter":false}', 2),
('Default centered company logo', 'Footer centrado con logo', '{"links":true,"social":true,"newsletter":false,"centered":true}', 3),
('Default company logo', 'Footer con logo de empresa', '{"links":true,"social":true,"newsletter":false,"logo":true}', 4),
('Default no logo', 'Footer sin logo', '{"links":true,"social":true,"newsletter":false,"logo":false}', 5)
ON CONFLICT DO NOTHING;

-- Datos iniciales para configuraciones del sitio
INSERT INTO webstudio_site_config (config_key, config_value, config_type, descripcion, categoria) VALUES
('site_name', 'Mi Sitio Web', 'string', 'Nombre del sitio web', 'general'),
('site_description', 'Descripción del sitio web', 'string', 'Descripción meta del sitio', 'seo'),
('site_keywords', 'eventos, tickets, boletería', 'string', 'Palabras clave del sitio', 'seo'),
('google_analytics_id', '', 'string', 'ID de Google Analytics', 'analytics'),
('facebook_pixel_id', '', 'string', 'ID del Pixel de Facebook', 'analytics'),
('social_facebook', '', 'string', 'URL de Facebook', 'social'),
('social_twitter', '', 'string', 'URL de Twitter', 'social'),
('social_instagram', '', 'string', 'URL de Instagram', 'social'),
('contact_email', 'info@misitio.com', 'string', 'Email de contacto', 'general'),
('contact_phone', '', 'string', 'Teléfono de contacto', 'general'),
('default_language', 'es', 'string', 'Idioma por defecto', 'general'),
('timezone', 'America/Caracas', 'string', 'Zona horaria', 'general')
ON CONFLICT DO NOTHING;

-- Datos iniciales para plantillas de email
INSERT INTO webstudio_email_templates (nombre, descripcion, categoria, configuracion) VALUES
('Newsletter Default', 'Plantilla por defecto para newsletters', 'newsletter', '{"header_color":"#3B82F6","footer_color":"#1F2937"}'),
('Promotional', 'Plantilla para promociones', 'promotional', '{"header_color":"#EF4444","footer_color":"#1F2937"}'),
('Transactional', 'Plantilla para emails transaccionales', 'transactional', '{"header_color":"#10B981","footer_color":"#1F2937"}'),
('Event Reminder', 'Plantilla para recordatorios de eventos', 'transactional', '{"header_color":"#F59E0B","footer_color":"#1F2937"}')
ON CONFLICT DO NOTHING;

-- Vista para estadísticas del Web Studio
CREATE OR REPLACE VIEW webstudio_dashboard_view AS
SELECT 
    COUNT(*) as total_paginas,
    COUNT(CASE WHEN estado = 'published' THEN 1 END) as paginas_publicadas,
    COUNT(CASE WHEN estado = 'draft' THEN 1 END) as paginas_borrador,
    COUNT(CASE WHEN tipo = 'custom' THEN 1 END) as paginas_personalizadas,
    COUNT(CASE WHEN tipo = 'system' THEN 1 END) as paginas_sistema
FROM webstudio_pages;

-- Comentarios para documentación
COMMENT ON TABLE webstudio_pages IS 'Tabla principal de páginas del Web Studio';
COMMENT ON TABLE webstudio_widgets IS 'Widgets disponibles para usar en páginas';
COMMENT ON TABLE webstudio_templates IS 'Plantillas de páginas predefinidas';
COMMENT ON TABLE webstudio_site_config IS 'Configuraciones generales del sitio';
COMMENT ON TABLE webstudio_header_components IS 'Componentes de header disponibles';
COMMENT ON TABLE webstudio_footer_components IS 'Componentes de footer disponibles';
COMMENT ON TABLE webstudio_email_templates IS 'Plantillas de email';
COMMENT ON TABLE webstudio_page_versions IS 'Historial de versiones de páginas';
COMMENT ON TABLE webstudio_page_stats IS 'Estadísticas de páginas';
COMMENT ON VIEW webstudio_dashboard_view IS 'Vista para estadísticas del dashboard del Web Studio'; 