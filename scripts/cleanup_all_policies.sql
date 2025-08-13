-- Script para limpiar TODAS las políticas RLS y empezar desde cero
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

-- 2. Función para eliminar todas las políticas de una tabla
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
SELECT drop_all_policies_from_table('profiles');
SELECT drop_all_policies_from_table('recintos');
SELECT drop_all_policies_from_table('eventos');
SELECT drop_all_policies_from_table('productos');
SELECT drop_all_policies_from_table('funciones');
SELECT drop_all_policies_from_table('salas');
SELECT drop_all_policies_from_table('mapas');
SELECT drop_all_policies_from_table('zonas');
SELECT drop_all_policies_from_table('plantillas_precios');
SELECT drop_all_policies_from_table('plantillas_productos');
SELECT drop_all_policies_from_table('ventas');
SELECT drop_all_policies_from_table('abonos');
SELECT drop_all_policies_from_table('payments');

-- 4. Verificar que todas las políticas fueron eliminadas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Limpiar función helper
DROP FUNCTION IF EXISTS drop_all_policies_from_table(TEXT);

-- 6. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 TODAS las políticas RLS han sido eliminadas';
    RAISE NOTICE '📋 Ahora ejecuta el script create_clean_tenant_policies.sql';
END $$;
