-- Script simple para limpiar funcion_id del mapa
-- Compatible con todas las versiones de PostgreSQL

-- 1. Verificar el contenido actual del mapa
SELECT 
    id,
    sala_id,
    contenido
FROM mapas 
WHERE sala_id = 7;

-- 2. Actualizar el mapa eliminando funcion_id de manera manual
-- Primero, vamos a ver qué funcion_id hay en el mapa
SELECT 
    jsonb_array_elements(contenido)->'sillas' as sillas_array
FROM mapas 
WHERE sala_id = 7;

-- 3. Crear una versión limpia del mapa
-- Esto es más seguro que usar funciones complejas
UPDATE mapas 
SET contenido = (
    SELECT jsonb_agg(
        CASE 
            WHEN element->>'type' = 'mesa' THEN
                jsonb_set(
                    element,
                    '{sillas}',
                    (
                        SELECT jsonb_agg(
                            silla - 'funcion_id'
                        )
                        FROM jsonb_array_elements(element->'sillas') AS silla
                    )
                )
            ELSE
                element - 'funcion_id'
        END
    )
    FROM jsonb_array_elements(contenido) AS element
)
WHERE sala_id = 7;

-- 4. Verificar el resultado
SELECT 
    id,
    sala_id,
    contenido
FROM mapas 
WHERE sala_id = 7;

-- 5. Verificar que no hay funcion_id en el contenido
SELECT 
    'Verificando funcion_id en sillas' as check_type,
    COUNT(*) as count
FROM mapas m,
     jsonb_array_elements(m.contenido) AS element,
     jsonb_array_elements(element->'sillas') AS silla
WHERE m.sala_id = 7 AND silla ? 'funcion_id'
UNION ALL
SELECT 
    'Verificando funcion_id en elementos principales' as check_type,
    COUNT(*) as count
FROM mapas m,
     jsonb_array_elements(m.contenido) AS element
WHERE m.sala_id = 7 AND element ? 'funcion_id'; 