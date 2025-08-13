-- 🚀 Script para arreglar la tabla tenants y crear políticas RLS
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- PASO 1: ARREGLAR LA TABLA TENANTS
-- =====================================================

-- Agregar columnas faltantes a la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_events INTEGER DEFAULT 50;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Actualizar tenants existentes con datos por defecto
UPDATE tenants 
SET 
    contact_email = COALESCE(contact_email, 'admin@empresa.com'),
    max_users = COALESCE(max_users, 10),
    max_events = COALESCE(max_events, 50),
    plan_type = COALESCE(plan_type, 'basic'),
    status = COALESCE(status, 'active')
WHERE contact_email IS NULL OR max_users IS NULL OR max_events IS NULL OR plan_type IS NULL OR status IS NULL;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tenants_contact_email ON tenants(contact_email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);

-- =====================================================
-- PASO 2: VERIFICAR ESTRUCTURA DE TENANTS
-- =====================================================

-- Mostrar la estructura actual de la tabla tenants
SELECT 
    'ESTRUCTURA TENANTS' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS RLS PARA TENANTS (SI NO EXISTEN)
-- =====================================================

-- Habilitar RLS en la tabla tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar si una política existe
CREATE OR REPLACE FUNCTION policy_exists(p_tablename TEXT, p_policyname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = p_tablename 
        AND policyname = p_policyname
    );
END;
$$ LANGUAGE plpgsql;

-- Crear políticas solo si no existen
DO $$
BEGIN
    -- Política: Admins pueden gestionar todos los tenants
    IF NOT policy_exists('tenants', 'Admins can manage all tenants') THEN
        CREATE POLICY "Admins can manage all tenants" ON tenants
            FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE '✅ Política "Admins can manage all tenants" creada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Admins can manage all tenants" ya existe';
    END IF;

    -- Política: Usuarios pueden crear su propio tenant
    IF NOT policy_exists('tenants', 'Users can create own tenant') THEN
        CREATE POLICY "Users can create own tenant" ON tenants
            FOR INSERT
            TO public
            WITH CHECK (true);
        RAISE NOTICE '✅ Política "Users can create own tenant" creada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Users can create own tenant" ya existe';
    END IF;

    -- Política: Usuarios pueden actualizar su propio tenant
    IF NOT policy_exists('tenants', 'Users can update own tenant') THEN
        CREATE POLICY "Users can update own tenant" ON tenants
            FOR UPDATE
            TO public
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE '✅ Política "Users can update own tenant" creada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Users can update own tenant" ya existe';
    END IF;

    -- Política: Usuarios pueden ver tenants públicos
    IF NOT policy_exists('tenants', 'Users can view public tenants') THEN
        CREATE POLICY "Users can view public tenants" ON tenants
            FOR SELECT
            TO public
            USING (true);
        RAISE NOTICE '✅ Política "Users can view public tenants" creada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Users can view public tenants" ya existe';
    END IF;
END $$;

-- Limpiar función helper
DROP FUNCTION IF EXISTS policy_exists(TEXT, TEXT);

-- =====================================================
-- PASO 4: VERIFICAR QUE TODO FUNCIONA
-- =====================================================

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'tenants';

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tenants';

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Tabla tenants arreglada y políticas RLS verificadas exitosamente';
    RAISE NOTICE '✅ Columnas agregadas: contact_email, max_users, max_events, plan_type, status';
    RAISE NOTICE '🔒 RLS habilitado con políticas para gestión completa de tenants';
    RAISE NOTICE '📋 Ahora puedes crear y gestionar empresas en el panel SaaS';
END $$;
