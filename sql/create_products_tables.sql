-- Script para crear tablas de productos
-- =====================================================

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    stock_disponible INTEGER DEFAULT 0,
    categoria VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de plantillas de productos
CREATE TABLE IF NOT EXISTS plantillas_productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    categoria VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para relación productos-eventos
CREATE TABLE IF NOT EXISTS productos_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    precio_especial DECIMAL(10,2),
    stock_disponible INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, evento_id)
);

-- Crear tabla para relación plantillas-productos-eventos
CREATE TABLE IF NOT EXISTS plantillas_productos_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plantilla_id UUID REFERENCES plantillas_productos(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    precio_especial DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plantilla_id, evento_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_activo ON plantillas_productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_eventos_evento_id ON productos_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_productos_eventos_producto_id ON productos_eventos(producto_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_eventos_evento_id ON plantillas_productos_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_eventos_plantilla_id ON plantillas_productos_eventos(plantilla_id);

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria, stock_disponible) VALUES 
    ('Camiseta del Evento', 'Camiseta oficial del evento con diseño exclusivo', 25.00, 'Merchandising', 100),
    ('Poster Autografiado', 'Poster del evento autografiado por los artistas', 15.00, 'Merchandising', 50),
    ('Programa del Evento', 'Programa oficial con información detallada', 5.00, 'Información', 200),
    ('Pack VIP', 'Pack exclusivo con camiseta, poster y programa', 40.00, 'Pack', 25)
ON CONFLICT DO NOTHING;

-- Insertar algunas plantillas de productos de ejemplo
INSERT INTO plantillas_productos (nombre, descripcion, precio_base, categoria) VALUES 
    ('Camiseta Estándar', 'Plantilla para camisetas de eventos', 20.00, 'Merchandising'),
    ('Poster Básico', 'Plantilla para posters de eventos', 10.00, 'Merchandising'),
    ('Pack Básico', 'Plantilla para packs de merchandising', 30.00, 'Pack')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
SELECT 'Tablas de productos creadas exitosamente!' as mensaje; 