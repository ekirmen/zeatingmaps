-- Corregir la estructura del mapa para que sea compatible con el frontend
-- El frontend espera elementos con type: "zona" que contengan sillas

UPDATE mapas 
SET contenido = '[
    {
        "_id": "zona_9",
        "type": "zona",
        "zona": 9,
        "nombre": "Oro",
        "color": "#c8ff00",
        "sillas": [
            {
                "_id": "silla_1",
                "fila": null,
                "type": "silla",
                "zona": 9,
                "price": null,
                "width": 20,
                "height": 20,
                "nombre": 1,
                "numero": 1,
                "status": "available",
                "user_id": null,
                "posicion": {"x": 100, "y": 100},
                "bloqueado": false
            },
            {
                "_id": "silla_2",
                "fila": null,
                "type": "silla",
                "zona": 9,
                "price": null,
                "width": 20,
                "height": 20,
                "nombre": 2,
                "numero": 2,
                "status": "available",
                "user_id": null,
                "posicion": {"x": 130, "y": 100},
                "bloqueado": false
            },
            {
                "_id": "silla_3",
                "fila": null,
                "type": "silla",
                "zona": 9,
                "price": null,
                "width": 20,
                "height": 20,
                "nombre": 3,
                "numero": 3,
                "status": "available",
                "user_id": null,
                "posicion": {"x": 160, "y": 100},
                "bloqueado": false
            },
            {
                "_id": "silla_4",
                "fila": null,
                "type": "silla",
                "zona": 9,
                "price": null,
                "width": 20,
                "height": 20,
                "nombre": 4,
                "numero": 4,
                "status": "available",
                "user_id": null,
                "posicion": {"x": 100, "y": 130},
                "bloqueado": false
            },
            {
                "_id": "silla_5",
                "fila": null,
                "type": "silla",
                "zona": 9,
                "price": null,
                "width": 20,
                "height": 20,
                "nombre": 5,
                "numero": 5,
                "status": "available",
                "user_id": null,
                "posicion": {"x": 130, "y": 130},
                "bloqueado": false
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
    jsonb_array_elements(m.contenido)->>'type' as tipo_elemento
FROM mapas m
WHERE m.sala_id = 7; 