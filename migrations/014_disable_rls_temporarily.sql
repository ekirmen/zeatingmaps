-- Deshabilitar RLS temporalmente para testing
-- Esto permitirá que la aplicación funcione mientras solucionamos los problemas

-- Deshabilitar RLS para payment_methods_global
ALTER TABLE payment_methods_global DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_methods_global';

-- Insertar datos de prueba si no existen
INSERT INTO payment_methods_global (method_id, enabled, config) VALUES
('stripe', true, '{"environment": "sandbox", "apiKey": "", "webhookSecret": "", "currency": "USD"}'),
('paypal', true, '{"environment": "sandbox", "clientId": "", "clientSecret": "", "currency": "USD"}'),
('apple_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'),
('google_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'),
('transferencia', true, '{"bankAccount": "", "currency": "USD"}'),
('pago_movil', true, '{"provider": "", "apiKey": "", "currency": "USD"}'),
('efectivo_tienda', true, '{"location": "", "currency": "USD"}'),
('efectivo', true, '{"currency": "USD"}')
ON CONFLICT (method_id) DO NOTHING;

-- Verificar datos insertados
SELECT method_id, enabled, config FROM payment_methods_global ORDER BY method_id;
