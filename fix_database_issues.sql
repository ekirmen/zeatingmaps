-- Script para arreglar los problemas de base de datos que impiden que el mapa se cargue
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Arreglar la tabla productos - añadir la columna evento_id que falta
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS evento_id UUID;

-- 2. Crear un alias para user_tenant_info como user_tenants (para compatibilidad)
-- Esto solucionará el error "relation user_tenants does not exist"
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
    id,
    user_id,
    tenant_id,
    is_active as active,
    last_login,
    login_count,
    created_at,
    updated_at
FROM public.user_tenant_info;

-- 3. Las vistas heredan las políticas RLS de la tabla base (user_tenant_info)
-- No necesitamos crear políticas separadas para la vista

-- 4. Verificar que el mapa existe y es accesible
SELECT 
    'mapas' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN sala_id = 52 THEN 1 END) as mapas_sala_52
FROM public.mapas;

-- 5. Verificar el contenido del mapa de la sala 52
SELECT 
    id,
    sala_id,
    nombre,
    estado,
    tenant_id,
    CASE 
        WHEN contenido IS NOT NULL THEN 'Tiene contenido'
        ELSE 'Sin contenido'
    END as contenido_status,
    LENGTH(contenido::text) as contenido_length
FROM public.mapas 
WHERE sala_id = 52;

-- 6. Verificar políticas RLS en mapas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'mapas';

-- 7. Probar acceso directo al mapa
SELECT 
    'Prueba de acceso' as test,
    id,
    sala_id,
    nombre,
    estado
FROM public.mapas 
WHERE sala_id = 52 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
