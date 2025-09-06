-- Insertar datos iniciales solo si no existen
-- Para payment_methods_global
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

-- Para comisiones_tasas
INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Comisión por Venta de Entrada', 'percentage', '{"percentage": 5}', 'Comisión aplicada a cada venta de entrada.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Comisión por Venta de Entrada');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Tasa de Procesamiento de Tarjeta', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Tasa estándar por transacción con tarjeta de crédito/débito.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Tasa de Procesamiento de Tarjeta');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'IVA General', 'percentage', '{"percentage": 16}', 'Impuesto al Valor Agregado aplicado a servicios.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'IVA General');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Tasa por Pago Móvil', 'percentage', '{"percentage": 3.5}', 'Tasa por el uso de plataformas de pago móvil.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Tasa por Pago Móvil');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Comisión Stripe', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Stripe.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Comisión Stripe');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Comisión PayPal', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con PayPal.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Comisión PayPal');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Comisión Apple Pay', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Apple Pay.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Comisión Apple Pay');

INSERT INTO comisiones_tasas (name, type, value, description) 
SELECT 'Comisión Google Pay', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Google Pay.'
WHERE NOT EXISTS (SELECT 1 FROM comisiones_tasas WHERE name = 'Comisión Google Pay');
