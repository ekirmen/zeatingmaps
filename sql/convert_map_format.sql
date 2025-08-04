-- Script para convertir el formato del mapa actual al formato esperado
-- El mapa actual tiene mesas con asientos, necesitamos convertirlo a zonas con asientos

-- 1. Primero, vamos a ver el formato actual del mapa
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as elementos_en_mapa,
    m.contenido
FROM mapas m
WHERE m.sala_id = 7;

-- 2. Crear una función para convertir el formato
CREATE OR REPLACE FUNCTION convert_map_to_zones_format(map_content jsonb)
RETURNS jsonb AS $$
DECLARE
    converted_content jsonb := '[]'::jsonb;
    element jsonb;
    zona_counter integer := 1;
    asiento_counter integer := 1;
BEGIN
    -- Iterar sobre cada elemento del mapa
    FOR element IN SELECT * FROM jsonb_array_elements(map_content)
    LOOP
        -- Si es una mesa, convertirla a zona
        IF element->>'type' = 'mesa' THEN
            -- Crear zona para esta mesa
            converted_content := converted_content || jsonb_build_object(
                '_id', 'zona-' || zona_counter,
                'type', 'zona',
                'nombre', 'Zona ' || zona_counter,
                'posicion', jsonb_build_object('x', 100 + (zona_counter - 1) * 400, 'y', 100 + (zona_counter - 1) * 300),
                'width', 400,
                'height', 300,
                'zona', zona_counter,
                'sillas', COALESCE(element->'sillas', '[]'::jsonb)
            );
            zona_counter := zona_counter + 1;
        END IF;
    END LOOP;
    
    RETURN converted_content;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar el mapa con el formato convertido
UPDATE mapas 
SET contenido = convert_map_to_zones_format(contenido)
WHERE sala_id = 7;

-- 4. Verificar el resultado
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as zonas_en_mapa,
    m.contenido
FROM mapas m
WHERE m.sala_id = 7;

-- 5. Crear zonas correspondientes en la tabla zonas si no existen
INSERT INTO zonas (nombre, sala_id, color, precio_base) VALUES
('Zona 1', 7, '#fbbf24', 150.00),
('Zona 2', 7, '#60a5fa', 100.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Verificar las zonas creadas
SELECT 
    z.*,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7
ORDER BY z.nombre; 