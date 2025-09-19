-- =====================================================
-- VERIFICAR Y CORREGIR PROBLEMAS DE AUTENTICACIÓN
-- =====================================================

-- 1. VERIFICAR QUE EL USUARIO ESTÁ AUTENTICADO
SELECT 
    'Current user' as check_type,
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as status;

-- 2. VERIFICAR QUE EL USUARIO TIENE PERFIL
SELECT 
    'User profile' as check_type,
    p.id,
    p.email,
    p.role,
    p.tenant_id
FROM profiles p
WHERE p.id = auth.uid();

-- 3. VERIFICAR QUE LAS FUNCIONES RLS FUNCIONAN
SELECT 
    'RLS Functions' as check_type,
    is_tenant_admin() as is_tenant_admin,
    is_super_admin() as is_super_admin,
    get_user_tenant_id() as user_tenant_id;

-- 4. PROBAR CONSULTA DIRECTA A PAYMENT_TRANSACTIONS
SELECT 
    'Payment transactions access' as check_type,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as user_transactions,
    COUNT(CASE WHEN tenant_id = get_user_tenant_id() THEN 1 END) as tenant_transactions
FROM payment_transactions;

-- 5. VERIFICAR POLÍTICAS RLS ACTIVAS
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
