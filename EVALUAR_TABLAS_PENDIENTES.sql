-- =====================================================
-- 🔍 EVALUAR TABLAS PENDIENTES - ANÁLISIS DETALLADO
-- =====================================================
-- 
-- ✅ Este script evalúa las 4 tablas restantes que necesitan
-- ✅ análisis más detallado antes de decidir si eliminar
-- ✅ o mantener
--
-- =====================================================

-- =====================================================
-- 📊 1. EVALUAR: user_tenant_info (user_tenants ya eliminada)
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

-- Verificar si user_tenant_info tiene datos únicos
SELECT 
    'user_tenant_info' as tabla,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(DISTINCT tenant_id) as tenants_unicos,
    COUNT(*) as total_registros
FROM public.user_tenant_info;

-- =====================================================
-- 📊 2. VERIFICAR: user_favorites (¿fue eliminada?)
-- =====================================================

-- Verificar si user_favorites existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_favorites' 
            AND table_schema = 'public'
        ) THEN 'user_favorites EXISTE'
        ELSE 'user_favorites ELIMINADA'
    END as estado_tabla;

-- =====================================================
-- 📊 3. VERIFICAR: crm_clients vs clientes
-- =====================================================

-- Verificar si crm_clients existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'crm_clients' 
            AND table_schema = 'public'
        ) THEN 'crm_clients EXISTE'
        ELSE 'crm_clients ELIMINADA'
    END as estado_tabla;

-- Verificar estructura de clientes (tabla principal)
SELECT 
    'clientes' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros en clientes
SELECT 
    'clientes' as tabla,
    COUNT(*) as total_registros
FROM public.clientes;

-- Verificar si clientes tiene datos únicos
SELECT 
    'clientes' as tabla,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT email) as emails_unicos,
    COUNT(DISTINCT telefono) as telefonos_unicos
FROM public.clientes;

-- =====================================================
-- 📊 4. EVALUAR: sales vs payments
-- =====================================================

-- Verificar estructura de sales
SELECT 
    'sales' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de payments
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

-- Verificar si sales tiene datos únicos
SELECT 
    'sales' as tabla,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT transaction_id) as transacciones_unicas,
    SUM(amount) as total_monto
FROM public.sales;

-- Verificar si payments tiene datos únicos
SELECT 
    'payments' as tabla,
    COUNT(DISTINCT id) as ids_unicos,
    COUNT(DISTINCT transaction_id) as transacciones_unicas,
    SUM(amount) as total_monto
FROM public.payments;

-- =====================================================
-- 📊 5. VERIFICAR DEPENDENCIAS EN EL CÓDIGO
-- =====================================================

-- Nota: Estas consultas ayudan a entender qué tablas
-- están siendo usadas en el código y cuáles son redundantes

-- =====================================================
-- ✅ RESULTADO ESPERADO:
-- ✅ Información detallada sobre cada tabla pendiente
-- ✅ Datos para tomar decisiones informadas
-- ✅ Identificación de redundancias reales
-- ✅ Plan de acción para cada tabla
-- =====================================================
