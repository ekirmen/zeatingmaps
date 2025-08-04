-- Script completo para arreglar los datos de la boletería
-- Este script verifica y crea todos los datos necesarios

-- 1. Verificar y crear tabla zonas si no existe
CREATE TABLE IF NOT EXISTS zonas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    sala_id INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#60a5fa',
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Verificar y crear tabla mapas si no existe
CREATE TABLE IF NOT EXISTS mapas (
    id SERIAL PRIMARY KEY,
    sala_id INTEGER NOT NULL,
    contenido JSONB,
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

-- 4. Crear un mapa de prueba para la sala 7
INSERT INTO mapas (sala_id, contenido) VALUES (
    7,
    '[
        {
            "_id": "zona-vip",
            "type": "zona",
            "nombre": "VIP",
            "posicion": {"x": 100, "y": 100},
            "width": 400,
            "height": 300,
            "zona": 1,
            "sillas": [
                {"_id": "vip-1", "nombre": "VIP-1", "posicion": {"x": 120, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
                {"_id": "vip-2", "nombre": "VIP-2", "posicion": {"x": 150, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
                {"_id": "vip-3", "nombre": "VIP-3", "posicion": {"x": 180, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
                {"_id": "vip-4", "nombre": "VIP-4", "posicion": {"x": 210, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"}
            ]
        },
        {
            "_id": "zona-general",
            "type": "zona",
            "nombre": "General",
            "posicion": {"x": 100, "y": 450},
            "width": 400,
            "height": 300,
            "zona": 2,
            "sillas": [
                {"_id": "gen-1", "nombre": "GEN-1", "posicion": {"x": 120, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
                {"_id": "gen-2", "nombre": "GEN-2", "posicion": {"x": 150, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
                {"_id": "gen-3", "nombre": "GEN-3", "posicion": {"x": 180, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
                {"_id": "gen-4", "nombre": "GEN-4", "posicion": {"x": 210, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
                {"_id": "gen-5", "nombre": "GEN-5", "posicion": {"x": 240, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
                {"_id": "gen-6", "nombre": "GEN-6", "posicion": {"x": 270, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"}
            ]
        },
        {
            "_id": "zona-economica",
            "type": "zona",
            "nombre": "Economica",
            "posicion": {"x": 100, "y": 800},
            "width": 400,
            "height": 300,
            "zona": 3,
            "sillas": [
                {"_id": "eco-1", "nombre": "ECO-1", "posicion": {"x": 120, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-2", "nombre": "ECO-2", "posicion": {"x": 150, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-3", "nombre": "ECO-3", "posicion": {"x": 180, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-4", "nombre": "ECO-4", "posicion": {"x": 210, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-5", "nombre": "ECO-5", "posicion": {"x": 240, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-6", "nombre": "ECO-6", "posicion": {"x": 270, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-7", "nombre": "ECO-7", "posicion": {"x": 300, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
                {"_id": "eco-8", "nombre": "ECO-8", "posicion": {"x": 330, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"}
            ]
        }
    ]'::jsonb
) ON CONFLICT (sala_id) DO UPDATE SET
    contenido = EXCLUDED.contenido,
    updated_at = NOW();

-- 5. Verificar que los datos se insertaron correctamente
SELECT 
    'zonas' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT sala_id) as salas_con_zonas
FROM zonas;

SELECT 
    'mapas' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN sala_id = 7 THEN 1 END) as mapas_sala_7
FROM mapas;

-- 6. Verificar zonas específicas de la sala 7
SELECT 
    z.*,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7
ORDER BY z.nombre;

-- 7. Verificar mapa de la sala 7
SELECT 
    m.*,
    s.nombre as sala_nombre,
    jsonb_array_length(m.contenido) as elementos_en_mapa
FROM mapas m
LEFT JOIN salas s ON m.sala_id = s.id
WHERE m.sala_id = 7; 