-- =====================================================
-- 🔍 ANALIZAR REDUNDANCIAS RESTANTES - ANÁLISIS DETALLADO
-- =====================================================
-- 
-- ✅ Este script analiza las 3 redundancias restantes
-- ✅ identificadas después de eliminar las 7 tablas redundantes
-- ✅ para determinar si deben eliminarse o mantenerse
--
-- =====================================================

-- =====================================================
-- 📊 1. ANÁLISIS DETALLADO: sales vs payments
-- =====================================================

-- Verificar si ambas tablas existen
SELECT 
    'VERIFICACIÓN DE EXISTENCIA' as analisis,
    'sales' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'sales' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado
UNION ALL
SELECT 
    'VERIFICACIÓN DE EXISTENCIA' as analisis,
    'payments' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'payments' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado;

-- Si ambas existen, comparar estructura detallada
-- (Solo ejecutar si ambas tablas existen)
SELECT 
    'ESTRUCTURA DE SALES' as analisis,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ESTRUCTURA DE PAYMENTS' as analisis,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros y analizar datos (sin columnas que no existen)
SELECT 
    'DATOS DE SALES' as analisis,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id) as ids_unicos,
    MIN(created_at) as fecha_mas_antigua,
    MAX(created_at) as fecha_mas_reciente
FROM public.sales;

SELECT 
    'DATOS DE PAYMENTS' as analisis,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id) as ids_unicos,
    MIN(created_at) as fecha_mas_antigua,
    MAX(created_at) as fecha_mas_reciente
FROM public.payments;

-- =====================================================
-- 📊 2. ANÁLISIS DETALLADO: user_tenant_info
-- =====================================================

-- Verificar estructura de user_tenant_info
SELECT 
    'ESTRUCTURA DE USER_TENANT_INFO' as analisis,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_tenant_info' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros y analizar datos
SELECT 
    'DATOS DE USER_TENANT_INFO' as analisis,
    COUNT(*) as total_registros,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(DISTINCT tenant_id) as tenants_unicos,
    MIN(created_at) as fecha_mas_antigua,
    MAX(created_at) as fecha_mas_reciente
FROM public.user_tenant_info;

-- Verificar si hay datos únicos o importantes
SELECT 
    'ANÁLISIS DE DATOS ÚNICOS' as analisis,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as con_tenant_id,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as con_role,
    COUNT(CASE WHEN permissions IS NOT NULL THEN 1 END) as con_permissions
FROM public.user_tenant_info;

-- =====================================================
-- 📊 3. BÚSQUEDA DE TABLAS CON NOMBRES SIMILARES
-- =====================================================

-- Buscar tablas que puedan tener nombres similares o redundantes
SELECT 
    'TABLAS CON NOMBRES SIMILARES' as analisis,
    table_name as tabla,
    'POSIBLE REDUNDANCIA' as observacion
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%user%' 
        OR table_name LIKE '%client%'
        OR table_name LIKE '%role%'
        OR table_name LIKE '%tag%'
        OR table_name LIKE '%tenant%'
        OR table_name LIKE '%sale%'
        OR table_name LIKE '%payment%'
        OR table_name LIKE '%event%'
        OR table_name LIKE '%function%'
    )
ORDER BY table_name;

-- =====================================================
-- 📊 4. VERIFICAR DEPENDENCIAS Y RELACIONES
-- =====================================================

-- Verificar claves foráneas que apunten a las tablas en cuestión
SELECT 
    'CLAVES FORÁNEAS A SALES' as analisis,
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_destino,
    ccu.column_name as columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'sales'
    AND tc.table_schema = 'public';

SELECT 
    'CLAVES FORÁNEAS A PAYMENTS' as analisis,
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_destino,
    ccu.column_name as columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'payments'
    AND tc.table_schema = 'public';

SELECT 
    'CLAVES FORÁNEAS A USER_TENANT_INFO' as analisis,
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_destino,
    ccu.column_name as columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'user_tenant_info'
    AND tc.table_schema = 'public';

-- =====================================================
-- 📊 5. RECOMENDACIONES BASADAS EN ANÁLISIS
-- =====================================================

-- Generar recomendaciones basadas en los datos encontrados
SELECT 
    'RECOMENDACIONES' as analisis,
    'sales vs payments' as redundancia,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sales' AND table_schema = 'public') = 0 
        THEN 'sales NO EXISTE - payments es la tabla principal'
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') = 0 
        THEN 'payments NO EXISTE - sales es la tabla principal'
        ELSE 'AMBAS EXISTEN - Evaluar cuál tiene más datos y funcionalidad'
    END as recomendacion
UNION ALL
SELECT 
    'RECOMENDACIONES' as analisis,
    'user_tenant_info' as redundancia,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.user_tenant_info) = 0 
        THEN 'user_tenant_info VACÍA - Considerar eliminar'
        WHEN (SELECT COUNT(*) FROM public.user_tenant_info) < 10 
        THEN 'user_tenant_info con pocos datos - Evaluar si es necesaria'
        ELSE 'user_tenant_info con datos - Mantener si se usa en el código'
    END as recomendacion;

-- =====================================================
-- ✅ RESULTADO ESPERADO:
-- ✅ Análisis detallado de sales vs payments
-- ✅ Evaluación de user_tenant_info
-- ✅ Identificación de tablas con nombres similares
-- ✅ Verificación de dependencias y relaciones
-- ✅ Recomendaciones específicas para cada redundancia
-- =====================================================
