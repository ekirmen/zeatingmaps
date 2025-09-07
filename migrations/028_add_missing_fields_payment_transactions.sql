-- Migration to add missing fields to payment_transactions table
-- This migration adds locator, tenant_id, user_id, evento_id, funcion_id, and payment_method fields
-- Also ensures payment_gateways table exists and creates default gateways if needed

-- Create payment_gateways table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  type character varying(50) NOT NULL,
  is_active boolean NULL DEFAULT false,
  config jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  tenant_id uuid NULL,
  CONSTRAINT payment_gateways_pkey PRIMARY KEY (id),
  CONSTRAINT payment_gateways_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for payment_gateways if they don't exist
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON public.payment_gateways USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_payment_gateways_type ON public.payment_gateways USING btree (type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_payment_gateways_tenant_id ON public.payment_gateways USING btree (tenant_id) TABLESPACE pg_default;

-- Add missing columns to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS locator VARCHAR(255),
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS evento_id UUID,
ADD COLUMN IF NOT EXISTS funcion_id INTEGER,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS gateway_name VARCHAR(100);

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
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_name ON payment_transactions(gateway_name);

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

-- Create default payment gateways if they don't exist
DO $$
DECLARE
    first_tenant_id UUID;
    default_gateway_id UUID;
BEGIN
    -- Get the first tenant ID
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Only create gateways if we found a tenant
    IF first_tenant_id IS NOT NULL THEN
        -- Create default Stripe gateway if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE type = 'stripe' AND tenant_id = first_tenant_id) THEN
            INSERT INTO payment_gateways (name, type, is_active, tenant_id, config)
            VALUES ('Stripe', 'stripe', true, first_tenant_id, '{"api_key": "", "webhook_secret": ""}'::jsonb);
            RAISE NOTICE 'Created default Stripe gateway for tenant: %', first_tenant_id;
        END IF;
        
        -- Create default Reservas gateway if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE type = 'reserva' AND tenant_id = first_tenant_id) THEN
            INSERT INTO payment_gateways (name, type, is_active, tenant_id, config)
            VALUES ('Reservas', 'reserva', true, first_tenant_id, '{"description": "Sistema de reservas interno"}'::jsonb);
            RAISE NOTICE 'Created default Reservas gateway for tenant: %', first_tenant_id;
        END IF;
        
        -- Create default Cash gateway if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE type = 'cash' AND tenant_id = first_tenant_id) THEN
            INSERT INTO payment_gateways (name, type, is_active, tenant_id, config)
            VALUES ('Efectivo', 'cash', true, first_tenant_id, '{"description": "Pago en efectivo"}'::jsonb);
            RAISE NOTICE 'Created default Cash gateway for tenant: %', first_tenant_id;
        END IF;
        
        -- Create default Transfer gateway if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE type = 'transfer' AND tenant_id = first_tenant_id) THEN
            INSERT INTO payment_gateways (name, type, is_active, tenant_id, config)
            VALUES ('Transferencia', 'transfer', true, first_tenant_id, '{"description": "Transferencia bancaria"}'::jsonb);
            RAISE NOTICE 'Created default Transfer gateway for tenant: %', first_tenant_id;
        END IF;
    ELSE
        RAISE NOTICE 'No tenants found, skipping gateway creation';
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
