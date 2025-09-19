    -- =====================================================
    -- AGREGAR COLUMNAS ESENCIALES FALTANTES
    -- =====================================================

    -- Agregar columnas que el frontend está intentando usar
    ALTER TABLE payment_transactions 
    ADD COLUMN IF NOT EXISTS user_id uuid,
    ADD COLUMN IF NOT EXISTS tenant_id uuid,
    ADD COLUMN IF NOT EXISTS evento_id uuid,
    ADD COLUMN IF NOT EXISTS funcion_id integer,
    ADD COLUMN IF NOT EXISTS payment_method character varying(50),
    ADD COLUMN IF NOT EXISTS gateway_name character varying(100),
    ADD COLUMN IF NOT EXISTS seats jsonb,
    ADD COLUMN IF NOT EXISTS "user" jsonb,
    ADD COLUMN IF NOT EXISTS usuario_id uuid,
    ADD COLUMN IF NOT EXISTS event uuid,
    ADD COLUMN IF NOT EXISTS funcion integer,
    ADD COLUMN IF NOT EXISTS processed_by uuid,
    ADD COLUMN IF NOT EXISTS payment_gateway_id uuid,
    ADD COLUMN IF NOT EXISTS fecha timestamp with time zone,
    ADD COLUMN IF NOT EXISTS payments jsonb,
    ADD COLUMN IF NOT EXISTS referrer character varying(255),
    ADD COLUMN IF NOT EXISTS "discountCode" character varying(50),
    ADD COLUMN IF NOT EXISTS "reservationDeadline" timestamp with time zone;

    -- Verificar que se agregaron correctamente
    SELECT 
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
