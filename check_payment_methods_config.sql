-- Script para verificar el contenido exacto del campo config
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar el contenido exacto del campo config
SELECT 
    'Contenido del campo config' as test,
    method_id,
    name,
    enabled,
    config,
    jsonb_typeof(config) as config_type,
    config ? 'instructions' as has_instructions,
    config ? 'location' as has_location,
    config ? 'contact' as has_contact,
    config ? 'store_address' as has_store_address,
    config ? 'provider' as has_provider,
    config ? 'api_key' as has_api_key,
    config ? 'bank_name' as has_bank_name,
    config ? 'account_number' as has_account_number
FROM public.payment_methods
WHERE enabled = true
AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY is_recommended DESC, name;

-- 2. Verificar si el método efectivo tiene la configuración correcta
SELECT 
    'Método efectivo - validación' as test,
    method_id,
    config,
    CASE 
        WHEN config IS NOT NULL AND config != '{}' THEN 'Tiene configuración'
        ELSE 'Sin configuración'
    END as config_status,
    -- Simular la validación que hace el código
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
