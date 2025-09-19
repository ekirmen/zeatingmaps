-- =====================================================
-- VERIFICAR TODAS LAS COLUMNAS DE PAYMENT_TRANSACTIONS
-- =====================================================

-- Verificar TODAS las columnas de la tabla payment_transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si hay columnas que empiecen con 'user'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
AND column_name LIKE '%user%'
ORDER BY column_name;

-- Verificar si hay columnas que empiecen con 'tenant'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
AND column_name LIKE '%tenant%'
ORDER BY column_name;

-- Verificar si hay columnas que empiecen con 'evento'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
AND column_name LIKE '%evento%'
ORDER BY column_name;

-- Verificar si hay columnas que empiecen con 'funcion'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
AND column_name LIKE '%funcion%'
ORDER BY column_name;

-- Verificar si hay columnas que empiecen con 'locator'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
AND column_name LIKE '%locator%'
ORDER BY column_name;
