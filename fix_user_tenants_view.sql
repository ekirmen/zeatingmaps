-- Script para arreglar la vista user_tenants con la columna role que falta
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Eliminar la vista actual
DROP VIEW IF EXISTS public.user_tenants;

-- 2. Crear la vista corregida con la columna role
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
    id,
    user_id,
    tenant_id,
    'USER' as role,  -- Añadir columna role con valor por defecto
    is_active as active,
    last_login,
    login_count,
    created_at,
    updated_at
FROM public.user_tenant_info;

-- 3. Verificar que la vista se creó correctamente
SELECT 
    'Vista user_tenants corregida' as test,
    COUNT(*) as total_registros
FROM public.user_tenants;

-- 4. Verificar la estructura de la vista
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_tenants'
ORDER BY ordinal_position;

-- 5. Probar acceso a la vista con la columna role
SELECT 
    'Prueba con role' as test,
    id,
    user_id,
    tenant_id,
    role,
    active
FROM public.user_tenants 
LIMIT 3;
