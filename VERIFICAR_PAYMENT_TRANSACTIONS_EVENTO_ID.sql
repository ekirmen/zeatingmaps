-- =====================================================
-- ✅ VERIFICAR PAYMENT_TRANSACTIONS CON EVENTO_ID
-- =====================================================
-- Script para verificar que los nuevos payment_transactions
-- se crean con evento_id correctamente
-- =====================================================

-- =====================================================
-- 📊 ESTADO ACTUAL DE PAYMENT_TRANSACTIONS
-- =====================================================

-- Verificar estado actual de payment_transactions
SELECT 
    'ESTADO ACTUAL' as categoria,
    COUNT(*) as total_registros,
    COUNT(evento_id) as con_evento_id,
    COUNT(*) - COUNT(evento_id) as sin_evento_id,
    CASE 
        WHEN COUNT(evento_id) = COUNT(*) THEN '✅ TODOS tienen evento_id'
        WHEN COUNT(evento_id) = 0 THEN '❌ NINGUNO tiene evento_id'
        ELSE '⚠️ PARCIALMENTE corregido'
    END as estado
FROM payment_transactions;

-- =====================================================
-- 📋 DETALLES DE REGISTROS SIN EVENTO_ID
-- =====================================================

-- Mostrar registros sin evento_id (si los hay)
SELECT 
    'REGISTROS SIN EVENTO_ID' as categoria,
    id,
    order_id,
    amount,
    currency,
    status,
    created_at,
    evento_id,
    tenant_id,
    user_id,
    funcion_id
FROM payment_transactions 
WHERE evento_id IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- 📊 ANÁLISIS POR FECHA DE CREACIÓN
-- =====================================================

-- Analizar registros por fecha de creación
SELECT 
    'ANÁLISIS POR FECHA' as categoria,
    DATE(created_at) as fecha_creacion,
    COUNT(*) as total_registros,
    COUNT(evento_id) as con_evento_id,
    COUNT(*) - COUNT(evento_id) as sin_evento_id
FROM payment_transactions 
GROUP BY DATE(created_at)
ORDER BY fecha_creacion DESC;

-- =====================================================
-- 🔍 VERIFICAR ESTRUCTURA DE LA TABLA
-- =====================================================

-- Verificar que la columna evento_id existe y tiene el tipo correcto
SELECT 
    'ESTRUCTURA TABLA' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
    AND table_schema = 'public'
    AND column_name IN ('evento_id', 'tenant_id', 'user_id', 'funcion_id')
ORDER BY column_name;

-- =====================================================
-- ✅ VERIFICAR FOREIGN KEYS
-- =====================================================

-- Verificar que las foreign keys están configuradas correctamente
SELECT 
    'FOREIGN KEYS' as categoria,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'payment_transactions'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- =====================================================
-- 📊 RESUMEN FINAL
-- =====================================================

/*
🎯 OBJETIVO: Verificar que payment_transactions se crean con evento_id

✅ VERIFICACIONES:
1. Estado actual de payment_transactions
2. Registros sin evento_id (si los hay)
3. Análisis por fecha de creación
4. Estructura de la tabla
5. Foreign keys configuradas

🚀 PRÓXIMOS PASOS:
1. Si hay registros sin evento_id: Actualizar registros existentes
2. Si no hay registros sin evento_id: ✅ Problema resuelto
3. Probar creación de nuevo payment_transaction
4. Verificar que se asigna evento_id correctamente

📝 NOTA: Este script debe ejecutarse después de:
- Actualizar el código en paymentProcessors.js
- Probar la funcionalidad de pagos
- Crear un nuevo payment_transaction
*/
