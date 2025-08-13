-- Script para verificar la estructura real de las tablas
-- Este script muestra qué columnas existen realmente

-- 1. Verificar estructura de la tabla recintos
SELECT 
    'recintos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla salas
SELECT 
    'salas' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salas' 
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla profiles
SELECT 
    'profiles' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Verificar estructura de la tabla tenants
SELECT 
    'tenants' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;
