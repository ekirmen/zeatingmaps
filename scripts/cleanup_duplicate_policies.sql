-- Script para limpiar políticas duplicadas y conflictivas
-- Ejecutar en Supabase SQL Editor DESPUÉS de verificar con check_missing_tenant_id.sql

-- 1. Eliminar políticas antiguas/duplicadas de profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Select own profile" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- 2. Eliminar políticas antiguas de otras tablas (si existen)
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can insert own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can update own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can delete own tenant recintos" ON recintos;

DROP POLICY IF EXISTS "Users can view own tenant eventos" ON eventos;
DROP POLICY IF EXISTS "Users can insert own tenant eventos" ON eventos;
DROP POLICY IF EXISTS "Users can update own tenant eventos" ON eventos;
DROP POLICY IF EXISTS "Users can delete own tenant eventos" ON eventos;

DROP POLICY IF EXISTS "Users can view own tenant productos" ON productos;
DROP POLICY IF EXISTS "Users can insert own tenant productos" ON productos;
DROP POLICY IF EXISTS "Users can update own tenant productos" ON productos;
DROP POLICY IF EXISTS "Users can delete own tenant productos" ON productos;

-- 3. Verificar políticas restantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar que solo quedan las políticas correctas
-- Deberías ver solo:
-- - "Admins can manage all profiles" (para administradores)
-- - Las políticas de tenant que vamos a crear en el siguiente script
