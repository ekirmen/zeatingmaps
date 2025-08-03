-- Script para limpiar funcion_id del mapa
-- Este script debe ejecutarse en la base de datos de Supabase

-- 1. Verificar el contenido actual del mapa
SELECT 
    id,
    sala_id,
    contenido
FROM mapas 
WHERE sala_id = 7;

-- 2. Actualizar el mapa eliminando funcion_id de las sillas
UPDATE mapas 
SET contenido = jsonb_path_set(
    contenido,
    'strict $[*].sillas[*].funcion_id',
    'null'
)
WHERE sala_id = 7;

-- 3. También limpiar funcion_id de sillas individuales (no en mesas)
UPDATE mapas 
SET contenido = jsonb_path_set(
    contenido,
    'strict $[*].funcion_id',
    'null'
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
    jsonb_path_query(contenido, 'strict $[*].sillas[*].funcion_id') as funcion_ids_in_sillas,
    jsonb_path_query(contenido, 'strict $[*].funcion_id') as funcion_ids_in_seats
FROM mapas 
WHERE sala_id = 7; 