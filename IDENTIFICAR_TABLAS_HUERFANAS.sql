-- =====================================================
-- 🔍 IDENTIFICAR TABLAS HUÉRFANAS
-- =====================================================
-- Script para identificar las 5 tablas que no están en la lista crítica
-- =====================================================

-- Mostrar las tablas huérfanas (las que no están en nuestra lista crítica)
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamaño
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN (
        'profiles', 'tenants', 'eventos', 'funciones', 'recintos', 'salas',
        'mapas', 'zonas', 'payments', 'payment_transactions', 'payment_gateways',
        'entradas', 'seat_locks', 'tenant_user_roles', 'user_recinto_assignments',
        'user_tags', 'user_tenant_assignments', 'user_tenant_info', 'user_activity_log',
        'email_templates', 'email_campaigns', 'settings', 'ivas', 'tags',
        'canales_venta', 'plantillas', 'plantillas_productos_template',
        'system_alerts', 'webstudio_widgets'
    )
ORDER BY tablename;

-- =====================================================
-- 📊 ANÁLISIS DE LAS TABLAS HUÉRFANAS
-- =====================================================

-- Verificar si estas tablas tienen datos
SELECT 
    'ANÁLISIS TABLAS HUÉRFANAS' as categoria,
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamaño,
    CASE 
        WHEN pg_total_relation_size('public.'||tablename) < 1000 THEN 'MUY PEQUEÑA'
        WHEN pg_total_relation_size('public.'||tablename) < 10000 THEN 'PEQUEÑA'
        WHEN pg_total_relation_size('public.'||tablename) < 100000 THEN 'MEDIANA'
        ELSE 'GRANDE'
    END as tamaño_categoria
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN (
        'profiles', 'tenants', 'eventos', 'funciones', 'recintos', 'salas',
        'mapas', 'zonas', 'payments', 'payment_transactions', 'payment_gateways',
        'entradas', 'seat_locks', 'tenant_user_roles', 'user_recinto_assignments',
        'user_tags', 'user_tenant_assignments', 'user_tenant_info', 'user_activity_log',
        'email_templates', 'email_campaigns', 'settings', 'ivas', 'tags',
        'canales_venta', 'plantillas', 'plantillas_productos_template',
        'system_alerts', 'webstudio_widgets'
    )
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- =====================================================
-- 📋 RECOMENDACIONES
-- =====================================================

/*
Si las tablas huérfanas son:
- MUY PEQUEÑAS o PEQUEÑAS: Probablemente se pueden eliminar
- MEDIANAS o GRANDES: Necesitan análisis más detallado

PRÓXIMO PASO: Identificar qué tablas son estas 5 huérfanas
*/
