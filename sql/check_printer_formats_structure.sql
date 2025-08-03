-- Script para verificar la estructura de printer_formats
-- =====================================================

-- Verificar columnas existentes en printer_formats
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'printer_formats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar algunos registros existentes
SELECT * FROM printer_formats LIMIT 3;

-- Verificar si la tabla existe y tiene datos
SELECT 
    COUNT(*) as total_registros,
    CASE 
        WHEN COUNT(*) > 0 THEN 'TABLA CON DATOS'
        ELSE 'TABLA VACÍA'
    END as estado_tabla
FROM printer_formats; 