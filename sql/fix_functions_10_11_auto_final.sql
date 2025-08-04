-- Script para corregir automáticamente las funciones 10 y 11
-- Este script creará los datos faltantes necesarios

-- 1. Crear mapa para sala_id = 7 si no existe
INSERT INTO mapas (sala_id, contenido, created_at, updated_at)
SELECT 7, 
    '[
        {
            "_id": "mesa_1",
            "type": "mesa",
            "zona": 1,
            "shape": "circle",
            "width": 120,
            "height": 120,
            "nombre": "Mesa 1",
            "radius": 60,
            "sillas": [
                {
                    "_id": "silla_1",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 1,
                    "numero": 1,
                    "status": "available",
                    "mesa_id": "mesa_1",
                    "user_id": null,
                    "parentId": "mesa_1",
                    "posicion": {"x": 50, "y": 50},
                    "bloqueado": false
                },
                {
                    "_id": "silla_2",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 2,
                    "numero": 2,
                    "status": "available",
                    "mesa_id": "mesa_1",
                    "user_id": null,
                    "parentId": "mesa_1",
                    "posicion": {"x": 80, "y": 50},
                    "bloqueado": false
                },
                {
                    "_id": "silla_3",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 3,
                    "numero": 3,
                    "status": "available",
                    "mesa_id": "mesa_1",
                    "user_id": null,
                    "parentId": "mesa_1",
                    "posicion": {"x": 110, "y": 50},
                    "bloqueado": false
                }
            ],
            "posicion": {"x": 100, "y": 100}
        },
        {
            "_id": "mesa_2",
            "type": "mesa",
            "zona": 1,
            "shape": "rect",
            "width": 100,
            "height": 80,
            "nombre": "Mesa 2",
            "sillas": [
                {
                    "_id": "silla_4",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 1,
                    "numero": 1,
                    "status": "available",
                    "mesa_id": "mesa_2",
                    "user_id": null,
                    "parentId": "mesa_2",
                    "posicion": {"x": 50, "y": 50},
                    "bloqueado": false
                },
                {
                    "_id": "silla_5",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 2,
                    "numero": 2,
                    "status": "available",
                    "mesa_id": "mesa_2",
                    "user_id": null,
                    "parentId": "mesa_2",
                    "posicion": {"x": 80, "y": 50},
                    "bloqueado": false
                }
            ],
            "posicion": {"x": 300, "y": 100}
        }
    ]'::jsonb,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = 7);

-- 2. Crear zona para sala_id = 7 si no existe
INSERT INTO zonas (id, nombre, sala_id, created_at, updated_at)
SELECT 1, 'General', 7, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE sala_id = 7);

-- 3. Verificar que todo se creó correctamente
SELECT '=== VERIFICACIÓN FINAL ===' as seccion;

SELECT 
    f.id as funcion_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre,
    CASE WHEN m.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_mapa,
    CASE WHEN z.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_zona,
    CASE WHEN p.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_plantilla
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
LEFT JOIN mapas m ON f.sala = m.sala_id
LEFT JOIN zonas z ON f.sala = z.sala_id
LEFT JOIN plantillas p ON f.plantilla = p.id
WHERE f.id IN (10, 11)
ORDER BY f.id;

-- 4. Mostrar detalles del mapa creado
SELECT '=== DETALLES DEL MAPA ===' as seccion;
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as num_elementos,
    m.contenido
FROM mapas m
WHERE m.sala_id = 7;

-- 5. Mostrar detalles de las zonas
SELECT '=== DETALLES DE LAS ZONAS ===' as seccion;
SELECT 
    z.id,
    z.nombre,
    z.sala_id
FROM zonas z
WHERE z.sala_id = 7; 