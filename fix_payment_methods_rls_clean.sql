-- Script para arreglar las políticas RLS de payment_methods (versión limpia)
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Eliminar TODAS las políticas existentes (incluyendo las que ya existen)
DROP POLICY IF EXISTS "payment_methods_select_policy" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_authenticated_all" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_tenant_admin_select" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view payment methods for their tenant" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert payment methods for their tenant" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update payment methods for their tenant" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete payment methods for their tenant" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_select_authenticated" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_insert_authenticated" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_update_authenticated" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_delete_authenticated" ON public.payment_methods;

-- 2. Crear políticas simples y claras
-- Política para SELECT: Permitir a usuarios autenticados ver métodos de pago
CREATE POLICY "payment_methods_select_authenticated" ON public.payment_methods
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT: Permitir a usuarios autenticados insertar métodos de pago
CREATE POLICY "payment_methods_insert_authenticated" ON public.payment_methods
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para UPDATE: Permitir a usuarios autenticados actualizar métodos de pago
CREATE POLICY "payment_methods_update_authenticated" ON public.payment_methods
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para DELETE: Permitir a usuarios autenticados eliminar métodos de pago
CREATE POLICY "payment_methods_delete_authenticated" ON public.payment_methods
    FOR DELETE
    TO authenticated
    USING (true);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 'Verificación de políticas RLS después de la limpieza' as test,
       schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd
FROM pg_policies 
WHERE tablename = 'payment_methods'
ORDER BY policyname;

-- 4. Probar la consulta que hace el frontend
SELECT 'Prueba de consulta del frontend' as test,
       method_id,
       name,
       enabled,
       tenant_id,
       is_recommended,
       config
FROM public.payment_methods
WHERE enabled = true
  AND tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid
ORDER BY is_recommended DESC, name;
