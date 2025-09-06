-- Crear tabla para configuración global de métodos de pago
CREATE TABLE IF NOT EXISTS payment_methods_global (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_payment_methods_global_method_id ON payment_methods_global(method_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_methods_global_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_payment_methods_global_updated_at
  BEFORE UPDATE ON payment_methods_global
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_global_updated_at();

-- Insertar métodos de pago por defecto
INSERT INTO payment_methods_global (method_id, enabled, config) VALUES
('stripe', true, '{}'),
('paypal', true, '{}'),
('transferencia', true, '{}'),
('pago_movil', true, '{}'),
('efectivo', true, '{}')
ON CONFLICT (method_id) DO NOTHING;
