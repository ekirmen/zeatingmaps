-- Script para deshabilitar temporalmente RLS en payment_methods
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que RLS está deshabilitado
SELECT 'Verificación de RLS deshabilitado' as test,
       schemaname,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'payment_methods';

-- 3. Probar la consulta que hace el frontend
SELECT 'Prueba de consulta del frontend (RLS deshabilitado)' as test,
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
