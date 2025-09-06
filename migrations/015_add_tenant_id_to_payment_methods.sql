-- Agregar tenant_id a payment_methods_global para filtrar por tenant

-- Agregar columna tenant_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_methods_global' 
                   AND column_name = 'tenant_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE payment_methods_global ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Obtener el tenant_id actual (reemplaza con tu tenant_id real)
-- Para sistema.veneventos.com, el tenant_id es: 9dbdb86f-8424-484c-bb76-0d9fa27573c8
UPDATE payment_methods_global 
SET tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
WHERE tenant_id IS NULL;

-- Verificar que se actualizó correctamente
SELECT method_id, enabled, tenant_id FROM payment_methods_global ORDER BY method_id;
