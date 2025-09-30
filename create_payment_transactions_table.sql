-- Script para crear la tabla payment_transactions que el sistema está esperando
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear la tabla payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id text NOT NULL,
    gateway_id uuid,
    amount numeric(10, 2) NOT NULL,
    currency text DEFAULT 'USD'::text,
    status text NOT NULL DEFAULT 'pending'::text,
    gateway_transaction_id text,
    gateway_response jsonb,
    user_id uuid,
    tenant_id uuid,
    evento_id uuid,
    funcion integer,
    seats jsonb,
    locator text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT payment_transactions_order_id_unique UNIQUE (order_id),
    CONSTRAINT payment_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON public.payment_transactions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_funcion ON public.payment_transactions USING btree (funcion);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions USING btree (created_at);

-- 3. Habilitar RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
CREATE POLICY payment_transactions_select_policy
ON public.payment_transactions FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

CREATE POLICY payment_transactions_insert_policy
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY payment_transactions_update_policy
ON public.payment_transactions FOR UPDATE
TO authenticated
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY payment_transactions_delete_policy
ON public.payment_transactions FOR DELETE
TO authenticated
USING (tenant_id = auth.tenant_id());

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_payment_transactions_set_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. Verificar que la tabla se creó correctamente
SELECT 
    'Verificación de tabla payment_transactions' as test,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
