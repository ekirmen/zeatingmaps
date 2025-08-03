-- Script para verificar la estructura de la tabla eventos
-- =====================================================

-- Verificar columnas existentes en la tabla eventos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar algunos registros existentes (sin asumir columnas específicas)
SELECT * FROM eventos LIMIT 3;

-- Verificar si hay columnas de fecha
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND column_name LIKE '%fecha%'
ORDER BY ordinal_position;

-- Verificar si hay columnas de estado
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND column_name LIKE '%estado%'
ORDER BY ordinal_position;

-- Verificar si la tabla existe y tiene datos
SELECT 
    COUNT(*) as total_registros,
    CASE 
        WHEN COUNT(*) > 0 THEN 'TABLA CON DATOS'
        ELSE 'TABLA VACÍA'
    END as estado_tabla
FROM eventos; 