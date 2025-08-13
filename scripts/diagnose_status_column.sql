-- 🔍 Script de DIAGNÓSTICO para la columna status
-- Este script verifica exactamente qué está pasando con la columna status

-- =====================================================
-- PASO 1: VERIFICAR EXISTENCIA DE LA TABLA TENANTS
-- =====================================================

-- Verificar si la tabla tenants existe
SELECT 
    'EXISTENCIA TABLA' as tipo,
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'tenants' 
AND table_schema = 'public';

-- =====================================================
-- PASO 2: VERIFICAR ESTRUCTURA COMPLETA DE TENANTS
-- =====================================================

-- Mostrar TODAS las columnas de tenants
SELECT 
    'ESTRUCTURA COMPLETA' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 3: VERIFICAR COLUMNA STATUS ESPECÍFICAMENTE
-- =====================================================

-- Verificar específicamente la columna status
SELECT 
    'COLUMNA STATUS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
AND column_name = 'status';

-- =====================================================
-- PASO 4: VERIFICAR DESDE PG_ATTRIBUTE (MÁS BAJO NIVEL)
-- =====================================================

-- Verificar desde pg_attribute (nivel más bajo)
SELECT 
    'PG_ATTRIBUTE STATUS' as tipo,
    attname as column_name,
    format_type(atttypid, atttypmod) as data_type,
    attnotnull as is_not_null,
    attnum as position
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'tenants'
AND n.nspname = 'public'
AND a.attname = 'status'
AND a.attnum > 0
AND NOT a.attisdropped;

-- =====================================================
-- PASO 5: VERIFICAR DESDE PG_CLASS
-- =====================================================

-- Verificar la tabla desde pg_class
SELECT 
    'PG_CLASS TENANTS' as tipo,
    relname as table_name,
    relkind as table_type,
    reltuples as estimated_rows
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'tenants'
AND n.nspname = 'public';

-- =====================================================
-- PASO 6: INTENTAR SELECT SIMPLE
-- =====================================================

-- Intentar un SELECT simple para ver si hay errores
DO $$
BEGIN
    RAISE NOTICE '🔍 Intentando SELECT simple de tenants...';
    
    -- Verificar si podemos hacer SELECT
    IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        RAISE NOTICE '✅ SELECT simple funciona';
    ELSE
        RAISE NOTICE '⚠️ SELECT simple no devuelve datos';
    END IF;
    
    -- Intentar contar filas
    RAISE NOTICE '📊 Total de filas en tenants: %', (SELECT COUNT(*) FROM tenants);
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error en SELECT: %', SQLERRM;
END $$;

-- =====================================================
-- PASO 7: VERIFICAR PERMISOS
-- =====================================================

-- Verificar permisos del usuario actual
SELECT 
    'PERMISOS USUARIO' as tipo,
    current_user as usuario_actual,
    session_user as usuario_sesion,
    current_database() as base_datos_actual;

-- =====================================================
-- PASO 8: VERIFICAR SCHEMA ACTUAL
-- =====================================================

-- Verificar schema actual
SELECT 
    'SCHEMA ACTUAL' as tipo,
    current_schema() as schema_actual;

-- Verificar schemas disponibles de otra manera
SELECT 
    'SCHEMAS DISPONIBLES' as tipo,
    nspname as schema_name
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%'
AND nspname != 'information_schema'
ORDER BY nspname;

-- =====================================================
-- PASO 9: INTENTAR DESCRIBIR LA TABLA
-- =====================================================

-- Intentar describir la tabla usando \d (equivalente)
SELECT 
    'DESCRIPCIÓN TABLA' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 10: VERIFICAR SI HAY CONFLICTOS DE NOMBRES
-- =====================================================

-- Verificar si hay conflictos de nombres
SELECT 
    'CONFLICTOS NOMBRES' as tipo,
    table_name,
    column_name,
    table_schema
FROM information_schema.columns 
WHERE column_name = 'status'
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- =====================================================
-- PASO 11: VERIFICAR VERSIÓN DE POSTGRESQL
-- =====================================================

-- Verificar versión de PostgreSQL
SELECT 
    'VERSIÓN POSTGRESQL' as tipo,
    version() as version_completa;

-- =====================================================
-- MENSAJE DE DIAGNÓSTICO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETADO';
    RAISE NOTICE '📋 Revisa los resultados para identificar el problema';
    RAISE NOTICE '💡 Si la columna status existe pero da error, puede ser:';
    RAISE NOTICE '   1. Problema de permisos';
    RAISE NOTICE '   2. Problema de schema';
    RAISE NOTICE '   3. Problema de contexto de ejecución';
    RAISE NOTICE '   4. Tabla corrupta o mal sincronizada';
END $$;
