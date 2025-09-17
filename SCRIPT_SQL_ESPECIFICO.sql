-- =====================================================
-- SCRIPT SQL ESPECÍFICO PARA LA ESTRUCTURA REAL DE PAYMENTS
-- =====================================================

-- 1. AGREGAR COLUMNAS FALTANTES A PAYMENT_TRANSACTIONS
-- =====================================================

DO $$
BEGIN
    -- Agregar columnas faltantes a payment_transactions si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'seats') THEN
        ALTER TABLE payment_transactions ADD COLUMN seats jsonb NULL;
        RAISE NOTICE 'Columna seats agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'monto') THEN
        ALTER TABLE payment_transactions ADD COLUMN monto numeric(10, 2) NULL;
        RAISE NOTICE 'Columna monto agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'usuario_id') THEN
        ALTER TABLE payment_transactions ADD COLUMN usuario_id uuid NULL;
        RAISE NOTICE 'Columna usuario_id agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'event') THEN
        ALTER TABLE payment_transactions ADD COLUMN event uuid NULL;
        RAISE NOTICE 'Columna event agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'funcion') THEN
        ALTER TABLE payment_transactions ADD COLUMN funcion integer NULL;
        RAISE NOTICE 'Columna funcion agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'processed_by') THEN
        ALTER TABLE payment_transactions ADD COLUMN processed_by uuid NULL;
        RAISE NOTICE 'Columna processed_by agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'payment_gateway_id') THEN
        ALTER TABLE payment_transactions ADD COLUMN payment_gateway_id uuid NULL;
        RAISE NOTICE 'Columna payment_gateway_id agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'created_at') THEN
        ALTER TABLE payment_transactions ADD COLUMN created_at timestamp with time zone NULL DEFAULT now();
        RAISE NOTICE 'Columna created_at agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'updated_at') THEN
        ALTER TABLE payment_transactions ADD COLUMN updated_at timestamp with time zone NULL DEFAULT now();
        RAISE NOTICE 'Columna updated_at agregada a payment_transactions';
    END IF;
    
    -- Campos adicionales específicos de payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'fecha') THEN
        ALTER TABLE payment_transactions ADD COLUMN fecha timestamp with time zone NULL;
        RAISE NOTICE 'Columna fecha agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'payments') THEN
        ALTER TABLE payment_transactions ADD COLUMN payments jsonb NULL;
        RAISE NOTICE 'Columna payments agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'referrer') THEN
        ALTER TABLE payment_transactions ADD COLUMN referrer text NULL;
        RAISE NOTICE 'Columna referrer agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'discountCode') THEN
        ALTER TABLE payment_transactions ADD COLUMN "discountCode" text NULL;
        RAISE NOTICE 'Columna discountCode agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'reservationDeadline') THEN
        ALTER TABLE payment_transactions ADD COLUMN "reservationDeadline" timestamp with time zone NULL;
        RAISE NOTICE 'Columna reservationDeadline agregada a payment_transactions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'user') THEN
        ALTER TABLE payment_transactions ADD COLUMN "user" uuid NULL;
        RAISE NOTICE 'Columna user agregada a payment_transactions';
    END IF;
END $$;

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

-- Verificar si la tabla payments existe y tiene datos
DO $$
DECLARE
    payments_count INTEGER;
BEGIN
    -- Verificar si la tabla payments existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM payments' INTO payments_count;
        RAISE NOTICE 'Tabla payments encontrada con % registros', payments_count;
        
        -- Migrar datos usando la estructura real de payments
        EXECUTE '
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
                ''USD'' as currency, 
                status, 
                COALESCE(created_at, fecha, now()) as created_at, 
                COALESCE(created_at, fecha, now()) as updated_at, 
                COALESCE(user_id, usuario_id) as user_id, 
                event as evento_id, 
                tenant_id, 
                locator, 
                funcion as funcion_id, 
                ''reserva'' as payment_method,
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
            )';
        
        RAISE NOTICE 'Migración completada desde payments a payment_transactions';
        
    ELSE
        RAISE NOTICE 'Tabla payments no existe, saltando migración';
    END IF;
