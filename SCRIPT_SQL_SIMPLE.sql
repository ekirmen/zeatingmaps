-- =====================================================
-- SCRIPT SQL SIMPLE - OPTIMIZACIÓN DE BASE DE DATOS
-- =====================================================

-- 1. AGREGAR COLUMNAS FALTANTES A PAYMENT_TRANSACTIONS
-- =====================================================

-- Agregar columnas faltantes a payment_transactions
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS seats jsonb NULL,
ADD COLUMN IF NOT EXISTS monto numeric(10, 2) NULL,
ADD COLUMN IF NOT EXISTS usuario_id uuid NULL,
ADD COLUMN IF NOT EXISTS event uuid NULL,
ADD COLUMN IF NOT EXISTS funcion integer NULL,
ADD COLUMN IF NOT EXISTS processed_by uuid NULL,
ADD COLUMN IF NOT EXISTS payment_gateway_id uuid NULL,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS fecha timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS payments jsonb NULL,
ADD COLUMN IF NOT EXISTS referrer text NULL,
ADD COLUMN IF NOT EXISTS "discountCode" text NULL,
ADD COLUMN IF NOT EXISTS "reservationDeadline" timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS "user" uuid NULL;

-- 2. CREAR ÍNDICES OPTIMIZADOS PARA PAYMENT_TRANSACTIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_transactions_locator ON payment_transactions (locator);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_funcion_id ON payment_transactions (funcion_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_evento_id ON payment_transactions (evento_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_usuario_id ON payment_transactions (usuario_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processed_by ON payment_transactions (processed_by);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_event ON payment_transactions (event);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_funcion ON payment_transactions (funcion);

-- 3. MIGRAR DATOS DESDE PAYMENTS A PAYMENT_TRANSACTIONS
-- =====================================================

-- Migrar datos usando la estructura real de payments
INSERT INTO payment_transactions (
    id, order_id, amount, currency, status, created_at, updated_at,
    user_id, evento_id, tenant_id, locator, funcion_id, payment_method,
    seats, monto, usuario_id, event, funcion, processed_by, payment_gateway_id,
    fecha, payments, referrer, "discountCode", "reservationDeadline", "user"
)
SELECT 
    id, 
    locator as order_id, 
    monto as amount, 
    'USD' as currency, 
    status, 
    COALESCE(created_at, fecha, now()) as created_at, 
    COALESCE(created_at, fecha, now()) as updated_at, 
    COALESCE(user_id, usuario_id) as user_id, 
    event as evento_id, 
    tenant_id, 
    locator, 
    funcion as funcion_id, 
    'reserva' as payment_method,
    seats, 
    monto,
    usuario_id,
    event,
    funcion,
    processed_by,
    payment_gateway_id,
    fecha,
    payments,
    referrer,
    "discountCode",
    "reservationDeadline",
    "user"
FROM payments
WHERE NOT EXISTS (
    SELECT 1 FROM payment_transactions pt WHERE pt.id = payments.id
);

-- 4. ACTUALIZAR CAMPOS DUPLICADOS
-- =====================================================

UPDATE payment_transactions 
SET monto = amount 
WHERE monto IS NULL AND amount IS NOT NULL;

UPDATE payment_transactions 
SET usuario_id = user_id 
WHERE usuario_id IS NULL AND user_id IS NOT NULL;

UPDATE payment_transactions 
SET event = evento_id 
WHERE event IS NULL AND evento_id IS NOT NULL;

UPDATE payment_transactions 
SET funcion = funcion_id 
WHERE funcion IS NULL AND funcion_id IS NOT NULL;

-- 5. OPTIMIZAR SEAT_LOCKS
-- =====================================================

-- Eliminar campos redundantes de seat_locks
ALTER TABLE seat_locks 
DROP COLUMN IF EXISTS zona_nombre,
DROP COLUMN IF EXISTS precio,
DROP COLUMN IF EXISTS session_id;

-- Crear índices optimizados para seat_locks
CREATE INDEX IF NOT EXISTS idx_seat_locks_locator ON seat_locks (locator);
CREATE INDEX IF NOT EXISTS idx_seat_locks_user_id ON seat_locks (user_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_id ON seat_locks (funcion_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_tenant_id ON seat_locks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_status ON seat_locks (status);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires_at ON seat_locks (expires_at);

-- 6. CREAR TABLA CONSOLIDADA DE MÉTODOS DE PAGO
-- =====================================================

-- Crear tabla payment_methods si no existe
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    method_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    enabled boolean NULL DEFAULT true,
    config jsonb NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    tenant_id uuid NULL,
    processing_time character varying(50) NULL DEFAULT 'Instantáneo',
    fee_structure jsonb NULL DEFAULT '{"percentage": 0, "fixed": 0}',
    supported_currencies jsonb NULL DEFAULT '["USD"]',
    supported_countries jsonb NULL DEFAULT '["US"]',
    is_recommended boolean NULL DEFAULT false,
    icon character varying(100) NULL,
    description text NULL,
    
    CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
    CONSTRAINT payment_methods_method_id_tenant_id_key UNIQUE (method_id, tenant_id),
    CONSTRAINT payment_methods_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Crear índices para payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_method_id ON payment_methods (method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON payment_methods (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON payment_methods (enabled);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods (type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_recommended ON payment_methods (is_recommended);

-- 7. MIGRAR MÉTODOS DE PAGO
-- =====================================================

-- Migrar desde payment_gateways si existe
INSERT INTO payment_methods (
    method_id, name, type, enabled, config, created_at, updated_at, tenant_id,
    processing_time, fee_structure, supported_currencies, supported_countries,
    is_recommended, icon, description
)
SELECT 
    LOWER(name) as method_id,
    name,
    type,
    is_active as enabled,
    config,
    created_at,
    updated_at,
    tenant_id,
    'Instantáneo' as processing_time,
    '{"percentage": 2.9, "fixed": 0.30}' as fee_structure,
    '["USD", "EUR", "MXN"]' as supported_currencies,
    '["US", "MX", "ES"]' as supported_countries,
    CASE WHEN type IN ('stripe', 'paypal') THEN true ELSE false END as is_recommended,
    CASE 
        WHEN LOWER(name) = 'stripe' THEN 'credit-card'
        WHEN LOWER(name) = 'paypal' THEN 'dollar'
        WHEN LOWER(name) = 'apple pay' THEN 'apple'
        WHEN LOWER(name) = 'google pay' THEN 'android'
        ELSE 'bank'
    END as icon,
    CASE 
        WHEN LOWER(name) = 'stripe' THEN 'Tarjetas de crédito y débito'
        WHEN LOWER(name) = 'paypal' THEN 'Pagos a través de PayPal'
        WHEN LOWER(name) = 'apple pay' THEN 'Pagos para usuarios iOS'
        WHEN LOWER(name) = 'google pay' THEN 'Pagos para usuarios Android'
        ELSE 'Método de pago personalizado'
    END as description
FROM payment_gateways
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods pm 
    WHERE pm.method_id = LOWER(payment_gateways.name) 
    AND pm.tenant_id = payment_gateways.tenant_id
)
ON CONFLICT (method_id, tenant_id) DO NOTHING;

-- Migrar desde payment_methods_global si existe
INSERT INTO payment_methods (
    method_id, name, type, enabled, config, created_at, updated_at, tenant_id,
    processing_time, fee_structure, supported_currencies, supported_countries,
    is_recommended, icon, description
)
SELECT 
    method_id,
    COALESCE(method_name, method_id) as name,
    'custom' as type,
    enabled,
    config,
    created_at,
    updated_at,
    tenant_id,
    'Instantáneo' as processing_time,
    '{"percentage": 0, "fixed": 0}' as fee_structure,
    '["USD"]' as supported_currencies,
    '["US"]' as supported_countries,
    false as is_recommended,
    'bank' as icon,
    'Método de pago personalizado' as description
FROM payment_methods_global
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods pm 
    WHERE pm.method_id = payment_methods_global.method_id 
    AND pm.tenant_id = payment_methods_global.tenant_id
)
ON CONFLICT (method_id, tenant_id) DO NOTHING;

-- 8. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de tablas y registros
SELECT 
    'payments' as tabla, 
    COUNT(*) as registros 
FROM payments
UNION ALL
SELECT 
    'payment_transactions' as tabla, 
    COUNT(*) as registros 
FROM payment_transactions
UNION ALL
SELECT 
    'payment_methods' as tabla, 
    COUNT(*) as registros 
FROM payment_methods
UNION ALL
SELECT 
    'seat_locks' as tabla, 
    COUNT(*) as registros 
FROM seat_locks;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
