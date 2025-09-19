-- =====================================================
-- SOLO ARREGLAR RLS PARA PAYMENT_TRANSACTIONS
-- =====================================================

-- 1. VERIFICAR QUE LAS FUNCIONES RLS EXISTEN
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

-- 2. ELIMINAR POLÍTICAS EXISTENTES DE PAYMENT_TRANSACTIONS
DROP POLICY IF EXISTS payment_transactions_authenticated_read ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_insert ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_update ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_tenant_admin_all ON payment_transactions;

-- 3. CREAR POLÍTICAS MÁS PERMISIVAS PARA PAYMENT_TRANSACTIONS
-- Política para lectura: permitir a usuarios autenticados leer sus propias transacciones
CREATE POLICY payment_transactions_authenticated_read ON payment_transactions
    FOR SELECT TO authenticated USING (
        user_id = (SELECT auth.uid()) 
        OR tenant_id = get_user_tenant_id()
        OR is_tenant_admin()
    );

-- Política para inserción: permitir a usuarios autenticados insertar
CREATE POLICY payment_transactions_authenticated_insert ON payment_transactions
    FOR INSERT TO authenticated WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND tenant_id = get_user_tenant_id()
    );

-- Política para actualización: permitir a usuarios autenticados actualizar sus transacciones
CREATE POLICY payment_transactions_authenticated_update ON payment_transactions
    FOR UPDATE TO authenticated USING (
        user_id = (SELECT auth.uid()) 
        OR is_tenant_admin()
    ) WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR is_tenant_admin()
    );

-- Política para tenant admin: acceso completo
CREATE POLICY payment_transactions_tenant_admin_all ON payment_transactions
    FOR ALL TO authenticated USING (
        is_tenant_admin() AND tenant_id = get_user_tenant_id()
    ) WITH CHECK (
        is_tenant_admin() AND tenant_id = get_user_tenant_id()
    );

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payment_transactions' 
AND schemaname = 'public'
ORDER BY policyname;
