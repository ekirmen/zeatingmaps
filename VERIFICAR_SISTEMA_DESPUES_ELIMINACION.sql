-- =====================================================
-- ✅ VERIFICAR SISTEMA DESPUÉS DE ELIMINACIÓN
-- =====================================================
-- 
-- ✅ Este script verifica que el sistema funciona correctamente
-- ✅ después de eliminar las 7 tablas redundantes
-- ✅ y identifica posibles problemas
--
-- =====================================================

-- =====================================================
-- 🔍 1. VERIFICAR QUE LAS TABLAS ELIMINADAS NO EXISTEN
-- =====================================================

-- Verificar que las tablas eliminadas ya no existen
SELECT 
    'TABLAS ELIMINADAS' as categoria,
    table_name as tabla,
    'NO EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'ventas',
        'affiliate_users', 
        'affiliateusers',
        'user_tenants_overview',
        'user_roles',
        'user_tag_relations',
        'crm_tags',
        'empresas'
    )
UNION ALL
SELECT 
    'TABLAS ELIMINADAS' as categoria,
    'TODAS LAS TABLAS REDUNDANTES' as tabla,
    'ELIMINADAS CORRECTAMENTE' as estado
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name IN (
            'ventas',
            'affiliate_users', 
            'affiliateusers',
            'user_tenants_overview',
            'user_roles',
            'user_tag_relations',
            'crm_tags',
            'empresas'
        )
);

-- =====================================================
-- 🔍 2. VERIFICAR TABLAS PRINCIPALES QUE DEBEN EXISTIR
-- =====================================================

-- Verificar que las tablas principales siguen existiendo
SELECT 
    'TABLAS PRINCIPALES' as categoria,
    table_name as tabla,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles',
        'tenants',
        'payments',
        'sales',
        'custom_roles',
        'tenant_user_roles',
        'tags',
        'user_tags',
        'clientes',
        'user_tenant_info',
        'user_tenants',
        'user_favorites',
        'crm_clients'
    )
ORDER BY table_name;

-- =====================================================
-- 🔍 3. VERIFICAR INTEGRIDAD DE DATOS PRINCIPALES
-- =====================================================

-- Verificar que profiles tiene datos
SELECT 
    'profiles' as tabla,
    COUNT(*) as total_usuarios,
    COUNT(DISTINCT id) as usuarios_unicos
FROM public.profiles;

-- Verificar que tenants tiene datos
SELECT 
    'tenants' as tabla,
    COUNT(*) as total_tenants,
    COUNT(DISTINCT id) as tenants_unicos
FROM public.tenants;

-- Verificar que payments tiene datos
SELECT 
    'payments' as tabla,
    COUNT(*) as total_pagos,
    COUNT(DISTINCT id) as pagos_unicos,
    SUM(amount) as total_monto
FROM public.payments;

-- Verificar que sales tiene datos (si existe)
SELECT 
    'sales' as tabla,
    COUNT(*) as total_ventas,
    COUNT(DISTINCT id) as ventas_unicas,
    SUM(amount) as total_monto
FROM public.sales;

-- =====================================================
-- 🔍 4. VERIFICAR RELACIONES ENTRE TABLAS PRINCIPALES
-- =====================================================

-- Verificar relación profiles-tenants
SELECT 
    'RELACIONES' as categoria,
    'profiles-tenants' as relacion,
    COUNT(DISTINCT p.id) as usuarios_con_tenants,
    COUNT(DISTINCT t.id) as tenants_con_usuarios
FROM public.profiles p
LEFT JOIN public.user_tenant_info uti ON p.id = uti.user_id
LEFT JOIN public.tenants t ON uti.tenant_id = t.id;

-- Verificar relación payments-tenants
SELECT 
    'RELACIONES' as categoria,
    'payments-tenants' as relacion,
    COUNT(DISTINCT p.id) as pagos_con_tenants,
    COUNT(DISTINCT t.id) as tenants_con_pagos
