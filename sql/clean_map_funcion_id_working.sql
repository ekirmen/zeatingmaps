-- Script para limpiar funcion_id del mapa
-- Compatible con versiones más antiguas de PostgreSQL

-- 1. Verificar el contenido actual del mapa
SELECT 
    id,
    sala_id,
    contenido
FROM mapas 
WHERE sala_id = 7;

-- 2. Crear una función temporal para limpiar funcion_id
CREATE OR REPLACE FUNCTION clean_funcion_id_from_map(jsonb_data jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    element jsonb;
    cleaned_element jsonb;
    cleaned_sillas jsonb;
    silla jsonb;
BEGIN
    -- Iterar sobre cada elemento del array
    FOR element IN SELECT * FROM jsonb_array_elements(jsonb_data)
    LOOP
        cleaned_element := element;
        
        -- Si es una mesa, limpiar funcion_id de las sillas
        IF element->>'type' = 'mesa' AND element ? 'sillas' THEN
            cleaned_sillas := '[]'::jsonb;
            
            -- Iterar sobre cada silla
            FOR silla IN SELECT * FROM jsonb_array_elements(element->'sillas')
            LOOP
                -- Eliminar funcion_id si existe
                cleaned_sillas := cleaned_sillas || (silla - 'funcion_id');
            END LOOP;
            
            cleaned_element := jsonb_set(cleaned_element, '{sillas}', cleaned_sillas);
        END IF;
        
        -- Eliminar funcion_id del elemento principal si existe
        cleaned_element := cleaned_element - 'funcion_id';
        
        result := result || cleaned_element;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar el mapa usando la función
UPDATE mapas 
SET contenido = clean_funcion_id_from_map(contenido)
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

-- 6. Limpiar la función después de usarla
DROP FUNCTION IF EXISTS clean_funcion_id_from_map(jsonb); 