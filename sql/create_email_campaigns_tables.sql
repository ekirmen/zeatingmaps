-- Tabla para campañas de email
CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'newsletter',
    estado VARCHAR(20) NOT NULL DEFAULT 'draft',
    configuracion JSONB DEFAULT '{}',
    total_enviados INTEGER DEFAULT 0,
    total_fallidos INTEGER DEFAULT 0,
    fecha_envio TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para widgets de campaña
CREATE TABLE IF NOT EXISTS campaign_widgets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    configuracion JSONB DEFAULT '{}',
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para destinatarios de campañas
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'pending',
    fecha_envio TIMESTAMP,
    fecha_apertura TIMESTAMP,
    fecha_clic TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para canales de venta
CREATE TABLE IF NOT EXISTS canales_venta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para estadísticas de emails
CREATE TABLE IF NOT EXISTS email_stats (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL, -- 'sent', 'opened', 'clicked', 'bounced'
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_adicionales JSONB DEFAULT '{}'
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_email_campaigns_estado ON email_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_fecha_envio ON email_campaigns(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_campaign_widgets_campaign_id ON campaign_widgets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_email_stats_campaign_id ON email_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_stats_tipo_evento ON email_stats(tipo_evento);

-- Datos iniciales para canales de venta
INSERT INTO canales_venta (nombre, url, activo) VALUES
('Marca blanca 1', 'https://kreatickets.pagatusboletos.com/tickets/', true),
('Internet', 'https://ventas.kreatickets.com/venta/', true),
('Test', 'https://ventas.kreatickets.com/test/', true)
ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_email_campaigns_updated_at 
    BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para estadísticas de campañas
CREATE OR REPLACE VIEW campaign_stats_view AS
SELECT 
    ec.id,
    ec.nombre,
    ec.tipo,
    ec.estado,
    ec.total_enviados,
    ec.total_fallidos,
    ec.fecha_envio,
    COUNT(cr.id) as total_destinatarios,
    COUNT(CASE WHEN cr.estado = 'sent' THEN 1 END) as enviados,
    COUNT(CASE WHEN cr.estado = 'opened' THEN 1 END) as abiertos,
    COUNT(CASE WHEN cr.estado = 'clicked' THEN 1 END) as clics,
    COUNT(CASE WHEN cr.estado = 'bounced' THEN 1 END) as rebotados
FROM email_campaigns ec
LEFT JOIN campaign_recipients cr ON ec.id = cr.campaign_id
GROUP BY ec.id, ec.nombre, ec.tipo, ec.estado, ec.total_enviados, ec.total_fallidos, ec.fecha_envio;

-- Función para obtener estadísticas de una campaña
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_id INTEGER)
RETURNS TABLE(
    total_destinatarios BIGINT,
    enviados BIGINT,
    abiertos BIGINT,
    clics BIGINT,
    rebotados BIGINT,
    tasa_apertura DECIMAL,
    tasa_clics DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(cr.id)::BIGINT as total_destinatarios,
        COUNT(CASE WHEN cr.estado = 'sent' THEN 1 END)::BIGINT as enviados,
        COUNT(CASE WHEN cr.estado = 'opened' THEN 1 END)::BIGINT as abiertos,
        COUNT(CASE WHEN cr.estado = 'clicked' THEN 1 END)::BIGINT as clics,
        COUNT(CASE WHEN cr.estado = 'bounced' THEN 1 END)::BIGINT as rebotados,
        CASE 
            WHEN COUNT(CASE WHEN cr.estado = 'sent' THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN cr.estado = 'opened' THEN 1 END)::DECIMAL / COUNT(CASE WHEN cr.estado = 'sent' THEN 1 END)::DECIMAL) * 100
            ELSE 0 
        END as tasa_apertura,
        CASE 
            WHEN COUNT(CASE WHEN cr.estado = 'opened' THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN cr.estado = 'clicked' THEN 1 END)::DECIMAL / COUNT(CASE WHEN cr.estado = 'opened' THEN 1 END)::DECIMAL) * 100
            ELSE 0 
        END as tasa_clics
    FROM campaign_recipients cr
    WHERE cr.campaign_id = get_campaign_stats.campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE email_campaigns IS 'Tabla principal para campañas de email';
COMMENT ON TABLE campaign_widgets IS 'Widgets configurados para cada campaña';
COMMENT ON TABLE campaign_recipients IS 'Destinatarios de cada campaña';
COMMENT ON TABLE canales_venta IS 'Canales de venta disponibles para botones';
COMMENT ON TABLE email_stats IS 'Estadísticas detalladas de emails';
COMMENT ON VIEW campaign_stats_view IS 'Vista con estadísticas resumidas de campañas'; 