-- Script para crear la tabla payment_methods
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear la tabla payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    method_id text NOT NULL, -- ID del método (stripe, paypal, etc.)
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false,
    is_recommended boolean DEFAULT false,
    processing_time text,
    fee_structure jsonb DEFAULT '{"percentage": 2.9, "fixed": 0.30}',
    config jsonb DEFAULT '{}', -- Configuración encriptada
    icon text,
    tenant_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraint único por tenant y method_id
    CONSTRAINT payment_methods_tenant_method_unique UNIQUE (tenant_id, method_id)
);

-- 2. Habilitar RLS en la tabla payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para payment_methods
DROP POLICY IF EXISTS "Users can view payment methods for their tenant" ON public.payment_methods;
CREATE POLICY "Users can view payment methods for their tenant" ON public.payment_methods
    FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can insert payment methods for their tenant" ON public.payment_methods;
CREATE POLICY "Users can insert payment methods for their tenant" ON public.payment_methods
    FOR INSERT WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can update payment methods for their tenant" ON public.payment_methods;
CREATE POLICY "Users can update payment methods for their tenant" ON public.payment_methods
    FOR UPDATE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can delete payment methods for their tenant" ON public.payment_methods;
CREATE POLICY "Users can delete payment methods for their tenant" ON public.payment_methods
    FOR DELETE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON public.payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_method_id ON public.payment_methods(method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON public.payment_methods(enabled) WHERE enabled = true;

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_payment_methods_set_updated_at ON public.payment_methods;
CREATE TRIGGER tr_payment_methods_set_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insertar métodos de pago por defecto para el tenant principal
-- (Esto se ejecutará solo si no existen métodos para el tenant)
INSERT INTO public.payment_methods (
    method_id, 
    name, 
    description, 
    enabled, 
    is_recommended, 
    processing_time, 
    fee_structure,
    tenant_id
) 
SELECT 
    'stripe',
    'Stripe',
    'Tarjetas de crédito y débito',
    false, -- Deshabilitado por defecto hasta configurar
    true,
    'Instantáneo',
    '{"percentage": 2.9, "fixed": 0.30}',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8' -- Tenant principal
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods 
    WHERE method_id = 'stripe' 
    AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
);

INSERT INTO public.payment_methods (
    method_id, 
    name, 
    description, 
    enabled, 
    is_recommended, 
    processing_time, 
    fee_structure,
    tenant_id
) 
SELECT 
    'paypal',
    'PayPal',
    'Pagos a través de PayPal',
    false, -- Deshabilitado por defecto hasta configurar
    true,
    'Instantáneo',
    '{"percentage": 2.9, "fixed": 0.30}',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8' -- Tenant principal
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods 
    WHERE method_id = 'paypal' 
    AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
);

INSERT INTO public.payment_methods (
    method_id, 
    name, 
    description, 
    enabled, 
    is_recommended, 
    processing_time, 
    fee_structure,
    tenant_id
) 
SELECT 
    'efectivo',
    'Efectivo',
    'Pagos en efectivo',
    true, -- Habilitado por defecto
    false,
    'Inmediato',
    '{"percentage": 0, "fixed": 0}',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8' -- Tenant principal
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods 
    WHERE method_id = 'efectivo' 
    AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
);

-- 7. Verificar que la tabla se creó correctamente
SELECT 
    'Tabla payment_methods creada' as test,
    COUNT(*) as total_methods
FROM public.payment_methods;

-- 8. Verificar la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payment_methods'
ORDER BY ordinal_position;

-- 9. Mostrar los métodos de pago insertados
SELECT 
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time
FROM public.payment_methods
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;
