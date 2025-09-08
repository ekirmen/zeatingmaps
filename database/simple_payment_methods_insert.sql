-- =====================================================
-- INSERTAR MÉTODOS DE PAGO SIMPLE (SIN ON CONFLICT)
-- =====================================================

-- Primero eliminar métodos existentes para evitar duplicados
DELETE FROM payment_methods_global 
WHERE tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- Insertar métodos de pago básicos para el tenant sistema.veneventos.com
INSERT INTO payment_methods_global (tenant_id, method_id, method_name, enabled, config) VALUES
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'stripe', 'Stripe', true, '{"apiKey": "pk_test_example", "secretKey": "sk_test_example"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'paypal', 'PayPal', true, '{"clientId": "example_client_id", "clientSecret": "example_client_secret"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'transferencia', 'Transferencia Bancaria', true, '{"bankAccount": "1234567890", "bankName": "Banco Ejemplo"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'pago_movil', 'Pago Móvil', true, '{"provider": "MercadoPago", "apiKey": "example_api_key"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo_tienda', 'Pago en Efectivo en Tienda', true, '{"location": "Tienda Principal"}'),
('9dbdb86f-8424-484c-bb76-0d9fa27573c8', 'efectivo', 'Efectivo', true, '{}');

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
