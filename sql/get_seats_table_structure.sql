-- Script para obtener la estructura completa de la tabla seats
-- Este script debe ejecutarse en la base de datos de Supabase

-- 1. Verificar todas las columnas de la tabla seats
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
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

-- 3. Verificar datos actuales
SELECT 
    COUNT(*) as total_seats,
    COUNT(DISTINCT funcion_id) as unique_functions,
    COUNT(DISTINCT _id) as unique_seat_ids,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT zona) as unique_zones
FROM seats;

-- 4. Verificar duplicados
SELECT 
    funcion_id, 
    _id, 
    COUNT(*) as count
FROM seats 
GROUP BY funcion_id, _id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. Verificar valores únicos en columnas importantes
SELECT 
    'status' as column_name,
    status as value,
    COUNT(*) as count
FROM seats 
GROUP BY status
UNION ALL
SELECT 
    'bloqueado' as column_name,
    bloqueado::text as value,
    COUNT(*) as count
FROM seats 
GROUP BY bloqueado
ORDER BY column_name, value; 