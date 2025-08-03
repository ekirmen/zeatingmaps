-- Script para verificar y corregir la tabla seats
-- Este script debe ejecutarse en la base de datos de Supabase

-- 1. Verificar la estructura actual de la tabla
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

-- 4. Si no existe la restricción única, crearla
-- (Descomenta las siguientes líneas si es necesario)

-- ALTER TABLE seats 
-- ADD CONSTRAINT seats_funcion_id_id_unique 
-- UNIQUE (funcion_id, _id);

-- 5. Verificar duplicados existentes
SELECT 
    funcion_id, 
    _id, 
    COUNT(*) as count
FROM seats 
GROUP BY funcion_id, _id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 6. Limpiar duplicados (mantener solo el registro con ID más bajo)
-- (Descomenta las siguientes líneas si es necesario)

-- DELETE FROM seats 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id,
--                ROW_NUMBER() OVER (PARTITION BY funcion_id, _id ORDER BY id) as rn
--         FROM seats
--     ) t 
--     WHERE t.rn > 1
-- );

-- 7. Verificar índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'seats';

-- 8. Crear índices si no existen
-- (Descomenta las siguientes líneas si es necesario)

-- CREATE INDEX IF NOT EXISTS idx_seats_funcion_id ON seats(funcion_id);
-- CREATE INDEX IF NOT EXISTS idx_seats_id ON seats(_id);
-- CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
-- CREATE INDEX IF NOT EXISTS idx_seats_bloqueado ON seats(bloqueado);

-- 9. Verificar el resultado final
SELECT 
    'Total seats' as metric,
    COUNT(*) as value
FROM seats
UNION ALL
SELECT 
    'Unique combinations' as metric,
    COUNT(DISTINCT (funcion_id, _id)) as value
FROM seats
UNION ALL
SELECT 
    'Duplicates' as metric,
    COUNT(*) - COUNT(DISTINCT (funcion_id, _id)) as value
FROM seats; 