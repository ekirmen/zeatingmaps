-- Script para arreglar la configuración de los otros métodos de pago
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Arreglar efectivo_tienda - agregar store_address
UPDATE public.payment_methods 
SET 
    config = config || '{"store_address": "Tienda Principal, Av. Principal 123, Ciudad"}',
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'efectivo_tienda' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 2. Arreglar pago_movil - agregar provider y api_key
UPDATE public.payment_methods 
SET 
    config = config || '{"provider": "MercadoPago", "api_key": "test_api_key_123"}',
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'pago_movil' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 3. Arreglar transferencia - agregar bank_name y account_number
UPDATE public.payment_methods 
SET 
    config = config || '{"bank_name": "Banco Principal", "account_number": "1234567890", "account_holder": "Sistema Veneventos"}',
    updated_at = CURRENT_TIMESTAMP
WHERE method_id = 'transferencia' 
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- 4. Verificar que todos los métodos ahora son válidos
SELECT 
    'Verificación final - todos los métodos' as test,
    method_id,
    name,
    enabled,
    config,
    CASE 
        WHEN method_id = 'efectivo' THEN 'Válido (no requiere campos)'
        WHEN method_id = 'efectivo_tienda' AND config ? 'store_address' THEN 'Válido (tiene store_address)'
        WHEN method_id = 'pago_movil' AND config ? 'provider' AND config ? 'api_key' THEN 'Válido (tiene provider y api_key)'
        WHEN method_id = 'transferencia' AND config ? 'bank_name' AND config ? 'account_number' THEN 'Válido (tiene bank_name y account_number)'
        ELSE 'Inválido (faltan campos requeridos)'
    END as validation_result
FROM public.payment_methods
WHERE enabled = true
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;
