-- Corregir la estructura del mapa para que sea compatible con SeatingMapUnified
-- El componente espera zonas con asientos que tengan x, y, ancho, alto

UPDATE mapas 
SET contenido = '[
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
            },
            {
                "_id": "silla_6",
                "nombre": "6",
                "x": 180,
                "y": 140,
                "ancho": 30,
                "alto": 30,
                "zona": 9,
                "estado": "disponible"
            },
            {
                "_id": "silla_7",
                "nombre": "7",
                "x": 100,
                "y": 180,
                "ancho": 30,
                "alto": 30,
                "zona": 9,
                "estado": "disponible"
            },
            {
                "_id": "silla_8",
                "nombre": "8",
                "x": 140,
                "y": 180,
                "ancho": 30,
                "alto": 30,
                "zona": 9,
                "estado": "disponible"
            },
            {
                "_id": "silla_9",
                "nombre": "9",
                "x": 180,
                "y": 180,
                "ancho": 30,
                "alto": 30,
                "zona": 9,
                "estado": "disponible"
            }
        ]
    }
]'::jsonb
WHERE sala_id = 7;

-- Verificar que se actualizó correctamente
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as num_elementos,
    jsonb_array_elements(m.contenido)->>'type' as tipo_elemento,
    jsonb_array_length(jsonb_array_elements(m.contenido)->'asientos') as num_asientos
FROM mapas m
WHERE m.sala_id = 7; 