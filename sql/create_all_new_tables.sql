-- =====================================================
-- SCRIPT PARA CREAR TODAS LAS NUEVAS TABLAS
-- CRM y Web Studio
-- =====================================================

-- Primero, asegurarse de que existe la función update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABLAS DEL CRM
-- =====================================================

-- Tabla para clientes del CRM
CREATE TABLE IF NOT EXISTS crm_clients (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(50),
    empresa VARCHAR(255),
    cargo VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_postal VARCHAR(20),
    tipo_cliente VARCHAR(50) DEFAULT 'individual',
    estado VARCHAR(20) DEFAULT 'activo',
    fuente VARCHAR(100),
    notas TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_contacto TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para interacciones/actividades del CRM
CREATE TABLE IF NOT EXISTS crm_interactions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    asunto VARCHAR(255),
    descripcion TEXT,
    resultado VARCHAR(100),
    fecha_interaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracion_minutos INTEGER,
    usuario_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para oportunidades de venta
CREATE TABLE IF NOT EXISTS crm_opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor_estimado DECIMAL(10,2),
    probabilidad INTEGER DEFAULT 50,
    etapa VARCHAR(50) DEFAULT 'prospeccion',
    fecha_cierre_esperada DATE,
    fecha_cierre_real DATE,
    usuario_asignado UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para tareas/recordatorios
CREATE TABLE IF NOT EXISTS crm_tasks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    opportunity_id INTEGER REFERENCES crm_opportunities(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'tarea',
    prioridad VARCHAR(20) DEFAULT 'media',
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_vencimiento TIMESTAMP,
    fecha_completada TIMESTAMP,
    usuario_asignado UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para etiquetas/tags
CREATE TABLE IF NOT EXISTS crm_tags (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación muchos a muchos entre clientes y etiquetas
CREATE TABLE IF NOT EXISTS crm_client_tags (
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES crm_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, tag_id)
);

-- Tabla para notas de clientes
CREATE TABLE IF NOT EXISTS crm_notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    titulo VARCHAR(255),
    contenido TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'nota',
    usuario_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuraciones del CRM
CREATE TABLE IF NOT EXISTS crm_settings (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLAS DEL WEB STUDIO
-- =====================================================

-- Tabla para páginas personalizadas del Web Studio
CREATE TABLE IF NOT EXISTS webstudio_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'custom',
    estado VARCHAR(20) DEFAULT 'draft',
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
    tipo VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100),
    configuracion_schema JSONB DEFAULT '{}',
    configuracion_default JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para plantillas de páginas
CREATE TABLE IF NOT EXISTS webstudio_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'general',
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
    config_type VARCHAR(50) DEFAULT 'string',
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'general',
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
    categoria VARCHAR(100) DEFAULT 'general',
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

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices CRM
CREATE INDEX IF NOT EXISTS idx_crm_clients_email ON crm_clients(email);
CREATE INDEX IF NOT EXISTS idx_crm_clients_estado ON crm_clients(estado);
CREATE INDEX IF NOT EXISTS idx_crm_clients_fecha_registro ON crm_clients(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_client_id ON crm_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_tipo ON crm_interactions(tipo);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_fecha ON crm_interactions(fecha_interaccion);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_client_id ON crm_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_etapa ON crm_opportunities(etapa);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_client_id ON crm_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_estado ON crm_tasks(estado);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_fecha_vencimiento ON crm_tasks(fecha_vencimiento);

-- Índices Web Studio
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_slug ON webstudio_pages(slug);
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_estado ON webstudio_pages(estado);
CREATE INDEX IF NOT EXISTS idx_webstudio_pages_tipo ON webstudio_pages(tipo);
CREATE INDEX IF NOT EXISTS idx_webstudio_widgets_tipo ON webstudio_widgets(tipo);
CREATE INDEX IF NOT EXISTS idx_webstudio_widgets_categoria ON webstudio_widgets(categoria);
CREATE INDEX IF NOT EXISTS idx_webstudio_templates_categoria ON webstudio_templates(categoria);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_versions_page_id ON webstudio_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_stats_page_id ON webstudio_page_stats(page_id);
CREATE INDEX IF NOT EXISTS idx_webstudio_page_stats_fecha ON webstudio_page_stats(fecha);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

-- Triggers CRM
CREATE TRIGGER update_crm_clients_updated_at 
    BEFORE UPDATE ON crm_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_opportunities_updated_at 
    BEFORE UPDATE ON crm_opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at 
    BEFORE UPDATE ON crm_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_notes_updated_at 
    BEFORE UPDATE ON crm_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_settings_updated_at 
    BEFORE UPDATE ON crm_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers Web Studio
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

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Datos iniciales para etiquetas CRM
INSERT INTO crm_tags (nombre, color, descripcion) VALUES
('VIP', '#FFD700', 'Clientes VIP'),
('Prospecto', '#FF6B6B', 'Clientes potenciales'),
('Activo', '#4CAF50', 'Clientes activos'),
('Inactivo', '#9E9E9E', 'Clientes inactivos'),
('Distribuidor', '#2196F3', 'Distribuidores'),
('Empresa', '#9C27B0', 'Clientes empresariales')
ON CONFLICT DO NOTHING;

-- Datos iniciales para configuraciones CRM
INSERT INTO crm_settings (config_key, config_value, descripcion) VALUES
('default_stage_pipeline', '["prospeccion", "calificacion", "propuesta", "negociacion", "cerrado"]', 'Etapas por defecto del pipeline de ventas'),
('task_reminder_hours', '24', 'Horas de anticipación para recordatorios de tareas'),
('auto_follow_up_days', '7', 'Días automáticos para seguimiento'),
('email_signature', 'Saludos cordiales,\nEquipo de Ventas', 'Firma por defecto para emails')
ON CONFLICT DO NOTHING;

-- Datos iniciales para widgets Web Studio
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

-- =====================================================
-- VISTAS PARA DASHBOARDS
-- =====================================================

-- Vista para dashboard del CRM
CREATE OR REPLACE VIEW crm_dashboard_view AS
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as clientes_activos,
    COUNT(CASE WHEN estado = 'prospecto' THEN 1 END) as prospectos,
    COUNT(CASE WHEN fecha_ultimo_contacto >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as contactados_30_dias,
    COUNT(CASE WHEN fecha_registro >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as nuevos_7_dias
FROM crm_clients;

-- Vista para estadísticas del Web Studio
CREATE OR REPLACE VIEW webstudio_dashboard_view AS
SELECT 
    COUNT(*) as total_paginas,
    COUNT(CASE WHEN estado = 'published' THEN 1 END) as paginas_publicadas,
    COUNT(CASE WHEN estado = 'draft' THEN 1 END) as paginas_borrador,
    COUNT(CASE WHEN tipo = 'custom' THEN 1 END) as paginas_personalizadas,
    COUNT(CASE WHEN tipo = 'system' THEN 1 END) as paginas_sistema
FROM webstudio_pages;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'Todas las tablas han sido creadas exitosamente!' as mensaje; 