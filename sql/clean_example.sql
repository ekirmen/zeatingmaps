-- EJEMPLO SEGURO para GitHub
-- Script de diagnóstico genérico (sin datos específicos)

-- 1. Verificar funciones (sin IDs específicos)
SELECT '=== FUNCIONES ===' as seccion;
SELECT 
    id,
    fecha_celebracion,
    evento,
    sala,
    plantilla
FROM funciones 
WHERE id IN (SELECT id FROM funciones LIMIT 2) -- Solo 2 ejemplos
ORDER BY id;

-- 2. Verificar eventos (sin datos específicos)
SELECT '=== EVENTOS ===' as seccion;
SELECT 
    e.id,
    e.nombre,
    e.slug
FROM eventos e
LIMIT 3; -- Solo 3 ejemplos

-- 3. Verificar estructura de mapas (sin datos)
SELECT '=== ESTRUCTURA MAPAS ===' as seccion;
SELECT 
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
LIMIT 2; -- Solo 2 ejemplos

-- 4. Script de corrección genérico (sin datos específicos)
-- INSERT INTO mapas (sala_id, contenido)
-- SELECT {SALA_ID}, '{ESTRUCTURA_JSON_GENERICA}'::jsonb
-- WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = {SALA_ID}); 