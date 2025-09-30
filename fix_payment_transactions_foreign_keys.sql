-- Script para arreglar las relaciones (foreign keys) de payment_transactions
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar las relaciones existentes
SELECT 
    'Relaciones existentes en payment_transactions' as test,
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

-- 2. Verificar la estructura de la tabla profiles
SELECT 
    'Estructura de profiles' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar la estructura de payment_transactions
SELECT 
    'Estructura de payment_transactions' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
  AND table_schema = 'public'
  AND column_name IN ('user_id', 'usuario_id', 'user')
ORDER BY ordinal_position;

-- 4. Crear la relación correcta entre payment_transactions y profiles
-- Primero eliminar relaciones duplicadas o incorrectas
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_user_id;

-- 5. Crear la relación correcta: user_id -> profiles(id)
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Verificar que la relación se creó correctamente
SELECT 
    'Relaciones después de la corrección' as test,
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
    AND kcu.column_name = 'user_id'
ORDER BY tc.constraint_name;
