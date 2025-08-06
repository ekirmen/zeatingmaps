-- Crear tabla plantillas_productos_template
CREATE TABLE IF NOT EXISTS plantillas_productos_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    productos JSONB, -- Array de productos con precios e impuestos
    evento_id UUID REFERENCES eventos(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_template_evento_id ON plantillas_productos_template(evento_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_template_activo ON plantillas_productos_template(activo);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_template_nombre ON plantillas_productos_template(nombre);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_plantillas_productos_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_plantillas_productos_template_updated_at ON plantillas_productos_template;
CREATE TRIGGER update_plantillas_productos_template_updated_at 
    BEFORE UPDATE ON plantillas_productos_template 
    FOR EACH ROW EXECUTE FUNCTION update_plantillas_productos_template_updated_at();

-- Comentarios para documentar
COMMENT ON TABLE plantillas_productos_template IS 'Plantillas de productos para asignar a funciones';
COMMENT ON COLUMN plantillas_productos_template.productos IS 'JSON con array de productos, cada uno con producto_id, precio e impuesto';
COMMENT ON COLUMN plantillas_productos_template.evento_id IS 'Referencia al evento al que pertenece esta plantilla'; 