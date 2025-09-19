-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A PAYMENT_TRANSACTIONS
-- =====================================================

-- Verificar y agregar columnas faltantes
DO $$
BEGIN
    -- Agregar columna user_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN user_id uuid;
        RAISE NOTICE 'Columna user_id agregada';
    ELSE
        RAISE NOTICE 'Columna user_id ya existe';
    END IF;

    -- Agregar columna tenant_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'tenant_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN tenant_id uuid;
        RAISE NOTICE 'Columna tenant_id agregada';
    ELSE
        RAISE NOTICE 'Columna tenant_id ya existe';
    END IF;

    -- Agregar columna evento_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'evento_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN evento_id uuid;
        RAISE NOTICE 'Columna evento_id agregada';
    ELSE
        RAISE NOTICE 'Columna evento_id ya existe';
    END IF;

    -- Agregar columna funcion_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'funcion_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN funcion_id integer;
        RAISE NOTICE 'Columna funcion_id agregada';
    ELSE
        RAISE NOTICE 'Columna funcion_id ya existe';
    END IF;

    -- Agregar columna payment_method si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'payment_method'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN payment_method character varying(50);
        RAISE NOTICE 'Columna payment_method agregada';
    ELSE
        RAISE NOTICE 'Columna payment_method ya existe';
    END IF;

    -- Agregar columna gateway_name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'gateway_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN gateway_name character varying(100);
        RAISE NOTICE 'Columna gateway_name agregada';
    ELSE
        RAISE NOTICE 'Columna gateway_name ya existe';
    END IF;

    -- Agregar columna seats si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'seats'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN seats jsonb;
        RAISE NOTICE 'Columna seats agregada';
    ELSE
        RAISE NOTICE 'Columna seats ya existe';
    END IF;

    -- Agregar columna user si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'user'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN "user" jsonb;
        RAISE NOTICE 'Columna user agregada';
    ELSE
        RAISE NOTICE 'Columna user ya existe';
    END IF;

    -- Agregar columna usuario_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'usuario_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN usuario_id uuid;
        RAISE NOTICE 'Columna usuario_id agregada';
    ELSE
        RAISE NOTICE 'Columna usuario_id ya existe';
    END IF;

    -- Agregar columna event si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'event'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN event uuid;
        RAISE NOTICE 'Columna event agregada';
    ELSE
        RAISE NOTICE 'Columna event ya existe';
    END IF;

    -- Agregar columna funcion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'funcion'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN funcion integer;
        RAISE NOTICE 'Columna funcion agregada';
    ELSE
        RAISE NOTICE 'Columna funcion ya existe';
    END IF;

    -- Agregar columna processed_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'processed_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN processed_by uuid;
        RAISE NOTICE 'Columna processed_by agregada';
    ELSE
        RAISE NOTICE 'Columna processed_by ya existe';
    END IF;

    -- Agregar columna payment_gateway_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'payment_gateway_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN payment_gateway_id uuid;
        RAISE NOTICE 'Columna payment_gateway_id agregada';
    ELSE
        RAISE NOTICE 'Columna payment_gateway_id ya existe';
    END IF;

    -- Agregar columna fecha si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'fecha'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN fecha timestamp with time zone;
        RAISE NOTICE 'Columna fecha agregada';
    ELSE
        RAISE NOTICE 'Columna fecha ya existe';
    END IF;

    -- Agregar columna payments si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'payments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN payments jsonb;
        RAISE NOTICE 'Columna payments agregada';
    ELSE
        RAISE NOTICE 'Columna payments ya existe';
    END IF;

    -- Agregar columna referrer si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'referrer'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN referrer character varying(255);
        RAISE NOTICE 'Columna referrer agregada';
    ELSE
        RAISE NOTICE 'Columna referrer ya existe';
    END IF;

    -- Agregar columna discountCode si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'discountCode'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN "discountCode" character varying(50);
        RAISE NOTICE 'Columna discountCode agregada';
    ELSE
        RAISE NOTICE 'Columna discountCode ya existe';
    END IF;

    -- Agregar columna reservationDeadline si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'reservationDeadline'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions ADD COLUMN "reservationDeadline" timestamp with time zone;
        RAISE NOTICE 'Columna reservationDeadline agregada';
    ELSE
        RAISE NOTICE 'Columna reservationDeadline ya existe';
    END IF;

END $$;

-- Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
