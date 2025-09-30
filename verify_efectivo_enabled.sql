-- Script para verificar que el método efectivo esté habilitado y sea accesible
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar el estado completo del método efectivo
SELECT 
    'Estado completo del método efectivo' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time,
    fee_structure,
    tenant_id,
    config,
    created_at,
    updated_at
FROM public.payment_methods
WHERE method_id = 'efectivo'
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 2. Verificar la consulta exacta que hace la tienda
SELECT 
    'Consulta exacta de la tienda' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time,
    config
FROM public.payment_methods
WHERE enabled = true
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;

-- 3. Verificar si hay algún problema con el tenant_id
SELECT 
    'Verificación de tenant_id' as test,
    COUNT(*) as total_methods,
    COUNT(CASE WHEN tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8' THEN 1 END) as methods_for_main_tenant,
    COUNT(CASE WHEN enabled = true AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8' THEN 1 END) as enabled_methods_for_main_tenant
FROM public.payment_methods;

-- 4. Verificar si el método efectivo está en la consulta de la tienda
SELECT 
    'Método efectivo en consulta de tienda' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.payment_methods 
            WHERE method_id = 'efectivo' 
            AND enabled = true 
            AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
        ) THEN 'SÍ ESTÁ DISPONIBLE'
        ELSE 'NO ESTÁ DISPONIBLE'
    END as status;

-- 5. Verificar todos los métodos habilitados
SELECT 
    'Todos los métodos habilitados' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    tenant_id
FROM public.payment_methods
WHERE enabled = true
ORDER BY tenant_id, is_recommended DESC, name;
