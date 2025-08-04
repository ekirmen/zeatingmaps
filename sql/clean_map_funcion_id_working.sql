-- Script para limpiar funcion_id del mapa y verificar estructura
-- Este script ayuda a resolver problemas de datos inconsistentes

-- 1. Verificar estructura de la tabla seat_locks
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks' 
ORDER BY ordinal_position;

-- 2. Verificar datos existentes en seat_locks
SELECT 
    COUNT(*) as total_locks,
    COUNT(DISTINCT seat_id) as unique_seats,
    COUNT(DISTINCT funcion_id) as unique_functions,
    COUNT(DISTINCT session_id) as unique_sessions
FROM seat_locks;

-- 3. Verificar tipos de datos en funcion_id
SELECT 
    funcion_id,
    pg_typeof(funcion_id) as data_type,
    COUNT(*) as count
FROM seat_locks 
GROUP BY funcion_id, pg_typeof(funcion_id)
LIMIT 10;

-- 4. Limpiar bloqueos expirados
DELETE FROM seat_locks 
WHERE expires_at < NOW();

-- 5. Verificar restricciones únicas
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'seat_locks';

-- 6. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'seat_locks';

-- 7. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'seat_locks';

-- 8. Mostrar estadísticas finales
SELECT 
    'seat_locks' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT seat_id) as unique_seats,
    COUNT(DISTINCT funcion_id) as unique_functions
FROM seat_locks
UNION ALL
SELECT 
    'seats' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT _id) as unique_seats,
    COUNT(DISTINCT funcion_id) as unique_functions
FROM seats; 