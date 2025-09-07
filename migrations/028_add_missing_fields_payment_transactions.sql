-- Migration to add missing fields to payment_transactions table
-- This migration adds locator, tenant_id, user_id, evento_id, and funcion_id fields

-- Add missing columns to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS locator VARCHAR(255),
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS evento_id UUID,
ADD COLUMN IF NOT EXISTS funcion_id INTEGER,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Add foreign key constraints (with error handling)
DO $$
BEGIN
    -- Add tenant_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_transactions_tenant_id'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT fk_payment_transactions_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    END IF;

    -- Add user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_transactions_user_id'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT fk_payment_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add evento_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_transactions_evento_id'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT fk_payment_transactions_evento_id 
        FOREIGN KEY (evento_id) REFERENCES eventos(id);
    END IF;

    -- Add funcion_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_transactions_funcion_id'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT fk_payment_transactions_funcion_id 
        FOREIGN KEY (funcion_id) REFERENCES funciones(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_locator ON payment_transactions(locator);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_evento_id ON payment_transactions(evento_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_funcion_id ON payment_transactions(funcion_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);

-- Update existing records with tenant_id (use first available tenant)
DO $$
DECLARE
    first_tenant_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Only update if we found a tenant
    IF first_tenant_id IS NOT NULL THEN
        UPDATE payment_transactions 
        SET tenant_id = first_tenant_id
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Updated payment_transactions with tenant_id: %', first_tenant_id;
    ELSE
        RAISE NOTICE 'No tenants found, skipping tenant_id update';
    END IF;
END $$;

-- Add RLS policies for the new fields
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for tenant isolation (with error handling)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own payment transactions" ON payment_transactions;
    DROP POLICY IF EXISTS "Users can insert their own payment transactions" ON payment_transactions;
    DROP POLICY IF EXISTS "Users can update their own payment transactions" ON payment_transactions;

    -- Create new policies
    CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
    FOR SELECT USING (
      tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can insert their own payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can update their own payment transactions" ON payment_transactions
    FOR UPDATE USING (
      tenant_id IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid()
      )
    );
END $$;
