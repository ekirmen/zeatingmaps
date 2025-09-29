-- Script para crear la tabla event_theme_settings si no existe
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear la tabla event_theme_settings si no existe
CREATE TABLE IF NOT EXISTS public.event_theme_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    event_name text,
    theme_settings jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Habilitar RLS en la tabla
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para event_theme_settings
DROP POLICY IF EXISTS "Users can view event theme settings for their tenant" ON public.event_theme_settings;
CREATE POLICY "Users can view event theme settings for their tenant" ON public.event_theme_settings
    FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can insert event theme settings for their tenant" ON public.event_theme_settings;
CREATE POLICY "Users can insert event theme settings for their tenant" ON public.event_theme_settings
    FOR INSERT WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can update event theme settings for their tenant" ON public.event_theme_settings;
CREATE POLICY "Users can update event theme settings for their tenant" ON public.event_theme_settings
    FOR UPDATE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "Users can delete event theme settings for their tenant" ON public.event_theme_settings;
CREATE POLICY "Users can delete event theme settings for their tenant" ON public.event_theme_settings
    FOR DELETE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- 4. Verificar que la tabla se creó correctamente
SELECT 
    'Tabla event_theme_settings creada' as test,
    COUNT(*) as total_records
FROM public.event_theme_settings;

-- 5. Verificar la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'event_theme_settings'
ORDER BY ordinal_position;
