-- 🔧 Plantilla segura para corregir mapas en blanco
-- Reemplaza {SALA_ID} y {ZONA_ID} con los valores reales

-- 1. Verificar si existe mapa para la sala
SELECT '=== VERIFICAR MAPA ===' as seccion;
SELECT 
    m.id,
    m.sala_id,
    CASE 
        WHEN m.contenido IS NULL THEN 'NULL'
        WHEN jsonb_typeof(m.contenido) = 'array' THEN 'ARRAY'
        WHEN jsonb_typeof(m.contenido) = 'object' THEN 'OBJECT'
        ELSE 'OTRO'
    END as tipo_contenido,
    CASE 
        WHEN m.contenido IS NOT NULL THEN jsonb_array_length(m.contenido)
        ELSE 0
    END as elementos_contenido
FROM mapas m
WHERE m.sala_id = {SALA_ID};

-- 2. Verificar si existen zonas para la sala
SELECT '=== VERIFICAR ZONAS ===' as seccion;
SELECT 
    z.id,
    z.nombre,
    z.sala_id,
    z.aforo,
    z.color,
    z.numerada
FROM zonas z
WHERE z.sala_id = '{SALA_ID}';

-- 3. Crear mapa si no existe (ESTRUCTURA SEGURA)
-- Descomenta y ajusta según necesites:
/*
INSERT INTO mapas (sala_id, contenido)
SELECT {SALA_ID}, 
    '[
        {
            "_id": "zona_{ZONA_ID}",
            "type": "zona",
            "id": {ZONA_ID},
            "nombre": "Zona General",
            "color": "#4CAF50",
            "asientos": [
                {
                    "_id": "silla_1",
                    "nombre": "1",
                    "x": 100,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": {ZONA_ID},
                    "estado": "disponible"
                },
                {
                    "_id": "silla_2",
                    "nombre": "2",
                    "x": 140,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": {ZONA_ID},
                    "estado": "disponible"
                }
            ]
        }
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = {SALA_ID});
*/

-- 4. Crear zona si no existe
-- Descomenta y ajusta según necesites:
/*
INSERT INTO zonas (id, nombre, aforo, color, numerada, sala_id)
SELECT {ZONA_ID}, 'General', 100, '#4CAF50', true, '{SALA_ID}'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE sala_id = '{SALA_ID}');
*/

-- 5. Verificar que todo se creó correctamente
SELECT '=== VERIFICACIÓN FINAL ===' as seccion;
SELECT 
    f.id as funcion_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    CASE WHEN m.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_mapa,
    CASE WHEN z.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_zona
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
LEFT JOIN mapas m ON f.sala = m.sala_id
LEFT JOIN zonas z ON f.sala::text = z.sala_id
WHERE f.sala = {SALA_ID}
ORDER BY f.id; 