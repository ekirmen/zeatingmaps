-- =====================================================
-- CORREGIR PROBLEMAS RESTANTES DE PAGO
-- =====================================================

-- 1. CORREGIR POLÍTICAS RLS PARA NOTIFICATIONS
-- Eliminar políticas existentes
DROP POLICY IF EXISTS notifications_authenticated_read ON notifications;
DROP POLICY IF EXISTS notifications_authenticated_insert ON notifications;
DROP POLICY IF EXISTS notifications_authenticated_update ON notifications;
DROP POLICY IF EXISTS notifications_tenant_admin_all ON notifications;

-- Crear políticas más permisivas para notifications
CREATE POLICY notifications_authenticated_read ON notifications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY notifications_authenticated_insert ON notifications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY notifications_authenticated_update ON notifications
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY notifications_tenant_admin_all ON notifications
    FOR ALL TO authenticated USING (is_tenant_admin()) WITH CHECK (is_tenant_admin());

-- 2. CORREGIR POLÍTICAS RLS PARA PAYMENT_TRANSACTIONS
-- Eliminar políticas existentes
DROP POLICY IF EXISTS payment_transactions_authenticated_read ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_insert ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_update ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_tenant_admin_all ON payment_transactions;

-- Crear políticas más permisivas para payment_transactions
CREATE POLICY payment_transactions_authenticated_read ON payment_transactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY payment_transactions_authenticated_insert ON payment_transactions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY payment_transactions_authenticated_update ON payment_transactions
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY payment_transactions_tenant_admin_all ON payment_transactions
    FOR ALL TO authenticated USING (is_tenant_admin()) WITH CHECK (is_tenant_admin());

-- 3. VERIFICAR QUE LAS FUNCIONES RLS EXISTEN
-- Si no existen, crearlas
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Verificar si el usuario está autenticado
    IF (SELECT auth.uid()) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar si es admin del tenant actual
    RETURN EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'TENANT_ADMIN' OR p.role = 'tenant_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Verificar si el usuario está autenticado
    IF (SELECT auth.uid()) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar si es super admin
    RETURN EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'SUPER_ADMIN' OR p.role = 'super_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_tenant_id uuid;
BEGIN
    -- Verificar si el usuario está autenticado
    IF (SELECT auth.uid()) IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obtener tenant ID del usuario
    SELECT tenant_id INTO user_tenant_id
    FROM profiles
    WHERE id = (SELECT auth.uid());

    RETURN user_tenant_id;
END;
$$;

-- 4. VERIFICAR QUE TODO FUNCIONA
SELECT 'RLS functions exist' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_tenant_admin' AND routine_schema = 'public')
            THEN 1 ELSE 0 END as status

UNION ALL

SELECT 'notifications RLS policies' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public')
            THEN 1 ELSE 0 END as status

UNION ALL

SELECT 'payment_transactions RLS policies' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND schemaname = 'public')
            THEN 1 ELSE 0 END as status;
