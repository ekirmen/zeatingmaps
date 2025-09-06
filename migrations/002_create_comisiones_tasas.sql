-- Tabla para gestión de comisiones y tasas por método de pago
CREATE TABLE comisiones_tasas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  fijo DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales
INSERT INTO comisiones_tasas (name, tipo, valor, fijo, activo) VALUES
('Stripe', 'porcentaje', 2.90, 0.30, true),
('PayPal', 'porcentaje', 2.90, 0.30, true),
('Apple Pay', 'porcentaje', 2.90, 0.30, true),
('Google Pay', 'porcentaje', 2.90, 0.30, true),
('Transferencia Bancaria', 'fijo', 0.00, 0.00, true),
('Pago Móvil', 'porcentaje', 3.50, 0.50, true),
('Pago en Efectivo en Tienda', 'fijo', 0.00, 0.00, true),
('Efectivo', 'fijo', 0.00, 0.00, true);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_comisiones_tasas_name ON comisiones_tasas(name);
CREATE INDEX idx_comisiones_tasas_activo ON comisiones_tasas(activo);
CREATE INDEX idx_comisiones_tasas_tipo ON comisiones_tasas(tipo);

-- Comentarios en la tabla
COMMENT ON TABLE comisiones_tasas IS 'Gestión de comisiones y tasas por método de pago';
COMMENT ON COLUMN comisiones_tasas.name IS 'Nombre del método de pago';
COMMENT ON COLUMN comisiones_tasas.tipo IS 'Tipo de comisión: porcentaje o fijo';
COMMENT ON COLUMN comisiones_tasas.valor IS 'Valor de la comisión (porcentaje o monto fijo)';
COMMENT ON COLUMN comisiones_tasas.fijo IS 'Tasa fija adicional en USD';
COMMENT ON COLUMN comisiones_tasas.activo IS 'Si la comisión está activa';
