-- =====================================================
-- HABILITAR RLS EN PAYMENT_TRANSACTIONS Y CORREGIR POLÍTICAS
-- =====================================================

-- 1. HABILITAR RLS EN LA TABLA
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'payment_transactions' 
AND schemaname = 'public';

-- 3. ELIMINAR POLÍTICAS DUPLICADAS (hay 2 políticas SELECT)
DROP POLICY IF EXISTS payment_transactions_authenticated_read ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_select ON payment_transactions;

-- 4. CREAR UNA SOLA POLÍTICA SELECT CONSOLIDADA
CREATE POLICY payment_transactions_authenticated_select ON payment_transactions
    FOR SELECT TO authenticated USING (
        user_id = (SELECT auth.uid()) OR 
        tenant_id = get_user_tenant_id() OR
        is_tenant_admin()
    );

-- 5. VERIFICAR POLÍTICAS FINALES
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'payment_transactions' 
AND schemaname = 'public'
ORDER BY policyname;

-- 6. PROBAR ACCESO A LA TABLA
SELECT 
    'RLS Test' as test_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id = (SELECT auth.uid()) THEN 1 END) as user_records,
    COUNT(CASE WHEN tenant_id = get_user_tenant_id() THEN 1 END) as tenant_records
FROM payment_transactions;