END $$;

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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seat_locks' AND column_name = 'zona_nombre') THEN
        ALTER TABLE seat_locks DROP COLUMN zona_nombre;
        RAISE NOTICE 'Columna zona_nombre eliminada de seat_locks';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seat_locks' AND column_name = 'precio') THEN
        ALTER TABLE seat_locks DROP COLUMN precio;
        RAISE NOTICE 'Columna precio eliminada de seat_locks';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seat_locks' AND column_name = 'session_id') THEN
        ALTER TABLE seat_locks DROP COLUMN session_id;
        RAISE NOTICE 'Columna session_id eliminada de seat_locks';
    END IF;
END $$;

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

-- 7. MIGRAR MÉTODOS DE PAGO (Solo si existen las tablas)
-- =====================================================

-- Migrar desde payment_gateways si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_gateways') THEN
        EXECUTE '
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
                ''Instantáneo'' as processing_time,
                ''{"percentage": 2.9, "fixed": 0.30}'' as fee_structure,
                ''["USD", "EUR", "MXN"]'' as supported_currencies,
                ''["US", "MX", "ES"]'' as supported_countries,
                CASE WHEN type IN (''stripe'', ''paypal'') THEN true ELSE false END as is_recommended,
                CASE 
                    WHEN LOWER(name) = ''stripe'' THEN ''credit-card''
                    WHEN LOWER(name) = ''paypal'' THEN ''dollar''
                    WHEN LOWER(name) = ''apple pay'' THEN ''apple''
                    WHEN LOWER(name) = ''google pay'' THEN ''android''
                    ELSE ''bank''
                END as icon,
                CASE 
                    WHEN LOWER(name) = ''stripe'' THEN ''Tarjetas de crédito y débito''
                    WHEN LOWER(name) = ''paypal'' THEN ''Pagos a través de PayPal''
                    WHEN LOWER(name) = ''apple pay'' THEN ''Pagos para usuarios iOS''
                    WHEN LOWER(name) = ''google pay'' THEN ''Pagos para usuarios Android''
                    ELSE ''Método de pago personalizado''
                END as description
            FROM payment_gateways
            WHERE NOT EXISTS (
                SELECT 1 FROM payment_methods pm 
                WHERE pm.method_id = LOWER(payment_gateways.name) 
                AND pm.tenant_id = payment_gateways.tenant_id
            )';
        
        RAISE NOTICE 'Datos migrados desde payment_gateways a payment_methods';
    ELSE
        RAISE NOTICE 'Tabla payment_gateways no existe, saltando migración';
    END IF;
END $$;

-- Migrar desde payment_methods_global si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods_global') THEN
        EXECUTE '
            INSERT INTO payment_methods (
                method_id, name, type, enabled, config, created_at, updated_at, tenant_id,
                processing_time, fee_structure, supported_currencies, supported_countries,
                is_recommended, icon, description
            )
            SELECT 
                method_id,
                COALESCE(method_name, method_id) as name,
                ''custom'' as type,
                enabled,
                config,
                created_at,
                updated_at,
                tenant_id,
                ''Instantáneo'' as processing_time,
                ''{"percentage": 0, "fixed": 0}'' as fee_structure,
                ''["USD"]'' as supported_currencies,
                ''["US"]'' as supported_countries,
                false as is_recommended,
                ''bank'' as icon,
                ''Método de pago personalizado'' as description
            FROM payment_methods_global
            WHERE NOT EXISTS (
                SELECT 1 FROM payment_methods pm 
                WHERE pm.method_id = payment_methods_global.method_id 
                AND pm.tenant_id = payment_methods_global.tenant_id
            )';
        
        RAISE NOTICE 'Datos migrados desde payment_methods_global a payment_methods';
    ELSE
        RAISE NOTICE 'Tabla payment_methods_global no existe, saltando migración';
    END IF;
END $$;

-- 8. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de tablas y registros
DO $$
DECLARE
    payment_transactions_count INTEGER;
    payment_methods_count INTEGER;
    seat_locks_count INTEGER;
    payments_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payment_transactions_count FROM payment_transactions;
    SELECT COUNT(*) INTO payment_methods_count FROM payment_methods;
    SELECT COUNT(*) INTO seat_locks_count FROM seat_locks;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        SELECT COUNT(*) INTO payments_count FROM payments;
    ELSE
        payments_count := 0;
    END IF;
    
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN ===';
    RAISE NOTICE 'payments (original): % registros', payments_count;
    RAISE NOTICE 'payment_transactions: % registros', payment_transactions_count;
    RAISE NOTICE 'payment_methods: % registros', payment_methods_count;
    RAISE NOTICE 'seat_locks: % registros', seat_locks_count;
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
