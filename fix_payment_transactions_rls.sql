-- =====================================================
-- CORREGIR RLS POLICIES PARA PAYMENT_TRANSACTIONS
-- =====================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS payment_transactions_authenticated_all ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_insert ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_read ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_select ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_update ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_tenant_admin_all ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_tenant_admin_select ON payment_transactions;

-- 2. CREAR POLÍTICAS CONSOLIDADAS Y OPTIMIZADAS

-- Política para usuarios autenticados: SELECT
CREATE POLICY payment_transactions_authenticated_select ON payment_transactions
    FOR SELECT TO authenticated 
    USING (
        -- Usuario puede ver sus propias transacciones
        user_id = (SELECT auth.uid())
        OR
        -- O si es tenant admin, puede ver transacciones de su tenant
        (is_tenant_admin() AND tenant_id = get_user_tenant_id())
    );

-- Política para usuarios autenticados: INSERT
CREATE POLICY payment_transactions_authenticated_insert ON payment_transactions
    FOR INSERT TO authenticated 
    WITH CHECK (
        -- Usuario puede insertar transacciones para sí mismo
        user_id = (SELECT auth.uid())
        AND
        -- Y debe pertenecer a su tenant
        tenant_id = get_user_tenant_id()
    );

-- Política para usuarios autenticados: UPDATE
CREATE POLICY payment_transactions_authenticated_update ON payment_transactions
    FOR UPDATE TO authenticated 
    USING (
        -- Usuario puede actualizar sus propias transacciones
        user_id = (SELECT auth.uid())
        OR
        -- O si es tenant admin, puede actualizar transacciones de su tenant
        (is_tenant_admin() AND tenant_id = get_user_tenant_id())
    )
    WITH CHECK (
        -- Mismas condiciones para el CHECK
        user_id = (SELECT auth.uid())
        OR
        (is_tenant_admin() AND tenant_id = get_user_tenant_id())
    );

-- Política para usuarios autenticados: DELETE
CREATE POLICY payment_transactions_authenticated_delete ON payment_transactions
    FOR DELETE TO authenticated 
    USING (
        -- Solo tenant admin puede eliminar transacciones
        is_tenant_admin() AND tenant_id = get_user_tenant_id()
    );

-- 3. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
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
ORDER BY policyname;

-- 4. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'payment_transactions';

-- 5. PROBAR ACCESO (OPCIONAL - DESCOMENTAR PARA PROBAR)
-- SELECT COUNT(*) as total_transactions FROM payment_transactions;
