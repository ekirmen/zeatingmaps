-- Verificar y arreglar datos de payment_methods_global
-- Primero verificar si hay datos
SELECT COUNT(*) as total_records FROM payment_methods_global;

-- Insertar datos iniciales solo si no existen
INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'stripe', true, '{"environment": "sandbox", "apiKey": "", "webhookSecret": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'stripe');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'paypal', true, '{"environment": "sandbox", "clientId": "", "clientSecret": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'paypal');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'apple_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'apple_pay');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'google_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'google_pay');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'transferencia', true, '{"bankAccount": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'transferencia');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'pago_movil', true, '{"provider": "", "apiKey": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'pago_movil');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'efectivo_tienda', true, '{"location": "", "currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'efectivo_tienda');

INSERT INTO payment_methods_global (method_id, enabled, config) 
SELECT 'efectivo', true, '{"currency": "USD"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_methods_global WHERE method_id = 'efectivo');

-- Verificar que se insertaron los datos
SELECT COUNT(*) as total_records_after FROM payment_methods_global;
SELECT method_id, enabled FROM payment_methods_global ORDER BY method_id;
