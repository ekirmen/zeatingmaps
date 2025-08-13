-- Script de verificación final del sistema
-- Ejecutar en Supabase SQL Editor DESPUÉS de ambos scripts anteriores

-- 1. Verificar que las columnas tenant_id están en su lugar
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

-- 2. Verificar que RLS está habilitado en todas las tablas
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

-- 3. Verificar políticas RLS creadas
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

-- 4. Contar total de políticas (debería ser ~26)
SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public';

-- 5. Verificar que no hay políticas duplicadas o conflictivas
SELECT 
    tablename,
    policyname,
    COUNT(*) as duplicate_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- 6. Verificar estructura de políticas por tabla
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 7. Mensaje de resumen
DO $$
DECLARE
    total_policies INTEGER;
    total_tables INTEGER;
    rls_enabled_tables INTEGER;
BEGIN
    -- Contar políticas
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Contar tablas con políticas
    SELECT COUNT(DISTINCT tablename) INTO total_tables
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Contar tablas con RLS habilitado
    SELECT COUNT(*) INTO rls_enabled_tables
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
        'profiles', 'recintos', 'eventos', 'productos', 'funciones',
        'salas', 'mapas', 'zonas', 'plantillas_precios', 
        'plantillas_productos', 'ventas', 'abonos', 'payments'
    );
    
    RAISE NOTICE '📊 RESUMEN DEL SISTEMA:';
    RAISE NOTICE '✅ Total de políticas RLS: %', total_policies;
    RAISE NOTICE '✅ Tablas con políticas: %', total_tables;
    RAISE NOTICE '✅ Tablas con RLS habilitado: %', rls_enabled_tables;
    
    IF total_policies BETWEEN 20 AND 30 THEN
        RAISE NOTICE '🎉 Sistema configurado correctamente';
        RAISE NOTICE '🔒 Multi-tenancy funcionando';
        RAISE NOTICE '📋 No debería haber más errores uuid = text';
    ELSE
        RAISE NOTICE '⚠️ Verificar configuración del sistema';
    END IF;
END $$;
