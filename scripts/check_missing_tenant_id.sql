-- Script para verificar tablas sin tenant_id y problemas de tipos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar qué tablas tienen columna tenant_id
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ TIENE tenant_id'
        ELSE '❌ NO TIENE tenant_id'
    END as tenant_id_status,
    CASE 
        WHEN c.column_name IS NOT NULL THEN c.data_type
        ELSE 'N/A'
    END as tenant_id_type,
    CASE 
        WHEN c.column_name IS NOT NULL THEN c.is_nullable
        ELSE 'N/A'
    END as tenant_id_nullable
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id'
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 3. Verificar políticas RLS existentes
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar tablas con RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- 5. Verificar estructura de tabla auth.users (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%tenant%'
ORDER BY column_name;

-- 6. Verificar JWT claims disponibles
-- Esto se ejecuta en el contexto de una sesión autenticada
-- SELECT auth.jwt() ->> 'tenant_id' as current_tenant_id;
