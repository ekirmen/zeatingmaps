-- Script para verificar la tabla zonas
-- Verificar si la tabla existe y su estructura

-- 1. Verificar si la tabla zonas existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'zonas';

-- 2. Verificar estructura de la tabla zonas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'zonas'
ORDER BY ordinal_position;

-- 3. Verificar datos en la tabla zonas
SELECT 
    COUNT(*) as total_zonas,
    COUNT(DISTINCT sala_id) as salas_con_zonas
FROM zonas;

-- 4. Verificar zonas por sala
SELECT 
    sala_id,
    COUNT(*) as zonas_count,
    STRING_AGG(nombre, ', ') as nombres_zonas
FROM zonas
GROUP BY sala_id
ORDER BY sala_id;

-- 5. Verificar relación con salas
SELECT 
    z.id as zona_id,
    z.nombre as zona_nombre,
    z.sala_id,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
ORDER BY z.sala_id, z.nombre;

-- 6. Verificar si hay zonas para la sala 7 (que parece ser la que se usa)
SELECT 
    z.*,
    s.nombre as sala_nombre
FROM zonas z
LEFT JOIN salas s ON z.sala_id = s.id
WHERE z.sala_id = 7; 