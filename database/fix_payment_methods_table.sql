-- =====================================================
-- ARREGLAR TABLA PAYMENT_METHODS_GLOBAL
-- =====================================================

-- Agregar columna method_name si no existe
ALTER TABLE payment_methods_global ADD COLUMN IF NOT EXISTS method_name VARCHAR(100);

-- Agregar columna config si no existe
ALTER TABLE payment_methods_global ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Agregar columna enabled si no existe
ALTER TABLE payment_methods_global ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Agregar columna updated_at si no existe
ALTER TABLE payment_methods_global ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_tenant_id ON payment_methods_global(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_method_id ON payment_methods_global(method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_enabled ON payment_methods_global(enabled);

-- Habilitar RLS si no está habilitado
ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods_global;
CREATE POLICY "Users can view payment methods" ON payment_methods_global
  FOR SELECT USING (true);

-- =====================================================
-- INSERTAR MÉTODOS DE PAGO BÁSICOS
-- =====================================================

-- Crear restricción única si no existe
ALTER TABLE payment_methods_global ADD CONSTRAINT IF NOT EXISTS unique_tenant_method 
UNIQUE (tenant_id, method_id);

-- Insertar métodos de pago básicos para el tenant sistema.veneventos.com
INSERT INTO payment_methods_global (tenant_id, method_id, method_name, enabled, config) VALUES
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'stripe', 'Stripe', true, '{"apiKey": "pk_test_example", "secretKey": "sk_test_example"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'paypal', 'PayPal', true, '{"clientId": "example_client_id", "clientSecret": "example_client_secret"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'transferencia', 'Transferencia Bancaria', true, '{"bankAccount": "1234567890", "bankName": "Banco Ejemplo"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'pago_movil', 'Pago Móvil', true, '{"provider": "MercadoPago", "apiKey": "example_api_key"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo_tienda', 'Pago en Efectivo en Tienda', true, '{"location": "Tienda Principal"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo', 'Efectivo', true, '{}')
ON CONFLICT (tenant_id, method_id) DO UPDATE SET
  method_name = EXCLUDED.method_name,
  enabled = EXCLUDED.enabled,
  config = EXCLUDED.config,
  updated_at = NOW();

-- =====================================================
-- VERIFICAR DATOS
-- =====================================================

-- Verificar que los métodos se insertaron correctamente
SELECT 
  method_id,
  method_name,
  enabled,
  config
FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'
ORDER BY method_id;
