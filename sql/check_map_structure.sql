-- Verificar la estructura actual del mapa para sala 7
SELECT 
    m.id,
    m.sala_id,
    jsonb_array_length(m.contenido) as num_elementos,
    jsonb_pretty(m.contenido) as contenido_formateado
FROM mapas m
WHERE m.sala_id = 7;

-- Verificar si hay elementos con type: "zona" en el mapa
SELECT 
    jsonb_array_elements(m.contenido) as elemento
FROM mapas m
WHERE m.sala_id = 7
AND jsonb_array_elements(m.contenido)->>'type' = 'zona';

-- Verificar todos los tipos de elementos en el mapa
SELECT 
    jsonb_array_elements(m.contenido)->>'type' as tipo_elemento,
    COUNT(*) as cantidad
FROM mapas m
WHERE m.sala_id = 7
GROUP BY jsonb_array_elements(m.contenido)->>'type'; 