-- Script simple para verificar la estructura de las tablas
-- Este script nos ayudará a confirmar los nombres correctos de las columnas

-- 1. Verificar estructura de la tabla eventos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla funciones
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'funciones'
ORDER BY ordinal_position;

-- 3. Verificar algunos datos de ejemplo
SELECT 
    'eventos' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN activo = true THEN 1 END) as active_records
FROM eventos;

SELECT 
    'funciones' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN evento IS NOT NULL THEN 1 END) as functions_with_event
FROM funciones;

-- 4. Verificar relación entre tablas
SELECT 
    e.nombre as event_name,
    COUNT(f.id) as function_count
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento
WHERE e.activo = true
GROUP BY e.id, e.nombre
ORDER BY function_count DESC
LIMIT 5; 