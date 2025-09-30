-- Script para arreglar las relaciones de payment_transactions
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar que todas las tablas necesarias existen
SELECT 
    'Verificación de tablas existentes' as test,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'eventos', 'funciones', 'payment_transactions')
ORDER BY table_name;

-- 2. Verificar la estructura de payment_transactions
SELECT 
    'Estructura de payment_transactions' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar las relaciones (foreign keys) de payment_transactions
SELECT 
    'Relaciones de payment_transactions' as test,
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
    AND tc.table_schema = 'public';

-- 4. Verificar si hay datos de prueba en payment_transactions
SELECT 
    'Datos en payment_transactions' as test,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completados,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes
FROM public.payment_transactions;

-- 5. Verificar si hay datos en las tablas relacionadas
SELECT 
    'Datos en profiles' as test,
    COUNT(*) as total_profiles
FROM public.profiles;

SELECT 
    'Datos en eventos' as test,
    COUNT(*) as total_eventos
FROM public.eventos;

SELECT 
    'Datos en funciones' as test,
    COUNT(*) as total_funciones
FROM public.funciones;
