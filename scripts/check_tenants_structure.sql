-- Script para verificar la estructura real de la tabla tenants
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué columnas tiene realmente la tabla tenants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tenants'
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tenants' 
            AND column_name = 'status'
        ) THEN '✅ La columna status SÍ existe'
        ELSE '❌ La columna status NO existe'
    END as status_column_exists;

-- 3. Verificar si existe la columna plan_type
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tenants' 
            AND column_name = 'plan_type'
        ) THEN '✅ La columna plan_type SÍ existe'
        ELSE '❌ La columna plan_type NO existe'
    END as plan_type_column_exists;

-- 4. Mostrar las primeras filas de la tabla tenants para ver la estructura
SELECT * FROM tenants LIMIT 3;

-- 5. Contar cuántos tenants hay
SELECT COUNT(*) as total_tenants FROM tenants;
