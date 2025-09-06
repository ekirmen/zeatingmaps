-- Tabla para configuración de comisiones y tasas
CREATE TABLE comisiones_tasas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'percentage', 'fixed', 'fixed_plus_percentage'
  value JSONB DEFAULT '{}', -- e.g., { "percentage": 5 }, { "fixed": 0.30 }, { "fixed": 0.30, "percentage": 2.9 }
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunas comisiones y tasas de ejemplo
INSERT INTO comisiones_tasas (name, type, value, description) VALUES
('Comisión por Venta de Entrada', 'percentage', '{"percentage": 5}', 'Comisión aplicada a cada venta de entrada.'),
('Tasa de Procesamiento de Tarjeta', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Tasa estándar por transacción con tarjeta de crédito/débito.'),
('IVA General', 'percentage', '{"percentage": 16}', 'Impuesto al Valor Agregado aplicado a servicios.'),
('Tasa por Pago Móvil', 'percentage', '{"percentage": 3.5}', 'Tasa por el uso de plataformas de pago móvil.'),
('Comisión Stripe', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Stripe.'),
('Comisión PayPal', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con PayPal.'),
('Comisión Apple Pay', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Apple Pay.'),
('Comisión Google Pay', 'fixed_plus_percentage', '{"fixed": 0.30, "percentage": 2.9}', 'Comisión por transacciones con Google Pay.');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_comisiones_tasas_name ON comisiones_tasas(name);
CREATE INDEX idx_comisiones_tasas_type ON comisiones_tasas(type);
CREATE INDEX idx_comisiones_tasas_is_active ON comisiones_tasas(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE comisiones_tasas ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read comisiones_tasas" ON comisiones_tasas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Allow authenticated users to update comisiones_tasas" ON comisiones_tasas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY "Allow authenticated users to insert comisiones_tasas" ON comisiones_tasas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY "Allow authenticated users to delete comisiones_tasas" ON comisiones_tasas
  FOR DELETE USING (auth.role() = 'authenticated');
