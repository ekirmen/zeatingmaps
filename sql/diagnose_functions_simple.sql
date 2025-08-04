-- Diagnóstico simple de las funciones 10 y 11
-- Ejecuta este script para ver qué datos faltan

-- 1. Verificar si existen las funciones
SELECT '=== FUNCIONES ===' as seccion;
SELECT 
    id,
    fecha_celebracion,
    evento,
    sala,
    plantilla
FROM funciones 
WHERE id IN (10, 11)
ORDER BY id;

-- 2. Verificar los eventos
SELECT '=== EVENTOS ===' as seccion;
SELECT 
    e.id,
    e.nombre,
    e.slug
FROM eventos e
WHERE e.id IN (
    SELECT DISTINCT evento 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 3. Verificar las salas
SELECT '=== SALAS ===' as seccion;
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

-- 4. Verificar los mapas
SELECT '=== MAPAS ===' as seccion;
SELECT 
    m.id,
    m.sala_id,
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

-- 5. Verificar las zonas
SELECT '=== ZONAS ===' as seccion;
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

-- 6. Verificar las plantillas
SELECT '=== PLANTILLAS ===' as seccion;
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    CASE 
        WHEN p.detalles IS NULL THEN 'NULL'
        WHEN p.detalles = '[]' THEN 'VACIO'
        WHEN jsonb_typeof(p.detalles) = 'array' THEN 'ARRAY'
        ELSE 'OTRO'
    END as tipo_detalles
FROM plantillas p
WHERE p.id IN (
    SELECT DISTINCT plantilla 
    FROM funciones 
    WHERE id IN (10, 11)
);

-- 7. Resumen del problema
SELECT '=== RESUMEN DEL PROBLEMA ===' as seccion;

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