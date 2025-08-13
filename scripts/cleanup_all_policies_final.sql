-- Script FINAL para limpiar TODAS las políticas RLS
-- ⚠️ ADVERTENCIA: Esto eliminará TODAS las políticas existentes
-- Ejecutar en Supabase SQL Editor DESPUÉS de verificar que quieres hacer esto

-- 1. Listar todas las políticas antes de eliminar (para referencia)
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

-- 2. Función para eliminar todas las políticas de una tabla específica
CREATE OR REPLACE FUNCTION drop_all_policies_from_table(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = table_name
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
        RAISE NOTICE '✅ Política eliminada: % en tabla %', policy_record.policyname, table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Eliminar TODAS las políticas de las tablas principales
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE '🗑️ Iniciando limpieza radical de políticas RLS...';
    
    -- Lista de tablas que sabemos que tienen políticas
    FOR table_record IN 
        SELECT DISTINCT tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE '🧹 Limpiando políticas de tabla: %', table_record.tablename;
        PERFORM drop_all_policies_from_table(table_record.tablename);
    END LOOP;
    
    RAISE NOTICE '🎉 Limpieza radical completada';
END $$;

-- 4. Verificar que todas las políticas fueron eliminadas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Contar políticas restantes (debería ser 0)
SELECT 
    COUNT(*) as total_policies_restantes,
    COUNT(DISTINCT tablename) as tablas_con_politicas
FROM pg_policies 
WHERE schemaname = 'public';

-- 6. Limpiar función helper
DROP FUNCTION IF EXISTS drop_all_policies_from_table(TEXT);

-- 7. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 TODAS las políticas RLS han sido eliminadas';
    RAISE NOTICE '📋 Ahora ejecuta INMEDIATAMENTE el script create_clean_tenant_policies.sql';
    RAISE NOTICE '⚠️ IMPORTANTE: Sin políticas RLS, el acceso a datos puede estar restringido';
END $$;
