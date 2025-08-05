-- 🔧 Script para corregir la estructura del mapa JSON
-- Para que sea compatible con SeatingMapUnified.jsx

-- El componente espera: mapa.contenido.zonas
-- Pero tenemos: mapa.contenido = [array de zonas]

-- Corregir la estructura del mapa
UPDATE mapas 
SET contenido = '{
    "zonas": [
        {
            "_id": "zona_9",
            "type": "zona",
            "id": 9,
            "nombre": "Oro",
            "color": "#c8ff00",
            "asientos": [
                {
                    "_id": "silla_1",
                    "nombre": "1",
                    "x": 100,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": 9,
                    "estado": "disponible"
                },
                {
                    "_id": "silla_2",
                    "nombre": "2",
                    "x": 140,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": 9,
                    "estado": "disponible"
                },
                {
                    "_id": "silla_3",
                    "nombre": "3",
                    "x": 180,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": 9,
                    "estado": "disponible"
                },
                {
                    "_id": "silla_4",
                    "nombre": "4",
                    "x": 100,
                    "y": 140,
                    "ancho": 30,
                    "alto": 30,
                    "zona": 9,
                    "estado": "disponible"
                },
                {
                    "_id": "silla_5",
                    "nombre": "5",
                    "x": 140,
                    "y": 140,
                    "ancho": 30,
                    "alto": 30,
                    "zona": 9,
                    "estado": "disponible"
                }
            ]
        }
    ]
}'::jsonb
WHERE sala_id = 7;

-- Verificar que se corrigió correctamente
SELECT '=== VERIFICACIÓN POST-CORRECCIÓN ===' as seccion;
SELECT 
    m.id,
    m.sala_id,
    jsonb_typeof(m.contenido) as tipo_contenido,
    CASE 
        WHEN m.contenido ? 'zonas' THEN 'SÍ'
        ELSE 'NO'
    END as tiene_zonas,
    jsonb_array_length(m.contenido->'zonas') as num_zonas,
    jsonb_array_length(m.contenido->'zonas'->0->'asientos') as num_asientos
FROM mapas m
WHERE m.sala_id = 7; 