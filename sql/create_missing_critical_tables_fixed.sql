-- Script para crear tablas críticas faltantes (CORREGIDO)
-- =====================================================

-- 1. Crear tabla admin_notifications (si no existe)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla payment_gateways (si no existe)
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla settings (si no existe) - versión simplificada
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla printer_formats (si no existe)
CREATE TABLE IF NOT EXISTS printer_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla productos (si no existe)
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    stock_disponible INTEGER DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla plantillas_productos (si no existe)
CREATE TABLE IF NOT EXISTS plantillas_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla productos_eventos (si no existe)
CREATE TABLE IF NOT EXISTS productos_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    precio_especial DECIMAL(10,2),
    stock_disponible INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, evento_id)
);

-- 8. Crear tabla plantillas_productos_eventos (si no existe)
CREATE TABLE IF NOT EXISTS plantillas_productos_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_id UUID REFERENCES plantillas_productos(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    precio_especial DECIMAL(10,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plantilla_id, evento_id)
);

-- Insertar datos de configuración básica (sin description)
INSERT INTO settings (key, value) VALUES 
    ('site_name', 'Mi Sistema de Eventos'),
    ('site_description', 'Sistema de gestión de eventos y boletería'),
    ('default_currency', 'USD'),
    ('timezone', 'America/Mexico_City')
ON CONFLICT (key) DO NOTHING;

-- Insertar formatos de impresora por defecto
INSERT INTO printer_formats (name, config, active) VALUES 
    ('Formato Estándar', '{"width": 80, "height": 297, "margin": 5}', true),
    ('Formato Ancho', '{"width": 112, "height": 297, "margin": 5}', true)
ON CONFLICT DO NOTHING;

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria, stock_disponible, activo) VALUES 
    ('Camiseta del Evento', 'Camiseta oficial del evento con diseño exclusivo', 25.00, 'Merchandising', 100, true),
    ('Poster Autografiado', 'Poster del evento autografiado por los artistas', 15.00, 'Merchandising', 50, true),
    ('Programa del Evento', 'Programa oficial con información detallada', 5.00, 'Información', 200, true),
    ('Pack VIP', 'Pack exclusivo con camiseta, poster y programa', 40.00, 'Pack', 25, true)
ON CONFLICT DO NOTHING;

-- Verificar tablas creadas
SELECT 
    'TABLAS CREADAS' as categoria,
    table_name,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'admin_notifications',
    'payment_gateways',
    'settings',
    'printer_formats',
    'productos',
    'plantillas_productos',
    'productos_eventos',
    'plantillas_productos_eventos'
)
ORDER BY table_name;

-- Mostrar resumen de datos insertados
SELECT 
    'DATOS INSERTADOS' as categoria,
    'settings' as tabla,
    COUNT(*) as registros
FROM settings
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'printer_formats' as tabla,
    COUNT(*) as registros
FROM printer_formats
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'productos' as tabla,
    COUNT(*) as registros
FROM productos; 