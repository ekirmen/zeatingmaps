-- =====================================================
-- SOLUCIONAR TODOS LOS PROBLEMAS DE PAGO
-- =====================================================

-- 1. AGREGAR COLUMNAS FALTANTES A PAYMENT_TRANSACTIONS
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS tenant_id uuid,
ADD COLUMN IF NOT EXISTS evento_id uuid,
ADD COLUMN IF NOT EXISTS funcion_id integer,
ADD COLUMN IF NOT EXISTS payment_method character varying(50),
ADD COLUMN IF NOT EXISTS gateway_name character varying(100),
ADD COLUMN IF NOT EXISTS seats jsonb,
ADD COLUMN IF NOT EXISTS "user" jsonb,
ADD COLUMN IF NOT EXISTS usuario_id uuid,
ADD COLUMN IF NOT EXISTS event uuid,
ADD COLUMN IF NOT EXISTS funcion integer,
ADD COLUMN IF NOT EXISTS processed_by uuid,
ADD COLUMN IF NOT EXISTS payment_gateway_id uuid,
ADD COLUMN IF NOT EXISTS fecha timestamp with time zone,
ADD COLUMN IF NOT EXISTS payments jsonb,
ADD COLUMN IF NOT EXISTS referrer character varying(255),
ADD COLUMN IF NOT EXISTS "discountCode" character varying(50),
ADD COLUMN IF NOT EXISTS "reservationDeadline" timestamp with time zone;

-- 2. CREAR TABLA NOTIFICATIONS COMPLETA
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    tenant_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    data jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    "read" boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. CREAR ÍNDICES PARA NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications USING btree (tenant_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at) TABLESPACE pg_default;

-- 4. CREAR TRIGGER PARA NOTIFICATIONS
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. CONFIGURAR RLS PARA NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_authenticated_read ON notifications;
DROP POLICY IF EXISTS notifications_authenticated_insert ON notifications;
DROP POLICY IF EXISTS notifications_authenticated_update ON notifications;
DROP POLICY IF EXISTS notifications_tenant_admin_all ON notifications;

CREATE POLICY notifications_authenticated_read ON notifications
    FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_authenticated_insert ON notifications
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_authenticated_update ON notifications
    FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_tenant_admin_all ON notifications
    FOR ALL TO authenticated USING (is_tenant_admin() AND tenant_id = get_user_tenant_id()) WITH CHECK (is_tenant_admin() AND tenant_id = get_user_tenant_id());

-- 6. CORREGIR FUNCIÓN get_transaction_with_seats
CREATE OR REPLACE FUNCTION get_transaction_with_seats(transaction_locator text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    transaction_record record;
    seats_data jsonb;
BEGIN
    SELECT * INTO transaction_record
    FROM payment_transactions
    WHERE locator = transaction_locator
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sl.id,
                'seat_id', sl.seat_id,
                'table_id', sl.table_id,
                'funcion_id', sl.funcion_id,
                'locked_at', sl.locked_at,
                'expires_at', sl.expires_at,
                'status', sl.status,
                'lock_type', sl.lock_type,
                'created_at', sl.created_at,
                'tenant_id', sl.tenant_id,
                'locator', sl.locator,
                'user_id', sl.user_id,
                'updated_at', sl.updated_at,
                'zona_id', sl.zona_id,
                'session_id', sl.session_id
            )
        ),
        '[]'::jsonb
    ) INTO seats_data
    FROM seat_locks sl
    WHERE sl.locator = transaction_locator;

    result := jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', transaction_record.id,
            'order_id', transaction_record.order_id,
            'gateway_id', transaction_record.gateway_id,
            'amount', transaction_record.amount,
            'currency', transaction_record.currency,
            'status', transaction_record.status,
            'gateway_transaction_id', transaction_record.gateway_transaction_id,
            'gateway_response', transaction_record.gateway_response,
            'created_at', transaction_record.created_at,
            'updated_at', transaction_record.updated_at,
            'user_id', transaction_record.user_id,
            'evento_id', transaction_record.evento_id,
            'tenant_id', transaction_record.tenant_id,
            'locator', transaction_record.locator,
            'funcion_id', transaction_record.funcion_id,
            'payment_method', transaction_record.payment_method,
            'gateway_name', transaction_record.gateway_name,
            'seats', transaction_record.seats,
            'monto', transaction_record.monto,
            'usuario_id', transaction_record.usuario_id,
            'event', transaction_record.event,
            'funcion', transaction_record.funcion,
            'processed_by', transaction_record.processed_by,
            'payment_gateway_id', transaction_record.payment_gateway_id,
            'fecha', transaction_record.fecha,
            'payments', transaction_record.payments,
            'referrer', transaction_record.referrer,
            'discountCode', transaction_record."discountCode",
            'reservationDeadline', transaction_record."reservationDeadline",
            'user_data', jsonb_build_object(
                'id', transaction_record.user_id,
                'email', (SELECT email FROM auth.users WHERE id = transaction_record.user_id),
                'created_at', (SELECT created_at FROM auth.users WHERE id = transaction_record.user_id)
            )
        ),
        'seats', seats_data
    );

    RETURN result;
END;
$$;

-- 7. CONFIGURAR RLS PARA PAYMENT_TRANSACTIONS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_transactions_authenticated_read ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_insert ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_update ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_tenant_admin_all ON payment_transactions;

CREATE POLICY payment_transactions_authenticated_read ON payment_transactions
    FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR tenant_id = get_user_tenant_id());

CREATE POLICY payment_transactions_authenticated_insert ON payment_transactions
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND tenant_id = get_user_tenant_id());

CREATE POLICY payment_transactions_authenticated_update ON payment_transactions
    FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) AND tenant_id = get_user_tenant_id()) WITH CHECK (user_id = (SELECT auth.uid()) AND tenant_id = get_user_tenant_id());

CREATE POLICY payment_transactions_tenant_admin_all ON payment_transactions
    FOR ALL TO authenticated USING (is_tenant_admin() AND tenant_id = get_user_tenant_id()) WITH CHECK (is_tenant_admin() AND tenant_id = get_user_tenant_id());

-- 8. VERIFICAR QUE TODO FUNCIONA
SELECT 'payment_transactions columns' as check_type, count(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' AND table_schema = 'public'

UNION ALL

SELECT 'notifications table exists' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') 
            THEN 1 ELSE 0 END as column_count

UNION ALL

SELECT 'get_transaction_with_seats function exists' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_transaction_with_seats' AND routine_schema = 'public')
            THEN 1 ELSE 0 END as column_count;
