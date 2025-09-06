-- Tabla para configuración global de métodos de pago
CREATE TABLE payment_methods_global (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar métodos de pago por defecto
INSERT INTO payment_methods_global (method_id, enabled, config) VALUES
('stripe', true, '{"environment": "sandbox", "apiKey": "", "webhookSecret": "", "currency": "USD"}'),
('paypal', true, '{"environment": "sandbox", "clientId": "", "clientSecret": "", "currency": "USD"}'),
('apple_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'),
('google_pay', true, '{"environment": "sandbox", "merchantId": "", "currency": "USD"}'),
('transferencia', true, '{"bankAccount": "", "currency": "USD"}'),
('pago_movil', true, '{"provider": "", "apiKey": "", "currency": "USD"}'),
('efectivo_tienda', true, '{"location": "", "currency": "USD"}'),
('efectivo', true, '{"currency": "USD"}');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_payment_methods_global_method_id ON payment_methods_global(method_id);
CREATE INDEX idx_payment_methods_global_enabled ON payment_methods_global(enabled);

-- Habilitar RLS (Row Level Security)
ALTER TABLE payment_methods_global ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read payment methods" ON payment_methods_global
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Allow authenticated users to update payment methods" ON payment_methods_global
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY "Allow authenticated users to insert payment methods" ON payment_methods_global
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
