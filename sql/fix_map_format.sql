-- Script para arreglar el formato del mapa
-- Convertir el formato actual de mesas a zonas

-- 1. Actualizar el mapa con el formato correcto
UPDATE mapas 
SET contenido = '[
    {
        "_id": "zona-1",
        "type": "zona",
        "nombre": "Zona 1",
        "posicion": {"x": 100, "y": 100},
        "width": 400,
        "height": 300,
        "zona": 1,
        "sillas": [
            {"_id": "asiento-1-1", "nombre": "A1", "posicion": {"x": 120, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
            {"_id": "asiento-1-2", "nombre": "A2", "posicion": {"x": 150, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
            {"_id": "asiento-1-3", "nombre": "A3", "posicion": {"x": 180, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
            {"_id": "asiento-1-4", "nombre": "A4", "posicion": {"x": 210, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
            {"_id": "asiento-1-5", "nombre": "A5", "posicion": {"x": 240, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"},
            {"_id": "asiento-1-6", "nombre": "A6", "posicion": {"x": 270, "y": 120}, "width": 20, "height": 20, "zona": 1, "estado": "disponible", "color": "#fbbf24"}
        ]
    },
    {
        "_id": "zona-2",
        "type": "zona",
        "nombre": "Zona 2",
        "posicion": {"x": 100, "y": 450},
        "width": 400,
        "height": 300,
        "zona": 2,
        "sillas": [
            {"_id": "asiento-2-1", "nombre": "B1", "posicion": {"x": 120, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-2", "nombre": "B2", "posicion": {"x": 150, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-3", "nombre": "B3", "posicion": {"x": 180, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-4", "nombre": "B4", "posicion": {"x": 210, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-5", "nombre": "B5", "posicion": {"x": 240, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-6", "nombre": "B6", "posicion": {"x": 270, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-7", "nombre": "B7", "posicion": {"x": 300, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"},
            {"_id": "asiento-2-8", "nombre": "B8", "posicion": {"x": 330, "y": 470}, "width": 20, "height": 20, "zona": 2, "estado": "disponible", "color": "#60a5fa"}
        ]
    },
    {
        "_id": "zona-3",
        "type": "zona",
        "nombre": "Zona 3",
        "posicion": {"x": 100, "y": 800},
        "width": 400,
        "height": 300,
        "zona": 3,
        "sillas": [
            {"_id": "asiento-3-1", "nombre": "C1", "posicion": {"x": 120, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-2", "nombre": "C2", "posicion": {"x": 150, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-3", "nombre": "C3", "posicion": {"x": 180, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-4", "nombre": "C4", "posicion": {"x": 210, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-5", "nombre": "C5", "posicion": {"x": 240, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-6", "nombre": "C6", "posicion": {"x": 270, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-7", "nombre": "C7", "posicion": {"x": 300, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-8", "nombre": "C8", "posicion": {"x": 330, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-9", "nombre": "C9", "posicion": {"x": 360, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"},
            {"_id": "asiento-3-10", "nombre": "C10", "posicion": {"x": 390, "y": 820}, "width": 20, "height": 20, "zona": 3, "estado": "disponible", "color": "#34d399"}
        ]
    }
]'::jsonb
WHERE sala_id = 7;

-- 2. Crear zonas correspondientes
INSERT INTO zonas (nombre, sala_id, color, precio_base) VALUES
('Zona 1', 7, '#fbbf24', 150.00),
('Zona 2', 7, '#60a5fa', 100.00),
('Zona 3', 7, '#34d399', 75.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar el resultado
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as zonas_en_mapa,
    m.contenido
FROM mapas m
WHERE m.sala_id = 7;

-- 4. Verificar las zonas
SELECT 
    z.*,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7
ORDER BY z.nombre; 