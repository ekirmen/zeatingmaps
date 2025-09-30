-- Script para asegurar que el método "efectivo" esté correctamente configurado
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Eliminar cualquier método "efectivo" existente
DELETE FROM public.payment_methods 
WHERE method_id = 'efectivo' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 2. Insertar el método "efectivo" correctamente configurado
INSERT INTO public.payment_methods (
    method_id, 
    name, 
    description, 
    enabled, 
    is_recommended, 
    processing_time, 
    fee_structure,
    config,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    'efectivo',
    'Efectivo',
    'Pagos en efectivo',
    true, -- Habilitado
    true, -- Recomendado
    'Inmediato',
    '{"percentage": 0, "fixed": 0}',
    '{"instructions": "Pago en efectivo al momento de la entrega", "location": "Oficina principal", "contact": "Teléfono: +58-xxx-xxx-xxxx"}',
    '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Verificar que se insertó correctamente
SELECT 
    'Método efectivo insertado' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time,
    config,
    tenant_id,
    created_at
FROM public.payment_methods
WHERE method_id = 'efectivo'
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 4. Verificar la consulta que hace la tienda
SELECT 
    'Consulta de la tienda - métodos habilitados' as test,
    method_id,
    name,
    enabled,
    is_recommended,
    config,
    processing_time
FROM public.payment_methods
WHERE enabled = true
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;

-- 5. Verificar que el config es válido JSON
SELECT 
    'Validación del config' as test,
    method_id,
    config,
    jsonb_typeof(config) as config_type,
    config ? 'instructions' as has_instructions,
    config ? 'location' as has_location,
    config ? 'contact' as has_contact,
    config->>'instructions' as instructions_value
FROM public.payment_methods
WHERE method_id = 'efectivo'
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
