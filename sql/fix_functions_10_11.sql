-- Script para diagnosticar y corregir funciones 10 y 11
-- Ejecutar este script para verificar el estado de las funciones

-- 1. Verificar si existen las funciones 10 y 11
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

-- 2. Verificar los eventos asociados
SELECT 
    e.id,
    e.nombre,
    e.slug,
    e.descripcion,
    e.fecha_inicio,
    e.fecha_fin,
    e.estado
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
    s.recinto_id,
    s.capacidad,
    s.estado
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
    z.sala_id,
    z.capacidad,
    z.estado
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

-- 7. Si las funciones no existen, crearlas con datos de prueba
-- (Descomenta estas líneas si necesitas crear las funciones)

/*
-- Crear función 10 si no existe
INSERT INTO funciones (id, fecha_celebracion, evento, sala, plantilla, created_at, updated_at)
SELECT 10, '2025-01-15 20:00:00', 1, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funciones WHERE id = 10);

-- Crear función 11 si no existe
INSERT INTO funciones (id, fecha_celebracion, evento, sala, plantilla, created_at, updated_at)
SELECT 11, '2025-01-16 20:00:00', 1, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funciones WHERE id = 11);
*/

-- 8. Verificar si hay mapas vacíos y crear uno de prueba si es necesario
-- (Descomenta estas líneas si necesitas crear un mapa de prueba)

/*
-- Crear mapa de prueba para sala_id = 1 si no existe
INSERT INTO mapas (sala_id, contenido, created_at, updated_at)
SELECT 1, 
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
                }
            ],
            "posicion": {"x": 100, "y": 100}
        }
    ]'::jsonb,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = 1);
*/ 