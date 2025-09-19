-- =====================================================
-- VERIFICAR COLUMNAS ESPECÍFICAS QUE CAUSAN ERRORES
-- =====================================================

-- Verificar columnas que el frontend está intentando usar
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as user_id_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'tenant_id'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as tenant_id_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'evento_id'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as evento_id_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'funcion_id'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as funcion_id_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'payment_method'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as payment_method_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'gateway_name'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as gateway_name_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'seats'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as seats_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'user'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as user_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'locator'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as locator_status;

-- Verificar si existe la columna payment_gateway_id (que el frontend está usando incorrectamente)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payment_transactions' 
            AND column_name = 'payment_gateway_id'
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'FALTA' 
    END as payment_gateway_id_status;

-- Mostrar todas las columnas que SÍ existen para referencia
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
