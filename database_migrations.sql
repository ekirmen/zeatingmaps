-- =====================================================
-- MIGRACIÓN DE BASE DE DATOS PARA FUNCIONES
-- =====================================================

-- 1. Crear tabla plantillas_comisiones
CREATE TABLE IF NOT EXISTS plantillas_comisiones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    detalles TEXT, -- JSON con detalles de comisiones
    recinto INTEGER REFERENCES recintos(id),
    sala INTEGER REFERENCES salas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla plantillas_productos
CREATE TABLE IF NOT EXISTS plantillas_productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    detalles TEXT, -- JSON con detalles de productos
    recinto INTEGER REFERENCES recintos(id),
    sala INTEGER REFERENCES salas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columnas a la tabla funciones
ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_comisiones INTEGER REFERENCES plantillas_comisiones(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS plantilla_producto INTEGER REFERENCES plantillas_productos(id);

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS tiempo_caducidad_reservas INTEGER DEFAULT -120; -- 2 horas por defecto

ALTER TABLE funciones 
ADD COLUMN IF NOT EXISTS fecha_liberacion_reservas TIMESTAMP WITH TIME ZONE;

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_recinto ON plantillas_comisiones(recinto);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_sala ON plantillas_comisiones(sala);
CREATE INDEX IF NOT EXISTS idx_plantillas_comisiones_nombre ON plantillas_comisiones(nombre);

CREATE INDEX IF NOT EXISTS idx_plantillas_productos_recinto ON plantillas_productos(recinto);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_sala ON plantillas_productos(sala);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_nombre ON plantillas_productos(nombre);

CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_comisiones ON funciones(plantilla_comisiones);
CREATE INDEX IF NOT EXISTS idx_funciones_plantilla_producto ON funciones(plantilla_producto);
CREATE INDEX IF NOT EXISTS idx_funciones_tiempo_caducidad ON funciones(tiempo_caducidad_reservas);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_plantillas_comisiones_updated_at ON plantillas_comisiones;
CREATE TRIGGER update_plantillas_comisiones_updated_at 
    BEFORE UPDATE ON plantillas_comisiones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plantillas_productos_updated_at ON plantillas_productos;
CREATE TRIGGER update_plantillas_productos_updated_at 
    BEFORE UPDATE ON plantillas_productos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Comentarios para documentar
COMMENT ON TABLE plantillas_comisiones IS 'Plantillas para configurar comisiones por zona y tipo de entrada';
COMMENT ON COLUMN plantillas_comisiones.detalles IS 'JSON con estructura de comisiones por zona y producto';

COMMENT ON TABLE plantillas_productos IS 'Plantillas para configurar productos por zona y tipo de entrada';
COMMENT ON COLUMN plantillas_productos.detalles IS 'JSON con estructura de productos por zona y tipo';

COMMENT ON COLUMN funciones.plantilla_comisiones IS 'Referencia a la plantilla de comisiones para esta función';
COMMENT ON COLUMN funciones.plantilla_producto IS 'Referencia a la plantilla de productos para esta función';
COMMENT ON COLUMN funciones.tiempo_caducidad_reservas IS 'Tiempo en minutos antes/después de la fecha de celebración para liberar reservas';
COMMENT ON COLUMN funciones.fecha_liberacion_reservas IS 'Fecha calculada de liberación de reservas';

-- 8. Ejemplo de datos de prueba para plantillas_comisiones
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

-- 9. Ejemplo de datos de prueba para plantillas_productos
INSERT INTO plantillas_productos (nombre, detalles, recinto, sala) VALUES 
(
    'Productos Estándar',
    '[
        {
            "zonaId": 1,
            "productoId": "uuid-del-producto",
            "nombre": "Entrada General",
            "tipoEntrada": "regular",
            "precio": 25.00
        },
        {
            "zonaId": 1,
            "productoId": "uuid-del-producto",
            "nombre": "Entrada VIP",
            "tipoEntrada": "vip",
            "precio": 50.00
        }
    ]',
    1, -- ID del recinto
    1  -- ID de la sala
) ON CONFLICT DO NOTHING; 