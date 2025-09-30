-- Script para verificar y corregir el tenant_id en payment_methods
-- Ejecuta este script después del anterior

-- 1. Verificar el tenant_id actual del usuario
SELECT 
    'Tenant ID del usuario actual' as info,
    (auth.jwt() ->> 'tenant_id')::uuid as current_tenant_id;

-- 2. Verificar si existen métodos de pago
SELECT 
    'Métodos de pago existentes' as info,
    COUNT(*) as total_methods,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM public.payment_methods;

-- 3. Si no hay métodos con tenant_id, actualizar todos los existentes
UPDATE public.payment_methods 
SET tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
WHERE tenant_id IS NULL;

-- 4. Insertar método Efectivo si no existe
INSERT INTO public.payment_methods (
    method_id, 
    name, 
    description, 
    enabled, 
    is_recommended, 
    processing_time, 
    fee_structure,
    tenant_id,
    config
) 
SELECT 
    'efectivo',
    'Efectivo',
    'Pagos en efectivo',
    true, -- Habilitado por defecto
    false,
    'Inmediato',
    '{"percentage": 0, "fixed": 0}',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
    '{"instructions": "Pago en efectivo al momento de la entrega", "location": "Oficina principal", "contact": "Teléfono: +58-xxx-xxx-xxxx"}'
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods 
    WHERE method_id = 'efectivo' 
    AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
);

-- 5. Verificar el resultado final
SELECT 
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time,
    tenant_id,
    CASE 
        WHEN config IS NOT NULL AND config != '{}' THEN 'Configurado'
        ELSE 'Sin configurar'
    END as config_status
FROM public.payment_methods
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;
