-- Script para verificar la funcionalidad de búsqueda de eventos
-- Este script ayuda a asegurar que los datos necesarios estén disponibles

-- 1. Verificar eventos disponibles para búsqueda
SELECT 
    'eventos' as table_name,
    COUNT(*) as total_events,
    COUNT(CASE WHEN activo = true THEN 1 END) as active_events,
    COUNT(CASE WHEN activo = false THEN 1 END) as inactive_events,
    COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as events_with_name,
    COUNT(CASE WHEN fecha_inicio IS NOT NULL THEN 1 END) as events_with_start_date,
    COUNT(CASE WHEN fecha_fin IS NOT NULL THEN 1 END) as events_with_end_date
FROM eventos;

-- 2. Verificar funciones disponibles para búsqueda
SELECT 
    'funciones' as table_name,
    COUNT(*) as total_functions,
    COUNT(CASE WHEN evento_id IS NOT NULL THEN 1 END) as functions_with_event,
    COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as functions_with_name,
    COUNT(CASE WHEN fecha IS NOT NULL THEN 1 END) as functions_with_date,
    COUNT(CASE WHEN hora_inicio IS NOT NULL THEN 1 END) as functions_with_time
FROM funciones;

-- 3. Verificar relación entre eventos y funciones
SELECT 
    e.nombre as event_name,
    e.id as event_id,
    COUNT(f.id) as function_count,
    MIN(f.fecha) as earliest_function,
    MAX(f.fecha) as latest_function
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento_id
WHERE e.activo = true
GROUP BY e.id, e.nombre
ORDER BY function_count DESC
LIMIT 10;

-- 4. Verificar eventos con funciones para búsqueda
SELECT 
    e.nombre as event_name,
    e.fecha_inicio,
    e.fecha_fin,
    f.nombre as function_name,
    f.fecha as function_date,
    f.hora_inicio
FROM eventos e
INNER JOIN funciones f ON e.id = f.evento_id
WHERE e.activo = true
ORDER BY e.fecha_inicio DESC, f.fecha DESC
LIMIT 20;

-- 5. Verificar datos de ejemplo para testing
SELECT 
    'Sample data for testing' as info,
    e.nombre as event_name,
    e.id as event_id,
    f.nombre as function_name,
    f.id as function_id,
    f.fecha as function_date,
    f.hora_inicio
FROM eventos e
INNER JOIN funciones f ON e.id = f.evento_id
WHERE e.activo = true
ORDER BY e.fecha_inicio DESC
LIMIT 5;

-- 6. Verificar índices para búsqueda eficiente
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('eventos', 'funciones')
AND indexname LIKE '%nombre%' OR indexname LIKE '%fecha%';

-- 7. Verificar permisos de lectura
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('eventos', 'funciones')
AND grantee = 'anon'
AND privilege_type = 'SELECT'; 