-- Script SEGURO para agregar tenant_id solo a tablas de usuario
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

-- 2. Lista EXPLÍCITA de tablas que SÍ queremos modificar
-- Solo tablas de negocio, NO tablas del sistema
DO $$
DECLARE
    table_record RECORD;
    target_tables TEXT[] := ARRAY[
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
        'payments',
        'tenants'
    ];
BEGIN
    RAISE NOTICE '🎯 Iniciando proceso para % tablas específicas', array_length(target_tables, 1);
    
    FOREACH table_record.table_name IN ARRAY target_tables
    LOOP
        -- Verificar si la tabla existe
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name
        ) THEN
            -- Verificar si la tabla ya tiene tenant_id
            IF NOT column_exists(table_record.table_name, 'tenant_id') THEN
                BEGIN
                    -- Agregar columna tenant_id
                    EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', table_record.table_name);
                    RAISE NOTICE '✅ Agregada columna tenant_id a tabla: %', table_record.table_name;
                    
                    -- Crear índice para mejorar performance
                    EXECUTE format('CREATE INDEX idx_%I_tenant_id ON %I(tenant_id)', table_record.table_name, table_record.table_name);
                    RAISE NOTICE '✅ Creado índice para tenant_id en tabla: %', table_record.table_name;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE '⚠️ Error en tabla %: %', table_record.table_name, SQLERRM;
                END;
            ELSE
                RAISE NOTICE 'ℹ️ Tabla % ya tiene tenant_id', table_record.table_name;
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Tabla % no existe, saltando...', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Verificar estado final de las tablas objetivo
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
    SELECT unnest(ARRAY[
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
        'payments',
        'tenants'
    ]) as table_name
) t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id'
ORDER BY t.table_name;

-- 4. Habilitar RLS SOLO en tablas que tengan tenant_id
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE '🔒 Habilitando RLS en tablas con tenant_id...';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name = 'tenant_id'
        AND t.table_name IN (
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
            'payments',
            'tenants'
        )
    LOOP
        BEGIN
            -- Habilitar RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
            RAISE NOTICE '✅ RLS habilitado en tabla: %', table_record.table_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Error habilitando RLS en tabla %: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. Limpiar función helper
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- 6. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Proceso completado exitosamente';
    RAISE NOTICE '📋 Ahora ejecuta el script create_clean_tenant_policies.sql';
    RAISE NOTICE '⚠️ Solo se modificaron las tablas de negocio especificadas';
END $$;
