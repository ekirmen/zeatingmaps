-- Script para limpiar TODAS las relaciones de payment_transactions y recrearlas
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar todas las relaciones existentes ANTES de limpiar
SELECT 
    'Relaciones ANTES de limpiar' as test,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'payment_transactions'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 2. ELIMINAR TODAS las relaciones existentes
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_user_id;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_evento_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_evento_id;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_funcion_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_funcion_id;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tenant_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_tenant_id;

-- 3. Verificar que se eliminaron todas las relaciones
SELECT 
    'Relaciones DESPUÉS de eliminar' as test,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'payment_transactions'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 4. CREAR SOLO las relaciones necesarias (una por cada tabla)
-- Relación con profiles (usando user_id)
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Relación con eventos (usando evento_id)
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_evento_id_fkey 
FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE SET NULL;

-- Relación con funciones (usando funcion_id)
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_funcion_id_fkey 
FOREIGN KEY (funcion_id) REFERENCES public.funciones(id) ON DELETE SET NULL;

-- Relación con tenants (usando tenant_id)
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 5. Verificar que las relaciones se crearon correctamente
SELECT 
    'Relaciones FINALES' as test,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'payment_transactions'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;
