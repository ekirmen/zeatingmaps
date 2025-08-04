-- Script alternativo para limpiar funcion_id del mapa
-- Compatible con versiones más antiguas de PostgreSQL

-- 1. Verificar el contenido actual del mapa
SELECT 
    id,
    sala_id,
    contenido
FROM mapas 
WHERE sala_id = 7;

-- 2. Función para limpiar funcion_id del JSON
CREATE OR REPLACE FUNCTION clean_funcion_id_from_json(jsonb_data jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    element jsonb;
    cleaned_element jsonb;
    cleaned_sillas jsonb;
    silla jsonb;
    cleaned_silla jsonb;
BEGIN
    result := '[]'::jsonb;
    
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
                cleaned_silla := silla;
                -- Eliminar funcion_id si existe
                IF cleaned_silla ? 'funcion_id' THEN
                    cleaned_silla := cleaned_silla - 'funcion_id';
                END IF;
                cleaned_sillas := cleaned_sillas || cleaned_silla;
            END LOOP;
            
            cleaned_element := jsonb_set(cleaned_element, '{sillas}', cleaned_sillas);
        END IF;
        
        -- Eliminar funcion_id del elemento principal si existe
        IF cleaned_element ? 'funcion_id' THEN
            cleaned_element := cleaned_element - 'funcion_id';
        END IF;
        
        result := result || cleaned_element;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar el mapa usando la función
UPDATE mapas 
SET contenido = clean_funcion_id_from_json(contenido)
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
    'funcion_ids_in_sillas' as check_type,
    jsonb_path_query(contenido, 'strict $[*].sillas[*].funcion_id') as funcion_ids
FROM mapas 
WHERE sala_id = 7
UNION ALL
SELECT 
    'funcion_ids_in_seats' as check_type,
    jsonb_path_query(contenido, 'strict $[*].funcion_id') as funcion_ids
FROM mapas 
WHERE sala_id = 7;

-- 6. Limpiar la función después de usarla
DROP FUNCTION IF EXISTS clean_funcion_id_from_json(jsonb); 