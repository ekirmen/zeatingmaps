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

-- PASO 2: Agregar columna plantilla_comisiones a funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_comisiones INTEGER REFERENCES plantillas_comisiones(id);

-- PASO 3: Agregar columna plantilla_producto a funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_producto UUID REFERENCES plantillas_productos(id);

-- PASO 4: Agregar columna tiempo_caducidad_reservas a funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS tiempo_caducidad_reservas INTEGER DEFAULT -120;

-- PASO 5: Agregar columna fecha_liberacion_reservas a funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS fecha_liberacion_reservas TIMESTAMP WITH TIME ZONE;

-- PASO 6: Crear índices
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_recinto ON plantillas_comisiones(recinto);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_sala ON plantillas_comisiones(sala);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_nombre ON plantillas_comisiones(nombre);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_comisiones ON funciones(plantilla_comisiones);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_producto ON funciones(plantilla_producto);
CREATE INDEX IF NOT EXISTS idx_funciones_tiempo_caducidad ON funciones(tiempo_caducidad_reservas);

-- PASO 7: Crear función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 8: Crear trigger
DROP TRIGGER IF EXISTS update_plantillas_comisiones_updated_at ON plantillas_comisiones;
CREATE TRIGGER update_plantillas_comisiones_updated_at 
    BEFORE UPDATE ON plantillas_comisiones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 9: Agregar comentarios
COMMENT ON TABLE plantillas_comisiones IS 'Plantillas para configurar comisiones por zona y tipo de entrada';
COMMENT ON COLUMN plantillas_comisiones.detalles IS 'JSON con estructura de comisiones por zona y producto';
COMMENT ON COLUMN funciones.plantilla_comisiones IS 'Referencia a la plantilla de comisiones para esta función';
COMMENT ON COLUMN funciones.plantilla_producto IS 'Referencia a la plantilla de productos para esta función';
COMMENT ON COLUMN funciones.tiempo_caducidad_reservas IS 'Tiempo en minutos antes/después de la fecha de celebración para liberar reservas';
COMMENT ON COLUMN funciones.fecha_liberacion_reservas IS 'Fecha calculada de liberación de reservas';

-- PASO 10: Insertar datos de ejemplo
INSERT INTO plantillas_comisiones (nombre, detalles, recinto, sala) VALUES 
(
    'Comisiones Estándar',
    '[
        {
            "zonaId": 1,
            "productoId": "uuid-del-producto",
            "comision": 2.50,
            "tipoEntrada": "regular",
            "porcentaje": 10
        },
        {
            "zonaId": 1,
            "productoId": "uuid-del-producto",
            "comision": 0.00,
            "tipoEntrada": "cortesia",
            "porcentaje": 0
        }
    ]',
    1,
    1
) ON CONFLICT DO NOTHING; 