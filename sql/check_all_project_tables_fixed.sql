-- Script para verificar todas las tablas del proyecto (CORREGIDO)
-- =====================================================

-- 1. Verificar todas las tablas existentes en el esquema public
SELECT 
    table_name,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Lista de tablas esperadas del proyecto
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

-- 3. Verificar tablas críticas para el funcionamiento básico
WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'eventos',
        'funciones',
        'payment_transactions',
        'admin_notifications',
        'usuarios',
        'recintos',
        'salas'
    ]) as critical_table_name
)
SELECT 
    'TABLAS CRÍTICAS' as categoria,
    ct.critical_table_name as table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM critical_tables ct
LEFT JOIN information_schema.tables it 
    ON ct.critical_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, ct.critical_table_name;

-- 4. Verificar tablas de productos (nuevas funcionalidades)
WITH product_tables AS (
    SELECT unnest(ARRAY[
        'productos',
        'plantillas_productos',
        'productos_eventos',
        'plantillas_productos_eventos'
    ]) as product_table_name
)
SELECT 
    'TABLAS DE PRODUCTOS' as categoria,
    pt.product_table_name as table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM product_tables pt
LEFT JOIN information_schema.tables it 
    ON pt.product_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, pt.product_table_name;

-- 5. Verificar tablas de configuración
WITH config_tables AS (
    SELECT unnest(ARRAY[
        'settings',
        'payment_gateways',
        'printer_formats',
        'webstudio_colors',
        'webstudio_footer',
        'webstudio_header'
    ]) as config_table_name
)
SELECT 
    'TABLAS DE CONFIGURACIÓN' as categoria,
    ct.config_table_name as table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM config_tables ct
LEFT JOIN information_schema.tables it 
    ON ct.config_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, ct.config_table_name;

-- 6. Verificar tablas de gestión de usuarios
WITH user_tables AS (
    SELECT unnest(ARRAY[
        'usuarios',
        'profiles',
        'admin_users',
        'tags',
        'user_tags',
        'user_tag_relations'
    ]) as user_table_name
)
SELECT 
    'TABLAS DE USUARIOS' as categoria,
    ut.user_table_name as table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM user_tables ut
LEFT JOIN information_schema.tables it 
    ON ut.user_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, ut.user_table_name;

-- 7. Resumen final
WITH all_expected_tables AS (
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
FROM all_expected_tables aet
LEFT JOIN information_schema.tables it 
    ON aet.expected_table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'; 