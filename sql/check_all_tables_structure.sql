-- Script para verificar la estructura de todas las tablas relevantes
-- =====================================================

-- Verificar estructura de payment_gateways
SELECT 
    'payment_gateways' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_gateways' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de payment_transactions
SELECT 
    'payment_transactions' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de productos
SELECT 
    'productos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de admin_notifications
SELECT 
    'admin_notifications' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si las tablas existen y tienen datos
SELECT 
    'payment_gateways' as tabla,
    COUNT(*) as registros
FROM payment_gateways
UNION ALL
SELECT 
    'payment_transactions' as tabla,
    COUNT(*) as registros
FROM payment_transactions
UNION ALL
SELECT 
    'productos' as tabla,
    COUNT(*) as registros
FROM productos
UNION ALL
SELECT 
    'admin_notifications' as tabla,
    COUNT(*) as registros
FROM admin_notifications; 