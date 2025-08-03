-- Script para verificar todas las tablas del proyecto
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
    ]) as table_name
)
SELECT 
    et.table_name,
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM expected_tables et
LEFT JOIN information_schema.tables it 
    ON et.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, et.table_name;

-- 3. Verificar tablas críticas para el funcionamiento básico
SELECT 
    'TABLAS CRÍTICAS' as categoria,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM (
    SELECT unnest(ARRAY[
        'eventos',
        'funciones',
        'payment_transactions',
        'admin_notifications',
        'usuarios',
        'recintos',
        'salas'
    ]) as table_name
) critical_tables
LEFT JOIN information_schema.tables it 
    ON critical_tables.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, table_name;

-- 4. Verificar tablas de productos (nuevas funcionalidades)
SELECT 
    'TABLAS DE PRODUCTOS' as categoria,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM (
    SELECT unnest(ARRAY[
        'productos',
        'plantillas_productos',
        'productos_eventos',
        'plantillas_productos_eventos'
    ]) as table_name
) product_tables
LEFT JOIN information_schema.tables it 
    ON product_tables.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, table_name;

-- 5. Verificar tablas de configuración
SELECT 
    'TABLAS DE CONFIGURACIÓN' as categoria,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM (
    SELECT unnest(ARRAY[
        'settings',
        'payment_gateways',
        'printer_formats',
        'webstudio_colors',
        'webstudio_footer',
        'webstudio_header'
    ]) as table_name
) config_tables
LEFT JOIN information_schema.tables it 
    ON config_tables.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, table_name;

-- 6. Verificar tablas de gestión de usuarios
SELECT 
    'TABLAS DE USUARIOS' as categoria,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'FALTA'
    END as estado
FROM (
    SELECT unnest(ARRAY[
        'usuarios',
        'profiles',
        'admin_users',
        'tags',
        'user_tags',
        'user_tag_relations'
    ]) as table_name
) user_tables
LEFT JOIN information_schema.tables it 
    ON user_tables.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
ORDER BY estado DESC, table_name;

-- 7. Resumen final
SELECT 
    'RESUMEN FINAL' as categoria,
    COUNT(CASE WHEN estado = 'EXISTE' THEN 1 END) as tablas_existentes,
    COUNT(CASE WHEN estado = 'FALTA' THEN 1 END) as tablas_faltantes,
    COUNT(*) as total_esperadas
FROM (
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
    ]) as table_name
) all_tables
LEFT JOIN information_schema.tables it 
    ON all_tables.table_name = it.table_name 
    AND it.table_schema = 'public' 
    AND it.table_type = 'BASE TABLE'
CROSS JOIN (
    SELECT 
        CASE 
            WHEN it.table_name IS NOT NULL THEN 'EXISTE'
            ELSE 'FALTA'
        END as estado
    FROM (SELECT 'dummy' as table_name) dummy
    LEFT JOIN information_schema.tables it 
        ON dummy.table_name = it.table_name 
        AND it.table_schema = 'public' 
        AND it.table_type = 'BASE TABLE'
) status_check; 