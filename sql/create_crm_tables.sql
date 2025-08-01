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
    tipo_cliente VARCHAR(50) DEFAULT 'individual', -- 'individual', 'empresa', 'distribuidor'
    estado VARCHAR(20) DEFAULT 'activo', -- 'activo', 'inactivo', 'prospecto'
    fuente VARCHAR(100), -- 'web', 'referido', 'evento', 'cold_call'
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
    tipo VARCHAR(50) NOT NULL, -- 'llamada', 'email', 'reunion', 'venta', 'soporte'
    asunto VARCHAR(255),
    descripcion TEXT,
    resultado VARCHAR(100),
    fecha_interaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracion_minutos INTEGER,
    usuario_id UUID, -- Referencia al usuario que realizó la interacción
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para oportunidades de venta
CREATE TABLE IF NOT EXISTS crm_opportunities (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor_estimado DECIMAL(10,2),
    probabilidad INTEGER DEFAULT 50, -- Porcentaje de probabilidad de cierre
    etapa VARCHAR(50) DEFAULT 'prospeccion', -- 'prospeccion', 'calificacion', 'propuesta', 'negociacion', 'cerrado'
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
    tipo VARCHAR(50) DEFAULT 'tarea', -- 'tarea', 'recordatorio', 'seguimiento'
    prioridad VARCHAR(20) DEFAULT 'media', -- 'baja', 'media', 'alta', 'urgente'
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'completada', 'cancelada'
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
    color VARCHAR(7) DEFAULT '#3B82F6', -- Color en formato hexadecimal
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
    tipo VARCHAR(50) DEFAULT 'nota', -- 'nota', 'comentario', 'historial'
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

-- Índices para mejorar rendimiento
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

-- Triggers para actualizar updated_at
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

-- Datos iniciales para etiquetas
INSERT INTO crm_tags (nombre, color, descripcion) VALUES
('VIP', '#FFD700', 'Clientes VIP'),
('Prospecto', '#FF6B6B', 'Clientes potenciales'),
('Activo', '#4CAF50', 'Clientes activos'),
('Inactivo', '#9E9E9E', 'Clientes inactivos'),
('Distribuidor', '#2196F3', 'Distribuidores'),
('Empresa', '#9C27B0', 'Clientes empresariales')
ON CONFLICT DO NOTHING;

-- Datos iniciales para configuraciones
INSERT INTO crm_settings (config_key, config_value, descripcion) VALUES
('default_stage_pipeline', '["prospeccion", "calificacion", "propuesta", "negociacion", "cerrado"]', 'Etapas por defecto del pipeline de ventas'),
('task_reminder_hours', '24', 'Horas de anticipación para recordatorios de tareas'),
('auto_follow_up_days', '7', 'Días automáticos para seguimiento'),
('email_signature', 'Saludos cordiales,\nEquipo de Ventas', 'Firma por defecto para emails')
ON CONFLICT DO NOTHING;

-- Vista para dashboard del CRM
CREATE OR REPLACE VIEW crm_dashboard_view AS
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as clientes_activos,
    COUNT(CASE WHEN estado = 'prospecto' THEN 1 END) as prospectos,
    COUNT(CASE WHEN fecha_ultimo_contacto >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as contactados_30_dias,
    COUNT(CASE WHEN fecha_registro >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as nuevos_7_dias
FROM crm_clients;

-- Comentarios para documentación
COMMENT ON TABLE crm_clients IS 'Tabla principal de clientes del CRM';
COMMENT ON TABLE crm_interactions IS 'Interacciones y actividades con clientes';
COMMENT ON TABLE crm_opportunities IS 'Oportunidades de venta';
COMMENT ON TABLE crm_tasks IS 'Tareas y recordatorios';
COMMENT ON TABLE crm_tags IS 'Etiquetas para categorizar clientes';
COMMENT ON TABLE crm_notes IS 'Notas y comentarios sobre clientes';
COMMENT ON TABLE crm_settings IS 'Configuraciones del sistema CRM';
COMMENT ON VIEW crm_dashboard_view IS 'Vista para estadísticas del dashboard del CRM'; 