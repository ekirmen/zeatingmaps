-- =====================================================
-- 🔍 EVALUAR TABLAS EXISTENTES - DESPUÉS DE ELIMINACIÓN
-- =====================================================
-- 
-- ✅ Este script evalúa las tablas que realmente existen
-- ✅ después de eliminar las 7 tablas redundantes
-- ✅ para identificar posibles redundancias restantes
--
-- =====================================================

-- =====================================================
-- 📊 1. VERIFICAR ESTADO DE TABLAS ELIMINADAS
-- =====================================================

-- Verificar qué tablas fueron eliminadas correctamente
SELECT 
    'user_tenants' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_tenants' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'user_favorites' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_favorites' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'crm_clients' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'crm_clients' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'user_roles' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_roles' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'user_tag_relations' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_tag_relations' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'crm_tags' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'crm_tags' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado
UNION ALL
SELECT 
    'empresas' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'empresas' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'ELIMINADA ✅'
    END as estado;

-- =====================================================
-- 📊 2. EVALUAR: user_tenant_info (tabla restante)
-- =====================================================

-- Verificar estructura de user_tenant_info
SELECT 
    'user_tenant_info' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_tenant_info' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros en user_tenant_info
SELECT 
    'user_tenant_info' as tabla,
    COUNT(*) as total_registros
FROM public.user_tenant_info;

-- =====================================================
-- 📊 3. EVALUAR: sales vs payments (posible redundancia)
-- =====================================================

-- Verificar si ambas tablas existen
SELECT 
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
    'payments' as tabla,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'payments' 
            AND table_schema = 'public'
        ) THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado;

-- Si ambas existen, comparar estructura
-- (Solo ejecutar si ambas tablas existen)
SELECT 
    'sales' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'payments' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros en cada tabla
SELECT 
    'sales' as tabla,
    COUNT(*) as total_registros
FROM public.sales
UNION ALL
SELECT 
    'payments' as tabla,
    COUNT(*) as total_registros
FROM public.payments;

-- =====================================================
-- 📊 4. VERIFICAR TABLAS PRINCIPALES RESTANTES
-- =====================================================

-- Listar tablas principales que deberían existir
SELECT 
    table_name as tabla_principal,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = table_name 
            AND table_schema = 'public'
        ) THEN 'EXISTE ✅'
        ELSE 'NO EXISTE ❌'
    END as estado
FROM (
    VALUES 
        ('profiles'),
        ('tenants'),
        ('clientes'),
        ('eventos'),
        ('funciones'),
        ('recintos'),
        ('salas'),
        ('zonas'),
        ('entradas'),
        ('custom_roles'),
        ('tenant_user_roles'),
        ('tags'),
        ('user_tags'),
        ('user_tenant_info')
) as tablas_principales(table_name);

-- =====================================================
-- 📊 5. RESUMEN DE REDUNDANCIAS RESTANTES
-- =====================================================

-- Identificar posibles redundancias restantes
SELECT 
    'POSIBLES REDUNDANCIAS RESTANTES:' as analisis,
    'sales vs payments' as redundancia_1,
    'user_tenant_info (evaluar si es necesaria)' as redundancia_2,
    'Verificar otras tablas con nombres similares' as redundancia_3;

-- =====================================================
-- ✅ RESULTADO ESPERADO:
-- ✅ Confirmación de eliminación de 7 tablas redundantes
-- ✅ Identificación de tablas principales restantes
-- ✅ Evaluación de posibles redundancias restantes
-- ✅ Plan de acción para optimización final
-- =====================================================
