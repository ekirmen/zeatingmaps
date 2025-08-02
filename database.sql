-- Tabla para píxeles de Facebook por evento
CREATE TABLE IF NOT EXISTS facebook_pixels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    pixel_id VARCHAR(255) NOT NULL,
    pixel_script TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    tracking_pages JSONB DEFAULT '{"event_page": true, "cart_page": true, "payment_page": true, "thank_you_page": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_facebook_pixels_event_id ON facebook_pixels(event_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pixels_active ON facebook_pixels(is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_facebook_pixels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_facebook_pixels_updated_at
    BEFORE UPDATE ON facebook_pixels
    FOR EACH ROW
    EXECUTE FUNCTION update_facebook_pixels_updated_at(); 

-- Tabla para configuraciones de impresora Boca
CREATE TABLE IF NOT EXISTS printer_formats (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de impresión
CREATE TABLE IF NOT EXISTS print_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES entradas(id),
    printer_name VARCHAR(255),
    print_data JSONB,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_print_logs_ticket_id ON print_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_print_logs_created_at ON print_logs(created_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_printer_formats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_printer_formats_updated_at
    BEFORE UPDATE ON printer_formats
    FOR EACH ROW
    EXECUTE FUNCTION update_printer_formats_updated_at(); 