-- =====================================================
-- MIGRACIÓN FINAL DE BASE DE DATOS PARA FUNCIONES
-- =====================================================

-- 1. Crear tabla plantillas_comisiones si no existe
CREATE TABLE IF NOT EXISTS plantillas_comisiones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    detalles TEXT, -- JSON con detalles de comisiones
    recinto INTEGER REFERENCES recintos(id),
    sala INTEGER REFERENCES salas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar columnas a la tabla funciones (solo las que faltan)
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_comisiones INTEGER REFERENCES plantillas_comisiones(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_producto UUID REFERENCES plantillas_productos(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS tiempo_caducidad_reservas INTEGER DEFAULT -120; -- 2 horas por defecto

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS fecha_liberacion_reservas TIMESTAMP WITH TIME ZONE;

-- 3. Crear índices para mejor rendimiento (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_recinto ON plantillas_comisiones(recinto);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_sala ON plantillas_comisiones(sala);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_nombre ON plantillas_comisiones(nombre);

CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_comisiones ON funciones(plantilla_comisiones);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_producto ON funciones(plantilla_producto);
CREATE INDEX IF NOT EXISTS idx_funciones_tiempo_caducidad ON funciones(tiempo_caducidad_reservas);

-- 4. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_plantillas_comisiones_updated_at ON plantillas_comisiones;
CREATE TRIGGER update_plantillas_comisiones_updated_at 
    BEFORE UPDATE ON plantillas_comisiones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios para documentar
COMMENT ON TABLE plantillas_comisiones IS 'Plantillas para configurar comisiones por zona y tipo de entrada';
COMMENT ON COLUMN plantillas_comisiones.detalles IS 'JSON con estructura de comisiones por zona y producto';

COMMENT ON COLUMN funciones.plantilla_comisiones IS 'Referencia a la plantilla de comisiones para esta función';
COMMENT ON COLUMN funciones.plantilla_producto IS 'Referencia a la plantilla de productos para esta función';
COMMENT ON COLUMN funciones.tiempo_caducidad_reservas IS 'Tiempo en minutos antes/después de la fecha de celebración para liberar reservas';
COMMENT ON COLUMN funciones.fecha_liberacion_reservas IS 'Fecha calculada de liberación de reservas';

-- 7. Ejemplo de datos de prueba para plantillas_comisiones
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
    1, -- ID del recinto
    1  -- ID de la sala
) ON CONFLICT DO NOTHING; 