-- Script para diagnosticar políticas RLS en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si RLS está habilitado en seat_locks
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seat_locks';

-- 2. Ver todas las políticas RLS en seat_locks
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
WHERE tablename = 'seat_locks';

-- 3. Verificar permisos de la tabla seat_locks
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'seat_locks' 
AND table_schema = 'public';

-- 4. Verificar si el usuario anónimo puede acceder
SELECT 
    has_table_privilege('anon', 'seat_locks', 'SELECT') as can_select,
    has_table_privilege('anon', 'seat_locks', 'INSERT') as can_insert,
    has_table_privilege('anon', 'seat_locks', 'UPDATE') as can_update,
    has_table_privilege('anon', 'seat_locks', 'DELETE') as can_delete;

-- 5. Verificar si authenticated puede acceder
SELECT 
    has_table_privilege('authenticated', 'seat_locks', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'seat_locks', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'seat_locks', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'seat_locks', 'DELETE') as can_delete;

-- 6. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seat_locks' 
AND table_schema = 'public'
ORDER BY ordinal_position;
