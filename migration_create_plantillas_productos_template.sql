-- Migración para crear la tabla plantillas_productos_template
-- Esta tabla es necesaria para las plantillas de productos en funciones

-- Crear tabla plantillas_productos_template
CREATE TABLE IF NOT EXISTS plantillas_productos_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    productos JSONB, -- Array de productos con precios e impuestos
    evento_id UUID REFERENCES eventos(id),
    tenant_id UUID REFERENCES tenants(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_template_evento_id ON plantillas_productos_template(evento_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_template_tenant_id ON plantillas_productos_template(tenant_id);
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
COMMENT ON COLUMN plantillas_productos_template.tenant_id IS 'Referencia al tenant al que pertenece esta plantilla';

-- Insertar algunas plantillas de ejemplo
INSERT INTO plantillas_productos_template (nombre, descripcion, productos, activo) VALUES
('Plantilla Básica', 'Plantilla básica para eventos simples', '[]', true),
('Plantilla Premium', 'Plantilla premium con productos adicionales', '[]', true)
ON CONFLICT DO NOTHING;
