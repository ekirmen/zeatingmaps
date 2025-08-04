-- Script para verificar la estructura de la tabla seats
-- Este script debe ejecutarse en la base de datos de Supabase

-- 1. Verificar la estructura actual de la tabla seats
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seats' 
ORDER BY ordinal_position;

-- 2. Verificar las restricciones existentes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'seats';

-- 3. Verificar si existe la restricción única compuesta
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'seats' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%funcion_id%';

-- 4. Verificar datos actuales
SELECT 
    COUNT(*) as total_seats,
    COUNT(DISTINCT funcion_id) as unique_functions,
    COUNT(DISTINCT _id) as unique_seat_ids
FROM seats;

-- 5. Verificar duplicados
SELECT 
    funcion_id, 
    _id, 
    COUNT(*) as count
FROM seats 
GROUP BY funcion_id, _id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 6. Verificar índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'seats'; 