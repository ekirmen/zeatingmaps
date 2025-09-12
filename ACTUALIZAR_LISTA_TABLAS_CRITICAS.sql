-- =====================================================
-- ✅ ACTUALIZAR LISTA DE TABLAS CRÍTICAS
-- =====================================================
-- Incluir las 4 tablas importantes que faltaban
-- =====================================================

-- Verificar que todas las tablas críticas (incluyendo las 4 nuevas) siguen existiendo
SELECT 
    'TABLAS CRÍTICAS ACTUALIZADAS' as categoria,
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamaño
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        -- Core del sistema (8 tablas)
        'profiles', 'tenants', 'eventos', 'funciones', 'recintos', 'salas',
        'mapas', 'zonas',
        
        -- Sistema de pagos (8 tablas) - ACTUALIZADO
        'payments', 'payment_transactions', 'payment_gateways',
        'payment_gateway_configs', 'payment_methods_global', 'comisiones_tasas',
        
        -- Sistema de entradas (4 tablas)
        'entradas', 'seat_locks', 'reservas', 'reservations',
        
        -- Gestión de usuarios (6 tablas)
        'tenant_user_roles', 'user_recinto_assignments', 'user_tags', 
        'user_tenant_assignments', 'user_tenant_info', 'user_activity_log',
        
        -- Sistema de email (3 tablas)
        'email_templates', 'email_campaigns', 'global_email_config',
        
        -- Configuración (3 tablas)
        'settings', 'ivas', 'tags',
        
        -- CMS y Frontend (1 tabla) - NUEVA
        'cms_pages',
        
        -- Otras importantes (4 tablas)
        'canales_venta', 'plantillas', 'plantillas_productos_template',
        'system_alerts', 'webstudio_widgets'
    )
ORDER BY tablename;

-- =====================================================
-- 📊 CONTEO ACTUALIZADO
-- =====================================================

-- Contar total de tablas críticas (ahora 29 tablas)
SELECT 
    COUNT(*) as total_tablas_criticas,
    'Tablas críticas actualizadas: ' || COUNT(*) as resumen
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'profiles', 'tenants', 'eventos', 'funciones', 'recintos', 'salas',
        'mapas', 'zonas', 'payments', 'payment_transactions', 'payment_gateways',
        'payment_gateway_configs', 'payment_methods_global', 'comisiones_tasas',
        'entradas', 'seat_locks', 'reservas', 'reservations', 'tenant_user_roles', 
        'user_recinto_assignments', 'user_tags', 'user_tenant_assignments', 
        'user_tenant_info', 'user_activity_log', 'email_templates', 'email_campaigns', 
        'global_email_config', 'settings', 'ivas', 'tags', 'cms_pages',
        'canales_venta', 'plantillas', 'plantillas_productos_template',
        'system_alerts', 'webstudio_widgets'
    );

-- =====================================================
-- 🔍 VERIFICAR TABLAS HUÉRFANAS ACTUALIZADAS
-- =====================================================

-- Ahora debería haber 0 tablas huérfanas
SELECT 
    'VERIFICACIÓN FINAL' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay tablas huérfanas - Lista actualizada correctamente'
        ELSE '⚠️ Aún hay ' || COUNT(*) || ' tablas huérfanas'
    END as resultado
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN (
        'profiles', 'tenants', 'eventos', 'funciones', 'recintos', 'salas',
        'mapas', 'zonas', 'payments', 'payment_transactions', 'payment_gateways',
        'payment_gateway_configs', 'payment_methods_global', 'comisiones_tasas',
        'entradas', 'seat_locks', 'reservas', 'reservations', 'tenant_user_roles', 
        'user_recinto_assignments', 'user_tags', 'user_tenant_assignments', 
        'user_tenant_info', 'user_activity_log', 'email_templates', 'email_campaigns', 
        'global_email_config', 'settings', 'ivas', 'tags', 'cms_pages',
        'canales_venta', 'plantillas', 'plantillas_productos_template',
        'system_alerts', 'webstudio_widgets'
    );

-- =====================================================
-- 📊 RESUMEN ACTUALIZADO
-- =====================================================

/*
🎯 LISTA ACTUALIZADA DE TABLAS CRÍTICAS (29 tablas):

✅ CORE DEL SISTEMA (8 tablas):
- profiles, tenants, eventos, funciones, recintos, salas, mapas, zonas

✅ SISTEMA DE PAGOS (8 tablas) - ACTUALIZADO:
- payments, payment_transactions, payment_gateways
- payment_gateway_configs, payment_methods_global, comisiones_tasas

✅ SISTEMA DE ENTRADAS (4 tablas):
- entradas, seat_locks, reservas, reservations

✅ GESTIÓN DE USUARIOS (6 tablas):
- tenant_user_roles, user_recinto_assignments, user_tags
- user_tenant_assignments, user_tenant_info, user_activity_log

✅ SISTEMA DE EMAIL (3 tablas):
- email_templates, email_campaigns, global_email_config

✅ CONFIGURACIÓN (3 tablas):
- settings, ivas, tags

✅ CMS Y FRONTEND (1 tabla) - NUEVA:
- cms_pages

✅ OTRAS IMPORTANTES (4 tablas):
- canales_venta, plantillas, plantillas_productos_template
- system_alerts, webstudio_widgets

TOTAL: 29 tablas críticas (vs 25 originales)
*/
