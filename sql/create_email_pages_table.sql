-- Crear tabla para páginas de email
CREATE TABLE IF NOT EXISTS email_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(100) NOT NULL DEFAULT 'newsletter',
  asunto VARCHAR(500) NOT NULL,
  contenido TEXT,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_email_pages_tipo ON email_pages(tipo);
CREATE INDEX IF NOT EXISTS idx_email_pages_created_at ON email_pages(created_at DESC);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_pages_updated_at 
    BEFORE UPDATE ON email_pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos datos de ejemplo
INSERT INTO email_pages (nombre, descripcion, tipo, asunto, contenido) VALUES
(
  'Newsletter Mensual',
  'Newsletter mensual con las últimas noticias y eventos',
  'newsletter',
  'Tu Newsletter Mensual - Novedades y Eventos',
  '<html><body><h1>Newsletter Mensual</h1><p>Contenido del newsletter...</p></body></html>'
),
(
  'Promoción Especial',
  'Email promocional para ofertas especiales',
  'promocional',
  '¡Oferta Especial! 50% de descuento en tu próxima compra',
  '<html><body><h1>¡Oferta Especial!</h1><p>No te pierdas esta increíble oferta...</p></body></html>'
),
(
  'Información de Evento',
  'Email informativo sobre un evento específico',
  'evento',
  'Información importante sobre tu evento',
  '<html><body><h1>Información del Evento</h1><p>Detalles importantes sobre tu evento...</p></body></html>'
); 