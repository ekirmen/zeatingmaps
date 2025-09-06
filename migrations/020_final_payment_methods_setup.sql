-- Configuración final de métodos de pago (compatible con restricción existente)

-- 1. Agregar columna tenant_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'tenant_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- 2. Actualizar tenant_id para registros existentes sin tenant_id
UPDATE payment_methods_global 
SET tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
WHERE tenant_id IS NULL;

-- 3. Insertar métodos de pago usando UPSERT compatible con restricción existente
-- Como ya existe una restricción única en method_id, usamos ON CONFLICT con esa columna

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
VALUES 
    ('stripe', true, '{"apiKey": "", "secretKey": "", "mode": "sandbox"}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('paypal', true, '{"clientId": "", "clientSecret": "", "mode": "sandbox"}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('apple_pay', true, '{"merchantId": "", "certificate": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('google_pay', true, '{"merchantId": "", "apiKey": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('transferencia', true, '{"bankAccount": "", "bankName": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('pago_movil', true, '{"provider": "", "apiKey": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('efectivo_tienda', true, '{"location": "", "instructions": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()),
    ('efectivo', true, '{}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW())
ON CONFLICT (method_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    config = EXCLUDED.config,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = NOW();

-- 4. Verificar resultado
SELECT method_id, enabled, tenant_id, created_at 
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
ORDER BY method_id;
