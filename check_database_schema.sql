-- Script para verificar el schema de la base de datos
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar estructura de la tabla mapas
SELECT 
    'mapas' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'mapas'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla funciones
SELECT 
    'funciones' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'funciones'
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla seat_locks
SELECT 
    'seat_locks' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'seat_locks'
ORDER BY ordinal_position;

-- 4. Verificar estructura de la tabla payments
SELECT 
    'payments' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS activas
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
  AND tablename IN ('mapas', 'funciones', 'seat_locks', 'payments')
ORDER BY tablename, policyname;

-- 6. Verificar datos de ejemplo en mapas
SELECT 
    'Datos de ejemplo en mapas' as info,
    id,
    sala_id,
    CASE 
        WHEN contenido IS NULL THEN 'contenido es NULL'
        WHEN jsonb_typeof(contenido) = 'object' THEN 'contenido es objeto'
        WHEN jsonb_typeof(contenido) = 'array' THEN 'contenido es array'
        ELSE 'contenido es ' || jsonb_typeof(contenido)
    END as tipo_contenido
FROM public.mapas
WHERE sala_id = 52
LIMIT 3;
