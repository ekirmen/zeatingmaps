-- Script para habilitar el método efectivo
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar el estado actual del método efectivo
SELECT 
    'Estado actual del método efectivo' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    tenant_id
FROM public.payment_methods
WHERE method_id = 'efectivo'
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 2. Habilitar el método efectivo
UPDATE public.payment_methods 
SET 
    enabled = true,
    is_recommended = true,
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'efectivo' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 3. Verificar que se actualizó correctamente
SELECT 
    'Estado después de habilitar' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    tenant_id,
    updated_at
FROM public.payment_methods
WHERE method_id = 'efectivo'
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 4. Verificar la consulta exacta que hace la tienda
SELECT 
    'Consulta de la tienda - métodos habilitados' as test,
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

-- 5. Verificar que el método efectivo está disponible
SELECT 
    'Verificación final' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.payment_methods 
            WHERE method_id = 'efectivo' 
            AND enabled = true 
            AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
        ) THEN '✅ MÉTODO EFECTIVO DISPONIBLE'
        ELSE '❌ MÉTODO EFECTIVO NO DISPONIBLE'
    END as status;
