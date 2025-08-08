-- 🚀 Fix para el problema de funciones no disponibles
-- Este script resuelve el problema "No hay funciones disponibles" en boletería

-- =====================================================
-- VERIFICAR Y CREAR TABLA FUNCIONES SI NO EXISTE
-- =====================================================

-- Crear tabla funciones si no existe
CREATE TABLE IF NOT EXISTS funciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    fecha_celebracion TIMESTAMP WITH TIME ZONE NOT NULL,
    hora TIME,
    sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    plantilla_id UUID REFERENCES plantillas_precios(id),
    estado VARCHAR(50) DEFAULT 'activa',
    capacidad_total INTEGER,
    capacidad_disponible INTEGER,
    precio_base DECIMAL(10,2),
    inicio_venta TIMESTAMP WITH TIME ZONE,
    fin_venta TIMESTAMP WITH TIME ZONE,
    pago_a_plazos BOOLEAN DEFAULT false,
    permitir_reservas_web BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_funciones_evento_id ON funciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_funciones_sala_id ON funciones(sala_id);
CREATE INDEX IF NOT EXISTS idx_funciones_fecha_celebracion ON funciones(fecha_celebracion);
CREATE INDEX IF NOT EXISTS idx_funciones_estado ON funciones(estado);

-- =====================================================
-- VERIFICAR TABLA EVENTOS
-- =====================================================

-- Crear tabla eventos si no existe
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(50) DEFAULT 'activo',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VERIFICAR TABLA SALAS
-- =====================================================

-- Crear tabla salas si no existe
CREATE TABLE IF NOT EXISTS salas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    capacidad INTEGER,
    recinto_id UUID REFERENCES recintos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VERIFICAR TABLA PLANTILLAS_PRECIOS
-- =====================================================

-- Crear tabla plantillas_precios si no existe
CREATE TABLE IF NOT EXISTS plantillas_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO SI NO EXISTEN
-- =====================================================

-- Insertar eventos de ejemplo
INSERT INTO eventos (id, nombre, descripcion, fecha_inicio, fecha_fin, estado) 
VALUES 
    (gen_random_uuid(), 'Concierto de Rock', 'Gran concierto de rock en vivo', '2024-02-15', '2024-02-15', 'activo'),
    (gen_random_uuid(), 'Teatro Clásico', 'Obra de teatro clásica', '2024-02-20', '2024-02-20', 'activo'),
    (gen_random_uuid(), 'Festival de Música', 'Festival de música electrónica', '2024-03-01', '2024-03-01', 'activo')
ON CONFLICT DO NOTHING;

-- Insertar recintos de ejemplo si no existen
INSERT INTO recintos (id, nombre, direccion, capacidad, ciudad, estado, pais) 
VALUES 
    (gen_random_uuid(), 'Estadio Olímpico', 'Av. Principal 123', 50000, 'Caracas', 'Distrito Capital', 'Venezuela'),
    (gen_random_uuid(), 'Teatro Teresa Carreño', 'Plaza Venezuela', 3000, 'Caracas', 'Distrito Capital', 'Venezuela')
ON CONFLICT DO NOTHING;

-- Insertar salas de ejemplo
INSERT INTO salas (id, nombre, capacidad, recinto_id) 
SELECT 
    gen_random_uuid(),
    'Sala Principal',
    1000,
    r.id
FROM recintos r 
WHERE r.nombre = 'Teatro Teresa Carreño'
ON CONFLICT DO NOTHING;

-- Insertar plantillas de precios de ejemplo
INSERT INTO plantillas_precios (id, nombre, descripcion) 
VALUES 
    (gen_random_uuid(), 'Plantilla General', 'Plantilla de precios general'),
    (gen_random_uuid(), 'Plantilla VIP', 'Plantilla de precios VIP')
ON CONFLICT DO NOTHING;

-- Insertar funciones de ejemplo
INSERT INTO funciones (id, nombre, fecha_celebracion, hora, sala_id, evento_id, plantilla_id, estado, capacidad_total, capacidad_disponible, precio_base, inicio_venta, fin_venta)
SELECT 
    gen_random_uuid(),
    'Función Principal',
    '2024-02-15 20:00:00',
    '20:00:00',
    s.id,
    e.id,
    p.id,
    'activa',
    1000,
    1000,
    50.00,
    '2024-01-01 00:00:00',
    '2024-02-14 23:59:59'
FROM salas s, eventos e, plantillas_precios p
WHERE s.nombre = 'Sala Principal' 
AND e.nombre = 'Concierto de Rock'
AND p.nombre = 'Plantilla General'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR QUE LOS DATOS SE INSERTARON CORRECTAMENTE
-- =====================================================

-- Consulta para verificar que hay funciones disponibles
SELECT 
    f.id,
    f.nombre,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    f.estado
FROM funciones f
LEFT JOIN eventos e ON f.evento_id = e.id
LEFT JOIN salas s ON f.sala_id = s.id
WHERE f.estado = 'activa'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para actualizar capacidad disponible
CREATE OR REPLACE FUNCTION update_capacidad_disponible()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar capacidad disponible cuando se vende un boleto
    UPDATE funciones 
    SET capacidad_disponible = capacidad_disponible - 1
    WHERE id = NEW.funcion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar capacidad
CREATE TRIGGER trigger_update_capacidad
    AFTER INSERT ON boletos
    FOR EACH ROW EXECUTE FUNCTION update_capacidad_disponible();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará las tablas necesarias si no existen
3. Insertará datos de ejemplo para que las funciones aparezcan
4. Verifica que las funciones se muestren en boletería

PARA VERIFICAR QUE FUNCIONA:
- Ve a la página de boletería
- Selecciona un evento
- Deberías ver las funciones disponibles
- Si no hay funciones, verifica que los datos se insertaron correctamente
*/
