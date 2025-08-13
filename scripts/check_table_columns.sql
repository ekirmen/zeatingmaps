-- Script para verificar la estructura de las tablas
-- Ejecutar en Supabase SQL Editor para diagnosticar

-- 1. Verificar qué tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar columnas de las tablas principales
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles',
    'recintos', 
    'eventos',
    'productos',
    'funciones',
    'salas',
    'mapas',
    'zonas',
    'plantillas_precios',
    'plantillas_productos',
    'ventas',
    'abonos',
    'payments'
)
ORDER BY table_name, ordinal_position;

-- 3. Verificar específicamente si tienen tenant_id
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ TIENE tenant_id'
        ELSE '❌ NO TIENE tenant_id'
    END as tenant_id_status,
    CASE 
        WHEN c.column_name IS NOT NULL THEN c.data_type
        ELSE 'N/A'
    END as tenant_id_type
FROM (
    SELECT 'profiles' as table_name UNION ALL
    SELECT 'recintos' UNION ALL
    SELECT 'eventos' UNION ALL
    SELECT 'productos' UNION ALL
    SELECT 'funciones' UNION ALL
    SELECT 'salas' UNION ALL
    SELECT 'mapas' UNION ALL
    SELECT 'zonas' UNION ALL
    SELECT 'plantillas_precios' UNION ALL
    SELECT 'plantillas_productos' UNION ALL
    SELECT 'ventas' UNION ALL
    SELECT 'abonos' UNION ALL
    SELECT 'payments'
) t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id'
ORDER BY t.table_name;

-- 4. Verificar si las tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'recintos', 
    'eventos',
    'productos',
    'funciones',
    'salas',
    'mapas',
    'zonas',
    'plantillas_precios',
    'plantillas_productos',
    'ventas',
    'abonos',
    'payments'
)
ORDER BY tablename;
