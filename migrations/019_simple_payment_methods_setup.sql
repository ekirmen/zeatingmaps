-- Configuración simple de métodos de pago con tenant_id

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

-- 3. Insertar métodos de pago solo si no existen
INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'stripe', true, '{"apiKey": "", "secretKey": "", "mode": "sandbox"}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'stripe' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'paypal', true, '{"clientId": "", "clientSecret": "", "mode": "sandbox"}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'paypal' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'apple_pay', true, '{"merchantId": "", "certificate": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'apple_pay' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'google_pay', true, '{"merchantId": "", "apiKey": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'google_pay' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'transferencia', true, '{"bankAccount": "", "bankName": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'transferencia' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'pago_movil', true, '{"provider": "", "apiKey": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'pago_movil' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'efectivo_tienda', true, '{"location": "", "instructions": ""}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'efectivo_tienda' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

INSERT INTO payment_methods_global (method_id, enabled, config, tenant_id, created_at, updated_at)
SELECT 'efectivo', true, '{}', '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods_global 
    WHERE method_id = 'efectivo' AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
);

-- 4. Verificar resultado
SELECT method_id, enabled, tenant_id, created_at 
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
ORDER BY method_id;
