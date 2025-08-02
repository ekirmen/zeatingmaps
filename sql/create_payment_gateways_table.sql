-- Tabla para pasarelas de pago
CREATE TABLE payment_gateways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- stripe, paypal, transfer, mobile_payment, zelle, reservation
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuraciones específicas de cada pasarela
CREATE TABLE payment_gateway_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gateway_id UUID REFERENCES payment_gateways(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    key_value TEXT,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para transacciones de pago
CREATE TABLE payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID,
    gateway_id UUID REFERENCES payment_gateways(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- pending, completed, failed, cancelled
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar pasarelas por defecto
INSERT INTO payment_gateways (name, type, is_active) VALUES
('Stripe', 'stripe', false),
('PayPal', 'paypal', false),
('Transferencias Bancarias', 'transfer', false),
('Pago Móvil', 'mobile_payment', false),
('Zelle', 'zelle', false),
('Reservas', 'reservation', false);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX idx_payment_gateways_type ON payment_gateways(type);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status); 