-- Script para verificar las tablas que faltan
-- =====================================================

-- Verificar todas las tablas esperadas del proyecto
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'admin_notifications',
        'admin_users',
        'boleteria',
        'cms_pages',
        'email_campaigns',
        'email_pages',
        'entradas',
        'eventos',
        'funciones',
        'galeria',
        'payment_gateways',
        'payment_transactions',
        'plantillas_precios',
        'productos',
        'productos_eventos',
        'plantillas_productos',
        'plantillas_productos_eventos',
        'printer_formats',
        'profiles',
        'recintos',
        'refunds',
        'salas',
        'seat_locks',
        'seats',
        'settings',
        'tags',
        'user_tags',
        'user_tag_relations',
        'usuarios',
        'webstudio_colors',
        'webstudio_footer',
        'webstudio_header'
    ]) as expected_table_name
)
SELECT 
    et.expected_table_name as table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM expected_tables et
LEFT JOIN information_schema.tables it 
    ON et.expected_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, et.expected_table_name;

-- Mostrar solo las tablas que faltan
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'admin_notifications',
        'admin_users',
        'boleteria',
        'cms_pages',
        'email_campaigns',
        'email_pages',
        'entradas',
        'eventos',
        'funciones',
        'galeria',
        'payment_gateways',
        'payment_transactions',
        'plantillas_precios',
        'productos',
        'productos_eventos',
        'plantillas_productos',
        'plantillas_productos_eventos',
        'printer_formats',
        'profiles',
        'recintos',
        'refunds',
        'salas',
        'seat_locks',
        'seats',
        'settings',
        'tags',
        'user_tags',
        'user_tag_relations',
        'usuarios',
        'webstudio_colors',
        'webstudio_footer',
        'webstudio_header'
    ]) as expected_table_name
)
SELECT 
    'TABLAS QUE FALTAN' as categoria,
    et.expected_table_name as table_name,
    'FALTA' as estado
FROM expected_tables et
LEFT JOIN information_schema.tables it 
    ON et.expected_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
WHERE it.table_name IS NULL
ORDER BY et.expected_table_name;

-- Resumen final
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'admin_notifications',
        'admin_users',
        'boleteria',
        'cms_pages',
        'email_campaigns',
        'email_pages',
        'entradas',
        'eventos',
        'funciones',
        'galeria',
        'payment_gateways',
        'payment_transactions',
        'plantillas_precios',
        'productos',
        'productos_eventos',
        'plantillas_productos',
        'plantillas_productos_eventos',
        'printer_formats',
        'profiles',
        'recintos',
        'refunds',
        'salas',
        'seat_locks',
        'seats',
        'settings',
        'tags',
        'user_tags',
        'user_tag_relations',
        'usuarios',
        'webstudio_colors',
        'webstudio_footer',
        'webstudio_header'
    ]) as expected_table_name
)
SELECT 
    'RESUMEN FINAL' as categoria,
    COUNT(CASE WHEN it.table_name IS NOT NULL THEN 1 END) as tablas_existentes,
    COUNT(CASE WHEN it.table_name IS NULL THEN 1 END) as tablas_faltantes,
    COUNT(*) as total_esperadas,
    ROUND(
        (COUNT(CASE WHEN it.table_name IS NOT NULL THEN 1 END)::decimal / COUNT(*)) * 100, 2
    ) as porcentaje_completitud
FROM expected_tables et
LEFT JOIN information_schema.tables it 
    ON et.expected_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'; 