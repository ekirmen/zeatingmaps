-- Script para arreglar las políticas RLS de payment_transactions
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar el estado actual de RLS
SELECT 
    'Estado RLS de payment_transactions' as test,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE oid = 'public.payment_transactions'::regclass;

-- 2. Verificar las políticas RLS existentes
SELECT 
    'Políticas RLS existentes' as test,
    pol.polname AS policyname,
    pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS policy_condition,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS policy_command
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'payment_transactions' AND nsp.nspname = 'public';

-- 3. Eliminar políticas RLS existentes (si las hay)
DROP POLICY IF EXISTS payment_transactions_select_policy ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_insert_policy ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_update_policy ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_delete_policy ON public.payment_transactions;

-- 4. Crear políticas RLS simples que permitan todas las operaciones
CREATE POLICY payment_transactions_select_policy
ON public.payment_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY payment_transactions_insert_policy
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY payment_transactions_update_policy
ON public.payment_transactions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY payment_transactions_delete_policy
ON public.payment_transactions FOR DELETE
TO authenticated
USING (true);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
    'Políticas RLS después de la creación' as test,
    pol.polname AS policyname,
    pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS policy_condition,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS policy_command
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'payment_transactions' AND nsp.nspname = 'public';

-- 6. Probar una consulta simple para verificar que funciona
SELECT 
    'Prueba de consulta simple' as test,
    COUNT(*) as total_registros
FROM public.payment_transactions;
