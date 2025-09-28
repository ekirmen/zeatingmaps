-- Script para crear la tabla payments faltante y arreglar el formato de datos del mapa
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear la tabla payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    funcion integer NOT NULL,
    seats jsonb,
    status text,
    locator text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid,
    user_id uuid,
    amount decimal(10,2),
    currency text DEFAULT 'USD',
    payment_method text,
    payment_reference text,
    metadata jsonb
);

-- 2. Habilitar RLS en la tabla payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- 4. Verificar que la tabla se creó correctamente
SELECT 
    'Tabla payments creada' as test,
    COUNT(*) as total_payments
FROM public.payments;

-- 5. Verificar la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- 6. Verificar que el mapa tiene el formato correcto
SELECT 
    'Verificación mapa' as test,
    id,
    sala_id,
    CASE 
        WHEN contenido IS NULL THEN 'contenido es NULL'
        WHEN jsonb_typeof(contenido) = 'object' THEN 'contenido es objeto'
        WHEN jsonb_typeof(contenido) = 'array' THEN 'contenido es array'
        ELSE 'contenido es ' || jsonb_typeof(contenido)
    END as tipo_contenido,
    CASE 
        WHEN contenido IS NULL THEN 'N/A'
        WHEN jsonb_typeof(contenido) = 'object' THEN 
            CASE 
                WHEN contenido ? 'elementos' THEN 'Tiene elementos'
                ELSE 'No tiene elementos'
            END
        ELSE 'N/A'
    END as tiene_elementos
FROM public.mapas
WHERE sala_id = 52
LIMIT 1;
