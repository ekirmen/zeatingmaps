-- =====================================================
-- MIGRACIÓN CON DATOS REALES DE LA BASE DE DATOS
-- =====================================================

-- PASO 1: Crear tabla plantillas_comisiones
CREATE TABLE IF NOT EXISTS plantillas_comisiones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    detalles TEXT,
    recinto INTEGER REFERENCES recintos(id),
    sala INTEGER REFERENCES salas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Agregar columnas a funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_comisiones INTEGER REFERENCES plantillas_comisiones(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_producto UUID REFERENCES plantillas_productos(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS tiempo_caducidad_reservas INTEGER DEFAULT -120;

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS fecha_liberacion_reservas TIMESTAMP WITH TIME ZONE;

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_recinto ON plantillas_comisiones(recinto);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_sala ON plantillas_comisiones(sala);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_nombre ON plantillas_comisiones(nombre);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_comisiones ON funciones(plantilla_comisiones);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_producto ON funciones(plantilla_producto);
CREATE INDEX IF NOT EXISTS idx_funciones_tiempo_caducidad ON funciones(tiempo_caducidad_reservas);

-- PASO 4: Crear función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 5: Crear trigger
DROP TRIGGER IF EXISTS update_plantillas_comisiones_updated_at ON plantillas_comisiones;
CREATE TRIGGER update_plantillas_comisiones_updated_at 
    BEFORE UPDATE ON plantillas_comisiones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 6: Agregar comentarios
COMMENT ON TABLE plantillas_comisiones IS 'Plantillas para configurar comisiones por zona y tipo de entrada';
COMMENT ON COLUMN plantillas_comisiones.detalles IS 'JSON con estructura de comisiones por zona y producto';
COMMENT ON COLUMN funciones.plantilla_comisiones IS 'Referencia a la plantilla de comisiones para esta función';
COMMENT ON COLUMN funciones.plantilla_producto IS 'Referencia a la plantilla de productos para esta función';
COMMENT ON COLUMN funciones.tiempo_caducidad_reservas IS 'Tiempo en minutos antes/después de la fecha de celebración para liberar reservas';
COMMENT ON COLUMN funciones.fecha_liberacion_reservas IS 'Fecha calculada de liberación de reservas';

-- PASO 7: Insertar datos de ejemplo usando IDs reales
-- Primero verificamos qué recintos y salas existen
DO $$
DECLARE
    primer_recinto_id INTEGER;
    primera_sala_id INTEGER;
    primer_producto_id UUID;
BEGIN
    -- Obtener el primer recinto
    SELECT id INTO primer_recinto_id FROM recintos LIMIT 1;
    
    -- Obtener la primera sala del primer recinto
    SELECT id INTO primera_sala_id FROM salas WHERE recinto_id = primer_recinto_id LIMIT 1;
    
    -- Obtener el primer producto
    SELECT id INTO primer_producto_id FROM plantillas_productos WHERE activo = true LIMIT 1;
    
    -- Solo insertar si encontramos datos válidos
    IF primer_recinto_id IS NOT NULL AND primera_sala_id IS NOT NULL THEN
        INSERT INTO plantillas_comisiones (nombre, detalles, recinto, sala) VALUES 
        (
            'Comisiones Estándar',
            CASE 
                WHEN primer_producto_id IS NOT NULL THEN
                    format('[
                        {
                            "zonaId": 1,
                            "productoId": "%s",
                            "comision": 2.50,
                            "tipoEntrada": "regular",
                            "porcentaje": 10
                        },
                        {
                            "zonaId": 1,
                            "productoId": "%s",
                            "comision": 0.00,
                            "tipoEntrada": "cortesia",
                            "porcentaje": 0
                        }
                    ]', primer_producto_id, primer_producto_id)
                ELSE
                    '[
                        {
                            "zonaId": 1,
                            "productoId": "ejemplo-uuid",
                            "comision": 2.50,
                            "tipoEntrada": "regular",
                            "porcentaje": 10
                        },
                        {
                            "zonaId": 1,
                            "productoId": "ejemplo-uuid",
                            "comision": 0.00,
                            "tipoEntrada": "cortesia",
                            "porcentaje": 0
                        }
                    ]'
            END,
            primer_recinto_id,
            primera_sala_id
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Datos insertados con éxito. Recinto ID: %, Sala ID: %', primer_recinto_id, primera_sala_id;
    ELSE
        RAISE NOTICE 'No se encontraron recintos o salas válidas para insertar datos de ejemplo';
    END IF;
END $$; 