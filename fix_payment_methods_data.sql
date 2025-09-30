-- Script para limpiar y configurar correctamente los métodos de pago
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Eliminar duplicados (mantener solo uno de cada método)
DELETE FROM public.payment_methods 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY method_id, tenant_id ORDER BY created_at DESC) as rn
        FROM public.payment_methods
        WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
    ) t WHERE rn > 1
);

-- 2. Actualizar el método "efectivo" con configuración
UPDATE public.payment_methods 
SET 
    processing_time = 'Inmediato',
    config = '{"instructions": "Pago en efectivo al momento de la entrega", "location": "Oficina principal", "contact": "Teléfono: +58-xxx-xxx-xxxx"}',
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'efectivo' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 3. Corregir processing_time de otros métodos
UPDATE public.payment_methods 
SET processing_time = '1-3 días hábiles'
WHERE method_id = 'transferencia' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

UPDATE public.payment_methods 
SET processing_time = 'Inmediato'
WHERE method_id = 'efectivo_tienda' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 4. Eliminar el método "reservas" que no es un método de pago
DELETE FROM public.payment_methods 
WHERE method_id = 'reservas' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 5. Asegurar que el método "efectivo" esté habilitado y sea recomendado
UPDATE public.payment_methods 
SET 
    enabled = true,
    is_recommended = true,
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'efectivo' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 6. Deshabilitar métodos que requieren configuración externa (Stripe, PayPal)
UPDATE public.payment_methods 
SET 
    enabled = false,
    updated_at = CURRENT_TIMESTAMP
WHERE method_id IN ('stripe', 'paypal', 'apple_pay', 'google_pay', 'pago_movil') 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 7. Verificar el resultado final
SELECT 
    method_id,
    name,
    enabled,
    is_recommended,
    processing_time,
    CASE 
        WHEN config IS NOT NULL AND config != '{}' THEN 'Configurado'
        ELSE 'Sin configurar'
    END as config_status,
    created_at
FROM public.payment_methods
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, enabled DESC, name;
