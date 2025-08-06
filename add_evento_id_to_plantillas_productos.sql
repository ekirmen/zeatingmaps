-- Agregar campo evento_id a la tabla plantillas_productos
ALTER TABLE plantillas_productos 
ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_evento_id ON plantillas_productos(evento_id);

-- Crear índice compuesto para consultas por evento y activo
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_evento_activo ON plantillas_productos(evento_id, activo);

-- Comentario para documentar
COMMENT ON COLUMN plantillas_productos.evento_id IS 'Referencia al evento al que pertenece este producto'; 