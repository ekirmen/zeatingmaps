-- 🔍 VERIFICAR ESTRUCTURA DE LA BASE DE DATOS
-- Este script verifica la estructura exacta de las tablas del sistema en Supabase

-- ========================================
-- PASO 1: VERIFICAR ESTRUCTURA DE pg_policies
-- ========================================
SELECT '=== ESTRUCTURA DE pg_policies ===' as info;

-- Verificar todas las columnas de pg_policies
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pg_policies'
ORDER BY ordinal_position;

-- ========================================
-- PASO 2: VERIFICAR ESTRUCTURA DE pg_tables
-- ========================================
SELECT '=== ESTRUCTURA DE pg_tables ===' as info;

-- Verificar todas las columnas de pg_tables
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pg_tables'
ORDER BY ordinal_position;

-- ========================================
-- PASO 3: VERIFICAR ESTRUCTURA DE pg_stat_user_tables
-- ========================================
SELECT '=== ESTRUCTURA DE pg_stat_user_tables ===' as info;

-- Verificar todas las columnas de pg_stat_user_tables
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pg_stat_user_tables'
ORDER BY ordinal_position;

-- ========================================
-- PASO 4: VERIFICAR TABLAS EXISTENTES
-- ========================================
SELECT '=== TABLAS EXISTENTES ===' as info;

-- Listar todas las tablas del esquema público
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- PASO 5: VERIFICAR ESTRUCTURA DE TABLAS CRÍTICAS
-- ========================================
SELECT '=== ESTRUCTURA DE TABLAS CRÍTICAS ===' as info;

-- Verificar estructura de recintos
SELECT 
    'recintos' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recintos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de tenants
SELECT 
    'tenants' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de profiles
SELECT 
    'profiles' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- PASO 6: VERIFICAR POLÍTICAS EXISTENTES
-- ========================================
SELECT '=== POLÍTICAS EXISTENTES ===' as info;

-- Intentar diferentes formas de verificar políticas
SELECT 'Intentando pg_policies:' as info;

-- Opción 1: pg_policies estándar
SELECT 
    'pg_policies estándar' as tipo,
    policyname,
    tablename,
    cmd
FROM pg_policies 
WHERE tablename = 'recintos'
LIMIT 5;

-- Opción 2: information_schema.policies (PostgreSQL 10+)
SELECT 'Intentando information_schema.policies:' as info;

SELECT 
    'information_schema.policies' as tipo,
    policy_name,
    table_name,
    action
FROM information_schema.policies 
WHERE table_name = 'recintos'
LIMIT 5;

-- ========================================
-- PASO 7: VERIFICAR RLS
-- ========================================
SELECT '=== VERIFICAR RLS ===' as info;

-- Verificar si RLS está habilitado en recintos
SELECT 
    'RLS en recintos:' as info,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as estado
FROM pg_tables 
WHERE tablename = 'recintos';

-- ========================================
-- PASO 8: VERIFICAR VERSIONES
-- ========================================
SELECT '=== VERSIONES ===' as info;

-- Verificar versión de PostgreSQL
SELECT 
    'Versión PostgreSQL:' as info,
    version() as version;

-- Verificar versión de Supabase
SELECT 
    'Versión Supabase:' as info,
    current_setting('server_version') as version;
