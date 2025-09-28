-- Script para crear solo la tabla faltante que impide que el mapa se cargue
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- ✅ Todas las tablas principales ya existen:
-- - mapas (con mapa real para sala 52)
-- - user_tenant_info (sistema multi-tenant)
-- - productos (estructura completa)
-- - eventos (estructura completa)

-- 1. Crear tabla event_theme_settings para temas de eventos (la única que falta)
CREATE TABLE IF NOT EXISTS public.event_theme_settings (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    theme_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, tenant_id)
);

-- 2. Habilitar RLS en todas las tablas (las existentes ya deberían tenerlo)
ALTER TABLE public.mapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_theme_settings ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para todas las tablas
-- Políticas para mapas
DROP POLICY IF EXISTS "mapas_tenant_access" ON public.mapas;
CREATE POLICY "mapas_tenant_access" ON public.mapas
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Políticas para user_tenant_info
DROP POLICY IF EXISTS "user_tenant_info_access" ON public.user_tenant_info;
CREATE POLICY "user_tenant_info_access" ON public.user_tenant_info
    FOR ALL USING (
        user_id = auth.uid() OR
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Políticas para productos
DROP POLICY IF EXISTS "productos_tenant_access" ON public.productos;
CREATE POLICY "productos_tenant_access" ON public.productos
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Políticas para eventos
DROP POLICY IF EXISTS "eventos_tenant_access" ON public.eventos;
CREATE POLICY "eventos_tenant_access" ON public.eventos
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Políticas para event_theme_settings
DROP POLICY IF EXISTS "event_theme_settings_access" ON public.event_theme_settings;
CREATE POLICY "event_theme_settings_access" ON public.event_theme_settings
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- 4. Verificar que todas las tablas están funcionando correctamente
SELECT 'mapas' as tabla, COUNT(*) as registros FROM public.mapas
UNION ALL
SELECT 'user_tenant_info' as tabla, COUNT(*) as registros FROM public.user_tenant_info
UNION ALL
SELECT 'productos' as tabla, COUNT(*) as registros FROM public.productos
UNION ALL
SELECT 'eventos' as tabla, COUNT(*) as registros FROM public.eventos
UNION ALL
SELECT 'event_theme_settings' as tabla, COUNT(*) as registros FROM public.event_theme_settings;
