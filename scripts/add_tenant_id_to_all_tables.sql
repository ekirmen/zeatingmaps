-- Script para agregar tenant_id a todas las tablas
-- Ejecutar en Supabase SQL Editor DESPUÉS de check_table_columns.sql

-- 1. Función helper para verificar si una columna existe
CREATE OR REPLACE FUNCTION column_exists(p_tablename TEXT, p_colname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_tablename 
        AND column_name = p_colname
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Agregar tenant_id a todas las tablas que no lo tengan
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Lista de tablas que DEBEN tener tenant_id
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('tenants', 'schema_migrations', 'audit_logs', 'system_alerts')
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
    LOOP
        -- Verificar si la tabla ya tiene tenant_id
        IF NOT column_exists(table_record.table_name, 'tenant_id') THEN
            -- Agregar columna tenant_id
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', table_record.table_name);
            RAISE NOTICE '✅ Agregada columna tenant_id a tabla: %', table_record.table_name;
            
            -- Crear índice para mejorar performance
            EXECUTE format('CREATE INDEX idx_%I_tenant_id ON %I(tenant_id)', table_record.table_name, table_record.table_name);
            RAISE NOTICE '✅ Creado índice para tenant_id en tabla: %', table_record.table_name;
        ELSE
            RAISE NOTICE 'ℹ️ Tabla % ya tiene tenant_id', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Agregar foreign key constraint a tenants (opcional, comentar si causa problemas)
-- DO $$
-- DECLARE
--     table_record RECORD;
-- BEGIN
--     FOR table_record IN 
--         SELECT table_name 
--         FROM information_schema.tables 
--         WHERE table_schema = 'public' 
--         AND table_type = 'BASE TABLE'
--         AND table_name NOT IN ('tenants', 'schema_migrations')
--     LOOP
--         IF column_exists(table_record.table_name, 'tenant_id') THEN
--             BEGIN
--                 EXECUTE format('ALTER TABLE %I ADD CONSTRAINT fk_%I_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id)', 
--                               table_record.table_name, table_record.table_name);
--                 RAISE NOTICE '✅ Agregada FK constraint en tabla: %', table_record.table_name;
--             EXCEPTION
--                 WHEN OTHERS THEN
--                     RAISE NOTICE '⚠️ No se pudo agregar FK en tabla %: %', table_record.table_name, SQLERRM;
--             END;
--         END IF;
--     END LOOP;
-- END $$;

-- 4. Verificar tablas que aún no tienen tenant_id
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ TIENE tenant_id'
        ELSE '❌ NO TIENE tenant_id'
    END as tenant_id_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id'
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
AND t.table_name NOT IN ('tenants', 'schema_migrations')
ORDER BY t.table_name;

-- 5. Habilitar RLS en todas las tablas con tenant_id
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name = 'tenant_id'
        AND t.table_name NOT IN ('tenants', 'schema_migrations')
    LOOP
        -- Habilitar RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        RAISE NOTICE '✅ RLS habilitado en tabla: %', table_record.table_name;
    END LOOP;
END $$;

-- 6. Limpiar función helper
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- 7. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Proceso completado';
    RAISE NOTICE '📋 Ahora ejecuta el script create_clean_tenant_policies.sql';
END $$;
