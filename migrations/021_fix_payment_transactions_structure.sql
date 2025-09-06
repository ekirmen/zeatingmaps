-- Verificar y arreglar la estructura de la tabla payment_transactions
-- Este script verifica la estructura actual y la corrige si es necesario

-- 1. Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'payment_transactions' 
                   AND table_schema = 'public') THEN
        -- Crear la tabla si no existe
        CREATE TABLE payment_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id VARCHAR(255) NOT NULL,
            gateway_id UUID,
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            status VARCHAR(50) DEFAULT 'pending',
            gateway_transaction_id VARCHAR(255),
            gateway_response JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
        CREATE INDEX idx_payment_transactions_gateway_id ON payment_transactions(gateway_id);
        CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
        CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
        
        RAISE NOTICE 'Tabla payment_transactions creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla payment_transactions ya existe';
    END IF;
END $$;

-- 2. Verificar y agregar columnas faltantes si es necesario
DO $$
BEGIN
    -- Verificar si order_id es VARCHAR y no UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'order_id' 
        AND data_type = 'uuid'
        AND table_schema = 'public'
    ) THEN
        -- Cambiar order_id de UUID a VARCHAR
        ALTER TABLE payment_transactions 
        ALTER COLUMN order_id TYPE VARCHAR(255);
        
        RAISE NOTICE 'Columna order_id cambiada de UUID a VARCHAR';
    END IF;
    
    -- Verificar si gateway_id es UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'gateway_id' 
        AND data_type = 'uuid'
        AND table_schema = 'public'
    ) THEN
        -- Cambiar gateway_id a UUID si no lo es
        ALTER TABLE payment_transactions 
        ALTER COLUMN gateway_id TYPE UUID USING gateway_id::UUID;
        
        RAISE NOTICE 'Columna gateway_id cambiada a UUID';
    END IF;
    
    -- Agregar columnas faltantes si no existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'gateway_transaction_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN gateway_transaction_id VARCHAR(255);
        
        RAISE NOTICE 'Columna gateway_transaction_id agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'gateway_response'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN gateway_response JSONB;
        
        RAISE NOTICE 'Columna gateway_response agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Columna created_at agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
END $$;

-- 3. Habilitar RLS si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'payment_transactions' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para payment_transactions';
    END IF;
END $$;

-- 4. Crear políticas RLS si no existen
DO $$
BEGIN
    -- Política para permitir lectura a todos los usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_transactions' 
        AND policyname = 'payment_transactions_select_policy'
    ) THEN
        CREATE POLICY payment_transactions_select_policy 
        ON payment_transactions FOR SELECT 
        TO authenticated 
        USING (true);
        
        RAISE NOTICE 'Política de SELECT creada para payment_transactions';
    END IF;
    
    -- Política para permitir inserción a todos los usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_transactions' 
        AND policyname = 'payment_transactions_insert_policy'
    ) THEN
        CREATE POLICY payment_transactions_insert_policy 
        ON payment_transactions FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        RAISE NOTICE 'Política de INSERT creada para payment_transactions';
    END IF;
    
    -- Política para permitir actualización a todos los usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_transactions' 
        AND policyname = 'payment_transactions_update_policy'
    ) THEN
        CREATE POLICY payment_transactions_update_policy 
        ON payment_transactions FOR UPDATE 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
        
        RAISE NOTICE 'Política de UPDATE creada para payment_transactions';
    END IF;
END $$;

-- 5. Mostrar la estructura final de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
