-- Script para verificar qué tablas faltan comparando con las que ya tienes
-- =====================================================

-- Lista de tablas que ya tienes (basado en tu lista)
WITH your_tables AS (
    SELECT unnest(ARRAY[
        'abonos',
        'admin_notifications',
        'affiliate_users',
        'affiliateusers',
        'asientos',
        'asientos_bloqueados',
        'campaign_recipients',
        'campaign_stats_view',
        'campaign_widgets',
        'canales_venta',
        'cms_pages',
        'contenido',
        'crm_client_tags',
        'crm_clients',
        'crm_dashboard_view',
        'crm_interactions',
        'crm_notes',
        'crm_opportunities',
        'crm_settings',
        'crm_tags',
        'crm_tasks',
        'descuentos',
        'email_campaigns',
        'email_pages',
        'email_stats',
        'email_templates',
        'empresas',
        'entradas',
        'eventos',
        'facebook_pixels',
        'funciones',
        'imagenes',
        'imagenes_eventos',
        'ivas',
        'mapas',
        'mesas',
        'metodos_pago',
        'notifications',
        'payment_gateway_configs',
        'payment_gateways',
        'payment_transactions',
        'payments',
        'plantillas',
        'plantillas_productos',
        'plantillas_productos_eventos',
        'print_logs',
        'printer_formats',
        'productos',
        'productos_eventos',
        'profiles',
        'profiles_view',
        'profiles_with_auth',
        'recintos',
        'referralsettings',
        'refunds',
        'salas',
        'seat_locks',
        'seats',
        'settings',
        'sillas',
        'tags',
        'tickets',
        'user_roles',
        'user_tag_relations',
        'user_tags',
        'users',
        'webstudio_dashboard_view',
        'webstudio_email_templates',
        'webstudio_footer_components',
        'webstudio_header_components',
        'webstudio_page_stats',
        'webstudio_page_versions',
        'webstudio_pages',
        'webstudio_site_config',
        'webstudio_templates',
        'webstudio_widgets',
        'wrappers_fdw_stats',
        'zonas'
    ]) as your_table_name
),
-- Lista de tablas esperadas del proyecto
expected_tables AS (
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
-- Mostrar tablas que faltan
SELECT 
    'TABLAS QUE FALTAN' as categoria,
    et.expected_table_name as table_name,
    'FALTA' as estado
FROM expected_tables et
LEFT JOIN your_tables yt ON et.expected_table_name = yt.your_table_name
WHERE yt.your_table_name IS NULL
ORDER BY et.expected_table_name;

-- Mostrar tablas que ya tienes (de las esperadas)
SELECT 
    'TABLAS QUE YA TIENES' as categoria,
    et.expected_table_name as table_name,
    'EXISTE' as estado
FROM expected_tables et
INNER JOIN your_tables yt ON et.expected_table_name = yt.your_table_name
ORDER BY et.expected_table_name;

-- Resumen final
WITH comparison AS (
    SELECT 
        et.expected_table_name,
        CASE WHEN yt.your_table_name IS NOT NULL THEN 1 ELSE 0 END as exists
    FROM expected_tables et
    LEFT JOIN your_tables yt ON et.expected_table_name = yt.your_table_name
)
SELECT 
    'RESUMEN FINAL' as categoria,
    COUNT(CASE WHEN exists = 1 THEN 1 END) as tablas_existentes,
    COUNT(CASE WHEN exists = 0 THEN 1 END) as tablas_faltantes,
    COUNT(*) as total_esperadas,
    ROUND(
        (COUNT(CASE WHEN exists = 1 THEN 1 END)::decimal / COUNT(*)) * 100, 2
    ) as porcentaje_completitud
FROM comparison; 