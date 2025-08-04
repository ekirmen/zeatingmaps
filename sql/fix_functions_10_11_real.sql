-- Script para corregir las funciones 10 y 11 usando datos reales
-- Basado en la estructura real de la base de datos

-- 1. Verificar las funciones existentes
SELECT 
    id,
    fecha_celebracion,
    evento,
    sala,
    plantilla,
    created_at
FROM funciones 
WHERE id IN (10, 11)
ORDER BY id;

-- 2. Verificar los eventos asociados (usando las columnas correctas)
SELECT 
    e.id,
    e.nombre,
    e.slug,
    e.descripcion
FROM eventos e
WHERE e.id IN (
    SELECT DISTINCT evento 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 3. Verificar las salas asociadas
SELECT 
    s.id,
    s.nombre,
    s.recinto_id
FROM salas s
WHERE s.id IN (
    SELECT DISTINCT sala 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 4. Verificar los mapas de las salas
SELECT 
    m.id,
    m.sala_id,
    m.contenido IS NOT NULL as tiene_contenido,
    CASE 
        WHEN m.contenido IS NULL THEN 'NULL'
        WHEN m.contenido = '{}' THEN 'VACIO'
        WHEN jsonb_typeof(m.contenido) = 'array' THEN 'ARRAY'
        WHEN jsonb_typeof(m.contenido) = 'object' THEN 'OBJECT'
        ELSE 'OTRO'
    END as tipo_contenido,
    CASE 
        WHEN m.contenido IS NOT NULL THEN jsonb_array_length(m.contenido)
        ELSE 0
    END as elementos_contenido
FROM mapas m
WHERE m.sala_id IN (
    SELECT DISTINCT sala 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 5. Verificar las zonas de las salas
SELECT 
    z.id,
    z.nombre,
    z.sala_id
FROM zonas z
WHERE z.sala_id IN (
    SELECT DISTINCT sala 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 6. Verificar las plantillas de precios
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.detalles IS NOT NULL as tiene_detalles,
    CASE 
        WHEN p.detalles IS NULL THEN 'NULL'
        WHEN p.detalles = '[]' THEN 'VACIO'
        WHEN jsonb_typeof(p.detalles) = 'array' THEN 'ARRAY'
        ELSE 'OTRO'
    END as tipo_detalles,
    CASE 
        WHEN p.detalles IS NOT NULL THEN jsonb_array_length(p.detalles)
        ELSE 0
    END as elementos_detalles
FROM plantillas p
WHERE p.id IN (
    SELECT DISTINCT plantilla 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 7. Crear mapas faltantes para las salas de las funciones 10 y 11
-- (Descomenta estas líneas si necesitas crear mapas)

/*
-- Crear mapa para sala_id = 7 (función 10)
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
                }
            ],
            "posicion": {"x": 100, "y": 100}
        }
    ]'::jsonb,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = 7);
*/

-- 8. Crear zonas faltantes para las salas
-- (Descomenta estas líneas si necesitas crear zonas)

/*
-- Crear zona para sala_id = 7
INSERT INTO zonas (id, nombre, sala_id, created_at, updated_at)
SELECT 1, 'General', 7, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE sala_id = 7);
*/

-- 9. Verificar el estado final
SELECT 'Estado final de las funciones:' as info;

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