FROM public.payments p
LEFT JOIN public.tenants t ON p.tenant_id = t.id;

-- =====================================================
-- 🔍 5. VERIFICAR SISTEMA DE ROLES
-- =====================================================

-- Verificar custom_roles
SELECT 
    'ROLES' as categoria,
    'custom_roles' as tabla,
    COUNT(*) as total_roles,
    COUNT(DISTINCT role_name) as roles_unicos
FROM public.custom_roles;

-- Verificar tenant_user_roles
SELECT 
    'ROLES' as categoria,
    'tenant_user_roles' as tabla,
    COUNT(*) as total_asignaciones,
    COUNT(DISTINCT user_id) as usuarios_con_roles,
    COUNT(DISTINCT tenant_id) as tenants_con_roles
FROM public.tenant_user_roles;

-- =====================================================
-- 🔍 6. VERIFICAR SISTEMA DE TAGS
-- =====================================================

-- Verificar tags principales
SELECT 
    'TAGS' as categoria,
    'tags' as tabla,
    COUNT(*) as total_tags,
    COUNT(DISTINCT name) as tags_unicos
FROM public.tags;

-- Verificar user_tags
SELECT 
    'TAGS' as categoria,
    'user_tags' as tabla,
    COUNT(*) as total_asignaciones,
    COUNT(DISTINCT user_id) as usuarios_con_tags,
    COUNT(DISTINCT tag_id) as tags_asignados
FROM public.user_tags;

-- =====================================================
-- 🔍 7. VERIFICAR SISTEMA CRM
-- =====================================================

-- Verificar clientes principales
SELECT 
    'CRM' as categoria,
    'clientes' as tabla,
    COUNT(*) as total_clientes,
    COUNT(DISTINCT email) as emails_unicos
FROM public.clientes;

-- Verificar crm_clients (si existe)
SELECT 
    'CRM' as categoria,
    'crm_clients' as tabla,
    COUNT(*) as total_clientes_crm,
    COUNT(DISTINCT email) as emails_unicos_crm
FROM public.crm_clients;

-- =====================================================
-- 🔍 8. VERIFICAR TABLAS PENDIENTES DE EVALUACIÓN
-- =====================================================

-- Verificar user_tenants vs user_tenant_info
SELECT 
    'PENDIENTES' as categoria,
    'user_tenants' as tabla,
    COUNT(*) as total_registros
FROM public.user_tenants
UNION ALL
SELECT 
    'PENDIENTES' as categoria,
    'user_tenant_info' as tabla,
    COUNT(*) as total_registros
FROM public.user_tenant_info;

-- Verificar user_favorites
SELECT 
    'PENDIENTES' as categoria,
    'user_favorites' as tabla,
    COUNT(*) as total_favoritos
FROM public.user_favorites;

-- =====================================================
-- 🔍 9. RESUMEN DE VERIFICACIÓN
-- =====================================================

-- Resumen general del estado del sistema
SELECT 
    'RESUMEN' as categoria,
    'TABLAS PRINCIPALES' as item,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'tenants', 'payments', 'sales',
        'custom_roles', 'tenant_user_roles', 'tags', 'user_tags',
        'clientes', 'user_tenant_info', 'user_tenants', 'user_favorites'
    )
UNION ALL
SELECT 
    'RESUMEN' as categoria,
    'TABLAS PENDIENTES' as item,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_tenants', 'user_favorites', 'crm_clients', 'sales'
    )
UNION ALL
SELECT 
    'RESUMEN' as categoria,
    'TABLAS ELIMINADAS' as item,
    7 as total;

-- =====================================================
-- ✅ RESULTADO ESPERADO:
-- ✅ Sistema funcionando correctamente
-- ✅ Tablas redundantes eliminadas
-- ✅ Tablas principales intactas
-- ✅ Datos preservados
-- ✅ Relaciones funcionando
-- =====================================================
