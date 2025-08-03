-- Script para crear las 8 tablas faltantes (CORREGIDO)
-- =====================================================

-- 1. Crear tabla admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla boleteria (sin foreign keys problemáticos)
CREATE TABLE IF NOT EXISTS boleteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID,
    funcion_id INTEGER,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock_disponible INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla galeria
CREATE TABLE IF NOT EXISTS galeria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla plantillas_precios
CREATE TABLE IF NOT EXISTS plantillas_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla webstudio_colors
CREATE TABLE IF NOT EXISTS webstudio_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear tabla webstudio_footer
CREATE TABLE IF NOT EXISTS webstudio_footer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    contenido TEXT,
    config JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear tabla webstudio_header
CREATE TABLE IF NOT EXISTS webstudio_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    contenido TEXT,
    config JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo (sin foreign keys problemáticos)
INSERT INTO admin_users (user_id, role, permissions) VALUES 
    (gen_random_uuid(), 'admin', '{"all": true}'),
    (gen_random_uuid(), 'moderator', '{"read": true, "write": true}')
ON CONFLICT DO NOTHING;

INSERT INTO boleteria (evento_id, funcion_id, nombre, descripcion, precio, stock_disponible) VALUES 
    (gen_random_uuid(), 1, 'Entrada General', 'Entrada general para el evento', 50.00, 100),
    (gen_random_uuid(), 2, 'Entrada VIP', 'Entrada VIP con beneficios especiales', 100.00, 50)
ON CONFLICT DO NOTHING;

INSERT INTO galeria (nombre, descripcion, imagen_url, categoria) VALUES 
    ('Evento 1', 'Imágenes del primer evento', 'https://example.com/evento1.jpg', 'Eventos'),
    ('Evento 2', 'Imágenes del segundo evento', 'https://example.com/evento2.jpg', 'Eventos')
ON CONFLICT DO NOTHING;

INSERT INTO plantillas_precios (nombre, descripcion, precio_base, categoria) VALUES 
    ('Plantilla Básica', 'Plantilla de precios básica', 25.00, 'General'),
    ('Plantilla Premium', 'Plantilla de precios premium', 75.00, 'Premium')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (nombre, email, telefono) VALUES 
    ('Juan Pérez', 'juan@example.com', '+1234567890'),
    ('María García', 'maria@example.com', '+0987654321')
ON CONFLICT DO NOTHING;

INSERT INTO webstudio_colors (nombre, color_hex, categoria) VALUES 
    ('Azul Principal', '#007bff', 'Primario'),
    ('Verde Éxito', '#28a745', 'Secundario'),
    ('Rojo Peligro', '#dc3545', 'Advertencia')
ON CONFLICT DO NOTHING;

INSERT INTO webstudio_footer (nombre, contenido, config) VALUES 
    ('Footer Principal', '© 2024 Mi Sistema. Todos los derechos reservados.', '{"show_social": true}'),
    ('Footer Simple', 'Sistema de eventos y boletería', '{"show_social": false}')
ON CONFLICT DO NOTHING;

INSERT INTO webstudio_header (nombre, contenido, config) VALUES 
    ('Header Principal', 'Mi Sistema de Eventos', '{"show_logo": true, "show_menu": true}'),
    ('Header Simple', 'Sistema de Boletería', '{"show_logo": false, "show_menu": true}')
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
    'admin_users',
    'boleteria',
    'galeria',
    'plantillas_precios',
    'usuarios',
    'webstudio_colors',
    'webstudio_footer',
    'webstudio_header'
)
ORDER BY table_name;

-- Mostrar resumen de datos insertados
SELECT 
    'DATOS INSERTADOS' as categoria,
    'admin_users' as tabla,
    COUNT(*) as registros
FROM admin_users
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'boleteria' as tabla,
    COUNT(*) as registros
FROM boleteria
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'galeria' as tabla,
    COUNT(*) as registros
FROM galeria
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'plantillas_precios' as tabla,
    COUNT(*) as registros
FROM plantillas_precios
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'usuarios' as tabla,
    COUNT(*) as registros
FROM usuarios
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'webstudio_colors' as tabla,
    COUNT(*) as registros
FROM webstudio_colors
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'webstudio_footer' as tabla,
    COUNT(*) as registros
FROM webstudio_footer
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'webstudio_header' as tabla,
    COUNT(*) as registros
FROM webstudio_header; 