-- Script CORREGIDO para agregar tenant_id a tablas específicas
-- Ejecutar en Supabase SQL Editor

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

-- 2. Agregar tenant_id a cada tabla individualmente (más seguro)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    RAISE NOTICE '🎯 Iniciando proceso para agregar tenant_id...';
    
    -- profiles
    IF NOT column_exists('profiles', 'tenant_id') THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla profiles ya tiene tenant_id';
    END IF;
    
    -- recintos
    IF NOT column_exists('recintos', 'tenant_id') THEN
        ALTER TABLE recintos ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_recintos_tenant_id ON recintos(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: recintos';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla recintos ya tiene tenant_id';
    END IF;
    
    -- eventos
    IF NOT column_exists('eventos', 'tenant_id') THEN
        ALTER TABLE eventos ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_eventos_tenant_id ON eventos(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: eventos';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla eventos ya tiene tenant_id';
    END IF;
    
    -- productos
    IF NOT column_exists('productos', 'tenant_id') THEN
        ALTER TABLE productos ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_productos_tenant_id ON productos(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: productos';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla productos ya tiene tenant_id';
    END IF;
    
    -- funciones
    IF NOT column_exists('funciones', 'tenant_id') THEN
        ALTER TABLE funciones ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_funciones_tenant_id ON funciones(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: funciones';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla funciones ya tiene tenant_id';
    END IF;
    
    -- salas
    IF NOT column_exists('salas', 'tenant_id') THEN
        ALTER TABLE salas ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_salas_tenant_id ON salas(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: salas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla salas ya tiene tenant_id';
    END IF;
    
    -- mapas
    IF NOT column_exists('mapas', 'tenant_id') THEN
        ALTER TABLE mapas ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_mapas_tenant_id ON mapas(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: mapas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla mapas ya tiene tenant_id';
    END IF;
    
    -- zonas
    IF NOT column_exists('zonas', 'tenant_id') THEN
        ALTER TABLE zonas ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_zonas_tenant_id ON zonas(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: zonas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla zonas ya tiene tenant_id';
    END IF;
    
    -- plantillas_precios
    IF NOT column_exists('plantillas_precios', 'tenant_id') THEN
        ALTER TABLE plantillas_precios ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_plantillas_precios_tenant_id ON plantillas_precios(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: plantillas_precios';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla plantillas_precios ya tiene tenant_id';
    END IF;
    
    -- plantillas_productos
    IF NOT column_exists('plantillas_productos', 'tenant_id') THEN
        ALTER TABLE plantillas_productos ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_plantillas_productos_tenant_id ON plantillas_productos(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: plantillas_productos';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla plantillas_productos ya tiene tenant_id';
    END IF;
    
    -- ventas
    IF NOT column_exists('ventas', 'tenant_id') THEN
        ALTER TABLE ventas ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_ventas_tenant_id ON ventas(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: ventas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla ventas ya tiene tenant_id';
    END IF;
    
    -- abonos
    IF NOT column_exists('abonos', 'tenant_id') THEN
        ALTER TABLE abonos ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_abonos_tenant_id ON abonos(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: abonos';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla abonos ya tiene tenant_id';
    END IF;
    
    -- payments
    IF NOT column_exists('payments', 'tenant_id') THEN
        ALTER TABLE payments ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla: payments';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla payments ya tiene tenant_id';
    END IF;
    
    RAISE NOTICE '🎉 Proceso de agregar columnas completado';
END $$;

-- 3. Habilitar RLS en todas las tablas
DO $$
BEGIN
    RAISE NOTICE '🔒 Habilitando RLS en todas las tablas...';
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;
    ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE plantillas_precios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE plantillas_productos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS habilitado en todas las tablas';
END $$;

-- 4. Verificar estado final
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ TIENE tenant_id'
        ELSE '❌ NO TIENE tenant_id'
    END as tenant_id_status
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

-- 5. Limpiar función helper
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- 6. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Proceso completado exitosamente';
    RAISE NOTICE '📋 Ahora ejecuta el script create_clean_tenant_policies.sql';
END $$;
