-- 🚀 Script para arreglar RLS con sistema de roles de usuario
-- Este script configura las políticas RLS correctamente para el panel de usuarios

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
-- =====================================================

-- Verificar si existe la columna role en profiles
SELECT 
    'ESTRUCTURA PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PASO 2: AGREGAR COLUMNA ROLE A PROFILES SI NO EXISTE
-- =====================================================

-- Agregar columna role si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'tenant_admin';

-- Agregar columna permissions si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Agregar columna tenant_id si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- =====================================================
-- PASO 3: ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar usuarios existentes con rol por defecto
UPDATE profiles 
SET 
    role = COALESCE(role, 'super_admin'),
    permissions = COALESCE(permissions, '{}'::jsonb),
    tenant_id = COALESCE(tenant_id, (SELECT id FROM tenants LIMIT 1))
WHERE role IS NULL OR permissions IS NULL OR tenant_id IS NULL;

-- =====================================================
-- PASO 4: VERIFICAR TABLA RECINTOS
-- =====================================================

-- Asegurar que recintos tenga tenant_id
ALTER TABLE recintos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_recintos_tenant_id ON recintos(tenant_id);

-- =====================================================
-- PASO 5: HABILITAR RLS EN TABLAS PRINCIPALES
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 6: FUNCIÓN HELPER PARA VERIFICAR PERMISOS
-- =====================================================

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND (
            role = 'super_admin' 
            OR permissions ? permission_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es tenant admin
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'tenant_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 7: CREAR POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Tenant admins can manage tenant profiles" ON profiles;

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO public
    USING (id = auth.uid());

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO public
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política: Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO public
    WITH CHECK (id = auth.uid());

-- Política: Super admins pueden gestionar todos los perfiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Tenant admins pueden gestionar perfiles de su tenant
CREATE POLICY "Tenant admins can manage tenant profiles" ON profiles
    FOR ALL
    TO public
    USING (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 8: CREAR POLÍTICAS RLS PARA RECINTOS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can manage own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Super admins can manage all recintos" ON recintos;
DROP POLICY IF EXISTS "Tenant admins can manage tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Event managers can view tenant recintos" ON recintos;

-- Política: Super admins pueden gestionar todos los recintos
CREATE POLICY "Super admins can manage all recintos" ON recintos
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Tenant admins pueden gestionar recintos de su tenant
CREATE POLICY "Tenant admins can manage tenant recintos" ON recintos
    FOR ALL
    TO public
    USING (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Política: Event managers pueden ver recintos de su tenant
CREATE POLICY "Event managers can view tenant recintos" ON recintos
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'event_manager'
            AND tenant_id = recintos.tenant_id
        )
    );

-- Política: Usuarios con permiso de gestión de recintos pueden gestionar
CREATE POLICY "Users with recintos permission can manage" ON recintos
    FOR ALL
    TO public
    USING (
        has_permission('gestión_de_recintos')
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        has_permission('gestión_de_recintos')
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 9: CREAR POLÍTICAS RLS PARA TENANTS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can manage all tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view public tenants" ON tenants;

-- Política: Super admins pueden gestionar todos los tenants
CREATE POLICY "Super admins can manage all tenants" ON tenants
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Usuarios pueden crear su propio tenant
CREATE POLICY "Users can create own tenant" ON tenants
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Política: Usuarios pueden ver tenants públicos
CREATE POLICY "Users can view public tenants" ON tenants
    FOR SELECT
    TO public
    USING (true);

-- Política: Tenant admins pueden actualizar su propio tenant
CREATE POLICY "Tenant admins can update own tenant" ON tenants
    FOR UPDATE
    TO public
    USING (
        is_tenant_admin() 
        AND id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 10: VERIFICAR ESTADO FINAL
-- =====================================================

-- Verificar que RLS está habilitado
SELECT 
    'RLS STATUS FINAL' as tipo,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'recintos', 'tenants')
ORDER BY tablename;

-- Verificar políticas finales
SELECT 
    'POLÍTICAS FINALES' as tipo,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('profiles', 'recintos', 'tenants')
ORDER BY tablename, policyname;

-- =====================================================
-- PASO 11: INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Insertar datos de prueba para verificar funcionamiento
DO $$
DECLARE
    first_tenant_id UUID;
    test_user_id UUID;
BEGIN
    -- Obtener el primer tenant disponible
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Solo insertar si hay datos disponibles
    IF first_tenant_id IS NOT NULL THEN
        -- Insertar recinto de prueba
        INSERT INTO recintos (nombre, direccion, tenant_id) VALUES
            ('Recinto de Prueba', 'Dirección de Prueba', first_tenant_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Recinto de prueba insertado correctamente';
    ELSE
        RAISE NOTICE '⚠️ No hay tenants disponibles para insertar recinto de prueba';
    END IF;
END $$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 SISTEMA DE RLS CON ROLES CONFIGURADO EXITOSAMENTE';
    RAISE NOTICE '✅ Políticas RLS configuradas para sistema de roles';
    RAISE NOTICE '🔒 Super admins pueden gestionar todo';
    RAISE NOTICE '🔒 Tenant admins pueden gestionar su tenant';
    RAISE NOTICE '🔒 Event managers pueden ver recintos';
    RAISE NOTICE '📋 Error de RLS en recintos debería estar resuelto';
    RAISE NOTICE '🚀 El panel de usuarios debería funcionar correctamente';
END $$;
