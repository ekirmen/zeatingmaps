-- Script para insertar zonas de prueba
-- Primero verificar si la tabla zonas existe

-- 1. Verificar si la tabla zonas existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'zonas';

-- 2. Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS zonas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    sala_id INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#60a5fa',
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar zonas de prueba para la sala 7
INSERT INTO zonas (nombre, sala_id, color, precio_base) VALUES
('VIP', 7, '#fbbf24', 150.00),
('General', 7, '#60a5fa', 100.00),
('Economica', 7, '#34d399', 75.00),
('Palco', 7, '#a78bfa', 200.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar las zonas insertadas
SELECT 
    z.*,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7
ORDER BY z.nombre;

-- 5. Verificar todas las zonas
SELECT 
    sala_id,
    COUNT(*) as zonas_count,
    STRING_AGG(nombre, ', ') as nombres_zonas
FROM zonas
GROUP BY sala_id
ORDER BY sala_id; 