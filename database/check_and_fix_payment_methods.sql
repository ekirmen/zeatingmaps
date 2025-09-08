-- =====================================================
-- VERIFICAR Y ARREGLAR TABLA PAYMENT_METHODS_GLOBAL
-- =====================================================

-- Primero verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_methods_global' 
ORDER BY ordinal_position;

-- =====================================================
-- AGREGAR COLUMNAS FALTANTES
-- =====================================================

-- Agregar columna method_name si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods_global' 
        AND column_name = 'method_name'
    ) THEN
        ALTER TABLE payment_methods_global ADD COLUMN method_name VARCHAR(100);
    END IF;
END $$;

-- Agregar columna config si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods_global' 
        AND column_name = 'config'
    ) THEN
        ALTER TABLE payment_methods_global ADD COLUMN config JSONB DEFAULT '{}';
    END IF;
END $$;

-- Agregar columna enabled si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods_global' 
        AND column_name = 'enabled'
    ) THEN
        ALTER TABLE payment_methods_global ADD COLUMN enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Agregar columna updated_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_methods_global' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE payment_methods_global ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- CREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_global_tenant_id ON payment_methods_global(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_method_id ON payment_methods_global(method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_enabled ON payment_methods_global(enabled);

-- =====================================================
-- HABILITAR RLS
-- =====================================================

ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods_global;
CREATE POLICY "Users can view payment methods" ON payment_methods_global
  FOR SELECT USING (true);

-- =====================================================
-- INSERTAR MÉTODOS DE PAGO
-- =====================================================

-- Eliminar métodos existentes para evitar duplicados
DELETE FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- Insertar métodos de pago básicos
INSERT INTO payment_methods_global (tenant_id, method_id, method_name, enabled, config) VALUES
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'stripe', 'Stripe', true, '{"apiKey": "pk_test_example", "secretKey": "sk_test_example"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'paypal', 'PayPal', true, '{"clientId": "example_client_id", "clientSecret": "example_client_secret"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'transferencia', 'Transferencia Bancaria', true, '{"bankAccount": "1234567890", "bankName": "Banco Ejemplo"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'pago_movil', 'Pago Móvil', true, '{"provider": "MercadoPago", "apiKey": "example_api_key"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo_tienda', 'Pago en Efectivo en Tienda', true, '{"location": "Tienda Principal"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo', 'Efectivo', true, '{}');

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_methods_global' 
ORDER BY ordinal_position;

-- Verificar datos insertados
SELECT 
  method_id,
  method_name,
  enabled,
  config
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY method_id;
